import {
    CarEntersEventDesc,
    EveryDayEventDesc,
    EveryNTicksEventDesc,
    GuestGenerationEventDesc,
    ParkLoadedEventDesc,
    RideBreakdownEventDesc,
    SingleImmediateEventDesc,
    StaffEventDesc,
    TrainEntersEventDesc,
    TriggerEventDesc,
    VariableChangeEventDesc,
    VariableThresholdEventDesc,
    VehicleCrashEventDesc,
    VehicleEntersEventDesc,
    WeatherChangeEventDesc
} from "../../jsonTypes";
import {error} from "../../../logger";
import CarEntersEvent from "./carEntersEvent";
import EveryDayEvent from "./everyDayEvent";
import EveryNTicksEvent from "./everyNTicksEvent";
import GuestGenerationEvent from "./guestGenerationEvent";
import ParkLoadedEvent from "./parkLoadedEvent";
import RideBreakdownEvent from "./rideBreakdownEvent";
import SingleImmediateEvent from "./singleImmediateEvent";
import StaffEvent from "./staffEvent";
import TrainEntersEvent from "./trainEntersEvent";
import TriggerEvent from "./triggerEvent";
import UnknownEvent from "./unknownEvent";
import VariableChangeEvent from "./variableChangeEvent";
import VariableThresholdEvent from "./variableThresholdEvent";
import VehicleCrashEvent from "./vehicleCrashEvent";
import WeatherChangeEvent from "./weatherChangeEvent";

export default function createEvent(data: TriggerEventDesc): TriggerEvent {
    switch (data.type) {
        case "carEnters":
            return new CarEntersEvent(data as CarEntersEventDesc);
        case "trainEnters":
            return new TrainEntersEvent(data as TrainEntersEventDesc);
        case "vehicleEnters": {
            // Legacy soft-load: detect "train" → trainEnters; otherwise carEnters.
            const legacy = data as VehicleEntersEventDesc;
            if (legacy.detect === "train") {
                return new TrainEntersEvent({
                    type: "trainEnters",
                    rideId: legacy.rideId,
                    tiles: [],
                    tile: legacy.tile
                });
            }
            return new CarEntersEvent({
                type: "carEnters",
                rideId: legacy.rideId,
                tiles: [],
                tile: legacy.tile
            });
        }
        case "singleImmediate":
            return new SingleImmediateEvent(data as SingleImmediateEventDesc);
        case "staff":
            return new StaffEvent(data as StaffEventDesc);
        case "variableChange":
            return new VariableChangeEvent(data as VariableChangeEventDesc);
        case "everyNTicks":
            return new EveryNTicksEvent(data as EveryNTicksEventDesc);
        case "everyDay":
            return new EveryDayEvent(data as EveryDayEventDesc);
        case "parkLoaded":
            return new ParkLoadedEvent(data as ParkLoadedEventDesc);
        case "rideBreakdown":
            return new RideBreakdownEvent(data as RideBreakdownEventDesc);
        case "vehicleCrash":
            return new VehicleCrashEvent(data as VehicleCrashEventDesc);
        case "guestGeneration":
            return new GuestGenerationEvent(data as GuestGenerationEventDesc);
        case "weatherChange":
            return new WeatherChangeEvent(data as WeatherChangeEventDesc);
        case "variableThreshold":
            return new VariableThresholdEvent(data as VariableThresholdEventDesc);
        default:
            error("trigger", `Unknown trigger event type: ${data.type}`);
            return new UnknownEvent(data);
    }
}
