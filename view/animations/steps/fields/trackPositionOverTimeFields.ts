/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, store} from "openrct2-flexui";
import {NumberSourceOrigin} from "../../../../model/animation/jsonTypes";
import {createNumberSourceFields} from "./numberSourceFields";

export function createTrackPositionOverTimeFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const positionFields = createNumberSourceFields({
        valueType: "int",
        label: "Position",
        minimum: -100000,
        maximum: 100000,
        onPersist,
        visibility
    });
    const spacingFields = createNumberSourceFields({
        valueType: "int",
        label: "Spacing",
        minimum: -100000,
        maximum: 100000,
        onPersist,
        visibility
    });
    const durationFields = createNumberSourceFields({
        valueType: "int",
        label: "Duration",
        minimum: 1,
        maximum: 100000,
        onPersist,
        visibility
    });

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: {
        position?: number;
        positionOrigin?: NumberSourceOrigin;
        positionVariableId?: string;
        spacing?: number;
        spacingOrigin?: NumberSourceOrigin;
        spacingVariableId?: string;
        durationTicks: number;
        durationTicksOrigin?: NumberSourceOrigin;
        durationTicksVariableId?: string;
    }): void {
        visibility.set("visible");
        positionFields.load(desc.position || 0, desc.positionOrigin, desc.positionVariableId);
        spacingFields.load(desc.spacing || 0, desc.spacingOrigin, desc.spacingVariableId);
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

    function read() {
        const data: {
            position: number;
            positionOrigin?: NumberSourceOrigin;
            positionVariableId?: string;
            spacing: number;
            spacingOrigin?: NumberSourceOrigin;
            spacingVariableId?: string;
            durationTicks: number;
            durationTicksOrigin?: NumberSourceOrigin;
            durationTicksVariableId?: string;
        } = {
            position: 0,
            spacing: 0,
            durationTicks: 40
        };
        applyNamed(data, "position", positionFields.read());
        applyNamed(data, "spacing", spacingFields.read());
        applyNamed(data, "durationTicks", durationFields.read());
        return data;
    }

    const widgets = [
        groupbox({
            text: "Along Track",
            visibility,
            content: [
                ...positionFields.widgets,
                ...spacingFields.widgets,
                ...durationFields.widgets
            ]
        })
    ];

    return {hide, load, read, widgets};
}

export type TrackPositionOverTimeFields = ReturnType<typeof createTrackPositionOverTimeFields>;
