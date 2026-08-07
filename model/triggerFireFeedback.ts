/// <reference path="./../openrct2.d.ts" />

import TriggerContext from "./animation/trigger/triggerContext";

export interface TriggerFireInfo {
    triggerId: string;
    tick: number;
    trainIndex?: number;
    carIndex?: number;
}

type TriggerFireListener = (info: TriggerFireInfo) => void;

let listener: TriggerFireListener | null = null;

export function bindTriggerFireFeedback(fn: TriggerFireListener | null): void {
    listener = fn;
}

/** Notify listeners that a trigger successfully fired (with context). */
export function reportTriggerFired(triggerId: string, context: TriggerContext): void {
    if (!listener) {
        return;
    }
    listener({
        triggerId: triggerId,
        tick: date.ticksElapsed,
        trainIndex: context.trainIndex,
        carIndex: context.carIndex
    });
}
