/// <reference path="./../../openrct2.d.ts" />

import {
    button,
    compute,
    dropdown,
    groupbox,
    horizontal,
    label,
    spinner,
    store,
    textbox,
    twoway,
    window
} from "openrct2-flexui";
import {spinnerStep, spinnerStepSelector} from "../ui/spinnerStep";
import {VariableStoredValue, VariableValueType} from "../../model/animation/jsonTypes";
import {formatVariableValue} from "../../model/animation/variable/variable";
import {validateVariableName} from "../../model/animation/variable/variableName";
import getConductor from "../../model/getConductor";
import {error} from "../../model/logger";
import {goToTileButton, pickIconButton} from "../ui/mapIconButtons";
import {pickTile} from "../ui/pickTile";
import {nameTextField} from "../ui/nameTextField";
import {WINDOW_COLOURS} from "../ui/windowColours";
import {openFormulaInstructions} from "./formulaInstructions";

const TYPE_LABELS = ["Int", "Float", "String", "Tile", "Coords", "Direction"];
const DIRECTION_LABELS = ["North", "East", "South", "West"];
const MODE_LABELS = ["Stored", "Formula"];

const editingVariableId = store<string>("");
const nameText = store<string>("");
const nameError = store<string>("");
const typeIndex = store<number>(0);
const modeIndex = store<number>(0);
const formulaText = store<string>("");
const lastErrorText = store<string>("");
const currentValueText = store<string>("0");
const valueText = store<string>("0");
const defaultValueText = store<string>("0");
const valueX = store<number>(0);
const valueY = store<number>(0);
const valueZ = store<number>(0);
const defaultX = store<number>(0);
const defaultY = store<number>(0);
const defaultZ = store<number>(0);
const valueDirection = store<number>(0);
const defaultDirection = store<number>(0);

const nameErrorVisibility = compute(nameError, (text) => (text ? "visible" : "none"));
const storedVisibility = compute(modeIndex, (mode) => (mode === 0 ? "visible" : "none"));
const formulaVisibility = compute(modeIndex, (mode) => (mode === 1 ? "visible" : "none"));
const formulaEmptyVisibility = compute(modeIndex, formulaText, (mode, text) => (
    mode === 1 && !text ? "visible" : "none"
));
const noErrorsVisibility = compute(modeIndex, lastErrorText, (mode, text) => (
    mode === 1 && !text ? "visible" : "none"
));
const scalarVisibility = compute(typeIndex, modeIndex, (index, mode) => (
    mode === 0 && index <= 2 ? "visible" : "none"
));
const tileVisibility = compute(typeIndex, modeIndex, (index, mode) => (
    mode === 0 && index === 3 ? "visible" : "none"
));
const coordsVisibility = compute(typeIndex, modeIndex, (index, mode) => (
    mode === 0 && index === 4 ? "visible" : "none"
));
const directionVisibility = compute(typeIndex, modeIndex, (index, mode) => (
    mode === 0 && index === 5 ? "visible" : "none"
));

let onEditorClosed: (() => void) | null = null;

function editingVariable() {
    return getConductor().variablesArray.findById(editingVariableId.get());
}

