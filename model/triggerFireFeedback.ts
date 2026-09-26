/// <reference path="./../openrct2.d.ts" />

import TriggerContext from "./animation/trigger/triggerContext";
import {log} from "./logger";

/** Record that a trigger successfully fired (console + shared log buffer). */
export function reportTriggerFired(
    triggerId: string,
    triggerName: string,
    context: TriggerContext
): void {
    const parts = [`Trigger "${triggerName}" fired`];
    if (typeof context.trainIndex === "number") {
        parts.push(`train=${context.trainIndex}`);
    }
    if (typeof context.carIndex === "number") {
        parts.push(`car=${context.carIndex}`);
    }
    log("trigger", parts.join(" "), {
        kind: "triggerFired",
        triggerId: triggerId,
        trainIndex: context.trainIndex,
        carIndex: context.carIndex
    });
}
