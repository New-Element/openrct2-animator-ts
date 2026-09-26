/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, store} from "openrct2-flexui";
import {NumberSourceOrigin} from "../../../../model/animation/jsonTypes";
import {createNumberSourceFields} from "./numberSourceFields";

export function createCoordsFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const deltaXFields = createNumberSourceFields({
        valueType: "int",
        label: "ΔX",
        minimum: -100000,
        maximum: 100000,
        onPersist: onPersist,
        visibility: visibility
    });
    const deltaYFields = createNumberSourceFields({
        valueType: "int",
        label: "ΔY",
        minimum: -100000,
        maximum: 100000,
        onPersist: onPersist,
        visibility: visibility
    });
    const deltaZFields = createNumberSourceFields({
        valueType: "int",
        label: "ΔZ",
        minimum: -100000,
        maximum: 100000,
        onPersist: onPersist,
        visibility: visibility
    });
    const durationFields = createNumberSourceFields({
        valueType: "int",
        label: "Duration",
        minimum: 1,
        maximum: 100000,
        onPersist: onPersist,
        visibility: visibility
    });

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: {
        deltaX?: number;
        deltaXOrigin?: NumberSourceOrigin;
        deltaXVariableId?: string;
        deltaY?: number;
        deltaYOrigin?: NumberSourceOrigin;
        deltaYVariableId?: string;
        deltaZ?: number;
        deltaZOrigin?: NumberSourceOrigin;
        deltaZVariableId?: string;
        durationTicks: number;
        durationTicksOrigin?: NumberSourceOrigin;
        durationTicksVariableId?: string;
    }): void {
        visibility.set("visible");
        deltaXFields.load(desc.deltaX || 0, desc.deltaXOrigin, desc.deltaXVariableId);
        deltaYFields.load(desc.deltaY || 0, desc.deltaYOrigin, desc.deltaYVariableId);
        deltaZFields.load(desc.deltaZ || 0, desc.deltaZOrigin, desc.deltaZVariableId);
        durationFields.load(desc.durationTicks, desc.durationTicksOrigin, desc.durationTicksVariableId);
    }

    function applyNamed(
        data: {[key: string]: number | NumberSourceOrigin | string},
        field: string,
        source: {value: number; origin?: NumberSourceOrigin; variableId?: string}
    ): void {
        data[field] = source.value;
        if (source.origin === "variable") {
            data[`${field}Origin`] = "variable";
            data[`${field}VariableId`] = source.variableId || "";
        }
    }

    function readCoords() {
        const data: {
            deltaX: number;
            deltaXOrigin?: NumberSourceOrigin;
            deltaXVariableId?: string;
            deltaY: number;
            deltaYOrigin?: NumberSourceOrigin;
            deltaYVariableId?: string;
            deltaZ: number;
            deltaZOrigin?: NumberSourceOrigin;
            deltaZVariableId?: string;
            durationTicks: number;
            durationTicksOrigin?: NumberSourceOrigin;
            durationTicksVariableId?: string;
        } = {
            deltaX: 0,
            deltaY: 0,
            deltaZ: 0,
            durationTicks: 40
        };
        applyNamed(data, "deltaX", deltaXFields.read());
        applyNamed(data, "deltaY", deltaYFields.read());
        applyNamed(data, "deltaZ", deltaZFields.read());
        applyNamed(data, "durationTicks", durationFields.read());
        return data;
    }

    const widgets = [
        groupbox({
            text: "Coordinates",
            visibility,
            content: [
                ...deltaXFields.widgets,
                ...deltaYFields.widgets,
                ...deltaZFields.widgets,
                ...durationFields.widgets
            ]
        })
    ];

    return {hide, load, readCoords, widgets};
}

export type CoordsFields = ReturnType<typeof createCoordsFields>;
