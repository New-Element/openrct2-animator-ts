/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, groupbox, horizontal, label, spinner, store, textbox, twoway} from "openrct2-flexui";
import getConductor from "../../../../model/getConductor";

export function createVariableStepFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const amountVisibility = store<"visible" | "none">("none");
    const valueVisibility = store<"visible" | "none">("none");
    const variableDropdownItems = store<string[]>(["(No Variables)"]);
    const variableSelectedIndex = store<number>(0);
    const variableAmount = store<number>(1);
    const variableValueText = store<string>("0");
    let variableOptionIds: string[] = [];

    function refreshVariableOptions(): void {
        const variables = getConductor().variablesArray.items;
        variableOptionIds = [];
        if (variables.length === 0) {
            variableDropdownItems.set(["(No Variables)"]);
            variableSelectedIndex.set(0);
            return;
        }
        const labels: string[] = [];
        for (let i = 0; i < variables.length; i++) {
            const name = variables[i].name.trim() ? variables[i].name : "(Unnamed)";
            labels.push(name);
            variableOptionIds.push(variables[i].id);
        }
        variableDropdownItems.set(labels);
    }

    function hide(): void {
        visibility.set("none");
        amountVisibility.set("none");
        valueVisibility.set("none");
    }

    function selectedVariableId(): string {
        return variableOptionIds[variableSelectedIndex.get()] || "";
    }

    function loadSet(variableId: string, value: string | number): void {
        visibility.set("visible");
        valueVisibility.set("visible");
        amountVisibility.set("none");
        refreshVariableOptions();
        variableSelectedIndex.set(Math.max(0, variableOptionIds.indexOf(variableId)));
        variableValueText.set(String(value));
    }

    function loadAmount(variableId: string, amount: number): void {
        visibility.set("visible");
        amountVisibility.set("visible");
        valueVisibility.set("none");
        refreshVariableOptions();
        variableSelectedIndex.set(Math.max(0, variableOptionIds.indexOf(variableId)));
        variableAmount.set(amount);
    }

    function readSetValue(): string | number {
        const raw = variableValueText.get();
        const asNumber = Number(raw);
        return raw !== "" && !isNaN(asNumber) ? asNumber : raw;
    }

    function readAmount(): number {
        return variableAmount.get();
    }

    const widgets = [
        groupbox({
            text: "Variable",
            visibility,
            content: [
                dropdown({
                    items: variableDropdownItems,
                    selectedIndex: twoway(variableSelectedIndex),
                    visibility,
                    onChange: (index) => {
                        variableSelectedIndex.set(index);
                        onPersist();
                    }
                }),
                horizontal([
                    label({
                        text: "Amount",
                        width: 50,
                        visibility: amountVisibility
                    }),
                    spinner({
                        value: twoway(variableAmount),
                        minimum: -100000,
                        maximum: 100000,
                        visibility: amountVisibility,
                        onChange: (value) => {
                            variableAmount.set(value);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({
                        text: "Value",
                        width: 40,
                        visibility: valueVisibility
                    }),
                    textbox({
                        text: variableValueText,
                        visibility: valueVisibility,
                        onChange: (text) => {
                            variableValueText.set(text);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {
        hide,
        refreshVariableOptions,
        loadSet,
        loadAmount,
        selectedVariableId,
        readSetValue,
        readAmount,
        widgets
    };
}

export type VariableStepFields = ReturnType<typeof createVariableStepFields>;
