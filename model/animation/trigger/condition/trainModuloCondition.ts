import {TrainModuloConditionDesc} from "../../jsonTypes";
import TriggerContext from "../triggerContext";
import Condition from "./condition";

export default class TrainModuloCondition extends Condition {
    type: "trainModulo" = "trainModulo";
    modulo: number;
    remainder: number;

    constructor(obj: TrainModuloConditionDesc) {
        super(obj);
        this.type = "trainModulo";
        this.modulo = obj.modulo;
        this.remainder = obj.remainder;
    }

    evaluate(context: TriggerContext): boolean {
        if (context.trainIndex === undefined) {
            return false;
        }
        return context.trainIndex % this.modulo === this.remainder;
    }

    getDataToPersist(): object {
        return {
            type: "trainModulo",
            modulo: this.modulo,
            remainder: this.remainder
        };
    }
}
