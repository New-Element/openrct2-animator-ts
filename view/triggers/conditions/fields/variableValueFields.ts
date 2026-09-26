/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, horizontal, label, spinner, store, textbox, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {CompareOp, VariableRhsKind} from "../../../../model/animation/jsonTypes";
import {COMPARE_LABELS, COMPARE_OPS, compareOpIndex} from "../../../../model/animation/trigger/condition/compare";
import getConductor from "../../../../model/getConductor";

const RHS_KINDS: VariableRhsKind[] = ["constant", "variable"];
const RHS_LABELS = ["Constant", "Other Variable"];

function displayName(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed : "(Unnamed)";
}

export function createVariableValueFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const constantVisibility = store<"visible" | "none">("none");
    const numberVisibility = store<"visible" | "none">("none");
    const stringVisibility = store<"visible" | "none">("none");
    const otherVarVisibility = store<"visible" | "none">("none");
    const variableItems = store<string[]>(["(No Variables)"]);
    const variableIndex = store<number>(0);
    const otherItems = store<string[]>(["(No Variables)"]);
    const otherIndex = store<number>(0);
    const opIndex = store<number>(0);
    const rhsIndex = store<number>(0);
    const numberValue = store<number>(0);
    const stringValue = store<string>("");
    let variableIds: string[] = [];

    function refreshVariables(): void {
        const variables = getConductor().variablesArray.items;
        variableIds = [];
        const labels: string[] = [];
        for (let i = 0; i < variables.length; i++) {
            variableIds.push(variables[i].id);
            labels.push(displayName(variables[i].name));
        }
        if (labels.length === 0) {
            variableItems.set(["(No Variables)"]);
            otherItems.set(["(No Variables)"]);
            return;
        }
        variableItems.set(labels);
        otherItems.set(labels);
    }

    function indexOfId(id: string): number {
        for (let i = 0; i < variableIds.length; i++) {
            if (variableIds[i] === id) {
                return i;
            }
        }
        return 0;
    }

    function selectedIsString(): boolean {
        const id = variableIds[variableIndex.get()];
        if (!id) {
            return false;
        }
        const variable = getConductor().variablesArray.findById(id);
        return !!variable && variable.valueType === "string";
    }

    function syncRhs(): void {
        const shown = visibility.get() === "visible";
        const rhs = RHS_KINDS[rhsIndex.get()] || "constant";
        const isString = selectedIsString();
        constantVisibility.set(shown && rhs === "constant" ? "visible" : "none");
        numberVisibility.set(shown && rhs === "constant" && !isString ? "visible" : "none");
        stringVisibility.set(shown && rhs === "constant" && isString ? "visible" : "none");
        otherVarVisibility.set(shown && rhs === "variable" ? "visible" : "none");
    }

    function hide(): void {
        visibility.set("none");
        constantVisibility.set("none");
        numberVisibility.set("none");
        stringVisibility.set("none");
        otherVarVisibility.set("none");
    }

    function load(desc: {
        variableId: string;
        op: CompareOp;
        rhsKind: VariableRhsKind;
        constant?: number | string;
        otherVariableId?: string;
    }): void {
        refreshVariables();
        visibility.set("visible");
        variableIndex.set(desc.variableId ? indexOfId(desc.variableId) : 0);
        opIndex.set(compareOpIndex(desc.op));
        rhsIndex.set(desc.rhsKind === "variable" ? 1 : 0);
        if (typeof desc.constant === "number") {
            numberValue.set(desc.constant);
        }
        if (typeof desc.constant === "string") {
            stringValue.set(desc.constant);
        }
        if (desc.otherVariableId) {
            otherIndex.set(indexOfId(desc.otherVariableId));
        }
        syncRhs();
    }

    function read(): {
        variableId: string;
        op: CompareOp;
        rhsKind: VariableRhsKind;
        constant: number | string;
        otherVariableId?: string;
    } {
        const rhs = RHS_KINDS[rhsIndex.get()] || "constant";
        return {
            variableId: variableIds[variableIndex.get()] || "",
            op: COMPARE_OPS[opIndex.get()] || "eq",
            rhsKind: rhs,
            constant: selectedIsString() ? stringValue.get() : numberValue.get(),
            otherVariableId: variableIds[otherIndex.get()]
        };
    }

    const widgets = [
        label({
            text: "Variable",
            visibility
        }),
        dropdown({
            items: variableItems,
            selectedIndex: twoway(variableIndex),
            visibility,
            onChange: (index) => {
                variableIndex.set(index);
                syncRhs();
                onPersist();
            }
        }),
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
            dropdown({
                items: RHS_LABELS,
                selectedIndex: twoway(rhsIndex),
                visibility,
                onChange: (index) => {
                    rhsIndex.set(index);
                    syncRhs();
                    onPersist();
                }
            })
        ]),
        spinner({
            step: spinnerStep,
            value: twoway(numberValue),
            minimum: -100000,
            maximum: 100000,
            visibility: numberVisibility,
            onChange: (value) => {
                numberValue.set(value);
                onPersist();
            }
        }),
        textbox({
            text: stringValue,
            visibility: stringVisibility,
            onChange: (value) => {
                stringValue.set(value);
                onPersist();
            }
        }),
        dropdown({
            items: otherItems,
            selectedIndex: twoway(otherIndex),
            visibility: otherVarVisibility,
            onChange: (index) => {
                otherIndex.set(index);
                onPersist();
            }
        })
    ];

    return {hide, load, read, widgets};
}

export type VariableValueFields = ReturnType<typeof createVariableValueFields>;
