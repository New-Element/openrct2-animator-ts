import {TriggerEventDescBase} from "../../jsonTypes";
import TriggerContext from "../triggerContext";

/**
 * Detects whether a trigger's event has occurred this tick.
 * Returns zero or more fire contexts.
 */
export default class TriggerEvent {
    type: string;

    constructor(obj: TriggerEventDescBase) {
        this.type = obj.type;
    }

    tryFire(): TriggerContext[] {
        return [];
    }

    getDataToPersist(): object {
        return {
            type: this.type
        };
    }
}
