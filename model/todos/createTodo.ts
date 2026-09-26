import Todo from "./todo";
import {TodoDesc} from "./todoTypes";

export default function createTodo(data: object): Todo {
    const raw = data as TodoDesc;
    if (!raw || typeof raw.id !== "string" || raw.id.length === 0) {
        throw new Error("To-Do is missing id");
    }
    return new Todo(raw);
}
