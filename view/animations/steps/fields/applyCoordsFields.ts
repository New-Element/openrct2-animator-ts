/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, store} from "openrct2-flexui";
import {CoordsSourceDesc} from "../../../../model/animation/jsonTypes";
import {createPeepTargetFields} from "../../../triggers/conditions/fields/peepTargetFields";
import {createCoordsSourceFields} from "./coordsSourceFields";

export function createApplyCoordsFields(onPersist: () => void) {
    const coordsVisibility = store<"visible" | "none">("none");
    const staffVisibility = store<"visible" | "none">("none");
    const coords = createCoordsSourceFields(onPersist, coordsVisibility);
    const staff = createPeepTargetFields(onPersist, "staff");

    function hide(): void {
        coordsVisibility.set("none");
        staffVisibility.set("none");
        staff.hide();
    }

    function loadCar(desc: CoordsSourceDesc): void {
        hide();
        coordsVisibility.set("visible");
        coords.load(desc);
    }

    function loadStaff(desc: CoordsSourceDesc, useTrigger: boolean, staffId: number | undefined): void {
        hide();
        coordsVisibility.set("visible");
        staffVisibility.set("visible");
        coords.load(desc);
        staff.load(useTrigger, staffId);
    }

    const widgets = [
        groupbox({
            text: "Coords",
            visibility: coordsVisibility,
            content: coords.widgets
        }),
        groupbox({
            text: "Staff",
            visibility: staffVisibility,
            content: staff.widgets
        })
    ];

    return {
        hide,
        loadCar,
        loadStaff,
        readCoords: () => coords.read(),
        readStaff: () => staff.read(),
        widgets
    };
}

export type ApplyCoordsFields = ReturnType<typeof createApplyCoordsFields>;
