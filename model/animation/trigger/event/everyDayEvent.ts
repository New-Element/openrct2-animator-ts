/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";
import {EveryDayEventDesc} from "../../jsonTypes";
import {withContextLists} from "../contextLists";
import TriggerContext from "../triggerContext";
import TriggerEvent from "./triggerEvent";

function calendarKey(): string | null {
    if (typeof date === "undefined" || typeof date.day !== "number") {
        return null;
    }
    return `${date.year}-${date.month}-${date.day}`;
}

export default class EveryDayEvent extends TriggerEvent {
    type: "everyDay" = "everyDay";

    private seeded: boolean = false;
    private lastKey: string | undefined;
    private loggedMissingDate: boolean = false;

    constructor(obj: EveryDayEventDesc) {
        super(obj);
        this.type = "everyDay";
    }

    tryFire(): TriggerContext[] {
        const key = calendarKey();
        if (!key) {
            if (!this.loggedMissingDate) {
                this.loggedMissingDate = true;
                error("trigger", "Every Day: park date is not available");
            }
            return [];
        }
        if (!this.seeded) {
            this.seeded = true;
            this.lastKey = key;
            return [];
        }
        if (key === this.lastKey) {
            return [];
        }
        this.lastKey = key;
        return [
            withContextLists({
                target: {static: true},
                day: date.day,
                month: date.month,
                year: date.year
            })
        ];
    }

    getDataToPersist(): object {
        return {
            type: "everyDay"
        };
    }
}
