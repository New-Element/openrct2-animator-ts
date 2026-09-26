/// <reference path="./../../openrct2.d.ts" />

import {
    activatePickerTool,
    clearTileSelection,
    highlightMapTile,
    mapCoordsToTile
} from "./pickerTool";

const TOOL_ID = "animator-pick-guest";

function resolveGuestId(entityId: number | undefined): number | null {
    if (entityId === undefined) {
        return null;
    }
    const entity = map.getEntity(entityId);
    if (!entity || entity.type !== "guest" || entity.id === null) {
        return null;
    }
    return entity.id;
}

export function pickGuest(onPicked: (guestId: number) => void): void {
    activatePickerTool<number>({
        id: TOOL_ID,
        filter: ["entity"],
        resolve: (event) => resolveGuestId(event.entityId),
        onHover: (guestId) => {
            const entity = map.getEntity(guestId);
            if (!entity) {
                return;
            }
            const tile = mapCoordsToTile({x: entity.x, y: entity.y});
            if (tile) {
                highlightMapTile(tile);
            }
        },
        onPick: onPicked,
        onFinish: () => clearTileSelection()
    });
}
