import {store} from "openrct2-flexui";
import TileCoords from "../../game/tileCoords";
import {showAlert} from "../ui/alertMessage";
import {
    clearTileSelection,
    highlightMapTiles,
    onPickerToolStart
} from "../ui/pickerTool";
import {getTodos, todoDone} from "./todosStore";

export const remainingHighlightPressed = store<boolean>(false);

function remainingTiles(): TileCoords[] {
    const items = getTodos();
    const seen: {[key: string]: true} = {};
    const tiles: TileCoords[] = [];
    for (let i = 0; i < items.length; i++) {
        const todo = items[i];
        if (todoDone(todo) || !todo.tile) {
            continue;
        }
        const key = `${todo.tile.x},${todo.tile.y}`;
        if (seen[key]) {
            continue;
        }
        seen[key] = true;
        tiles.push({x: todo.tile.x, y: todo.tile.y});
    }
    return tiles;
}

export function clearRemainingHighlight(): void {
    remainingHighlightPressed.set(false);
    clearTileSelection();
}

export function applyRemainingHighlight(): void {
    if (!remainingHighlightPressed.get()) {
        return;
    }
    const tiles = remainingTiles();
    if (tiles.length === 0) {
        remainingHighlightPressed.set(false);
        clearTileSelection();
        return;
    }
    highlightMapTiles(tiles);
}

export function setRemainingHighlight(on: boolean): void {
    if (!on) {
        clearRemainingHighlight();
        return;
    }
    const tiles = remainingTiles();
    if (tiles.length === 0) {
        remainingHighlightPressed.set(false);
        clearTileSelection();
        showAlert("No Tiles To Highlight", "No Remaining To-Dos Have A Tile.");
        return;
    }
    remainingHighlightPressed.set(true);
    highlightMapTiles(tiles);
}

export function toggleRemainingHighlight(): void {
    setRemainingHighlight(!remainingHighlightPressed.get());
}

onPickerToolStart(() => {
    if (remainingHighlightPressed.get()) {
        clearRemainingHighlight();
    }
});
