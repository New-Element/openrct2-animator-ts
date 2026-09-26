/// <reference path="./../../../../openrct2.d.ts" />

import {store} from "openrct2-flexui";
import {TileTargetDesc} from "../../../../model/animation/jsonTypes";
import {createTileTargetFields} from "../../../animations/steps/fields/tileTargetFields";

export function createConditionTileFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const tile = createTileTargetFields(onPersist, visibility);

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: TileTargetDesc): void {
        visibility.set("visible");
        tile.load(desc);
    }

    function read(): TileTargetDesc {
        return tile.readTarget();
    }

    return {hide, load, read, setAbsoluteTile: tile.setAbsoluteTile, widgets: tile.widgets};
}

export type ConditionTileFields = ReturnType<typeof createConditionTileFields>;
