/// <reference path="./../../openrct2.d.ts" />

import PersistentModel from "./persistentModel";

export default class PersistentArray {
    name: string;
    namespace: string;
    items: PersistentModel[];

    getItem(data): any {
        return data;
    }

    save(): void {
        context.getParkStorage().set(this.getKey(), this.getDataToStore());
    }

    getKey(): string {
        return this.namespace + '.' + this.name;
    }

    getDataToStore(): object[] {
        let data = [];
        let length = this.items.length,
            i:number;

        for (i = 0; i < length; i += 1) {
            data.push(this.items[i].getDataToPersist());
        }

        return data;
    }

    getDataFromStorage(): object[] {
        return context.getParkStorage().get(this.getKey(), []);
    }

    load(): void {
        let data = this.getDataFromStorage(),
            length = data.length,
            i: number;

        this.items = [];
        for (i = 0; i < length; i += 1) {
            this.items.push(this.getItem(data[i]));
        }
    }

}