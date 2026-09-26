import {
    BlockBrakeStatusConditionDesc,
    CarEqualsConditionDesc,
    CarLocationConditionDesc,
    CarModuloConditionDesc,
    CarSpeedConditionDesc,
    CarStatusConditionDesc,
    ConditionDesc,
    ConditionDescBase,
    DateStatusConditionDesc,
    GuestExistsConditionDesc,
    GuestFlagConditionDesc,
    GuestItemConditionDesc,
    GuestLocationConditionDesc,
    GuestNeedConditionDesc,
    ParkCashConditionDesc,
    ParkFlagConditionDesc,
    ParkGuestCountConditionDesc,
    ParkRatingConditionDesc,
    RideBreakdownStatusConditionDesc,
    RideEmptyConditionDesc,
    RideGuestCountConditionDesc,
    RideOpenConditionDesc,
    RideStatusConditionDesc,
    ScenarioStatusConditionDesc,
    StaffExistsConditionDesc,
    StaffFlagConditionDesc,
    StaffLocationConditionDesc,
    TemperatureConditionDesc,
    TrackBrakeSpeedConditionDesc,
    TrackChainLiftConditionDesc,
    TrackInvertedConditionDesc,
    TrainLocationConditionDesc,
    TrainModuloConditionDesc,
    VariableValueConditionDesc,
    WeatherStatusConditionDesc
} from "../../jsonTypes";
import {error} from "../../../logger";
import TriggerContext from "../triggerContext";
import CarEqualsCondition from "./carEqualsCondition";
import CarModuloCondition from "./carModuloCondition";
import Condition from "./condition";
import {
    GuestExistsCondition,
    GuestFlagCondition,
    GuestItemCondition,
    GuestLocationCondition,
    GuestNeedCondition
} from "./guestConditions";
import {
    DateStatusCondition,
    ParkCashCondition,
    ParkFlagCondition,
    ParkGuestCountCondition,
    ParkRatingCondition,
    ScenarioStatusCondition,
    TemperatureCondition,
    WeatherStatusCondition
} from "./parkConditions";
import {
    RideBreakdownStatusCondition,
    RideEmptyCondition,
    RideGuestCountCondition,
    RideStatusCondition
} from "./rideConditions";
import RideOpenCondition from "./rideOpenCondition";
import {
    StaffExistsCondition,
    StaffFlagCondition,
    StaffLocationCondition
} from "./staffConditions";
import {
    BlockBrakeStatusCondition,
    TrackBrakeSpeedCondition,
    TrackChainLiftCondition,
    TrackInvertedCondition
} from "./trackConditions";
import TrainModuloCondition from "./trainModuloCondition";
import UnknownCondition from "./unknownCondition";
import VariableValueCondition from "./variableValueCondition";
import {
    CarLocationCondition,
    CarSpeedCondition,
    CarStatusCondition,
    TrainLocationCondition
} from "./vehicleConditions";

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
        case "weatherStatus":
            return new WeatherStatusCondition(data as WeatherStatusConditionDesc);
        case "temperature":
            return new TemperatureCondition(data as TemperatureConditionDesc);
        case "dateStatus":
            return new DateStatusCondition(data as DateStatusConditionDesc);
        case "parkRating":
            return new ParkRatingCondition(data as ParkRatingConditionDesc);
        case "parkGuestCount":
            return new ParkGuestCountCondition(data as ParkGuestCountConditionDesc);
        case "parkCash":
            return new ParkCashCondition(data as ParkCashConditionDesc);
        case "parkFlag":
            return new ParkFlagCondition(data as ParkFlagConditionDesc);
        case "scenarioStatus":
            return new ScenarioStatusCondition(data as ScenarioStatusConditionDesc);
        case "variableValue":
            return new VariableValueCondition(data as VariableValueConditionDesc);
        case "rideStatus":
            return new RideStatusCondition(data as RideStatusConditionDesc);
        case "rideBreakdownStatus":
            return new RideBreakdownStatusCondition(data as RideBreakdownStatusConditionDesc);
        case "rideGuestCount":
            return new RideGuestCountCondition(data as RideGuestCountConditionDesc);
        case "rideEmpty":
            return new RideEmptyCondition(data as RideEmptyConditionDesc);
        case "carStatus":
            return new CarStatusCondition(data as CarStatusConditionDesc);
        case "carSpeed":
            return new CarSpeedCondition(data as CarSpeedConditionDesc);
        case "carLocation":
            return new CarLocationCondition(data as CarLocationConditionDesc);
        case "trainLocation":
            return new TrainLocationCondition(data as TrainLocationConditionDesc);
        case "trackChainLift":
            return new TrackChainLiftCondition(data as TrackChainLiftConditionDesc);
        case "trackBrakeSpeed":
            return new TrackBrakeSpeedCondition(data as TrackBrakeSpeedConditionDesc);
        case "trackInverted":
            return new TrackInvertedCondition(data as TrackInvertedConditionDesc);
        case "blockBrakeStatus":
            return new BlockBrakeStatusCondition(data as BlockBrakeStatusConditionDesc);
        case "guestExists":
            return new GuestExistsCondition(data as GuestExistsConditionDesc);
        case "guestLocation":
            return new GuestLocationCondition(data as GuestLocationConditionDesc);
        case "guestNeed":
            return new GuestNeedCondition(data as GuestNeedConditionDesc);
        case "guestItem":
            return new GuestItemCondition(data as GuestItemConditionDesc);
        case "guestFlag":
            return new GuestFlagCondition(data as GuestFlagConditionDesc);
        case "staffExists":
            return new StaffExistsCondition(data as StaffExistsConditionDesc);
        case "staffLocation":
            return new StaffLocationCondition(data as StaffLocationConditionDesc);
        case "staffFlag":
            return new StaffFlagCondition(data as StaffFlagConditionDesc);
        default:
            error("trigger", `Unknown condition type: ${data.type}`);
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
