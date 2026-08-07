import TriggerContext from "./trigger/triggerContext";

type FireTriggerFn = (triggerId: string, context: TriggerContext) => void;

let fireTriggerImpl: FireTriggerFn = () => {
    console.log("[FireTrigger] Conductor not bound");
};

export function bindFireTrigger(fn: FireTriggerFn): void {
    fireTriggerImpl = fn;
}

export function fireTriggerById(triggerId: string, context: TriggerContext): void {
    fireTriggerImpl(triggerId, context);
}
