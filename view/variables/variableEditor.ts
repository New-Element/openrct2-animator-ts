/// <reference path="./../../openrct2.d.ts" />

import {
    button,
    dropdown,
    groupbox,
    horizontal,
    label,
    store,
    textbox,
    window
} from "openrct2-flexui";
import {VariableValueType} from "../../model/animation/jsonTypes";
import getConductor from "../../model/getConductor";
import {WINDOW_COLOURS} from "../ui/windowColours";

const TYPE_LABELS = ["Int", "Float", "String"];

const editingVariableId = store<string>("");
const nameText = store<string>("");
const typeIndex = store<number>(0);
const valueText = store<string>("0");
const defaultValueText = store<string>("0");

let onEditorClosed: (() => void) | null = null;

function editingVariable() {
    return getConductor().variablesArray.findById(editingVariableId.get());
}

function typeFromIndex(index: number): VariableValueType {
    switch (index) {
        case 1:
            return "float";
        case 2:
            return "string";
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
        default:
            return 0;
    }
}

function parseEditorValue(valueType: VariableValueType, text: string): number | string {
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

function loadStoresFromVariable(): void {
    const variable = editingVariable();
    if (!variable) {
        return;
    }
    nameText.set(variable.name);
    typeIndex.set(indexFromType(variable.valueType));
    valueText.set(String(variable.value));
    defaultValueText.set(String(variable.defaultValue));
}

function persistName(text: string): void {
    const variable = editingVariable();
    if (!variable) {
        return;
    }
    variable.setName(text);
    getConductor().variablesArray.save();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function persistType(index: number): void {
    const variable = editingVariable();
    if (!variable) {
        return;
    }
    variable.setValueType(typeFromIndex(index));
    valueText.set(String(variable.value));
    defaultValueText.set(String(variable.defaultValue));
    getConductor().variablesArray.save();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function persistValue(text: string): void {
    const variable = editingVariable();
    if (!variable) {
        return;
    }
    const next = parseEditorValue(variable.valueType, text);
    getConductor().setVariableValue(variable.id, next);
    valueText.set(String(variable.value));
    getConductor().variablesArray.save();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function persistDefaultValue(text: string): void {
    const variable = editingVariable();
    if (!variable) {
        return;
    }
    variable.setDefaultValue(parseEditorValue(variable.valueType, text));
    defaultValueText.set(String(variable.defaultValue));
    getConductor().variablesArray.save();
    if (onEditorClosed) {
        onEditorClosed();
    }
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
    if (onEditorClosed) {
        onEditorClosed();
    }
}

const editorWindow = window({
    title: "Edit Variable",
    colours: WINDOW_COLOURS,
    width: { value: 300, min: 260, max: 420 },
    height: { value: 240, min: 220, max: 360 },
    position: "center",
    padding: 8,
    content: [
        groupbox({
            text: "Name",
            content: [
                textbox({
                    text: nameText,
                    onChange: (text) => {
                        nameText.set(text);
                        persistName(text);
                    }
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
            text: "Value",
            content: [
                textbox({
                    text: valueText,
                    onChange: (text) => {
                        valueText.set(text);
                        persistValue(text);
                    }
                })
            ]
        }),
        groupbox({
            text: "Reset Value",
            content: [
                textbox({
                    text: defaultValueText,
                    onChange: (text) => {
                        defaultValueText.set(text);
                        persistDefaultValue(text);
                    }
                })
            ]
        }),
        horizontal([
            button({
                text: "Delete Variable",
                width: 110,
                height: 14,
                onClick: () => deleteEditingVariable()
            })
        ])
    ],
    onClose: () => {
        if (onEditorClosed) {
            onEditorClosed();
        }
    }
});

export function openVariableEditor(variableId: string, onClosed?: () => void): void {
    const variable = getConductor().variablesArray.findById(variableId);
    if (!variable) {
        console.log(`[VariableEditor] Variable "${variableId}" not found`);
        return;
    }
    onEditorClosed = onClosed || null;
    editingVariableId.set(variable.id);
    loadStoresFromVariable();
    editorWindow.open();
}
