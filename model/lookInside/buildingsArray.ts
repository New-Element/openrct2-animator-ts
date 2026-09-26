import PersistentArray from "../data/persistentArray";
import Building from "./building";
import createBuilding from "./createBuilding";

export default class BuildingsArray extends PersistentArray {
    items: Building[] = [];

    constructor() {
        super("buildingsv1", "animator");
    }

    getItem(data: object): Building {
        return createBuilding(data);
    }

    findById(id: string): Building | undefined {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                return this.items[i];
            }
        }
        return undefined;
    }

    findByTile(x: number, y: number): Building | undefined {
        for (let i = 0; i < this.items.length; i++) {
            const tiles = this.items[i].tiles;
            for (let t = 0; t < tiles.length; t++) {
                if (tiles[t].x === x && tiles[t].y === y) {
                    return this.items[i];
                }
            }
        }
        return undefined;
    }

    removeById(id: string): boolean {
        const next: Building[] = [];
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
