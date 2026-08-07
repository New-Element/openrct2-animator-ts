import {TriggerEventDesc} from "../../model/animation/jsonTypes";
import Trigger from "../../model/animation/trigger/trigger";
import {formatErrorText} from "../ui/errorText";

export type TriggerEventKind =
    | "manual"
    | "carEnters"
    | "singleImmediate"
    | "staff"
    | "variableChange"
    | "unknown";

export const UNKNOWN_EVENT_LABEL = "Unknown (Error)";

export const EDITOR_EVENT_LABELS = [
    "Manual",
    "Car Enters",
    "Immediate",
    "Staff",
    "On Variable Change"
];

export const FILTER_EVENT_LABELS = [
    "All",
    "Manual",
    "Car Enters",
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
        case "vehicleEnters": // legacy type string if somehow still present at runtime
            return "carEnters";
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

export function editorIndexFromKind(kind: TriggerEventKind): number {
    switch (kind) {
        case "manual":
            return 0;
        case "carEnters":
            return 1;
        case "singleImmediate":
            return 2;
        case "staff":
            return 3;
        case "variableChange":
            return 4;
        case "unknown":
            // Not in editor dropdown; caller should not persist until user picks a real type.
            return 0;
    }
}

export function kindFromEditorIndex(index: number): TriggerEventKind {
    switch (index) {
        case 1:
            return "carEnters";
        case 2:
            return "singleImmediate";
        case 3:
            return "staff";
        case 4:
            return "variableChange";
        default:
            return "manual";
    }
}

/** Filter dropdown: 0 = All, then editor kinds, then Unknown (Error). */
export function kindFromFilterIndex(index: number): TriggerEventKind | "all" {
    if (index <= 0) {
        return "all";
    }
    if (index === 6) {
        return "unknown";
    }
    return kindFromEditorIndex(index - 1);
}

export function createEventStub(kind: TriggerEventKind): TriggerEventDesc | null {
    switch (kind) {
        case "manual":
            return null;
        case "carEnters":
            return {
                type: "carEnters",
                rideId: 0,
                tile: { x: 0, y: 0 }
            };
        case "singleImmediate":
            return { type: "singleImmediate" };
        case "staff":
            return { type: "staff", staffId: 0 };
        case "variableChange":
            return { type: "variableChange", variableId: "" };
        case "unknown":
            return null;
    }
}
