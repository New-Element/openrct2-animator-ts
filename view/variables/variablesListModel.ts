import {store} from "openrct2-flexui";
import getConductor from "../../model/getConductor";
import createVariable from "../../model/animation/variable/createVariable";
import Variable, {formatVariableValue} from "../../model/animation/variable/variable";
import {nextVariableName, validateVariableName} from "../../model/animation/variable/variableName";
import uuidV4 from "../../model/util/uuid";
import {showAlert} from "../ui/alertMessage";
import {confirmResetVariables} from "./confirmResetVariables";
import {openVariableEditor} from "./variableEditor";
import {createFolderExplorer} from "../ui/folderExplorer";

const searchText = store<string>("");

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
        case "tile":
            return "Tile";
        case "coords":
            return "Coords";
        case "direction":
            return "Direction";
        default:
            return valueType;
    }
}

function matchesSearch(variable: Variable, query: string): boolean {
    if (!query) {
        return true;
    }
    return variable.name.toLowerCase().indexOf(query) !== -1 ||
        displayName(variable.name).toLowerCase().indexOf(query) !== -1;
}

const explorer = createFolderExplorer<Variable>({
    collection: "variables",
    itemNoun: "Variable",
    extraColumnCount: 3,
    getItems: () => getConductor().variablesArray.items,
    extraColumns: (variable) => [
        typeLabel(variable.valueType),
        formatVariableValue(variable.valueType, variable.value),
        variable.isFormula() ? "Formula" : formatVariableValue(variable.valueType, variable.defaultValue)
    ],
    itemMatchesSearch: matchesSearch,
    displayName: (variable) => displayName(variable.name),
    getSearchQuery: () => searchText.get(),
    clearSearch: () => searchText.set(""),
    onOpenItem: (variable) => {
        openVariableEditor(variable.id, refreshVariablesList);
    },
    onRenameItem: (variable, name) => {
        const reason = validateVariableName(name, getConductor().variablesArray.items, variable.id);
        if (reason) {
            showAlert("Cannot Rename Variable", reason);
            return;
        }
        variable.setName(name);
    },
    deleteItem: (variable) => {
        getConductor().variablesArray.removeById(variable.id);
    },
    saveItems: () => {
        getConductor().variablesArray.save();
    }
});

export function refreshVariablesList(): void {
    explorer.refresh();
}

export function addUntitledVariable(): void {
    const id = uuidV4();
    const conductor = getConductor();
    const variable = createVariable({
        id: id,
        name: nextVariableName(conductor.variablesArray.items),
        valueType: "int",
        value: 0,
        defaultValue: 0,
        folder: explorer.currentFolderPath()
    });
    conductor.variablesArray.items.push(variable);
    conductor.variablesArray.save();
    refreshVariablesList();
    openVariableEditor(id, refreshVariablesList);
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
    pathText: explorer.pathText,
    listItems: explorer.listItems,
    selectedCell: explorer.selectedCell,
    refresh: refreshVariablesList,
    onRowClick: explorer.onRowClick,
    addUntitledVariable,
    resetAllVariablesWithConfirm,
    newFolder: explorer.newFolder,
    renameSelected: explorer.renameSelected,
    moveSelected: explorer.moveSelected,
    deleteSelected: explorer.deleteSelected
};
