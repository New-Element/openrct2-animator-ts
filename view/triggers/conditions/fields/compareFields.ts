/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {CompareOp} from "../../../../model/animation/jsonTypes";
import {COMPARE_LABELS, COMPARE_OPS, compareOpIndex} from "../../../../model/animation/trigger/condition/compare";

export function createCompareFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const opIndex = store<number>(0);
    const value = store<number>(0);

    function hide(): void {
        visibility.set("none");
    }

    function load(op: CompareOp, nextValue: number): void {
        visibility.set("visible");
        opIndex.set(compareOpIndex(op));
        value.set(nextValue);
    }

    function read(): {op: CompareOp; value: number} {
        return {
            op: COMPARE_OPS[opIndex.get()] || "eq",
            value: value.get()
        };
    }

    const widgets = [
        horizontal([
            label({
                text: "Compare",
                width: 55,
                visibility
            }),
            dropdown({
                items: COMPARE_LABELS,
                selectedIndex: twoway(opIndex),
                width: 50,
                visibility,
                onChange: (index) => {
                    opIndex.set(index);
                    onPersist();
                }
            }),
            spinner({
                step: spinnerStep,
                value: twoway(value),
                minimum: -100000,
                maximum: 100000,
                visibility,
                onChange: (next) => {
                    value.set(next);
                    onPersist();
                }
            })
        ])
    ];

    return {hide, load, read, widgets};
}

export type CompareFields = ReturnType<typeof createCompareFields>;
