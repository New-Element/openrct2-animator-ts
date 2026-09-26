/// <reference path="./../../../../openrct2.d.ts" />

import {
    button,
    compute,
    dropdown,
    horizontal,
    label,
    listview,
    spinner,
    store,
    twoway
} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import TileCoords from "../../../../game/tileCoords";
import {TravelDirection} from "../../../../model/animation/jsonTypes";
import {copyTiles, loadTravelDirection} from "../../../../model/animation/trigger/event/eventTiles";
import Trigger from "../../../../model/animation/trigger/trigger";
import getConductor from "../../../../model/getConductor";
import {goToRideButton, goToTileButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickRide} from "../../../ui/pickRide";
import {pickTile} from "../../../ui/pickTile";
import {clearTileSelection, highlightMapTiles} from "../../../ui/pickerTool";
import {indexOfRideId, listParkRides, RideOption, rideNames} from "../../rideOptions";

/** Events that store a ride + tiles (carEnters, trainEnters). */
export type RideTileEvent = {
    rideId: number;
    tiles: TileCoords[];
    direction: TravelDirection;
    checkEveryTicks: number;
    setCheckEveryTicks: (ticks: number) => void;
};

const DIRECTION_LABELS = ["Either", "Forwards", "Backwards"];
const DIRECTIONS: TravelDirection[] = ["either", "forwards", "backwards"];

function directionIndex(direction: TravelDirection): number {
    for (let i = 0; i < DIRECTIONS.length; i++) {
        if (DIRECTIONS[i] === direction) {
            return i;
        }
    }
    return 0;
}

function tileRowLabel(tile: TileCoords): string {
    return `X ${tile.x}, Y ${tile.y}`;
}

function tilesEqual(a: TileCoords, b: TileCoords): boolean {
    return a.x === b.x && a.y === b.y;
}

function indexOfTile(tiles: TileCoords[], tile: TileCoords): number {
    for (let i = 0; i < tiles.length; i++) {
        if (tilesEqual(tiles[i], tile)) {
            return i;
        }
    }
    return -1;
}