function notifyClosed(): void {
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function typeFromIndex(index: number): VariableValueType {
    switch (index) {
        case 1:
            return "float";
        case 2:
            return "string";
        case 3:
            return "tile";
        case 4:
            return "coords";
        case 5:
            return "direction";
        default:
            return "int";
    }
}

function indexFromType(valueType: VariableValueType): number {
    switch (valueType) {
        case "float":
            return 1;
        case "string":
            return 2;
        case "tile":
            return 3;
        case "coords":
            return 4;
        case "direction":
            return 5;
        default:
            return 0;
    }
}

function parseScalar(valueType: VariableValueType, text: string): number | string {
    if (valueType === "string") {
        return text;
    }
    const n = Number(text);
    if (isNaN(n)) {
        return 0;
    }
    if (valueType === "int") {
        return Math.floor(n);
    }
    return n;
}

function readTile(x: number, y: number): VariableStoredValue {
    return {x: x, y: y};
}

function readCoords(x: number, y: number, z: number): VariableStoredValue {
    return {x: x, y: y, z: z};
}

function loadStructuredStores(): void {
    const variable = editingVariable();
    if (!variable) {
        return;
    }
    if (variable.valueType === "tile" && variable.value && typeof variable.value === "object") {
        const tile = variable.value as {x: number; y: number};
        valueX.set(tile.x);
        valueY.set(tile.y);
    }
    else if (variable.valueType === "coords" && variable.value && typeof variable.value === "object") {
        const coords = variable.value as {x: number; y: number; z: number};
        valueX.set(coords.x);
        valueY.set(coords.y);
        valueZ.set(coords.z);
    }
    else if (variable.valueType === "direction" && typeof variable.value === "number") {
        valueDirection.set(variable.value);
    }
    else {
        valueX.set(0);
        valueY.set(0);
        valueZ.set(0);
        valueDirection.set(0);
    }

    if (variable.valueType === "tile" && variable.defaultValue && typeof variable.defaultValue === "object") {
        const tile = variable.defaultValue as {x: number; y: number};
        defaultX.set(tile.x);
        defaultY.set(tile.y);
    }
    else if (variable.valueType === "coords" && variable.defaultValue && typeof variable.defaultValue === "object") {
        const coords = variable.defaultValue as {x: number; y: number; z: number};
        defaultX.set(coords.x);
        defaultY.set(coords.y);
        defaultZ.set(coords.z);
    }
    else if (variable.valueType === "direction" && typeof variable.defaultValue === "number") {
        defaultDirection.set(variable.defaultValue);
    }
    else {
        defaultX.set(0);
        defaultY.set(0);
        defaultZ.set(0);
        defaultDirection.set(0);
    }
}

function loadStoresFromVariable(): void {
    const variable = editingVariable();
    if (!variable) {
        return;
    }
    nameText.set(variable.name);
    nameError.set("");
    typeIndex.set(indexFromType(variable.valueType));
    modeIndex.set(variable.isFormula() ? 1 : 0);
    formulaText.set(variable.formula);
    lastErrorText.set(variable.lastError);
    currentValueText.set(formatVariableValue(variable.valueType, variable.value));
    valueText.set(typeof variable.value === "object" ? "" : String(variable.value));
    defaultValueText.set(typeof variable.defaultValue === "object" ? "" : String(variable.defaultValue));
    loadStructuredStores();
}

function persistName(text: string): void {
    const variable = editingVariable();
    if (!variable) {
        return;
    }
    const reason = validateVariableName(text, getConductor().variablesArray.items, variable.id);
    if (reason) {
        nameError.set(reason);
        return;
    }
    nameError.set("");
    variable.setName(text);
    getConductor().variablesArray.save();
    notifyClosed();
}

function persistType(index: number): void {
    const variable = editingVariable();
    if (!variable) {
        return;
    }
    variable.setValueType(typeFromIndex(index));
    loadStoresFromVariable();
    getConductor().variablesArray.save();
    notifyClosed();
}

function persistMode(index: number): void {
    const variable = editingVariable();
    if (!variable) {
        return;
    }
    variable.setValueKind(index === 1 ? "formula" : "stored");
    loadStoresFromVariable();
    getConductor().variablesArray.save();
    notifyClosed();
}

function persistFormula(text: string): void {
    const variable = editingVariable();
    if (!variable || !variable.isFormula()) {
        return;
    }
    variable.setFormula(text);
    getConductor().variablesArray.save();
    notifyClosed();
}

function persistLastError(text: string): void {
    const variable = editingVariable();
    if (!variable || !variable.isFormula()) {
        return;
    }
    variable.setLastError(text);
    getConductor().variablesArray.save();
    notifyClosed();
}

function persistScalarValue(text: string): void {
    const variable = editingVariable();
    if (!variable || variable.isFormula() || variable.valueType === "tile" || variable.valueType === "coords" || variable.valueType === "direction") {
        return;
    }
    const next = parseScalar(variable.valueType, text);
    getConductor().setVariableValue(variable.id, next);
    valueText.set(String(variable.value));
    getConductor().variablesArray.save();
    notifyClosed();
}

function persistScalarDefault(text: string): void {
    const variable = editingVariable();
    if (!variable || variable.isFormula() || variable.valueType === "tile" || variable.valueType === "coords" || variable.valueType === "direction") {
        return;
    }
    variable.setDefaultValue(parseScalar(variable.valueType, text));
    defaultValueText.set(String(variable.defaultValue));
    getConductor().variablesArray.save();
    notifyClosed();
}

function persistStructuredValue(): void {
    const variable = editingVariable();
    if (!variable || variable.isFormula()) {
        return;
    }
    if (variable.valueType === "tile") {
        getConductor().setVariableValue(variable.id, readTile(valueX.get(), valueY.get()));
    }
    else if (variable.valueType === "coords") {
        getConductor().setVariableValue(variable.id, readCoords(valueX.get(), valueY.get(), valueZ.get()));
    }
    else if (variable.valueType === "direction") {
        getConductor().setVariableValue(variable.id, valueDirection.get());
    }
    else {
        return;
    }
    loadStructuredStores();
    getConductor().variablesArray.save();
    notifyClosed();
}

function persistStructuredDefault(): void {
    const variable = editingVariable();
    if (!variable || variable.isFormula()) {
        return;
    }
    if (variable.valueType === "tile") {
        variable.setDefaultValue(readTile(defaultX.get(), defaultY.get()));
    }
    else if (variable.valueType === "coords") {
        variable.setDefaultValue(readCoords(defaultX.get(), defaultY.get(), defaultZ.get()));
    }
    else if (variable.valueType === "direction") {
        variable.setDefaultValue(defaultDirection.get());
    }
    else {
        return;
    }
    loadStructuredStores();
    getConductor().variablesArray.save();
    notifyClosed();
}

function deleteEditingVariable(): void {
    const id = editingVariableId.get();
    const conductor = getConductor();
    if (!conductor.variablesArray.findById(id)) {
        return;
    }
    conductor.variablesArray.removeById(id);
    conductor.variablesArray.save();
    editorWindow.close();
    notifyClosed();
}

function xyRow(
    xStore: typeof valueX,
    yStore: typeof valueY,
    visibility: typeof tileVisibility,
    onChange: () => void,
    onPick?: () => void
) {
    const row = [
        label({text: "X", width: 16, visibility}),
        spinner({
            step: spinnerStep,
            value: twoway(xStore),
            minimum: 0,
            maximum: 10000,
            visibility,
            onChange: (value) => {
                xStore.set(value);
                onChange();
            }
        }),
        label({text: "Y", width: 16, visibility}),
        spinner({
            step: spinnerStep,
            value: twoway(yStore),
            minimum: 0,
            maximum: 10000,
            visibility,
            onChange: (value) => {
                yStore.set(value);
                onChange();
            }
        })
    ];
    if (onPick) {
        row.push(pickIconButton({
            tooltip: "Pick Tile",
            visibility,
            onClick: onPick
        }));
        row.push(goToTileButton({
            visibility,
            getTile: () => ({x: xStore.get(), y: yStore.get()})
        }));
    }
    return horizontal(row);
}

function coordsRow(
    xStore: typeof valueX,
    yStore: typeof valueY,
    zStore: typeof valueZ,
    onChange: () => void
) {
    return horizontal([
        label({text: "X", width: 16, visibility: coordsVisibility}),
        spinner({
            step: spinnerStep,
            value: twoway(xStore),
            minimum: -100000,
            maximum: 100000,
            visibility: coordsVisibility,
            onChange: (value) => {
                xStore.set(value);
                onChange();
            }
        }),
        label({text: "Y", width: 16, visibility: coordsVisibility}),
        spinner({
            step: spinnerStep,
            value: twoway(yStore),
            minimum: -100000,
            maximum: 100000,
            visibility: coordsVisibility,
            onChange: (value) => {
                yStore.set(value);
                onChange();
            }
        }),
        label({text: "Z", width: 16, visibility: coordsVisibility}),
        spinner({
            step: spinnerStep,
            value: twoway(zStore),
            minimum: -100000,
            maximum: 100000,
            visibility: coordsVisibility,
            onChange: (value) => {
                zStore.set(value);
                onChange();
            }
        })
    ]);
}

const editorWindow = window({
    title: "Edit Variable",
    colours: WINDOW_COLOURS,
    width: {value: 340, min: 300, max: 480},
    height: {value: 460, min: 320, max: 620},
    position: "center",
    padding: 8,
    content: [
        groupbox({
            text: "Name",
            content: [
                nameTextField({
                    text: nameText,
                    onChange: (text) => {
                        nameText.set(text);
                        persistName(text);
                    }
                }),
                label({
                    text: nameError,
                    visibility: nameErrorVisibility
                })
            ]
        }),
        groupbox({
            text: "Type",
            content: [
                dropdown({
                    items: TYPE_LABELS,
                    selectedIndex: typeIndex,
                    onChange: (index) => {
                        typeIndex.set(index);
                        persistType(index);
                    }
                })
            ]
        }),
        groupbox({
            text: "Mode",
            content: [
                dropdown({
                    items: MODE_LABELS,
                    selectedIndex: modeIndex,
                    onChange: (index) => {
                        modeIndex.set(index);
                        persistMode(index);
                    }
                })
            ]
        }),
        groupbox({
            text: "Formula",
            visibility: formulaVisibility,
            content: [
                textbox({
                    text: formulaText,
                    visibility: formulaVisibility,
                    onChange: (text) => {
                        formulaText.set(text);
                        persistFormula(text);
                    }
                }),
                label({
                    text: "Enter A Formula",
                    visibility: formulaEmptyVisibility
                }),
                button({
                    text: "Instructions",
                    width: 90,
                    height: 14,
                    visibility: formulaVisibility,
                    onClick: () => openFormulaInstructions()
                }),
                label({
                    text: "Current Value",
                    visibility: formulaVisibility
                }),
                label({
                    text: currentValueText,
                    visibility: formulaVisibility
                })
            ]
        }),
        groupbox({
            text: "Last Error",
            visibility: formulaVisibility,
            content: [
                textbox({
                    text: lastErrorText,
                    visibility: formulaVisibility,
                    onChange: (text) => {
                        lastErrorText.set(text);
                        persistLastError(text);
                    }
                }),
                label({
                    text: "No Errors",
                    visibility: noErrorsVisibility
                })
            ]
        }),
        groupbox({
            text: "Value",
            visibility: storedVisibility,
            content: [
                textbox({
                    text: valueText,
                    visibility: scalarVisibility,
                    onChange: (text) => {
                        valueText.set(text);
                        persistScalarValue(text);
                    }
                }),
                xyRow(valueX, valueY, tileVisibility, persistStructuredValue, () => {
                    pickTile((tile) => {
                        valueX.set(tile.x);
                        valueY.set(tile.y);
                        persistStructuredValue();
                    });
                }),
                coordsRow(valueX, valueY, valueZ, persistStructuredValue),
                dropdown({
                    items: DIRECTION_LABELS,
                    selectedIndex: twoway(valueDirection),
                    visibility: directionVisibility,
                    onChange: (index) => {
                        valueDirection.set(index);
                        persistStructuredValue();
                    }
                })
            ]
        }),
        groupbox({
            text: "Reset Value",
            visibility: storedVisibility,
            content: [
                textbox({
                    text: defaultValueText,
                    visibility: scalarVisibility,
                    onChange: (text) => {
                        defaultValueText.set(text);
                        persistScalarDefault(text);
                    }
                }),
                xyRow(defaultX, defaultY, tileVisibility, persistStructuredDefault, () => {
                    pickTile((tile) => {
                        defaultX.set(tile.x);
                        defaultY.set(tile.y);
                        persistStructuredDefault();
                    });
                }),
                coordsRow(defaultX, defaultY, defaultZ, persistStructuredDefault),
                dropdown({
                    items: DIRECTION_LABELS,
                    selectedIndex: twoway(defaultDirection),
                    visibility: directionVisibility,
                    onChange: (index) => {
                        defaultDirection.set(index);
                        persistStructuredDefault();
                    }
                })
            ]
        }),
        horizontal({
            padding: {left: "1w"},
            spacing: 6,
            content: [
                spinnerStepSelector(),
                button({
                    text: "Delete Variable",
                    width: 110,
                    height: 14,
                    onClick: () => deleteEditingVariable()
                })
            ]
        })
    ],
    onClose: () => {
        notifyClosed();
    }
});

export function openVariableEditor(variableId: string, onClosed?: () => void): void {
    const variable = getConductor().variablesArray.findById(variableId);
    if (!variable) {
        error("variableEditor", `Variable "${variableId}" not found`);
        return;
    }
    onEditorClosed = onClosed || null;
    editingVariableId.set(variable.id);
    loadStoresFromVariable();
    editorWindow.open();
}
