import {
    CarEntersEventDesc,
    SingleImmediateEventDesc,
    StaffEventDesc,
    TrainEntersEventDesc,
    TriggerEventDesc,
    VariableChangeEventDesc,
    VehicleEntersEventDesc
} from "../../jsonTypes";
import reportPluginError from "../../../reportPluginError";
import CarEntersEvent from "./carEntersEvent";
import SingleImmediateEvent from "./singleImmediateEvent";
import StaffEvent from "./staffEvent";
import TrainEntersEvent from "./trainEntersEvent";
import TriggerEvent from "./triggerEvent";
import UnknownEvent from "./unknownEvent";
import VariableChangeEvent from "./variableChangeEvent";

export default function createEvent(data: TriggerEventDesc): TriggerEvent {
    switch (data.type) {
        case "carEnters":
            return new CarEntersEvent({
                type: "carEnters",
                rideId: (data as CarEntersEventDesc).rideId,
                tile: (data as CarEntersEventDesc).tile
            });
        case "trainEnters":
            return new TrainEntersEvent({
                type: "trainEnters",
                rideId: (data as TrainEntersEventDesc).rideId,
                tile: (data as TrainEntersEventDesc).tile
            });
        case "vehicleEnters": {
            // Legacy soft-load: detect "train" → trainEnters; otherwise carEnters.
            const legacy = data as VehicleEntersEventDesc;
            if (legacy.detect === "train") {
                return new TrainEntersEvent({
                    type: "trainEnters",
                    rideId: legacy.rideId,
                    tile: legacy.tile
                });
            }
            return new CarEntersEvent({
                type: "carEnters",
                rideId: legacy.rideId,
                tile: legacy.tile
            });
        }
        case "singleImmediate":
            return new SingleImmediateEvent(data as SingleImmediateEventDesc);
        case "staff":
            return new StaffEvent(data as StaffEventDesc);
        case "variableChange":
            return new VariableChangeEvent(data as VariableChangeEventDesc);
        default:
            reportPluginError("trigger", `Unknown trigger event type: ${data.type}`);
            return new UnknownEvent(data);
    }
}
