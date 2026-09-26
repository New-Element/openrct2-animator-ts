/// <reference path="./../../../../openrct2.d.ts" />

import {
    compute,
    dropdown,
    horizontal,
    label,
    spinner,
    store,
    twoway,
    WritableStore
} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import TileCoords from "../../../../game/tileCoords";
import {TileTargetDesc, TileTargetOrigin} from "../../../../model/animation/jsonTypes";
import {loadTileTarget, persistTileTargetFields} from "../../../../model/animation/step/tileTarget";
import {goToTileButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickTile} from "../../../ui/pickTile";
import {createTypedVariablePicker} from "../../../variables/typedVariablePicker";

const ORIGIN_LABELS = ["Fixed Tile", "Trigger Tile", "Tile Variable"];
const ORIGINS: TileTargetOrigin[] = ["fixed", "trigger", "variable"];

function originIndex(origin: TileTargetOrigin): number {
    for (let i = 0; i < ORIGINS.length; i++) {
        if (ORIGINS[i] === origin) {
            return i;
        }
    }
    return 0;
}

/**
 * Shared Tile row for steps: fixed world tile, offset from the fire tile, or a Tile variable.
 */
export function createTileTargetFields(
    onPersist: () => void,
    visibility: WritableStore<"visible" | "none">
) {
    const originSelected = store<number>(0);
    const tileX = store<number>(0);
    const tileY = store<number>(0);
    let absolute: TileCoords = {x: 0, y: 0};
    let offset: TileCoords = {x: 0, y: 0};

    const origin = (): TileTargetOrigin => ORIGINS[originSelected.get()] || "fixed";
    const isOffsetOrigin = compute(originSelected, (index) => index > 0);
    const xLabel = compute(isOffsetOrigin, (relative) => (relative ? "Offset X" : "X"));
    const yLabel = compute(isOffsetOrigin, (relative) => (relative ? "Offset Y" : "Y"));
    const spinnerMin = compute(isOffsetOrigin, (relative) => (relative ? -10000 : 0));
    const pickVisibility = compute(visibility, originSelected, (shown, index) => {
        return shown === "visible" && index === 0 ? "visible" : "none";
    });
    const triggerHintVisibility = compute(visibility, originSelected, (shown, index) => {
        return shown === "visible" && index === 1 ? "visible" : "none";
    });
    const variableVisibility = compute(visibility, originSelected, (shown, index) => {
        return shown === "visible" && index === 2 ? "visible" : "none";
    });
    const offsetHintVisibility = compute(visibility, originSelected, (shown, index) => {
        return shown === "visible" && index === 2 ? "visible" : "none";
    });
    const tileLabelVisibility = pickVisibility;

    const picker = createTypedVariablePicker({
        valueType: "tile",
        emptyLabel: "(No Tile Variables)",
        missingLabel: "Tile Variable Missing",
        visibility: variableVisibility,
        onChange: () => onPersist()
    });

    function showActiveCoords(): void {
        if (origin() === "fixed") {
            tileX.set(absolute.x);
            tileY.set(absolute.y);
        }
        else {
            tileX.set(offset.x);
            tileY.set(offset.y);
        }
    }

    function captureActiveCoords(): void {
        const coords = {x: tileX.get(), y: tileY.get()};
        if (origin() === "fixed") {
            absolute = coords;
        }
        else {
            offset = coords;
        }
    }

    function isRelative(): boolean {
        return origin() !== "fixed";
    }

    function load(desc: TileTargetDesc): void {
        const loaded = loadTileTarget(desc);
        originSelected.set(originIndex(loaded.origin));
        absolute = {x: loaded.tile.x, y: loaded.tile.y};
        offset = {x: loaded.offset.x, y: loaded.offset.y};
        picker.refresh(loaded.tileVariableId);
        showActiveCoords();
    }

    function readTarget(): TileTargetDesc {
        captureActiveCoords();
        return persistTileTargetFields({
            origin: origin(),
            relativeToTrigger: origin() === "trigger",
            tile: {x: absolute.x, y: absolute.y},
            offset: {x: offset.x, y: offset.y},
            tileVariableId: picker.selectedId()
        });
    }

    function setAbsoluteTile(tile: TileCoords): void {
        if (origin() !== "fixed") {
            return;
        }
        absolute = {x: tile.x, y: tile.y};
        tileX.set(tile.x);
        tileY.set(tile.y);
    }

    const widgets = [
        dropdown({
            items: ORIGIN_LABELS,
            selectedIndex: twoway(originSelected),
            visibility,
            onChange: (index) => {
                const previous = origin();
                if (index === 0) {
                    if (previous !== "fixed") {
                        offset = {x: tileX.get(), y: tileY.get()};
                    }
                    originSelected.set(index);
                    tileX.set(absolute.x);
                    tileY.set(absolute.y);
                }
                else {
                    if (previous === "fixed") {
                        absolute = {x: tileX.get(), y: tileY.get()};
                    }
                    originSelected.set(index);
                    tileX.set(offset.x);
                    tileY.set(offset.y);
                    if (index === 2) {
                        picker.refresh();
                    }
                }
                onPersist();
            }
        }),
        label({
            text: "Offset From The Tile The Trigger Fired On",
            visibility: triggerHintVisibility
        }),
        ...picker.widgets,
        label({
            text: "Offset From The Tile Variable",
            visibility: offsetHintVisibility
        }),
        label({
            text: "Tile",
            visibility: tileLabelVisibility
        }),
        horizontal([
            label({
                text: xLabel,
                width: 55,
                visibility
            }),
            spinner({
                step: spinnerStep,
                value: twoway(tileX),
                minimum: spinnerMin,
                maximum: 10000,
                visibility,
                onChange: (value) => {
                    tileX.set(value);
                    captureActiveCoords();
                    onPersist();
                }
            }),
            label({
                text: yLabel,
                width: 55,
                visibility
            }),
            spinner({
                step: spinnerStep,
                value: twoway(tileY),
                minimum: spinnerMin,
                maximum: 10000,
                visibility,
                onChange: (value) => {
                    tileY.set(value);
                    captureActiveCoords();
                    onPersist();
                }
            }),
            pickIconButton({
                tooltip: "Pick Tile",
                visibility: pickVisibility,
                onClick: () => {
                    pickTile((tile) => {
                        setAbsoluteTile(tile);
                        onPersist();
                    });
                }
            }),
            goToTileButton({
                visibility: pickVisibility,
                getTile: () => ({x: tileX.get(), y: tileY.get()})
            })
        ])
    ];

    return {load, readTarget, isRelative, setAbsoluteTile, widgets};
}

export type TileTargetFields = ReturnType<typeof createTileTargetFields>;
