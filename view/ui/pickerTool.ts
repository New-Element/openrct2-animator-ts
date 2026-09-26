/// <reference path="./../../openrct2.d.ts" />

import TileCoords from "../../game/tileCoords";
import {maybeGrabLookInsideHover} from "../../model/lookInside/lookInsideHover";

export type PickerToolEvent = {
    mapCoords?: CoordsXY;
    tileElementIndex?: number;
    entityId?: number;
};

type PickerStartListener = () => void;

const pickerStartListeners: PickerStartListener[] = [];

/** Register a callback that runs whenever a map picker tool starts. */
export function onPickerToolStart(listener: PickerStartListener): void {
    pickerStartListeners.push(listener);
}

function notifyPickerToolStart(): void {
    for (let i = 0; i < pickerStartListeners.length; i++) {
        pickerStartListeners[i]();
    }
}

export interface ActivatePickerOptions<T> {
    id: string;
    cursor?: CursorType;
    filter?: ToolFilter[];
    /** Resolve a value from the tool event; null means ignore this event. */
    resolve: (event: PickerToolEvent) => T | null;
    /** Optional hover feedback (e.g. tile highlight). */
    onHover?: (value: T, event: PickerToolEvent) => void;
    onPick: (value: T) => void;
    /** Cleanup when the tool ends (cancel or after pick). */
    onFinish?: () => void;
    /** If true, keep the tool open after a pick so the user can pick several times. */
    stayActive?: boolean;
}

/**
 * Shared tool lifecycle for map pickers: move → hover, down → pick (+ cancel unless stayActive), finish → cleanup.
 * Concrete pickers (tile, ride, object, …) supply resolve / hover / pick only.
 */
export function activatePickerTool<T>(options: ActivatePickerOptions<T>): void {
    if (typeof ui === "undefined") {
        return;
    }

    notifyPickerToolStart();
    ui.activateTool({
        id: options.id,
        cursor: options.cursor || "cross_hair",
        filter: options.filter,
        onMove: (event) => {
            const value = options.resolve(event);
            if (value === null || !options.onHover) {
                return;
            }
            options.onHover(value, event);
        },
        onDown: (event) => {
            const value = options.resolve(event);
            if (value === null) {
                return;
            }
            if (options.onHover) {
                options.onHover(value, event);
            }
            options.onPick(value);
            if (!options.stayActive && ui.tool) {
                ui.tool.cancel();
            }
        },
        onFinish: () => {
            if (options.onFinish) {
                options.onFinish();
            }
            maybeGrabLookInsideHover();
        }
    });
}

export interface ActivateDragPickerOptions {
    id: string;
    cursor?: CursorType;
    filter?: ToolFilter[];
    onStart?: () => void;
    onDown: (event: PickerToolEvent) => void;
    onMove: (event: PickerToolEvent) => void;
    onUp: (event: PickerToolEvent) => void;
    onFinish?: () => void;
}

/**
 * Shared tool lifecycle for drag pickers: start → down → move → up → finish.
 * Concrete pickers own drag state and what the rectangle means.
 */
export function activateDragPickerTool(options: ActivateDragPickerOptions): void {
    if (typeof ui === "undefined") {
        return;
    }

    notifyPickerToolStart();
    ui.activateTool({
        id: options.id,
        cursor: options.cursor || "cross_hair",
        filter: options.filter,
        onStart: () => {
            if (options.onStart) {
                options.onStart();
            }
        },
        onDown: (event) => {
            options.onDown(event);
        },
        onMove: (event) => {
            options.onMove(event);
        },
        onUp: (event) => {
            options.onUp(event);
        },
        onFinish: () => {
            if (options.onFinish) {
                options.onFinish();
            }
            maybeGrabLookInsideHover();
        }
    });
}

export function cancelToolIfId(id: string): void {
    if (typeof ui === "undefined" || !ui.tool) {
        return;
    }
    if (ui.tool.id === id) {
        ui.tool.cancel();
    }
}

export function mapCoordsToTile(coords: CoordsXY | undefined): TileCoords | null {
    if (!coords || (coords.x === 0 && coords.y === 0)) {
        return null;
    }
    return {
        x: Math.floor(coords.x / 32),
        y: Math.floor(coords.y / 32)
    };
}

export function highlightMapTiles(tiles: TileCoords[]): void {
    const coords: CoordsXY[] = [];
    for (let i = 0; i < tiles.length; i++) {
        coords.push({
            x: tiles[i].x * 32,
            y: tiles[i].y * 32
        });
    }
    ui.tileSelection.range = null;
    ui.tileSelection.tiles = coords;
}

export function highlightMapTile(tile: TileCoords): void {
    highlightMapTiles([tile]);
}

export function clearTileSelection(): void {
    ui.tileSelection.range = null;
    ui.tileSelection.tiles = [];
}
