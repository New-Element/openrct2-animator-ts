/// <reference path="./../../openrct2.d.ts" />

import TileCoords from "../../game/tileCoords";
import {
    activateDragPickerTool,
    cancelToolIfId,
    highlightMapTiles,
    mapCoordsToTile,
    PickerToolEvent
} from "./pickerTool";

export const PICK_TILE_SET_TOOL_ID = "animator-pick-tile-set";

export type TileSetDragMode = "add" | "remove";

export type PickTileSetOptions = {
    /** Tiles already in the set; used for highlight and add-vs-remove. */
    getTiles: () => TileCoords[];
    /** Called on mouse up with every tile in the dragged rectangle. */
    onCommit: (mode: TileSetDragMode, tiles: TileCoords[]) => void;
    onFinish?: () => void;
};

function copyTiles(tiles: TileCoords[]): TileCoords[] {
    const out: TileCoords[] = [];
    for (let i = 0; i < tiles.length; i++) {
        out.push({x: tiles[i].x, y: tiles[i].y});
    }
    return out;
}

function tilesEqual(a: TileCoords, b: TileCoords): boolean {
    return a.x === b.x && a.y === b.y;
}

function tileListContains(tiles: TileCoords[], tile: TileCoords): boolean {
    for (let i = 0; i < tiles.length; i++) {
        if (tilesEqual(tiles[i], tile)) {
            return true;
        }
    }
    return false;
}

export function tilesInRect(a: TileCoords, b: TileCoords): TileCoords[] {
    const x0 = Math.min(a.x, b.x);
    const x1 = Math.max(a.x, b.x);
    const y0 = Math.min(a.y, b.y);
    const y1 = Math.max(a.y, b.y);
    const out: TileCoords[] = [];
    for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
            out.push({x: x, y: y});
        }
    }
    return out;
}

function unionTiles(base: TileCoords[], extra: TileCoords[]): TileCoords[] {
    const out = copyTiles(base);
    for (let i = 0; i < extra.length; i++) {
        if (!tileListContains(out, extra[i])) {
            out.push({x: extra[i].x, y: extra[i].y});
        }
    }
    return out;
}

function subtractTiles(base: TileCoords[], remove: TileCoords[]): TileCoords[] {
    const out: TileCoords[] = [];
    for (let i = 0; i < base.length; i++) {
        if (!tileListContains(remove, base[i])) {
            out.push({x: base[i].x, y: base[i].y});
        }
    }
    return out;
}

function previewTiles(base: TileCoords[], range: TileCoords[], mode: TileSetDragMode): TileCoords[] {
    if (mode === "add") {
        return unionTiles(base, range);
    }
    return subtractTiles(base, range);
}

function eventTile(event: PickerToolEvent): TileCoords | null {
    return mapCoordsToTile(event.mapCoords);
}

/**
 * Drag a rectangle of tiles. Starting on a tile already in the set removes the
 * rectangle; otherwise it adds. Same rule as Scenery Manager's area selector.
 * Stays active until the user cancels the tool.
 */
export function pickTileSet(options: PickTileSetOptions): void {
    let dragging = false;
    let mode: TileSetDragMode = "add";
    let start: TileCoords | null = null;
    let end: TileCoords | null = null;

    function included(): TileCoords[] {
        return copyTiles(options.getTiles());
    }

    function showIdle(): void {
        highlightMapTiles(included());
    }

    function showDrag(): void {
        if (!start || !end) {
            showIdle();
            return;
        }
        highlightMapTiles(previewTiles(included(), tilesInRect(start, end), mode));
    }

    activateDragPickerTool({
        id: PICK_TILE_SET_TOOL_ID,
        filter: ["terrain"],
        onStart: () => {
            showIdle();
        },
        onDown: (event) => {
            const tile = eventTile(event);
            if (!tile) {
                return;
            }
            dragging = true;
            start = tile;
            end = tile;
            mode = tileListContains(included(), tile) ? "remove" : "add";
            showDrag();
        },
        onMove: (event) => {
            if (!dragging) {
                showIdle();
                return;
            }
            const tile = eventTile(event);
            if (!tile) {
                return;
            }
            end = tile;
            showDrag();
        },
        onUp: () => {
            if (!dragging || !start || !end) {
                dragging = false;
                showIdle();
                return;
            }
            const range = tilesInRect(start, end);
            const commitMode = mode;
            dragging = false;
            start = null;
            end = null;
            options.onCommit(commitMode, range);
            showIdle();
        },
        onFinish: () => {
            dragging = false;
            start = null;
            end = null;
            if (options.onFinish) {
                options.onFinish();
            }
        }
    });
}

export function cancelPickTileSet(): void {
    cancelToolIfId(PICK_TILE_SET_TOOL_ID);
}
