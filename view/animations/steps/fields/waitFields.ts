/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, store} from "openrct2-flexui";
import {WaitStepDesc} from "../../../../model/animation/jsonTypes";
import {createNumberSourceFields} from "./numberSourceFields";

export function createWaitFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const ticks = createNumberSourceFields({
        valueType: "int",
        label: "Ticks",
        minimum: 0,
        maximum: 100000,
        onPersist: onPersist,
        visibility: visibility
    });

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: WaitStepDesc): void {
        visibility.set("visible");
        ticks.load(desc.ticks, desc.ticksOrigin, desc.ticksVariableId);
    }

    function persist(): WaitStepDesc {
        const source = ticks.read();
        return {
            type: "wait",
            ticks: source.value,
            ...(source.origin === "variable" ? {ticksOrigin: "variable", ticksVariableId: source.variableId || ""} : {})
        };
    }

    const widgets = [
        groupbox({
            text: "Wait",
            visibility,
            content: [
                ...ticks.widgets
            ]
        })
    ];

    return {visibility, hide, load, persist, widgets};
}

export type WaitFields = ReturnType<typeof createWaitFields>;
