/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, store} from "openrct2-flexui";
import {SwitchTiTrackOrderStepDesc} from "../../../../model/animation/jsonTypes";
import {createRideTileFields} from "./rideTileFields";
import {RideSelectFields} from "./rideSelectFields";

export function createSwitchTiTrackOrderFields(
    rideSelect: RideSelectFields,
    onPersist: () => void
) {
    const visibility = store<"visible" | "none">("none");
    const rideTile = createRideTileFields(rideSelect, onPersist, visibility);

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: SwitchTiTrackOrderStepDesc): void {
        visibility.set("visible");
        rideTile.load(desc.tile, desc.rideId);
    }

    function persist(): SwitchTiTrackOrderStepDesc {
        return {
            type: "switchTiTrackOrder",
            tile: rideTile.getTile(),
            rideId: rideTile.getRideId()
        };
    }

    const widgets = [
        groupbox({
            text: "Switch TI Track Order",
            visibility,
            content: [...rideTile.widgets]
        })
    ];

    return {hide, load, persist, widgets};
}

export type SwitchTiTrackOrderFields = ReturnType<typeof createSwitchTiTrackOrderFields>;
