/// <reference path="./../../openrct2.d.ts" />

import {
    button,
    checkbox,
    colourPicker,
    compute,
    groupbox,
    horizontal,
    label,
    listview,
    spinner,
    store,
    twoway,
    vertical,
    window
} from "openrct2-flexui";
import TileCoords from "../../game/tileCoords";
import {resolveSceneryObject} from "../../model/animation/step/scenery/sceneryQuery";
import Building from "../../model/lookInside/building";
import {RoofObject} from "../../model/lookInside/buildingTypes";
import {
    RoofObjectIdentity,
    roofObjectMatchesIdentity
} from "../../model/lookInside/roofObjectIdentity";
import {error} from "../../model/logger";
import uuidV4 from "../../model/util/uuid";
import {
    cancelPickScenery,
    collectPickedSceneryOnTiles,
    PickedScenery,
    pickScenery
} from "../ui/pickScenery";
import {goToTileButton, pickIconButton} from "../ui/mapIconButtons";
import {
    cancelPickTileSet,
    pickTileSet,
    TileSetDragMode
} from "../ui/pickTileSet";
import {
    clearTileSelection,
    highlightMapTile,
    highlightMapTiles
} from "../ui/pickerTool";
import {nameTextField} from "../ui/nameTextField";
import {WINDOW_COLOURS} from "../ui/windowColours";
import {onLookInsideRoofsConfigChanged} from "../../model/lookInside/lookInsideHover";
import {
    buildingDisplayName,
    buildingHasRoofObject,
    findBuildingById,
    findBuildingByRoofObject,
    findBuildingByTile,
    removeBuildingById,
    saveBuildings
} from "./buildingsStore";
import {showAlert} from "../ui/alertMessage";
import {confirmDeleteBuilding} from "./confirmDeleteBuilding";

const editingBuildingId = store<string>("");
const nameText = store<string>("");

const tileListItems = store<string[][]>([]);
const selectedTileIndex = store<number>(-1);
const tilesSelectedCell = store<RowColumn | null>(null);
const removeTilesDisabled = compute(selectedTileIndex, (index) => index < 0);

const roofObjectListItems = store<string[][]>([]);
const selectedRoofIndex = store<number>(-1);
const removeRoofDisabled = compute(selectedRoofIndex, (index) => index < 0);
const roofSelectedCell = store<RowColumn | null>(null);
const roofEditorVisibility = store<"visible" | "none">("none");
const roofEmptyVisibility = store<"visible" | "none">("visible");
const roofMissingVisibility = store<"visible" | "none">("none");
const roofNameText = store<string>("");
const roofTileText = store<string>("");
const roofTypeText = store<string>("");
const roofFilterText = store<string>("");
const roofFilterVisibility = store<"visible" | "none">("none");
const roofPrimaryColour = store<number>(0);
const roofSecondaryColour = store<number>(0);
const roofTertiaryColour = store<number>(0);
const hideNorth = store<boolean>(true);
const hideSouth = store<boolean>(true);
const hideEast = store<boolean>(true);
const hideWest = store<boolean>(true);
const addAboveHeight = store<number>(0);
const bulkAddDisabled = compute(tileListItems, (rows) => rows.length === 0);

let onEditorClosed: (() => void) | null = null;
let editorIsOpen = false;
let tilePickerActive = false;
let sceneryPickerActive = false;
let loadingRoofSelection = false;
let displayedRoofIndexes: number[] = [];

function editingBuilding(): Building | undefined {
    return findBuildingById(editingBuildingId.get());
}

function objectTypeLabel(type: RoofObject["objectType"]): string {
    if (type === "small_scenery") {
        return "Small Scenery";
    }
    if (type === "large_scenery") {
        return "Large Scenery";
    }
    return "Wall";
}

function roofObjectListLabel(object: RoofObject): string {
    const resolved = resolveSceneryObject(object.objectIdentifier, object.objectType);
    return resolved ? resolved.name : (object.objectName || object.objectIdentifier);
}

function identityFromPicked(picked: PickedScenery): RoofObjectIdentity {
    const identity: RoofObjectIdentity = {
        tileX: picked.tile.x,
        tileY: picked.tile.y,
        objectType: picked.objectType,
        objectIdentifier: picked.objectIdentifier,
        baseHeight: picked.baseHeight,
        primaryColour: picked.primaryColour,
        secondaryColour: picked.secondaryColour,
        tertiaryColour: picked.tertiaryColour
    };
    if (picked.tileLocation !== undefined) {
        identity.tileLocation = picked.tileLocation;
    }
    return identity;
}

