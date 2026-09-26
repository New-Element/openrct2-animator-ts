/// <reference path="./../../openrct2.d.ts" />

import {
    button,
    checkbox,
    compute,
    dropdown,
    groupbox,
    horizontal,
    label,
    store,
    window
} from "openrct2-flexui";
import {error} from "../../model/logger";
import {goToTileButton, pickIconButton} from "../ui/mapIconButtons";
import {cancelPickTile, pickTile} from "../ui/pickTile";
import {
    clearTileSelection,
    highlightMapTile
} from "../ui/pickerTool";
import {nameTextField} from "../ui/nameTextField";
import {WINDOW_COLOURS} from "../ui/windowColours";
import {confirmDeleteTodo} from "./confirmDeleteTodo";
import {
    findTodoById,
    removeTodoById,
    saveTodos,
    TODO_PRIORITY_LABELS,
    TODO_PRIORITY_VALUES,
    todoDone,
    todoPriorityIndex,
    todoTileLabel
} from "./todosStore";

const editingTodoId = store<string>("");
const nameText = store<string>("");
const priorityIndex = store<number>(2);
const doneChecked = store<boolean>(false);
const tileText = store<string>("No Tile");
const hasTile = store<boolean>(false);
const noTileDisabled = compute(hasTile, (set) => !set);

let onEditorClosed: (() => void) | null = null;
let editorIsOpen = false;
let tilePickerActive = false;

function notifyClosed(): void {
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function persistName(text: string): void {
    const todo = findTodoById(editingTodoId.get());
    if (!todo) {
        return;
    }
    todo.name = text;
    saveTodos();
    notifyClosed();
}

function persistPriority(index: number): void {
    const todo = findTodoById(editingTodoId.get());
    if (!todo) {
        return;
    }
    todo.priority = TODO_PRIORITY_VALUES[index] || "normal";
    saveTodos();
    notifyClosed();
}

function persistDone(checked: boolean): void {
    const todo = findTodoById(editingTodoId.get());
    if (!todo) {
        return;
    }
    todo.done = checked;
    saveTodos();
    notifyClosed();
}

function syncTileUi(): void {
    const todo = findTodoById(editingTodoId.get());
    if (!todo) {
        tileText.set("No Tile");
        hasTile.set(false);
        return;
    }
    tileText.set(todoTileLabel(todo));
    hasTile.set(!!todo.tile);
}

function highlightEditorTile(): void {
    if (!editorIsOpen || tilePickerActive) {
        return;
    }
    const todo = findTodoById(editingTodoId.get());
    if (todo && todo.tile) {
        highlightMapTile(todo.tile);
        return;
    }
    clearTileSelection();
}

function startPickTile(): void {
    tilePickerActive = true;
    pickTile(
        (tile) => {
            const todo = findTodoById(editingTodoId.get());
            if (!todo) {
                return;
            }
            todo.tile = {x: tile.x, y: tile.y};
            saveTodos();
            syncTileUi();
            notifyClosed();
        },
        () => {
            tilePickerActive = false;
            if (editorIsOpen) {
                highlightEditorTile();
            }
        }
    );
}

function clearTile(): void {
    const todo = findTodoById(editingTodoId.get());
    if (!todo || !todo.tile) {
        return;
    }
    todo.tile = undefined;
    saveTodos();
    syncTileUi();
    highlightEditorTile();
    notifyClosed();
}

function closeEditorCleanup(): void {
    editorIsOpen = false;
    if (tilePickerActive) {
        cancelPickTile();
        tilePickerActive = false;
    }
    clearTileSelection();
}

function deleteEditingTodo(): void {
    const todo = findTodoById(editingTodoId.get());
    if (!todo) {
        editorWindow.close();
        notifyClosed();
        return;
    }
    confirmDeleteTodo(todo.id, todo.name, () => {
        removeTodoById(todo.id);
        editorWindow.close();
        notifyClosed();
    });
}

const editorWindow = window({
    title: "Edit To-Do",
    colours: WINDOW_COLOURS,
    width: {value: 280, min: 240, max: 420},
    height: {value: 280, min: 240, max: 360},
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
                })
            ]
        }),
        groupbox({
            text: "Priority",
            content: [
                dropdown({
                    items: TODO_PRIORITY_LABELS,
                    selectedIndex: priorityIndex,
                    onChange: (index) => {
                        priorityIndex.set(index);
                        persistPriority(index);
                    }
                })
            ]
        }),
        checkbox({
            text: "Done",
            isChecked: doneChecked,
            onChange: (checked) => {
                doneChecked.set(checked);
                persistDone(checked);
            }
        }),
        groupbox({
            text: "Tile",
            content: [
                label({
                    text: tileText
                }),
                horizontal([
                    pickIconButton({
                        tooltip: "Pick Tile",
                        onClick: () => startPickTile()
                    }),
                    goToTileButton({
                        disabled: noTileDisabled,
                        getTile: () => {
                            const todo = findTodoById(editingTodoId.get());
                            return todo && todo.tile ? todo.tile : null;
                        }
                    }),
                    button({
                        text: "Clear Tile",
                        width: 80,
                        height: 14,
                        disabled: noTileDisabled,
                        onClick: () => clearTile()
                    })
                ])
            ]
        }),
        button({
            text: "Delete To-Do",
            width: 100,
            height: 14,
            onClick: () => deleteEditingTodo()
        })
    ],
    onOpen: () => {
        highlightEditorTile();
    },
    onClose: () => {
        closeEditorCleanup();
        notifyClosed();
    }
});

export function openTodoEditor(todoId: string, onClosed?: () => void): void {
    const todo = findTodoById(todoId);
    if (!todo) {
        error("todo", `To-Do "${todoId}" not found`);
        return;
    }
    onEditorClosed = onClosed || null;
    editingTodoId.set(todo.id);
    nameText.set(todo.name);
    priorityIndex.set(todoPriorityIndex(todo));
    doneChecked.set(todoDone(todo));
    syncTileUi();
    editorIsOpen = true;
    highlightEditorTile();
    editorWindow.open();
}
