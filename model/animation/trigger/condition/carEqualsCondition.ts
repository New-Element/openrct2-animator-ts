import {CarEqualsConditionDesc} from "../../jsonTypes";
import TriggerContext from "../triggerContext";
import Condition from "./condition";

export default class CarEqualsCondition extends Condition {
    type: "carEquals" = "carEquals";
    value: number;

    constructor(obj: CarEqualsConditionDesc) {
        super(obj);
        this.type = "carEquals";
        this.value = obj.value;
    }

    evaluate(context: TriggerContext): boolean {
        if (context.carIndex === undefined) {
            return false;
        }
        return context.carIndex === this.value;
    }

    getDataToPersist(): object {
        return {
            type: "carEquals",
            value: this.value
        };
    }
}
