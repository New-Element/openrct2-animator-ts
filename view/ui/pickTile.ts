/// <reference path="./../../openrct2.d.ts" />

import TileCoords from "../../game/tileCoords";
import {
    activatePickerTool,
    clearTileSelection,
    highlightMapTile,
    mapCoordsToTile
} from "./pickerTool";

const TOOL_ID = "animator-pick-tile";

/**
 * Activate a map tile picker tool. Calls onPicked with tile coords, then cancels.
 * Highlights the tile under the cursor while the tool is active.
 */
export function pickTile(onPicked: (tile: TileCoords) => void): void {
    activatePickerTool<TileCoords>({
        id: TOOL_ID,
        filter: ["terrain"],
        resolve: (event) => mapCoordsToTile(event.mapCoords),
        onHover: (tile) => highlightMapTile(tile),
        onPick: onPicked,
        onFinish: () => clearTileSelection()
    });
}
