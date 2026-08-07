import PersistentArray from "../data/persistentArray";
import {TriggerDesc} from "./jsonTypes";
import createTrigger from "./trigger/createTrigger";
import Trigger from "./trigger/trigger";

export default class TriggersArray extends PersistentArray {
    items: Trigger[] = [];

    constructor() {
        super("triggersv1", "animator");
    }

    getItem(data: object): Trigger {
        return createTrigger(data as TriggerDesc);
    }

    findById(id: string): Trigger | undefined {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                return this.items[i];
            }
        }
        return undefined;
    }

    removeById(id: string): boolean {
        const next: Trigger[] = [];
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
