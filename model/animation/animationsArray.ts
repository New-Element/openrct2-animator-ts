import Animation from "./animation";
import PersistentArray from "../data/persistentArray";
import {AnimationDesc} from "./jsonTypes";

export default class AnimationsArray extends PersistentArray {
    items: Animation[] = [];

    constructor() {
        super('animationsv2', 'animator');
    }

    getItem(data: object): Animation {
        return new Animation(data as AnimationDesc);
    }

    findById(id: string): Animation | undefined {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                return this.items[i];
            }
        }
        return undefined;
    }

    removeById(id: string): boolean {
        const next: Animation[] = [];
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
