/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {VariableRandomIntStepDesc} from "../../../../model/animation/jsonTypes";
import {createTypedVariablePicker} from "../../../variables/typedVariablePicker";

export function createVariableRandomIntFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const minValue = store<number>(1);
    const maxValue = store<number>(10);
    const picker = createTypedVariablePicker({
        valueType: "int",
        emptyLabel: "(No Int Variables)",
        missingLabel: "Int Variable Missing",
        visibility,
        onChange: () => onPersist(),
        storedOnly: true
    });

    function hide(): void {
        visibility.set("none");
    }

    function refresh(): void {
        picker.refresh();
    }

    function load(desc: VariableRandomIntStepDesc): void {
        visibility.set("visible");
        picker.refresh(desc.variableId);
        minValue.set(typeof desc.min === "number" ? desc.min : 1);
        maxValue.set(typeof desc.max === "number" ? desc.max : 10);
    }

    function persist(): VariableRandomIntStepDesc {
        return {
            type: "variableRandomInt",
            variableId: picker.selectedId(),
            min: minValue.get(),
            max: maxValue.get()
        };
    }

    const widgets = [
        groupbox({
            text: "Random Integer",
            visibility,
            content: [
                ...picker.widgets,
                horizontal([
                    label({
                        text: "Min",
                        width: 40,
                        visibility
                    }),
                    spinner({
                        step: spinnerStep,
                        value: twoway(minValue),
                        minimum: -100000,
                        maximum: 100000,
                        visibility,
                        onChange: (value) => {
                            minValue.set(value);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({
                        text: "Max",
                        width: 40,
                        visibility
                    }),
                    spinner({
                        step: spinnerStep,
                        value: twoway(maxValue),
                        minimum: -100000,
                        maximum: 100000,
                        visibility,
                        onChange: (value) => {
                            maxValue.set(value);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {hide, refresh, load, persist, widgets};
}

export type VariableRandomIntFields = ReturnType<typeof createVariableRandomIntFields>;
