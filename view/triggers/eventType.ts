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
    "Staff",
    "On Variable Change",
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
        case "staff":
            return "staff";
        case "variableChange":
            return "variableChange";
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
        case "staff":
            return "Staff";
        case "variableChange":
            return "On Variable Change";
        case "unknown":
            return formatErrorText(UNKNOWN_EVENT_LABEL);
    }
}

/** Filter dropdown: 0 = All, then editor kinds, then Unknown (Error). */
export function kindFromFilterIndex(index: number): TriggerEventKind | "all" {
    if (index <= 0) {
        return "all";
    }
    if (index === 7) {
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
            return "staff";
        case 5:
            return "variableChange";
        default:
            return "manual";
    }
}
