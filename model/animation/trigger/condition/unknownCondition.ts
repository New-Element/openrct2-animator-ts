import {ConditionDescBase} from "../../jsonTypes";
import TriggerContext from "../triggerContext";
import Condition from "./condition";

/**
 * Placeholder for unrecognized persisted condition types.
 * Never passes; round-trips the original JSON so data is not lost on save.
 */
export default class UnknownCondition extends Condition {
    private raw: ConditionDescBase;

    constructor(obj: ConditionDescBase) {
        super(obj);
        this.raw = obj;
    }

    evaluate(_context: TriggerContext): boolean {
        return false;
    }

    getDataToPersist(): object {
        return this.raw;
    }
}
