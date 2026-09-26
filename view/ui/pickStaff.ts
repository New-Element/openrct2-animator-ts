/// <reference path="./../../openrct2.d.ts" />

import {
    activatePickerTool,
    clearTileSelection,
    highlightMapTile,
    mapCoordsToTile
} from "./pickerTool";

const TOOL_ID = "animator-pick-staff";

function resolveStaffId(entityId: number | undefined): number | null {
    if (entityId === undefined) {
        return null;
    }
    const entity = map.getEntity(entityId);
    if (!entity || entity.type !== "staff" || entity.id === null) {
        return null;
    }
    return entity.id;
}

export function pickStaff(onPicked: (staffId: number) => void): void {
    activatePickerTool<number>({
        id: TOOL_ID,
        filter: ["entity"],
        resolve: (event) => resolveStaffId(event.entityId),
        onHover: (staffId) => {
            const entity = map.getEntity(staffId);
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
