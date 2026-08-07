import TriggerContext from "./trigger/triggerContext";

let current: TriggerContext | null = null;

export function setCurrentTriggerContext(context: TriggerContext | null): void {
    current = context;
}

export function getCurrentTriggerContext(): TriggerContext | null {
    return current;
}
