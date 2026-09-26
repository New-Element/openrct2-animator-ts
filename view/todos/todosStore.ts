import {isUnderFolder} from "../../model/folders/folderPath";
import getConductor from "../../model/getConductor";
import Todo from "../../model/todos/todo";
import {TodoPriority} from "../../model/todos/todoTypes";

export type {TodoPriority};
export {Todo};

export const TODO_PRIORITY_LABELS = ["Urgent", "High", "Normal", "Low"];
export const TODO_PRIORITY_VALUES: TodoPriority[] = [
    "urgent",
    "high",
    "normal",
    "low"
];
export const TODO_FILTER_LABELS = ["Remaining", "Completed", "All"];

function todosArray() {
    return getConductor().todosArray;
}

export function todoPriority(todo: Todo): TodoPriority {
    if (
        todo.priority === "urgent" ||
        todo.priority === "high" ||
        todo.priority === "normal" ||
        todo.priority === "low"
    ) {
        return todo.priority;
    }
    return "normal";
}

export function todoPriorityLabel(todo: Todo): string {
    switch (todoPriority(todo)) {
        case "urgent":
            return "Urgent";
        case "high":
            return "High";
        case "low":
            return "Low";
        default:
            return "Normal";
    }
}

export function todoPriorityIndex(todo: Todo): number {
    const value = todoPriority(todo);
    for (let i = 0; i < TODO_PRIORITY_VALUES.length; i++) {
        if (TODO_PRIORITY_VALUES[i] === value) {
            return i;
        }
    }
    return 2;
}

export function todoDone(todo: Todo): boolean {
    return todo.done === true;
}

export function todoStatusLabel(todo: Todo): string {
    return todoDone(todo) ? "Done" : "Remaining";
}

export function todoDoneCell(todo: Todo): string {
    return todoDone(todo) ? "Y" : "N";
}

export function folderDoneCell(path: string, items: Todo[]): string {
    let total = 0;
    let done = 0;
    for (let i = 0; i < items.length; i++) {
        if (!isUnderFolder(items[i].folder, path)) {
            continue;
        }
        total += 1;
        if (todoDone(items[i])) {
            done += 1;
        }
    }
    return `${done}/${total}`;
}

export function todoDisplayName(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed : "(Unnamed)";
}

export function todoTileColumn(todo: Todo): string {
    if (!todo.tile) {
        return "—";
    }
    return `${todo.tile.x}, ${todo.tile.y}`;
}

export function todoTileLabel(todo: Todo): string {
    if (!todo.tile) {
        return "No Tile";
    }
    return `${todo.tile.x}, ${todo.tile.y}`;
}

export function getTodos(): Todo[] {
    return todosArray().items;
}

/** Copy of to-dos, Urgent first, then High, Normal, Low. */
export function todosSortedByPriority(): Todo[] {
    const items = getTodos().slice();
    items.sort((left, right) => todoPriorityIndex(left) - todoPriorityIndex(right));
    return items;
}

export function findTodoById(id: string): Todo | undefined {
    return todosArray().findById(id);
}

export function addTodo(todo: Todo): void {
    const array = todosArray();
    array.items.push(todo);
    array.save();
}

/** Returns false if the id was already gone. */
export function removeTodoById(id: string): boolean {
    const array = todosArray();
    const removed = array.removeById(id);
    if (removed) {
        array.save();
    }
    return removed;
}

export function saveTodos(): void {
    todosArray().save();
}
