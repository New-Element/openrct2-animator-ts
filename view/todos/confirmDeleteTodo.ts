import {confirmDelete} from "../ui/confirmDelete";
import {todoDisplayName} from "./todosStore";

/**
 * Open a delete confirmation dialog. Calls onConfirm only if the user chooses Delete.
 */
export function confirmDeleteTodo(
    _todoId: string,
    todoName: string,
    onConfirm: () => void
): void {
    confirmDelete({
        title: "Delete To-Do",
        message: `Delete "${todoDisplayName(todoName)}"? This cannot be undone.`,
        onConfirm: onConfirm
    });
}
