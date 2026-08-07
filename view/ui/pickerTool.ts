/// <reference path="./../../openrct2.d.ts" />

import TileCoords from "../../game/tileCoords";

export type PickerToolEvent = {
    mapCoords?: CoordsXY;
    tileElementIndex?: number;
    entityId?: number;
};

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
}

/**
 * Shared tool lifecycle for map pickers: move → hover, down → pick + cancel, finish → cleanup.
 * Concrete pickers (tile, ride, object, …) supply resolve / hover / pick only.
 */
export function activatePickerTool<T>(options: ActivatePickerOptions<T>): void {
    if (typeof ui === "undefined") {
        return;
    }

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
            if (ui.tool) {
                ui.tool.cancel();
            }
        },
        onFinish: () => {
            if (options.onFinish) {
                options.onFinish();
            }
        }
    });
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

export function highlightMapTile(tile: TileCoords): void {
    ui.tileSelection.tiles = [
        {
            x: tile.x * 32,
            y: tile.y * 32
        }
    ];
}

export function clearTileSelection(): void {
    ui.tileSelection.tiles = [];
}
