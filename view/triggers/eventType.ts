import Trigger from "../../model/animation/trigger/trigger";
import {formatErrorText} from "../ui/errorText";
import {TriggerEventKind} from "./events/eventUiTypes";

export type {TriggerEventKind} from "./events/eventUiTypes";

export const UNKNOWN_EVENT_LABEL = "Unknown (Error)";

export const FILTER_EVENT_LABELS = [
    "All",
    "Manual",
    "Car Enters",
    "Train Enters",
    "Immediate",
    "Every N Ticks",
    "Every Day",
    "Park Loaded",
    "Ride Breaks Down",
    "Vehicle Crashes",
    "Guest Spawns",
    "Weather Changes",
    "Staff",
    "On Variable Change",
    "Variable Crosses Threshold",
    formatErrorText(UNKNOWN_EVENT_LABEL)
];

export function eventKindFromTrigger(trigger: Trigger): TriggerEventKind {
    if (!trigger.event) {
        return "manual";
    }
    switch (trigger.event.type) {
        case "carEnters":
            return "carEnters";
        case "trainEnters":
            return "trainEnters";
        case "vehicleEnters": {
            // Legacy soft-load path if type string is still present at runtime.
            const detect = (trigger.event as { detect?: string }).detect;
            return detect === "train" ? "trainEnters" : "carEnters";
        }
        case "singleImmediate":
            return "singleImmediate";
        case "everyNTicks":
            return "everyNTicks";
        case "everyDay":
            return "everyDay";
        case "parkLoaded":
            return "parkLoaded";
        case "rideBreakdown":
            return "rideBreakdown";
        case "vehicleCrash":
            return "vehicleCrash";
        case "guestGeneration":
            return "guestGeneration";
        case "weatherChange":
            return "weatherChange";
        case "staff":
            return "staff";
        case "variableChange":
            return "variableChange";
        case "variableThreshold":
            return "variableThreshold";
        default:
            return "unknown";
    }
}

export function eventKindLabel(kind: TriggerEventKind): string {
    switch (kind) {
        case "manual":
            return "Manual";
        case "carEnters":
            return "Car Enters";
        case "trainEnters":
            return "Train Enters";
        case "singleImmediate":
            return "Immediate";
        case "everyNTicks":
            return "Every N Ticks";
        case "everyDay":
            return "Every Day";
        case "parkLoaded":
            return "Park Loaded";
        case "rideBreakdown":
            return "Ride Breaks Down";
        case "vehicleCrash":
            return "Vehicle Crashes";
        case "guestGeneration":
            return "Guest Spawns";
        case "weatherChange":
            return "Weather Changes";
        case "staff":
            return "Staff";
        case "variableChange":
            return "On Variable Change";
        case "variableThreshold":
            return "Variable Crosses Threshold";
        case "unknown":
            return formatErrorText(UNKNOWN_EVENT_LABEL);
    }
}

/** Filter dropdown: 0 = All, then editor kinds, then Unknown (Error). */
export function kindFromFilterIndex(index: number): TriggerEventKind | "all" {
    if (index <= 0) {
        return "all";
    }
    if (index === 15) {
        return "unknown";
    }
    switch (index - 1) {
        case 1:
            return "carEnters";
        case 2:
            return "trainEnters";
        case 3:
            return "singleImmediate";
        case 4:
            return "everyNTicks";
        case 5:
            return "everyDay";
        case 6:
            return "parkLoaded";
        case 7:
            return "rideBreakdown";
        case 8:
            return "vehicleCrash";
        case 9:
            return "guestGeneration";
        case 10:
            return "weatherChange";
        case 11:
            return "staff";
        case 12:
            return "variableChange";
        case 13:
            return "variableThreshold";
        default:
            return "manual";
    }
}
