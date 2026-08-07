import PersistentModel from "../../data/persistentModel";
import {ConditionDesc, TriggerDesc, TriggerEventDesc} from "../jsonTypes";
import createCondition, {evaluateAll} from "./condition/createCondition";
import Condition from "./condition/condition";
import createEvent from "./event/createEvent";
import TriggerEvent from "./event/triggerEvent";
import TriggerContext from "./triggerContext";

export default class Trigger implements PersistentModel {
    id: string;
    name: string;
    event: TriggerEvent | null;
    conditions: Condition[];
    animationIds: string[];

    constructor(obj: TriggerDesc) {
        this.id = obj.id;
        this.name = obj.name;
        this.event = obj.event ? createEvent(obj.event) : null;
        this.conditions = [];
        if (obj.conditions) {
            for (let i = 0; i < obj.conditions.length; i++) {
                this.conditions.push(createCondition(obj.conditions[i]));
            }
        }
        this.animationIds = obj.animationIds.slice();
    }

    /**
     * Poll this trigger's event (if any). Returns contexts that fired and pass conditions.
     */
    tryFireFromEvent(): TriggerContext[] {
        if (!this.event) {
            return [];
        }
        const contexts = this.event.tryFire();
        const passed: TriggerContext[] = [];
        for (let i = 0; i < contexts.length; i++) {
            if (evaluateAll(this.conditions, contexts[i])) {
                passed.push(contexts[i]);
            }
        }
        return passed;
    }

    /**
     * Fire this trigger with an externally supplied context (e.g. from Conductor.fireTrigger).
     */
    tryFireWithContext(context: TriggerContext): false | TriggerContext {
        if (!evaluateAll(this.conditions, context)) {
            return false;
        }
        return context;
    }

    setName(name: string): void {
        this.name = name;
    }

    setEvent(eventDesc: TriggerEventDesc | null): void {
        this.event = eventDesc ? createEvent(eventDesc) : null;
    }

    setConditions(descs: ConditionDesc[]): void {
        this.conditions = [];
        for (let i = 0; i < descs.length; i++) {
            this.conditions.push(createCondition(descs[i]));
        }
    }

    getConditionDescs(): ConditionDesc[] {
        const descs: ConditionDesc[] = [];
        for (let i = 0; i < this.conditions.length; i++) {
            descs.push(this.conditions[i].getDataToPersist() as ConditionDesc);
        }
        return descs;
    }

    getDataToPersist(): object {
        const eventData: TriggerEventDesc | null = this.event
            ? this.event.getDataToPersist() as TriggerEventDesc
            : null;
        const conditions: object[] = [];
        for (let i = 0; i < this.conditions.length; i++) {
            conditions.push(this.conditions[i].getDataToPersist());
        }
        return {
            id: this.id,
            name: this.name,
            event: eventData,
            conditions: conditions,
            animationIds: this.animationIds.slice()
        };
    }
}
