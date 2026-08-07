import {CarModuloConditionDesc} from "../../jsonTypes";
import TriggerContext from "../triggerContext";
import Condition from "./condition";

export default class CarModuloCondition extends Condition {
    type: "carModulo" = "carModulo";
    modulo: number;
    remainder: number;

    constructor(obj: CarModuloConditionDesc) {
        super(obj);
        this.type = "carModulo";
        this.modulo = obj.modulo;
        this.remainder = obj.remainder;
    }

    evaluate(context: TriggerContext): boolean {
        if (context.carIndex === undefined) {
            return false;
        }
        return context.carIndex % this.modulo === this.remainder;
    }

    getDataToPersist(): object {
        return {
            type: "carModulo",
            modulo: this.modulo,
            remainder: this.remainder
        };
    }
}
