/// <reference path="./../../../../openrct2.d.ts" />

import {compute, dropdown, horizontal, label, spinner, store, Store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {NumberSourceOrigin, VariableValueType} from "../../../../model/animation/jsonTypes";
import {persistNumberSource, readNumberOrigin} from "../../../../model/animation/step/numberSource";
import {createTypedVariablePicker} from "../../../variables/typedVariablePicker";

const ORIGIN_LABELS = ["Hardcoded", "Variable"];

export function createNumberSourceFields(args: {
    valueType: VariableValueType;
    label: string;
    minimum: number;
    maximum: number;
    onPersist: () => void;
    visibility: Store<"visible" | "none">;
}) {
    const originSelected = store<number>(0);
    const hardcoded = store<number>(0);
    const hardcodedVisibility = compute(args.visibility, originSelected, (shown, index) => (
        shown === "visible" && index === 0 ? "visible" : "none" as const
    ));
    const variableVisibility = compute(args.visibility, originSelected, (shown, index) => (
        shown === "visible" && index === 1 ? "visible" : "none" as const
    ));
    const emptyLabel = args.valueType === "float"
        ? "(No Float Variables)"
        : args.valueType === "direction"
            ? "(No Direction Variables)"
            : "(No Int Variables)";
    const missingLabel = args.valueType === "float"
        ? "Float Variable Missing"
        : args.valueType === "direction"
            ? "Direction Variable Missing"
            : "Int Variable Missing";
    const picker = createTypedVariablePicker({
        valueType: args.valueType,
        emptyLabel: emptyLabel,
        missingLabel: missingLabel,
        visibility: variableVisibility,
        onChange: () => args.onPersist()
    });

    function origin(): NumberSourceOrigin {
        return originSelected.get() === 1 ? "variable" : "hardcoded";
    }

    function load(value: number, valueOrigin?: NumberSourceOrigin, variableId?: string): void {
        originSelected.set(readNumberOrigin(valueOrigin) === "variable" ? 1 : 0);
        hardcoded.set(typeof value === "number" ? value : 0);
        picker.refresh(typeof variableId === "string" ? variableId : "");
    }

    function read(): {value: number; origin?: NumberSourceOrigin; variableId?: string} {
        return persistNumberSource(hardcoded.get(), origin(), picker.selectedId());
    }

    const widgets = [
        horizontal([
            label({text: args.label, width: 70, visibility: args.visibility}),
            dropdown({
                items: ORIGIN_LABELS,
                selectedIndex: twoway(originSelected),
                visibility: args.visibility,
                onChange: (index) => {
                    originSelected.set(index);
                    if (index === 1) {
                        picker.refresh();
                    }
                    args.onPersist();
                }
            }),
            spinner({
                step: spinnerStep,
                value: twoway(hardcoded),
                minimum: args.minimum,
                maximum: args.maximum,
                visibility: hardcodedVisibility,
                onChange: (next) => {
                    hardcoded.set(next);
                    args.onPersist();
                }
            })
        ]),
        ...picker.widgets
    ];

    return {load, read, origin, picker, widgets};
}

export type NumberSourceFields = ReturnType<typeof createNumberSourceFields>;
