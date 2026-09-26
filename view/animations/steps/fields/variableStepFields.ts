/// <reference path="./../../../../openrct2.d.ts" />

import {compute, dropdown, groupbox, horizontal, label, spinner, store, textbox, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {NumberSourceOrigin, VariableStoredValue, VariableValueType} from "../../../../model/animation/jsonTypes";
import {persistNumberSource, readNumberOrigin} from "../../../../model/animation/step/numberSource";
import {createTypedVariablePicker} from "../../../variables/typedVariablePicker";
import {emptyValueForType} from "../../../../model/animation/variable/variable";
import getConductor from "../../../../model/getConductor";
import {goToTileButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickTile} from "../../../ui/pickTile";

const DIRECTION_LABELS = ["North", "East", "South", "West"];

function displayName(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed : "(Unnamed)";
}

export function createVariableStepFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const amountVisibility = store<"visible" | "none">("none");
    const valueVisibility = store<"visible" | "none">("none");
    const scalarVisibility = store<"visible" | "none">("none");
    const tileVisibility = store<"visible" | "none">("none");
    const coordsVisibility = store<"visible" | "none">("none");
    const directionVisibility = store<"visible" | "none">("none");
    const hintText = store<string>("");
    const hintVisibility = compute(visibility, hintText, (shown, hint) => (
        shown === "visible" && hint ? "visible" : "none" as const
    ));
    const variableDropdownItems = store<string[]>(["(No Variables)"]);
    const variableSelectedIndex = store<number>(0);
    const variableAmount = store<number>(1);
    const amountOriginIndex = store<number>(0);
    const amountHardcodedVisibility = compute(amountVisibility, amountOriginIndex, (shown, index) => (
        shown === "visible" && index === 0 ? "visible" : "none" as const
    ));
    const destAmountType = store<"int" | "float">("int");
    const amountVariableVisibility = compute(amountVisibility, amountOriginIndex, (shown, origin) => (
        shown === "visible" && origin === 1 ? "visible" : "none" as const
    ));
    const amountIntVisibility = compute(amountVariableVisibility, destAmountType, (shown, type) => (
        shown === "visible" && type === "int" ? "visible" : "none" as const
    ));
    const amountFloatVisibility = compute(amountVariableVisibility, destAmountType, (shown, type) => (
        shown === "visible" && type === "float" ? "visible" : "none" as const
    ));
    const amountIntPicker = createTypedVariablePicker({
        valueType: "int",
        emptyLabel: "(No Int Variables)",
        missingLabel: "Int Variable Missing",
        visibility: amountIntVisibility,
        onChange: () => onPersist()
    });
    const amountFloatPicker = createTypedVariablePicker({
        valueType: "float",
        emptyLabel: "(No Float Variables)",
        missingLabel: "Float Variable Missing",
        visibility: amountFloatVisibility,
        onChange: () => onPersist()
    });
    const variableValueText = store<string>("0");
    const valueX = store<number>(0);
    const valueY = store<number>(0);
    const valueZ = store<number>(0);
    const valueDirection = store<number>(0);
    let variableOptionIds: string[] = [];
    let listMode: "set" | "amount" = "set";
    let storedId = "";

    function eligibleForSet(variable: {isFormula(): boolean}): boolean {
        return !variable.isFormula();
    }

    function eligibleForAmount(variable: {isFormula(): boolean; valueType: VariableValueType}): boolean {
        return !variable.isFormula() && (variable.valueType === "int" || variable.valueType === "float");
    }

    function selectedVariable() {
        return getConductor().variablesArray.findById(variableOptionIds[variableSelectedIndex.get()] || storedId);
    }

    function syncValueEditor(): void {
        const variable = selectedVariable();
        const type = variable && eligibleForSet(variable) ? variable.valueType : "";
        scalarVisibility.set(valueVisibility.get() === "visible" && (type === "int" || type === "float" || type === "string") ? "visible" : "none");
        tileVisibility.set(valueVisibility.get() === "visible" && type === "tile" ? "visible" : "none");
        coordsVisibility.set(valueVisibility.get() === "visible" && type === "coords" ? "visible" : "none");
        directionVisibility.set(valueVisibility.get() === "visible" && type === "direction" ? "visible" : "none");
    }

    function refreshVariableOptions(preferredId?: string): void {
        if (preferredId !== undefined) {
            storedId = preferredId;
        }
        const variables = getConductor().variablesArray.items;
        variableOptionIds = [];
        const labels: string[] = [];
        let found = -1;
        for (let i = 0; i < variables.length; i++) {
            const variable = variables[i];
            if (listMode === "set" ? !eligibleForSet(variable) : !eligibleForAmount(variable)) {
                continue;
            }
            if (variable.id === storedId) {
                found = labels.length;
            }
            labels.push(displayName(variable.name));
            variableOptionIds.push(variable.id);
        }
        if (labels.length === 0) {
            if (storedId) {
                variableDropdownItems.set(["Variable Missing"]);
                variableOptionIds = [storedId];
                variableSelectedIndex.set(0);
                hintText.set("Variable Missing");
                syncValueEditor();
                return;
            }
            variableDropdownItems.set(listMode === "amount" ? ["(No Int Or Float Variables)"] : ["(No Stored Variables)"]);
            variableSelectedIndex.set(0);
            hintText.set(listMode === "amount" ? "No Int Or Float Variables" : "No Stored Variables");
            syncValueEditor();
            return;
        }
        if (storedId && found < 0) {
            labels.unshift("Variable Missing");
            variableOptionIds.unshift(storedId);
            found = 0;
            hintText.set("Variable Missing");
        } else {
            hintText.set("");
        }
        variableDropdownItems.set(labels);
        variableSelectedIndex.set(found >= 0 ? found : 0);
        if (variableOptionIds[variableSelectedIndex.get()]) {
            storedId = variableOptionIds[variableSelectedIndex.get()];
        }
        syncValueEditor();
    }

    function hide(): void {
        visibility.set("none");
        amountVisibility.set("none");
        valueVisibility.set("none");
        scalarVisibility.set("none");
        tileVisibility.set("none");
        coordsVisibility.set("none");
        directionVisibility.set("none");
        hintText.set("");
    }

    function selectedVariableId(): string {
        return variableOptionIds[variableSelectedIndex.get()] || storedId;
    }

    function loadStructuredValue(value: VariableStoredValue): void {
        if (value && typeof value === "object") {
            const obj = value as {x?: number; y?: number; z?: number};
            valueX.set(typeof obj.x === "number" ? obj.x : 0);
            valueY.set(typeof obj.y === "number" ? obj.y : 0);
            valueZ.set(typeof obj.z === "number" ? obj.z : 0);
            return;
        }
        if (typeof value === "number") {
            valueDirection.set(value);
            variableValueText.set(String(value));
            return;
        }
        variableValueText.set(String(value));
    }

    function loadSet(variableId: string, value: VariableStoredValue): void {
        visibility.set("visible");
        valueVisibility.set("visible");
        amountVisibility.set("none");
        listMode = "set";
        refreshVariableOptions(variableId);
        loadStructuredValue(value);
        syncValueEditor();
    }

    function syncDestAmountType(): void {
        const variable = selectedVariable();
        destAmountType.set(variable && variable.valueType === "float" ? "float" : "int");
    }

    function loadAmount(
        variableId: string,
        amount: number,
        amountOrigin?: NumberSourceOrigin,
        amountVariableId?: string
    ): void {
        visibility.set("visible");
        amountVisibility.set("visible");
        valueVisibility.set("none");
        scalarVisibility.set("none");
        tileVisibility.set("none");
        coordsVisibility.set("none");
        directionVisibility.set("none");
        listMode = "amount";
        refreshVariableOptions(variableId);
        syncDestAmountType();
        amountOriginIndex.set(readNumberOrigin(amountOrigin) === "variable" ? 1 : 0);
        variableAmount.set(amount);
        amountIntPicker.refresh(typeof amountVariableId === "string" ? amountVariableId : "");
        amountFloatPicker.refresh(typeof amountVariableId === "string" ? amountVariableId : "");
    }

    function readSetValue(): VariableStoredValue {
        const variable = selectedVariable();
        const type = variable ? variable.valueType : "int";
        if (type === "tile") {
            return {x: valueX.get(), y: valueY.get()};
        }
        if (type === "coords") {
            return {x: valueX.get(), y: valueY.get(), z: valueZ.get()};
        }
        if (type === "direction") {
            return valueDirection.get();
        }
        if (type === "string") {
            return variableValueText.get();
        }
        const asNumber = Number(variableValueText.get());
        return variableValueText.get() !== "" && !isNaN(asNumber) ? asNumber : 0;
    }

    function readAmount(): number {
        return variableAmount.get();
    }

    function readAmountSource(): {value: number; origin?: NumberSourceOrigin; variableId?: string} {
        const type = destAmountType.get();
        const variableId = type === "float" ? amountFloatPicker.selectedId() : amountIntPicker.selectedId();
        return persistNumberSource(
            variableAmount.get(),
            amountOriginIndex.get() === 1 ? "variable" : "hardcoded",
            variableId
        );
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
                        storedId = variableOptionIds[index] || storedId;
                        const variable = selectedVariable();
                        if (variable && listMode === "set") {
                            loadStructuredValue(emptyValueForType(variable.valueType));
                        }
                        refreshVariableOptions();
                        syncDestAmountType();
                        onPersist();
                    }
                }),
                label({
                    text: hintText,
                    visibility: hintVisibility
                }),
                horizontal([
                    label({
                        text: "Amount",
                        width: 50,
                        visibility: amountVisibility
                    }),
                    dropdown({
                        items: ["Hardcoded", "Variable"],
                        selectedIndex: twoway(amountOriginIndex),
                        visibility: amountVisibility,
                        onChange: (index) => {
                            amountOriginIndex.set(index);
                            if (index === 1) {
                                amountIntPicker.refresh();
                                amountFloatPicker.refresh();
                            }
                            onPersist();
                        }
                    }),
                    spinner({
                        step: spinnerStep,
                        value: twoway(variableAmount),
                        minimum: -100000,
                        maximum: 100000,
                        visibility: amountHardcodedVisibility,
                        onChange: (value) => {
                            variableAmount.set(value);
                            onPersist();
                        }
                    })
                ]),
                ...amountIntPicker.widgets,
                ...amountFloatPicker.widgets,
                horizontal([
                    label({
                        text: "Value",
                        width: 40,
                        visibility: scalarVisibility
                    }),
                    textbox({
                        text: variableValueText,
                        visibility: scalarVisibility,
                        onChange: (text) => {
                            variableValueText.set(text);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({text: "X", width: 16, visibility: tileVisibility}),
                    spinner({
                        step: spinnerStep,
                        value: twoway(valueX),
                        minimum: 0,
                        maximum: 10000,
                        visibility: tileVisibility,
                        onChange: (value) => {
                            valueX.set(value);
                            onPersist();
                        }
                    }),
                    label({text: "Y", width: 16, visibility: tileVisibility}),
                    spinner({
                        step: spinnerStep,
                        value: twoway(valueY),
                        minimum: 0,
                        maximum: 10000,
                        visibility: tileVisibility,
                        onChange: (value) => {
                            valueY.set(value);
                            onPersist();
                        }
                    }),
                    pickIconButton({
                        tooltip: "Pick Tile",
                        visibility: tileVisibility,
                        onClick: () => {
                            pickTile((tile) => {
                                valueX.set(tile.x);
                                valueY.set(tile.y);
                                onPersist();
                            });
                        }
                    }),
                    goToTileButton({
                        visibility: tileVisibility,
                        getTile: () => ({x: valueX.get(), y: valueY.get()})
                    })
                ]),
                horizontal([
                    label({text: "X", width: 16, visibility: coordsVisibility}),
                    spinner({
                        step: spinnerStep,
                        value: twoway(valueX),
                        minimum: -100000,
                        maximum: 100000,
                        visibility: coordsVisibility,
                        onChange: (value) => {
                            valueX.set(value);
                            onPersist();
                        }
                    }),
                    label({text: "Y", width: 16, visibility: coordsVisibility}),
                    spinner({
                        step: spinnerStep,
                        value: twoway(valueY),
                        minimum: -100000,
                        maximum: 100000,
                        visibility: coordsVisibility,
                        onChange: (value) => {
                            valueY.set(value);
                            onPersist();
                        }
                    }),
                    label({text: "Z", width: 16, visibility: coordsVisibility}),
                    spinner({
                        step: spinnerStep,
                        value: twoway(valueZ),
                        minimum: -100000,
                        maximum: 100000,
                        visibility: coordsVisibility,
                        onChange: (value) => {
                            valueZ.set(value);
                            onPersist();
                        }
                    })
                ]),
                dropdown({
                    items: DIRECTION_LABELS,
                    selectedIndex: twoway(valueDirection),
                    visibility: directionVisibility,
                    onChange: (index) => {
                        valueDirection.set(index);
                        onPersist();
                    }
                })
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
        readAmountSource,
        widgets
    };
}

export type VariableStepFields = ReturnType<typeof createVariableStepFields>;
