import {store} from "openrct2-flexui";
import getConductor from "../../model/getConductor";
import createVariable from "../../model/animation/variable/createVariable";
import uuidV4 from "../../model/util/uuid";
import {confirmResetVariables} from "./confirmResetVariables";
import {openVariableEditor} from "./variableEditor";

const searchText = store<string>("");
const listItems = store<string[][]>([]);

/** Variable ids matching the current filtered list order (for row click). */
let visibleVariableIds: string[] = [];

function displayName(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed : "(Unnamed)";
}

function typeLabel(valueType: string): string {
    switch (valueType) {
        case "int":
            return "Int";
        case "float":
            return "Float";
        case "string":
            return "String";
        default:
            return valueType;
    }
}

function matchesSearch(name: string): boolean {
    const query = searchText.get().trim().toLowerCase();
    if (!query) {
        return true;
    }
    return name.toLowerCase().indexOf(query) !== -1 ||
        displayName(name).toLowerCase().indexOf(query) !== -1;
}

export function refreshVariablesList(): void {
    const variables = getConductor().variablesArray.items;
    const rows: string[][] = [];
    const ids: string[] = [];

    for (let i = 0; i < variables.length; i++) {
        const variable = variables[i];
        if (!matchesSearch(variable.name)) {
            continue;
        }
        rows.push([
            displayName(variable.name),
            typeLabel(variable.valueType),
            String(variable.value),
            String(variable.defaultValue)
        ]);
        ids.push(variable.id);
    }

    visibleVariableIds = ids;
    listItems.set(rows);
}

export function addUntitledVariable(): void {
    const id = uuidV4();
    const variable = createVariable({
        id: id,
        name: "",
        valueType: "int",
        value: 0,
        defaultValue: 0
    });
    const conductor = getConductor();
    conductor.variablesArray.items.push(variable);
    conductor.variablesArray.save();
    refreshVariablesList();
    openVariableEditor(id, refreshVariablesList);
}

export function openVariableAtListIndex(index: number): void {
    if (index < 0 || index >= visibleVariableIds.length) {
        return;
    }
    openVariableEditor(visibleVariableIds[index], refreshVariablesList);
}

export function resetAllVariablesWithConfirm(): void {
    confirmResetVariables(() => {
        const conductor = getConductor();
        conductor.resetAllVariables();
        conductor.variablesArray.save();
        refreshVariablesList();
    });
}

export const variablesListModel = {
    searchText,
    listItems,
    refresh: refreshVariablesList,
    addUntitledVariable,
    openVariableAtListIndex,
    resetAllVariablesWithConfirm
};
