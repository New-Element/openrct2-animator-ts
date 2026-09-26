import {compute, store} from "openrct2-flexui";
import uuidV4 from "../../model/util/uuid";
import {createFolderExplorer} from "../ui/folderExplorer";
import {applyRemainingHighlight} from "./remainingHighlight";
import {openTodoEditor} from "./todoEditor";
import {
    addTodo,
    folderDoneCell,
    getTodos,
    removeTodoById,
    saveTodos,
    Todo,
    todoDisplayName,
    todoDone,
    todoDoneCell,
    todoPriority,
    todoPriorityLabel,
    todosSortedByPriority,
    todoTileColumn
} from "./todosStore";

const searchText = store<string>("");
const filterIndex = store<number>(0);
const selectedDone = store<boolean>(false);

function todoMatchesFilter(todo: Todo): boolean {
    if (filterIndex.get() === 1) {
        return todoDone(todo);
    }
    if (filterIndex.get() === 2) {
        return true;
    }
    return !todoDone(todo);
}

function matchesSearch(todo: Todo, query: string): boolean {
    if (!todoMatchesFilter(todo)) {
        return false;
    }
    if (!query) {
        return true;
    }
    if (todo.name.toLowerCase().indexOf(query) !== -1) {
        return true;
    }
    return todoPriorityLabel(todo).toLowerCase().indexOf(query) !== -1;
}

const explorer = createFolderExplorer<Todo>({
    collection: "todos",
    itemNoun: "To-Do",
    extraColumnCount: 3,
    getItems: () => todosSortedByPriority(),
    extraColumns: (todo) => [
        todoPriorityLabel(todo),
        todoTileColumn(todo),
        todoDoneCell(todo)
    ],
    folderExtraColumns: (path) => ["", "", folderDoneCell(path, getTodos())],
    openOnSecondClick: false,
    itemMatchesSearch: matchesSearch,
    displayName: (todo) => todoDisplayName(todo.name),
    getSearchQuery: () => searchText.get(),
    clearSearch: () => searchText.set(""),
    onOpenItem: (todo) => {
        openTodoEditor(todo.id, refreshTodosList);
    },
    renameItems: false,
    onRenameItem: (todo, name) => {
        todo.name = name;
    },
    deleteItem: (todo) => {
        removeTodoById(todo.id);
    },
    saveItems: () => {
        saveTodos();
    }
});

function hasFolderOrItemRow(rows: string[][]): boolean {
    for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] !== "../") {
            return true;
        }
    }
    return false;
}

const emptyLabel = compute(explorer.listItems, searchText, filterIndex, (rows, search, filter) => {
    if (hasFolderOrItemRow(rows)) {
        return "";
    }
    if (search.trim()) {
        return "No To-Dos Match This Search";
    }
    if (filter === 1) {
        return "No Completed To-Dos In This Folder";
    }
    if (filter === 2) {
        return "No To-Dos In This Folder";
    }
    return "No Remaining To-Dos In This Folder";
});

const emptyVisibility = compute(explorer.listItems, (rows) => (
    hasFolderOrItemRow(rows) ? "none" : "visible"
));

const editDisabled = compute(
    explorer.itemSelected,
    explorer.folderSelected,
    (item, folder) => !item && !folder
);
const editLabel = compute(explorer.folderSelected, (folder) => (
    folder ? "Rename" : "Edit"
));
const markLabel = compute(selectedDone, (done) => (
    done ? "Mark Not Done" : "Mark Done"
));
const markVisibility = compute(explorer.itemSelected, (selected) => (
    selected ? "visible" : "none"
));

function syncSelection(): void {
    const todo = explorer.selectedItem();
    selectedDone.set(todo ? todoDone(todo) : false);
}

export function refreshTodosList(): void {
    explorer.refresh();
    syncSelection();
    applyRemainingHighlight();
}

function onRowClick(index: number): void {
    explorer.onRowClick(index);
    syncSelection();
}

function createUntitledTodo(): Todo {
    return new Todo({
        id: uuidV4(),
        name: "Untitled To-Do",
        folder: explorer.currentFolderPath(),
        priority: "normal",
        done: false
    });
}

export function addUntitledTodo(): void {
    const todo = createUntitledTodo();
    addTodo(todo);
    refreshTodosList();
    openTodoEditor(todo.id, refreshTodosList);
}

function editSelected(): void {
    const todo = explorer.selectedItem();
    if (todo) {
        openTodoEditor(todo.id, refreshTodosList);
        return;
    }
    if (explorer.folderSelected.get()) {
        explorer.renameSelected();
    }
}

function toggleSelectedDone(): void {
    const todo = explorer.selectedItem();
    if (!todo) {
        return;
    }
    todo.done = !todoDone(todo);
    todo.priority = todoPriority(todo);
    saveTodos();
    refreshTodosList();
}

export const todosListModel = {
    searchText,
    filterIndex,
    pathText: explorer.pathText,
    listItems: explorer.listItems,
    selectedCell: explorer.selectedCell,
    emptyLabel,
    emptyVisibility,
    editLabel,
    editDisabled,
    markLabel,
    markVisibility,
    refresh: refreshTodosList,
    onRowClick,
    addUntitledTodo,
    editSelected,
    toggleSelectedDone,
    newFolder: explorer.newFolder,
    moveSelected: explorer.moveSelected,
    deleteSelected: explorer.deleteSelected
};