function roofObjectFromPicked(picked: PickedScenery): RoofObject {
    const object: RoofObject = {
        id: uuidV4(),
        tile: {x: picked.tile.x, y: picked.tile.y},
        objectType: picked.objectType,
        objectIdentifier: picked.objectIdentifier,
        objectName: picked.objectName,
        baseHeight: picked.baseHeight,
        primaryColour: picked.primaryColour,
        secondaryColour: picked.secondaryColour,
        tertiaryColour: picked.tertiaryColour,
        hideNorth: true,
        hideSouth: true,
        hideEast: true,
        hideWest: true
    };
    if (picked.tileLocation !== undefined) {
        object.tileLocation = picked.tileLocation;
    }
    return object;
}

function roofObjectOnMap(object: RoofObject): boolean {
    const found = collectPickedSceneryOnTiles([{x: object.tile.x, y: object.tile.y}]);
    for (let i = 0; i < found.length; i++) {
        if (roofObjectMatchesIdentity(object, identityFromPicked(found[i]))) {
            return true;
        }
    }
    return false;
}

function persistName(text: string): void {
    const building = editingBuilding();
    if (!building) {
        return;
    }
    building.name = text;
    saveBuildings();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function notifyClosed(): void {
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function setSelectedTileIndex(index: number): void {
    selectedTileIndex.set(index);
    if (index < 0) {
        tilesSelectedCell.set(null);
    } else {
        tilesSelectedCell.set({row: index, column: 0});
    }
    refreshRoofObjectList();
}

function showAllRoofObjects(): void {
    setSelectedTileIndex(-1);
    highlightEditorSelection();
}

function refreshTileList(): void {
    const building = editingBuilding();
    if (!building) {
        tileListItems.set([]);
        setSelectedTileIndex(-1);
        return;
    }
    const rows: string[][] = [];
    for (let i = 0; i < building.tiles.length; i++) {
        rows.push([
            String(building.tiles[i].x),
            String(building.tiles[i].y)
        ]);
    }
    tileListItems.set(rows);
    const selected = selectedTileIndex.get();
    if (selected < 0 || selected >= building.tiles.length) {
        setSelectedTileIndex(-1);
        return;
    }
    tilesSelectedCell.set({row: selected, column: 0});
}

function refreshRoofObjectList(): void {
    const building = editingBuilding();
    displayedRoofIndexes = [];
    if (!building) {
        roofObjectListItems.set([]);
        roofFilterText.set("");
        roofFilterVisibility.set("none");
        setSelectedRoofIndex(-1);
        return;
    }
    const tileIndex = selectedTileIndex.get();
    const filterTile = tileIndex >= 0 && tileIndex < building.tiles.length
        ? building.tiles[tileIndex]
        : null;
    if (filterTile) {
        roofFilterText.set(`Objects On ${filterTile.x}, ${filterTile.y}`);
        roofFilterVisibility.set("visible");
    } else {
        roofFilterText.set("");
        roofFilterVisibility.set("none");
    }
    const rows: string[][] = [];
    for (let i = 0; i < building.roofObjects.length; i++) {
        const object = building.roofObjects[i];
        if (filterTile && (object.tile.x !== filterTile.x || object.tile.y !== filterTile.y)) {
            continue;
        }
        displayedRoofIndexes.push(i);
        rows.push([
            roofObjectListLabel(object),
            `${object.tile.x}, ${object.tile.y}`,
            String(object.baseHeight)
        ]);
    }
    roofObjectListItems.set(rows);
    const selected = selectedRoofIndex.get();
    let visibleRow = -1;
    for (let r = 0; r < displayedRoofIndexes.length; r++) {
        if (displayedRoofIndexes[r] === selected) {
            visibleRow = r;
            break;
        }
    }
    if (selected < 0 || selected >= building.roofObjects.length || visibleRow < 0) {
        setSelectedRoofIndex(-1);
        return;
    }
    roofSelectedCell.set({row: visibleRow, column: 0});
    loadSelectedRoofEditor();
}

function showEmptyRoofEditor(): void {
    roofEditorVisibility.set("none");
    roofEmptyVisibility.set("visible");
    roofMissingVisibility.set("none");
}

function loadSelectedRoofEditor(): void {
    const building = editingBuilding();
    const index = selectedRoofIndex.get();
    if (!building || index < 0 || index >= building.roofObjects.length) {
        showEmptyRoofEditor();
        return;
    }
    const object = building.roofObjects[index];
    loadingRoofSelection = true;
    roofNameText.set(roofObjectListLabel(object));
    roofTileText.set(`Tile ${object.tile.x}, ${object.tile.y}`);
    roofTypeText.set(objectTypeLabel(object.objectType));
    roofPrimaryColour.set(object.primaryColour);
    roofSecondaryColour.set(object.secondaryColour);
    roofTertiaryColour.set(object.tertiaryColour);
    hideNorth.set(object.hideNorth !== false);
    hideSouth.set(object.hideSouth !== false);
    hideEast.set(object.hideEast !== false);
    hideWest.set(object.hideWest !== false);
    loadingRoofSelection = false;
    roofEmptyVisibility.set("none");
    roofEditorVisibility.set("visible");
    roofMissingVisibility.set(roofObjectOnMap(object) ? "none" : "visible");
}

function setSelectedRoofIndex(index: number): void {
    selectedRoofIndex.set(index);
    if (index < 0) {
        roofSelectedCell.set(null);
        showEmptyRoofEditor();
        highlightEditorSelection();
        return;
    }
    roofSelectedCell.set({row: index, column: 0});
    loadSelectedRoofEditor();
    highlightEditorSelection();
}

function persistHideFlag(which: "hideNorth" | "hideSouth" | "hideEast" | "hideWest", checked: boolean): void {
    if (loadingRoofSelection) {
        return;
    }
    const building = editingBuilding();
    const index = selectedRoofIndex.get();
    if (!building || index < 0 || index >= building.roofObjects.length) {
        return;
    }
    building.roofObjects[index][which] = checked;
    saveBuildings();
    refreshRoofObjectList();
    onLookInsideRoofsConfigChanged();
}

function roofObjectsChanged(preferredIndex?: number): void {
    refreshRoofObjectList();
    if (typeof preferredIndex === "number") {
        setSelectedRoofIndex(preferredIndex);
    } else {
        highlightEditorSelection();
    }
    saveBuildings();
    onLookInsideRoofsConfigChanged();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function addPickedRoofObjects(pickedList: PickedScenery[]): void {
    const building = editingBuilding();
    if (!building || pickedList.length === 0) {
        return;
    }
    let added = 0;
    let conflictCount = 0;
    let conflictName = "";
    let lastIndex = selectedRoofIndex.get();
    for (let i = 0; i < pickedList.length; i++) {
        const identity = identityFromPicked(pickedList[i]);
        if (buildingHasRoofObject(building, identity)) {
            continue;
        }
        const owner = findBuildingByRoofObject(identity);
        if (owner) {
            conflictCount++;
            if (conflictName === "") {
                conflictName = buildingDisplayName(owner.name);
            }
            continue;
        }
        building.roofObjects.push(roofObjectFromPicked(pickedList[i]));
        lastIndex = building.roofObjects.length - 1;
        added++;
    }
    if (added > 0) {
        roofObjectsChanged(lastIndex);
    }
    if (conflictCount === 0) {
        return;
    }
    if (conflictCount === 1 && added === 0) {
        ui.showError(
            "Object In Use",
            `This Object Belongs To "${conflictName}".`
        );
        return;
    }
    ui.showError(
        "Object In Use",
        "Some Of These Objects Belong To Other Buildings."
    );
}

function startAddRoofObject(): void {
    if (tilePickerActive) {
        cancelPickTileSet();
        tilePickerActive = false;
    }
    sceneryPickerActive = true;
    pickScenery(
        (picked) => {
            addPickedRoofObjects([picked]);
        },
        () => {
            sceneryPickerActive = false;
            if (editorIsOpen) {
                highlightEditorSelection();
            }
        },
        true
    );
}

function tilesForBulkAdd(): TileCoords[] {
    return buildingTilesForHighlight();
}

function addObjectsAboveHeight(): void {
    addPickedRoofObjects(collectPickedSceneryOnTiles(tilesForBulkAdd(), {
        minBaseHeight: addAboveHeight.get()
    }));
}

function removeSelectedRoofObject(): void {
    const building = editingBuilding();
    const index = selectedRoofIndex.get();
    if (!building || index < 0 || index >= building.roofObjects.length) {
        return;
    }
    building.roofObjects.splice(index, 1);
    setSelectedRoofIndex(-1);
    roofObjectsChanged();
}

function buildingTilesForHighlight(): TileCoords[] {
    const building = editingBuilding();
    if (!building) {
        return [];
    }
    const tiles: TileCoords[] = [];
    for (let i = 0; i < building.tiles.length; i++) {
        tiles.push({
            x: building.tiles[i].x,
            y: building.tiles[i].y
        });
    }
    return tiles;
}

function highlightBuildingTiles(): void {
    if (!editorIsOpen) {
        return;
    }
    const tiles = buildingTilesForHighlight();
    if (tiles.length === 0) {
        clearTileSelection();
        return;
    }
    highlightMapTiles(tiles);
}

function highlightEditorSelection(): void {
    if (!editorIsOpen || tilePickerActive || sceneryPickerActive) {
        return;
    }
    const building = editingBuilding();
    const index = selectedRoofIndex.get();
    if (building && index >= 0 && index < building.roofObjects.length) {
        const object = building.roofObjects[index];
        highlightMapTile({x: object.tile.x, y: object.tile.y});
        return;
    }
    highlightBuildingTiles();
}

function tilesChanged(): void {
    refreshTileList();
    refreshRoofObjectList();
    highlightEditorSelection();
    saveBuildings();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function addPickedTiles(tiles: TileCoords[]): void {
    const building = editingBuilding();
    if (!building || tiles.length === 0) {
        return;
    }
    let added = 0;
    let conflictCount = 0;
    let conflictName = "";
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        const owner = findBuildingByTile(tile.x, tile.y);
        if (owner && owner.id === building.id) {
            continue;
        }
        if (owner) {
            conflictCount++;
            if (conflictName === "") {
                conflictName = buildingDisplayName(owner.name);
            }
            continue;
        }
        building.tiles.push({
            x: tile.x,
            y: tile.y
        });
        added++;
    }
    if (added > 0) {
        setSelectedTileIndex(building.tiles.length - 1);
        tilesChanged();
    }
    if (conflictCount === 0) {
        return;
    }
    if (conflictCount === 1 && added === 0) {
        ui.showError(
            "Tile In Use",
            `This Tile Belongs To "${conflictName}".`
        );
        return;
    }
    ui.showError(
        "Tile In Use",
        "Some Of These Tiles Belong To Other Buildings."
    );
}

function removePickedTiles(tiles: TileCoords[]): void {
    const building = editingBuilding();
    if (!building || tiles.length === 0) {
        return;
    }
    const remove: {[key: string]: boolean} = {};
    for (let i = 0; i < tiles.length; i++) {
        remove[`${tiles[i].x},${tiles[i].y}`] = true;
    }
    const kept: typeof building.tiles = [];
    for (let i = 0; i < building.tiles.length; i++) {
        const tile = building.tiles[i];
        if (!remove[`${tile.x},${tile.y}`]) {
            kept.push(tile);
        }
    }
    if (kept.length === building.tiles.length) {
        return;
    }
    building.tiles = kept;
    if (selectedTileIndex.get() >= building.tiles.length) {
        setSelectedTileIndex(building.tiles.length - 1);
    }
    tilesChanged();
}

function applyTileDrag(mode: TileSetDragMode, tiles: TileCoords[]): void {
    if (mode === "remove") {
        removePickedTiles(tiles);
        return;
    }
    addPickedTiles(tiles);
}

function startAddTiles(): void {
    if (sceneryPickerActive) {
        cancelPickScenery();
        sceneryPickerActive = false;
    }
    tilePickerActive = true;
    pickTileSet({
        getTiles: () => buildingTilesForHighlight(),
        onCommit: applyTileDrag,
        onFinish: () => {
            tilePickerActive = false;
            if (editorIsOpen) {
                highlightEditorSelection();
            }
        }
    });
}

function removeSelectedTile(): void {
    const building = editingBuilding();
    const index = selectedTileIndex.get();
    if (!building || index < 0 || index >= building.tiles.length) {
        return;
    }
    building.tiles.splice(index, 1);
    if (index >= building.tiles.length) {
        setSelectedTileIndex(building.tiles.length - 1);
    }
    tilesChanged();
}

function closeEditorCleanup(): void {
    editorIsOpen = false;
    if (tilePickerActive) {
        cancelPickTileSet();
        tilePickerActive = false;
    }
    if (sceneryPickerActive) {
        cancelPickScenery();
        sceneryPickerActive = false;
    }
    clearTileSelection();
}

function deleteEditingBuilding(): void {
    const building = editingBuilding();
    if (!building) {
        editorWindow.close();
        notifyClosed();
        return;
    }
    confirmDeleteBuilding(building.id, building.name, () => {
        removeBuildingById(building.id);
        editorWindow.close();
        notifyClosed();
    });
}

function clearNonExistingRoofObjects(): void {
    const building = editingBuilding();
    if (!building) {
        return;
    }
    const kept: RoofObject[] = [];
    for (let i = 0; i < building.roofObjects.length; i++) {
        if (roofObjectOnMap(building.roofObjects[i])) {
            kept.push(building.roofObjects[i]);
        }
    }
    const removed = building.roofObjects.length - kept.length;
    if (removed === 0) {
        showAlert("Clear Roof Objects", "All Roof Objects Still Exist On The Map.");
        return;
    }
    building.roofObjects = kept;
    setSelectedRoofIndex(-1);
    roofObjectsChanged();
}

const editorWindow = window({
    title: "Edit Building",
    colours: WINDOW_COLOURS,
    width: {value: 576, min: 420, max: 960},
    height: {value: 520, min: 420, max: 740},
    position: "center",
    padding: 8,
    content: [
        vertical({
            spacing: 4,
            height: "1w",
            content: [
                groupbox({
                    text: "Name",
                    content: [
                        nameTextField({
                            text: nameText,
                            onChange: (text) => {
                                nameText.set(text);
                                persistName(text);
                            }
                        })
                    ]
                }),
                horizontal({
                    spacing: 8,
                    height: "1w",
                    content: [
                        groupbox({
                            text: "Tiles",
                            width: 280,
                            height: "1w",
                            content: [
                                listview({
                                    items: tileListItems,
                                    columns: [
                                        {header: "X", canSort: true},
                                        {header: "Y", canSort: true}
                                    ],
                                    scrollbars: "vertical",
                                    canSelect: true,
                                    selectedCell: twoway(tilesSelectedCell),
                                    height: "1w",
                                    onClick: (item) => {
                                        setSelectedTileIndex(item);
                                        highlightEditorSelection();
                                    }
                                }),
                                horizontal([
                                    pickIconButton({
                                        tooltip: "Pick Tiles",
                                        onClick: () => startAddTiles()
                                    }),
                                    button({
                                        text: "Remove",
                                        width: 65,
                                        height: 14,
                                        disabled: removeTilesDisabled,
                                        onClick: () => removeSelectedTile()
                                    }),
                                    goToTileButton({
                                        disabled: removeTilesDisabled,
                                        getTile: () => {
                                            const building = editingBuilding();
                                            const index = selectedTileIndex.get();
                                            if (!building || index < 0 || index >= building.tiles.length) {
                                                return null;
                                            }
                                            return building.tiles[index];
                                        }
                                    })
                                ])
                            ]
                        }),
                        groupbox({
                            text: "Roof Objects",
                            width: "1w",
                            height: "1w",
                            content: [
                                horizontal({
                                    content: [
                                        label({
                                            text: roofFilterText,
                                            visibility: roofFilterVisibility
                                        }),
                                        button({
                                            text: "Show All",
                                            width: 70,
                                            height: 14,
                                            visibility: roofFilterVisibility,
                                            onClick: () => showAllRoofObjects()
                                        })
                                    ]
                                }),
                                listview({
                                    items: roofObjectListItems,
                                    columns: [
                                        {header: "Object", canSort: true},
                                        {header: "Tile", canSort: true, width: "70px"},
                                        {header: "BH", canSort: true, width: "40px"}
                                    ],
                                    scrollbars: "vertical",
                                    canSelect: true,
                                    selectedCell: twoway(roofSelectedCell),
                                    height: "1w",
                                    onClick: (item) => {
                                        if (item < 0 || item >= displayedRoofIndexes.length) {
                                            return;
                                        }
                                        setSelectedRoofIndex(displayedRoofIndexes[item]);
                                    }
                                }),
                                horizontal([
                                    pickIconButton({
                                        tooltip: "Add Roof Object",
                                        onClick: () => startAddRoofObject()
                                    }),
                                    goToTileButton({
                                        tooltip: "Go To Object",
                                        disabled: removeRoofDisabled,
                                        getTile: () => {
                                            const building = editingBuilding();
                                            const index = selectedRoofIndex.get();
                                            if (!building || index < 0 || index >= building.roofObjects.length) {
                                                return null;
                                            }
                                            return building.roofObjects[index].tile;
                                        }
                                    })
                                ]),
                                horizontal([
                                    label({
                                        text: "Height",
                                        width: 45
                                    }),
                                    spinner({
                                        value: twoway(addAboveHeight),
                                        minimum: 0,
                                        maximum: 10000,
                                        width: 70
                                    }),
                                    button({
                                        text: "Add Above Height",
                                        width: 125,
                                        height: 14,
                                        disabled: bulkAddDisabled,
                                        onClick: () => addObjectsAboveHeight()
                                    })
                                ]),
                                label({
                                    text: "No Roof Object Selected",
                                    visibility: roofEmptyVisibility
                                }),
                                label({
                                    text: roofNameText,
                                    visibility: roofEditorVisibility
                                }),
                                label({
                                    text: roofTileText,
                                    visibility: roofEditorVisibility
                                }),
                                label({
                                    text: roofTypeText,
                                    visibility: roofEditorVisibility
                                }),
                                horizontal([
                                    label({
                                        text: "Primary",
                                        width: 55,
                                        visibility: roofEditorVisibility
                                    }),
                                    colourPicker({
                                        colour: roofPrimaryColour,
                                        visibility: roofEditorVisibility,
                                        disabled: true
                                    }),
                                    label({
                                        text: "Secondary",
                                        width: 70,
                                        visibility: roofEditorVisibility
                                    }),
                                    colourPicker({
                                        colour: roofSecondaryColour,
                                        visibility: roofEditorVisibility,
                                        disabled: true
                                    }),
                                    label({
                                        text: "Tertiary",
                                        width: 55,
                                        visibility: roofEditorVisibility
                                    }),
                                    colourPicker({
                                        colour: roofTertiaryColour,
                                        visibility: roofEditorVisibility,
                                        disabled: true
                                    })
                                ]),
                                label({
                                    text: "This Object Could Not Be Found On The Map.",
                                    visibility: roofMissingVisibility
                                }),
                                horizontal([
                                    checkbox({
                                        text: "North",
                                        isChecked: twoway(hideNorth),
                                        visibility: roofEditorVisibility,
                                        onChange: (checked) => {
                                            hideNorth.set(checked);
                                            persistHideFlag("hideNorth", checked);
                                        }
                                    }),
                                    checkbox({
                                        text: "East",
                                        isChecked: twoway(hideEast),
                                        visibility: roofEditorVisibility,
                                        onChange: (checked) => {
                                            hideEast.set(checked);
                                            persistHideFlag("hideEast", checked);
                                        }
                                    }),
                                    checkbox({
                                        text: "South",
                                        isChecked: twoway(hideSouth),
                                        visibility: roofEditorVisibility,
                                        onChange: (checked) => {
                                            hideSouth.set(checked);
                                            persistHideFlag("hideSouth", checked);
                                        }
                                    }),
                                    checkbox({
                                        text: "West",
                                        isChecked: twoway(hideWest),
                                        visibility: roofEditorVisibility,
                                        onChange: (checked) => {
                                            hideWest.set(checked);
                                            persistHideFlag("hideWest", checked);
                                        }
                                    })
                                ]),
                                button({
                                    text: "Remove Roof Object",
                                    width: 140,
                                    height: 14,
                                    visibility: roofEditorVisibility,
                                    onClick: () => removeSelectedRoofObject()
                                })
                            ]
                        })
                    ]
                }),
                horizontal([
                    button({
                        text: "Delete Building",
                        width: 115,
                        height: 14,
                        onClick: () => deleteEditingBuilding()
                    }),
                    button({
                        text: "Clear Non-Existing Roof Objects",
                        width: 235,
                        height: 14,
                        onClick: () => clearNonExistingRoofObjects()
                    })
                ])
            ]
        })
    ],
    onOpen: () => {
        highlightEditorSelection();
    },
    onClose: () => {
        closeEditorCleanup();
        notifyClosed();
    }
});

export function openBuildingEditor(buildingId: string, onClosed?: () => void): void {
    const building = findBuildingById(buildingId);
    if (!building) {
        error("lookInside", `Building "${buildingId}" not found`);
        return;
    }
    onEditorClosed = onClosed || null;
    editingBuildingId.set(building.id);
    nameText.set(building.name);
    setSelectedTileIndex(-1);
    setSelectedRoofIndex(-1);
    refreshTileList();
    refreshRoofObjectList();
    editorIsOpen = true;
    highlightEditorSelection();
    editorWindow.open();
}
