import {EveryNTicksEventDesc} from "../../jsonTypes";
import {withContextLists} from "../contextLists";
import TriggerContext from "../triggerContext";
import TriggerEvent from "./triggerEvent";

const DEFAULT_TICKS = 40;

function normalizeTicks(ticks: number | undefined): number {
    if (typeof ticks !== "number") {
        return DEFAULT_TICKS;
    }
    if (ticks < 1) {
        return 1;
    }
    return Math.floor(ticks);
}

export default class EveryNTicksEvent extends TriggerEvent {
    type: "everyNTicks" = "everyNTicks";
    ticks: number;

    /** Ticks seen since the last fire (or since load). Not persisted. */
    private count: number = 0;

    constructor(obj: EveryNTicksEventDesc) {
        super(obj);
        this.type = "everyNTicks";
        this.ticks = normalizeTicks(obj.ticks);
    }

    setTicks(ticks: number): void {
        const next = normalizeTicks(ticks);
        if (next === this.ticks) {
            return;
        }
        this.ticks = next;
        this.count = 0;
    }

    tryFire(): TriggerContext[] {
        this.count += 1;
        if (this.count < this.ticks) {
            return [];
        }
        this.count = 0;
        return [
            withContextLists({
                target: {
                    static: true
                }
            })
        ];
    }

    getDataToPersist(): object {
        return {
            type: "everyNTicks",
            ticks: this.ticks
        };
    }
}
