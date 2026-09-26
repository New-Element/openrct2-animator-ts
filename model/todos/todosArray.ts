import PersistentArray from "../data/persistentArray";
import createTodo from "./createTodo";
import Todo from "./todo";

export default class TodosArray extends PersistentArray {
    items: Todo[] = [];

    constructor() {
        super("todosv1", "animator");
    }

    getItem(data: object): Todo {
        return createTodo(data);
    }

    findById(id: string): Todo | undefined {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                return this.items[i];
            }
        }
        return undefined;
    }

    removeById(id: string): boolean {
        const next: Todo[] = [];
        let removed = false;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                removed = true;
            } else {
                next.push(this.items[i]);
            }
        }
        this.items = next;
        return removed;
    }
}
