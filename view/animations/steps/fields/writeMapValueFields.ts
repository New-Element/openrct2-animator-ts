/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, store} from "openrct2-flexui";
import {createPeepTargetFields} from "../../../triggers/conditions/fields/peepTargetFields";
import {createTypedVariablePicker} from "../../../variables/typedVariablePicker";

export function createWriteMapValueFields(onPersist: () => void) {
    const tileVisibility = store<"visible" | "none">("none");
    const coordsVisibility = store<"visible" | "none">("none");
    const directionVisibility = store<"visible" | "none">("none");
    const guestVisibility = store<"visible" | "none">("none");
    const staffVisibility = store<"visible" | "none">("none");

    const tilePicker = createTypedVariablePicker({
        valueType: "tile",
        emptyLabel: "(No Tile Variables)",
        missingLabel: "Tile Variable Missing",
        visibility: tileVisibility,
        storedOnly: true,
        onChange: () => onPersist()
    });
    const coordsPicker = createTypedVariablePicker({
        valueType: "coords",
        emptyLabel: "(No Coords Variables)",
        missingLabel: "Coords Variable Missing",
        visibility: coordsVisibility,
        storedOnly: true,
        onChange: () => onPersist()
    });
    const directionPicker = createTypedVariablePicker({
        valueType: "direction",
        emptyLabel: "(No Direction Variables)",
        missingLabel: "Direction Variable Missing",
        visibility: directionVisibility,
        storedOnly: true,
        onChange: () => onPersist()
    });
    const guest = createPeepTargetFields(onPersist, "guest");
    const staff = createPeepTargetFields(onPersist, "staff");

    function hide(): void {
        tileVisibility.set("none");
        coordsVisibility.set("none");
        directionVisibility.set("none");
        guestVisibility.set("none");
        staffVisibility.set("none");
        guest.hide();
        staff.hide();
    }

    function loadTileDestination(variableId: string): void {
        hide();
        tileVisibility.set("visible");
        tilePicker.refresh(variableId);
    }

    function loadCoordsDestination(variableId: string): void {
        coordsVisibility.set("visible");
        coordsPicker.refresh(variableId);
    }

    function loadGuest(variableId: string, useTrigger: boolean, guestId: number | undefined): void {
        hide();
        loadCoordsDestination(variableId);
        guestVisibility.set("visible");
        guest.load(useTrigger, guestId);
    }

    function loadStaff(variableId: string, useTrigger: boolean, staffId: number | undefined): void {
        hide();
        loadCoordsDestination(variableId);
        staffVisibility.set("visible");
        staff.load(useTrigger, staffId);
    }

    function loadDirectionDestination(variableId: string): void {
        directionVisibility.set("visible");
        directionPicker.refresh(variableId);
    }

    function loadGuestDirection(variableId: string, useTrigger: boolean, guestId: number | undefined): void {
        hide();
        loadDirectionDestination(variableId);
        guestVisibility.set("visible");
        guest.load(useTrigger, guestId);
    }

    function loadStaffDirection(variableId: string, useTrigger: boolean, staffId: number | undefined): void {
        hide();
        loadDirectionDestination(variableId);
        staffVisibility.set("visible");
        staff.load(useTrigger, staffId);
    }

    const widgets = [
        groupbox({
            text: "Destination",
            visibility: tileVisibility,
            content: tilePicker.widgets
        }),
        groupbox({
            text: "Destination",
            visibility: coordsVisibility,
            content: coordsPicker.widgets
        }),
        groupbox({
            text: "Destination",
            visibility: directionVisibility,
            content: directionPicker.widgets
        }),
        groupbox({
            text: "Guest",
            visibility: guestVisibility,
            content: guest.widgets
        }),
        groupbox({
            text: "Staff",
            visibility: staffVisibility,
            content: staff.widgets
        })
    ];

    return {
        hide,
        loadTileDestination,
        loadCoordsDestination,
        loadDirectionDestination,
        loadGuest,
        loadStaff,
        loadGuestDirection,
        loadStaffDirection,
        tileVariableId: () => tilePicker.selectedId(),
        coordsVariableId: () => coordsPicker.selectedId(),
        directionVariableId: () => directionPicker.selectedId(),
        readGuest: () => guest.read(),
        readStaff: () => staff.read(),
        widgets
    };
}

export type WriteMapValueFields = ReturnType<typeof createWriteMapValueFields>;
