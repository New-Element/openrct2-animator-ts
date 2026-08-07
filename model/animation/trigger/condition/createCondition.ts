import {
    CarEqualsConditionDesc,
    CarModuloConditionDesc,
    ConditionDesc,
    ConditionDescBase,
    RideOpenConditionDesc,
    TrainModuloConditionDesc
} from "../../jsonTypes";
import reportPluginError from "../../../reportPluginError";
import TriggerContext from "../triggerContext";
import CarEqualsCondition from "./carEqualsCondition";
import CarModuloCondition from "./carModuloCondition";
import Condition from "./condition";
import RideOpenCondition from "./rideOpenCondition";
import TrainModuloCondition from "./trainModuloCondition";
import UnknownCondition from "./unknownCondition";

export default function createCondition(data: ConditionDesc | ConditionDescBase): Condition {
    switch (data.type) {
        case "trainModulo":
            return new TrainModuloCondition(data as TrainModuloConditionDesc);
        case "carModulo":
            return new CarModuloCondition(data as CarModuloConditionDesc);
        case "carEquals":
            return new CarEqualsCondition(data as CarEqualsConditionDesc);
        case "rideOpen":
            return new RideOpenCondition(data as RideOpenConditionDesc);
        default:
            reportPluginError("trigger", `Unknown condition type: ${data.type}`);
            return new UnknownCondition(data);
    }
}

export function evaluateAll(conditions: Condition[], context: TriggerContext): boolean {
    for (let i = 0; i < conditions.length; i++) {
        if (!conditions[i].evaluate(context)) {
            return false;
        }
    }
    return true;
}
