import {TriggerEventDescBase} from "../../jsonTypes";
import TriggerContext from "../triggerContext";
import TriggerEvent from "./triggerEvent";

/**
 * Placeholder for unrecognized persisted event types.
 * Does not fire; round-trips the original JSON so data is not lost on save.
 */
export default class UnknownEvent extends TriggerEvent {
    private raw: TriggerEventDescBase;

    constructor(obj: TriggerEventDescBase) {
        super(obj);
        this.raw = obj;
    }

    tryFire(): TriggerContext[] {
        return [];
    }

    getDataToPersist(): object {
        return this.raw;
    }
}
