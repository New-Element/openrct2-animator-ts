import {TriggerEventKind} from "./eventType";

/**
 * Human-readable condition variables available for a given event kind.
 */
export function availableVariablesForEventKind(
    kind: TriggerEventKind,
    variableName?: string
): string[] {
    switch (kind) {
        case "carEnters":
            return ["Train Index", "Car Index"];
        case "variableChange":
            if (variableName && variableName.trim()) {
                return [variableName.trim()];
            }
            return ["Variable Value"];
        default:
            return [];
    }
}

export function availableVariablesLabel(
    kind: TriggerEventKind,
    variableName?: string
): string {
    const vars = availableVariablesForEventKind(kind, variableName);
    if (vars.length === 0) {
        return "No Condition Variables";
    }
    return `Available: ${vars.join(", ")}`;
}
