/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, store} from "openrct2-flexui";
import {SceneryRotationStepDesc} from "../../../../model/animation/jsonTypes";
import {createNumberSourceFields} from "./numberSourceFields";
import {createSceneryTargetFields} from "./sceneryTargetFields";

export function createSceneryRotationFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const directionFields = createNumberSourceFields({
        valueType: "direction",
        label: "Rotation",
        minimum: 0,
        maximum: 3,
        onPersist: onPersist,
        visibility: visibility
    });
    const target = createSceneryTargetFields(onPersist, visibility, (picked) => {
        directionFields.load(picked.direction);
    });

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: SceneryRotationStepDesc): void {
        visibility.set("visible");
        target.load(desc);
        directionFields.load(desc.direction, desc.directionOrigin, desc.directionVariableId);
    }

    function persist(): SceneryRotationStepDesc {
        const source = directionFields.read();
        return {
            type: "sceneryRotation",
            ...target.persistTarget(),
            direction: source.value,
            ...(source.origin === "variable" ? {directionOrigin: "variable", directionVariableId: source.variableId || ""} : {})
        };
    }

    const widgets = [
        groupbox({
            text: "Rotate Scenery",
            visibility,
            content: [
                ...target.widgets,
                ...directionFields.widgets
            ]
        })
    ];

    return {hide, load, persist, widgets};
}

export type SceneryRotationFields = ReturnType<typeof createSceneryRotationFields>;
