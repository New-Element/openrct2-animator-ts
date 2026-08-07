import {ConditionDescBase} from "../../jsonTypes";
import TriggerContext from "../triggerContext";

export default class Condition {
    type: string;

    constructor(obj: ConditionDescBase) {
        this.type = obj.type;
    }

    evaluate(context: TriggerContext): boolean {
        return true;
    }

    getDataToPersist(): object {
        return {
            type: this.type
        };
    }
}
