import PersistentModel from "../../data/persistentModel";
import Action from "./action/action";
import createAction from "./action/createAction";
import {AnimationTarget} from "../animationTarget";

export default class Frame implements PersistentModel {

    index: number|false;
    minIndex: number|false;
    maxIndex: number|false;
    actions: Action[];

    constructor(obj: object) {
        let key: string;
        for (key in obj) {
            if (key === 'actions') {
                this.setActions(obj);
            } else {
                this[key] = obj[key];
            }
        }
    }

    setActions(data): void {
        this.actions = [];
        for (const item of data) {
            this.actions.push(createAction(item));
        }
    }

    getDataToPersist(): object {
        return {
            index: this.index,
            minIndex: this.minIndex,
            maxIndex: this.maxIndex,
            actions: this.getActionsDataToPersist()
        };
    }

    getActionsDataToPersist(): object[] {
        let data = [];
        for (const action of this.actions) {
            data.push(action.getDataToPersist());
        }
        return data;
    }
x
    shouldPlayOnIndex(index: number): boolean {
        if (this.index !== false) {
            return this.index === index;
        } else {
            if (this.minIndex !== false && this.minIndex < index) {
                return false;
            }
            if (this.maxIndex !== false && this.maxIndex > index) {
                return false;
            }
            return true;
        }
    }

    play(target: AnimationTarget): void {
        let i: number, ln = this.actions.length;
        for (i = 0; i < ln; i += 1) {
            this.actions[i].apply(target);
        }
    }

}