export function createRideTileFields(
    getTrigger: () => Trigger | null,
    getRideTileEvent: (trigger: Trigger) => RideTileEvent | null,
    canPersist: () => boolean = () => true
) {
    const visibility = store<"visible" | "none">("none");
    const coordVisibility = store<"visible" | "none">("none");
    const rideDropdownItems = store<string[]>(["(No Rides)"]);
    const rideSelectedIndex = store<number>(0);
    const directionSelectedIndex = store<number>(0);
    const tileListItems = store<string[]>([]);
    const selectedTileIndex = store<number>(-1);
    const selectedTileCell = store<RowColumn | null>(null);
    const tileX = store<number>(0);
    const tileY = store<number>(0);
    const checkEveryTicks = store<number>(1);
    let rideOptions: RideOption[] = [];
    let loadingSelection = false;

    function refreshRideOptions(): void {
        rideOptions = listParkRides();
        if (rideOptions.length === 0) {
            rideDropdownItems.set(["(No Rides)"]);
            rideSelectedIndex.set(0);
            return;
        }
        rideDropdownItems.set(rideNames(rideOptions));
    }

    function currentTiles(): TileCoords[] {
        const trigger = getTrigger();
        if (!trigger) {
            return [];
        }
        const event = getRideTileEvent(trigger);
        return event ? event.tiles : [];
    }

    function fieldsVisible(): boolean {
        return visibility.get() === "visible";
    }

    function highlightSavedTiles(): void {
        if (!fieldsVisible()) {
            clearTileSelection();
            return;
        }
        highlightMapTiles(currentTiles());
    }

    function setSelectedTileIndex(index: number): void {
        selectedTileIndex.set(index);
        if (index < 0) {
            selectedTileCell.set(null);
            coordVisibility.set("none");
            return;
        }
        selectedTileCell.set({row: index, column: 0});
        const tiles = currentTiles();
        const tile = tiles[index];
        if (!tile) {
            coordVisibility.set("none");
            return;
        }
        loadingSelection = true;
        tileX.set(tile.x);
        tileY.set(tile.y);
        loadingSelection = false;
        coordVisibility.set(fieldsVisible() ? "visible" : "none");
    }

    function refreshTileList(preferredIndex?: number): void {
        const tiles = currentTiles();
        const rows: string[] = [];
        for (let i = 0; i < tiles.length; i++) {
            rows.push(tileRowLabel(tiles[i]));
        }
        tileListItems.set(rows);
        if (tiles.length === 0) {
            setSelectedTileIndex(-1);
            return;
        }
        let index = typeof preferredIndex === "number" ? preferredIndex : selectedTileIndex.get();
        if (index < 0 || index >= tiles.length) {
            index = tiles.length - 1;
        }
        setSelectedTileIndex(index);
    }

    function applyTiles(tiles: TileCoords[], preferredIndex?: number): void {
        if (!canPersist()) {
            return;
        }
        const trigger = getTrigger();
        if (!trigger) {
            return;
        }
        const event = getRideTileEvent(trigger);
        if (!event) {
            return;
        }
        event.tiles = copyTiles(tiles);
        getConductor().triggersArray.save();
        refreshTileList(preferredIndex);
        highlightSavedTiles();
    }

    function persistSelectedCoords(): void {
        if (loadingSelection) {
            return;
        }
        const index = selectedTileIndex.get();
        const tiles = copyTiles(currentTiles());
        if (index < 0 || index >= tiles.length) {
            return;
        }
        const next = {x: tileX.get(), y: tileY.get()};
        const other = indexOfTile(tiles, next);
        if (other >= 0 && other !== index) {
            loadingSelection = true;
            tileX.set(tiles[index].x);
            tileY.set(tiles[index].y);
            loadingSelection = false;
            return;
        }
        tiles[index] = next;
        applyTiles(tiles, index);
    }

    function hide(): void {
        visibility.set("none");
        coordVisibility.set("none");
        clearTileSelection();
    }

    function save(trigger: Trigger): void {
        const event = getRideTileEvent(trigger);
        if (!event) {
            return;
        }
        if (rideOptions.length > 0) {
            const idx = rideSelectedIndex.get();
            if (idx >= 0 && idx < rideOptions.length) {
                event.rideId = rideOptions[idx].id;
            }
        }
        const dirIdx = directionSelectedIndex.get();
        event.direction = DIRECTIONS[dirIdx] || "either";
        event.setCheckEveryTicks(checkEveryTicks.get());
        getConductor().triggersArray.save();
    }

    function persistFromUi(): void {
        if (!canPersist()) {
            return;
        }
        const trigger = getTrigger();
        if (trigger) {
            save(trigger);
        }
    }

    function load(trigger: Trigger): void {
        refreshRideOptions();
        const event = getRideTileEvent(trigger);
        if (!event) {
            hide();
            return;
        }
        visibility.set("visible");
        const rideIndex = indexOfRideId(rideOptions, event.rideId);
        rideSelectedIndex.set(rideIndex < 0 ? 0 : rideIndex);
        directionSelectedIndex.set(directionIndex(loadTravelDirection(event.direction)));
        checkEveryTicks.set(event.checkEveryTicks);
        refreshTileList(event.tiles.length > 0 ? 0 : -1);
        highlightSavedTiles();
    }

    const widgets = [
        label({
            text: "Ride",
            visibility
        }),
        horizontal([
            dropdown({
                items: rideDropdownItems,
                selectedIndex: twoway(rideSelectedIndex),
                visibility,
                onChange: (index) => {
                    rideSelectedIndex.set(index);
                    persistFromUi();
                }
            }),
            pickIconButton({
                tooltip: "Pick Ride",
                visibility,
                onClick: () => {
                    pickRide(
                        (rideId) => {
                            refreshRideOptions();
                            const rideIndex = indexOfRideId(rideOptions, rideId);
                            if (rideIndex < 0) {
                                return;
                            }
                            rideSelectedIndex.set(rideIndex);
                            persistFromUi();
                        },
                        () => highlightSavedTiles()
                    );
                }
            }),
            goToRideButton({
                visibility,
                getRideId: () => {
                    const ride = rideOptions[rideSelectedIndex.get()];
                    return ride ? ride.id : undefined;
                }
            })
        ]),
        label({
            text: "Direction",
            visibility
        }),
        dropdown({
            items: DIRECTION_LABELS,
            selectedIndex: twoway(directionSelectedIndex),
            visibility,
            onChange: (index) => {
                directionSelectedIndex.set(index);
                persistFromUi();
            }
        }),
        horizontal([
            label({
                text: "Check Every",
                width: 80,
                visibility
            }),
            spinner({
                step: spinnerStep,
                value: twoway(checkEveryTicks),
                minimum: 1,
                maximum: 100000,
                visibility,
                onChange: (value) => {
                    checkEveryTicks.set(value);
                    persistFromUi();
                }
            }),
            label({
                text: "Ticks",
                width: 40,
                visibility
            })
        ]),
        label({
            text: "Tiles",
            visibility
        }),
        listview({
            items: tileListItems,
            scrollbars: "vertical",
            canSelect: true,
            selectedCell: twoway(selectedTileCell),
            height: 70,
            visibility,
            onClick: (item) => {
                setSelectedTileIndex(item);
            }
        }),
        horizontal([
            pickIconButton({
                tooltip: "Add Tile",
                visibility,
                onClick: () => {
                    pickTile(
                        (tile) => {
                            const tiles = copyTiles(currentTiles());
                            const existing = indexOfTile(tiles, tile);
                            if (existing >= 0) {
                                refreshTileList(existing);
                                highlightSavedTiles();
                                return;
                            }
                            tiles.push({x: tile.x, y: tile.y});
                            applyTiles(tiles, tiles.length - 1);
                        },
                        () => highlightSavedTiles()
                    );
                }
            }),
            button({
                text: "Delete",
                width: 55,
                height: 14,
                visibility,
                disabled: compute(selectedTileIndex, (index) => index < 0),
                onClick: () => {
                    const index = selectedTileIndex.get();
                    const tiles = copyTiles(currentTiles());
                    if (index < 0 || index >= tiles.length) {
                        return;
                    }
                    tiles.splice(index, 1);
                    const next = tiles.length === 0 ? -1 : Math.min(index, tiles.length - 1);
                    applyTiles(tiles, next);
                }
            })
        ]),
        horizontal([
            label({
                text: "X",
                width: 12,
                visibility: coordVisibility
            }),
            spinner({
                step: spinnerStep,
                value: twoway(tileX),
                minimum: 0,
                maximum: 10000,
                visibility: coordVisibility,
                onChange: (value) => {
                    tileX.set(value);
                    persistSelectedCoords();
                }
            }),
            label({
                text: "Y",
                width: 12,
                visibility: coordVisibility
            }),
            spinner({
                step: spinnerStep,
                value: twoway(tileY),
                minimum: 0,
                maximum: 10000,
                visibility: coordVisibility,
                onChange: (value) => {
                    tileY.set(value);
                    persistSelectedCoords();
                }
            }),
            pickIconButton({
                tooltip: "Pick Tile",
                visibility: coordVisibility,
                onClick: () => {
                    pickTile(
                        (tile) => {
                            tileX.set(tile.x);
                            tileY.set(tile.y);
                            persistSelectedCoords();
                        },
                        () => highlightSavedTiles()
                    );
                }
            }),
            goToTileButton({
                visibility: coordVisibility,
                getTile: () => ({x: tileX.get(), y: tileY.get()})
            })
        ])
    ];

    return {hide, load, save, widgets};
}

export type RideTileFields = ReturnType<typeof createRideTileFields>;
