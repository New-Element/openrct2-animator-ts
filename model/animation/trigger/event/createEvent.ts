import {
    CarEntersEventDesc,
    SingleImmediateEventDesc,
    StaffEventDesc,
    TriggerEventDesc,
    VariableChangeEventDesc
} from "../../jsonTypes";
import reportPluginError from "../../../reportPluginError";
import CarEntersEvent from "./carEntersEvent";
import SingleImmediateEvent from "./singleImmediateEvent";
import StaffEvent from "./staffEvent";
import TriggerEvent from "./triggerEvent";
import UnknownEvent from "./unknownEvent";
import VariableChangeEvent from "./variableChangeEvent";

export default function createEvent(data: TriggerEventDesc): TriggerEvent {
    switch (data.type) {
        case "carEnters":
        case "vehicleEnters": // legacy soft-load
            return new CarEntersEvent({
                type: "carEnters",
                rideId: (data as CarEntersEventDesc).rideId,
                tile: (data as CarEntersEventDesc).tile
            });
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
