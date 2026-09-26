import TriggerContext from "./trigger/triggerContext";
import {error} from "../logger";

type FireTriggerFn = (triggerId: string, context: TriggerContext) => void;

let fireTriggerImpl: FireTriggerFn = () => {
    error("fireTrigger", "Conductor not bound");
};

export function bindFireTrigger(fn: FireTriggerFn): void {
    fireTriggerImpl = fn;
}

export function fireTriggerById(triggerId: string, context: TriggerContext): void {
    fireTriggerImpl(triggerId, context);
}
