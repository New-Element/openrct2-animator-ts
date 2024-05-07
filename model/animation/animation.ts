import {Trigger} from "./trigger/trigger";
import PersistentModel from "../data/persistentModel";

export default class Animation implements PersistentModel {
    id: string;
    name: string;
    trigger: Trigger;

    state: AnimationState;

    constructor(obj: object) {
        let key:string;
        // let's apply them all, except for the trigger where we need to make an instance of that.
        for (key in obj) {
            if (key === 'trigger') {

            } else {
                this[key] = obj[key];
            }
        }
    }

    start(): void {

    }

    getDataToPersist(): object {
        return {
            id: this.id,
            name: this.name,
            trigger: this.trigger.getDataToPersist()
        }
    }
};