/// <reference path="./../../openrct2.d.ts" />

import TileCoords from "../../game/tileCoords";
import {
    activatePickerTool,
    cancelToolIfId,
    clearTileSelection,
    highlightMapTile,
    mapCoordsToTile
} from "./pickerTool";

export const PICK_TILE_TOOL_ID = "animator-pick-tile";

/**
 * Activate a map tile picker tool. Calls onPicked with tile coords, then cancels
 * unless stayActive is true (user cancels to stop).
 * Highlights the tile under the cursor while the tool is active.
 */
export function pickTile(
    onPicked: (tile: TileCoords) => void,
    onToolFinish?: () => void,
    stayActive?: boolean
): void {
    activatePickerTool<TileCoords>({
        id: PICK_TILE_TOOL_ID,
        filter: ["terrain"],
        resolve: (event) => mapCoordsToTile(event.mapCoords),
        onHover: (tile) => highlightMapTile(tile),
        onPick: onPicked,
        stayActive: stayActive,
        onFinish: () => {
            clearTileSelection();
            if (onToolFinish) {
                onToolFinish();
            }
        }
    });
}

export function cancelPickTile(): void {
    cancelToolIfId(PICK_TILE_TOOL_ID);
}
