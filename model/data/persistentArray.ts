/// <reference path="./../../openrct2.d.ts" />

import {error} from "../logger";
import PersistentModel from "./persistentModel";

type loadArgs = object[] | false;

export default class PersistentArray {
    name: string;
    namespace: string;
    items: PersistentModel[] = [];

    constructor(name: string, namespace: string) {
        this.name = name;
        this.namespace = namespace;
    }

    getItem(data: object): PersistentModel {
        return data as PersistentModel;
    }

    save(): void {
        context.getParkStorage().set(this.getKey(), this.getDataToStore());
    }

    getKey(): string {
        return this.namespace + '.' + this.name;
    }

    getDataToStore(): object[] {
        let data: object[] = [];
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

    load(dataIn: loadArgs): void {
        let data = dataIn !== false ? dataIn : this.getDataFromStorage(),
            length = data.length,
            i: number;
        this.items = [];
        for (i = 0; i < length; i += 1) {
            try {
                this.items.push(this.getItem(data[i]));
            } catch (e) {
                error(
                    this.name,
                    `Failed to load item at index ${i}; skipping`,
                    e
                );
            }
        }
    }

}
