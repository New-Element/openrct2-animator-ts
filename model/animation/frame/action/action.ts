import PersistentModel from "../../../data/persistentModel";
import {AnimationTarget} from "../../animationTarget";

export default class Action implements PersistentModel {
    type: string;

    runState: {};

    constructor(obj: object) {
        let key: string;
        for (key in obj) {
            this[key] = obj[key];
        }
        this.setRunState();
    }

    setRunState(): void {
        this.runState = {};
    }

    getDataToPersist(): object {
        return {
            type: this.type
        };
    }

    apply(target: AnimationTarget): void {

    }
}