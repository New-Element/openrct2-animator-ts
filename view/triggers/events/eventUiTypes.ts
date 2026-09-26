import {TriggerEventDesc} from "../../../model/animation/jsonTypes";
import Trigger from "../../../model/animation/trigger/trigger";

export type TriggerEventKind =
    | "manual"
    | "carEnters"
    | "trainEnters"
    | "singleImmediate"
    | "everyNTicks"
    | "everyDay"
    | "parkLoaded"
    | "rideBreakdown"
    | "vehicleCrash"
    | "guestGeneration"
    | "weatherChange"
    | "staff"
    | "variableChange"
    | "variableThreshold"
    | "unknown";

export type EventUiModule = {
    kind: TriggerEventKind;
    /** Label in the editor Event Type dropdown; omitted for unknown. */
    editorLabel: string | null;
    createStub(): TriggerEventDesc | null;
    hide(): void;
    load(trigger: Trigger): void;
    save(trigger: Trigger): void;
    conditionVariableNames(variableName?: string): string[];
};
