import PersistentArray from "../data/persistentArray";
import {VariableDesc} from "./jsonTypes";
import createVariable from "./variable/createVariable";
import Variable from "./variable/variable";

export default class VariablesArray extends PersistentArray {
    items: Variable[] = [];

    constructor() {
        super("variablesv1", "animator");
    }

    getItem(data: object): Variable {
        return createVariable(data as VariableDesc);
    }

    findById(id: string): Variable | undefined {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                return this.items[i];
            }
        }
        return undefined;
    }

    removeById(id: string): boolean {
        const next: Variable[] = [];
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
