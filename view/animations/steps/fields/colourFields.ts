/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, store} from "openrct2-flexui";
import {NumberSourceOrigin} from "../../../../model/animation/jsonTypes";
import {UNSELECTED_COLOUR} from "../../../../model/animation/step/car/vehicleColour";
import {createColourSourceFields} from "./colourSourceFields";

export function createColourFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const bodyFields = createColourSourceFields({label: "Body", onPersist: onPersist, visibility: visibility});
    const trimFields = createColourSourceFields({label: "Trim", onPersist: onPersist, visibility: visibility});
    const tertiaryFields = createColourSourceFields({label: "Tertiary", onPersist: onPersist, visibility: visibility});

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: {
        value: {body: number; trim: number; tertiary: number};
        bodyOrigin?: NumberSourceOrigin;
        bodyVariableId?: string;
        trimOrigin?: NumberSourceOrigin;
        trimVariableId?: string;
        tertiaryOrigin?: NumberSourceOrigin;
        tertiaryVariableId?: string;
    }): void {
        visibility.set("visible");
        const value = desc.value || {body: UNSELECTED_COLOUR, trim: UNSELECTED_COLOUR, tertiary: UNSELECTED_COLOUR};
        bodyFields.load(value.body, desc.bodyOrigin, desc.bodyVariableId);
        trimFields.load(value.trim, desc.trimOrigin, desc.trimVariableId);
        tertiaryFields.load(value.tertiary, desc.tertiaryOrigin, desc.tertiaryVariableId);
    }

    function applyOrigin(
        data: {
            bodyOrigin?: NumberSourceOrigin;
            bodyVariableId?: string;
            trimOrigin?: NumberSourceOrigin;
            trimVariableId?: string;
            tertiaryOrigin?: NumberSourceOrigin;
            tertiaryVariableId?: string;
        },
        field: "body" | "trim" | "tertiary",
        source: {value: number; origin?: NumberSourceOrigin; variableId?: string}
    ): void {
        if (source.origin === "variable") {
            data[`${field}Origin`] = "variable";
            data[`${field}VariableId`] = source.variableId || "";
        }
    }

    function read() {
        const body = bodyFields.read();
        const trim = trimFields.read();
        const tertiary = tertiaryFields.read();
        const data: {
            value: {body: number; trim: number; tertiary: number};
            bodyOrigin?: NumberSourceOrigin;
            bodyVariableId?: string;
            trimOrigin?: NumberSourceOrigin;
            trimVariableId?: string;
            tertiaryOrigin?: NumberSourceOrigin;
            tertiaryVariableId?: string;
        } = {
            value: {
                body: body.value,
                trim: trim.value,
                tertiary: tertiary.value
            }
        };
        applyOrigin(data, "body", body);
        applyOrigin(data, "trim", trim);
        applyOrigin(data, "tertiary", tertiary);
        return data;
    }

    function readValue() {
        return read().value;
    }

    const widgets = [
        groupbox({
            text: "Colours",
            visibility,
            content: [
                ...bodyFields.widgets,
                ...trimFields.widgets,
                ...tertiaryFields.widgets
            ]
        })
    ];

    return {visibility, hide, load, read, readValue, widgets};
}

export type ColourFields = ReturnType<typeof createColourFields>;
