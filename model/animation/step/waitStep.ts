import {WaitStepDesc} from "../jsonTypes";
import {resolveNumberSource} from "./numberSource";
import TimedStep from "./timedStep";
import StepRunContext from "./stepRunContext";

function resolvedWaitTicks(obj: WaitStepDesc): number {
    const ticks = resolveNumberSource(
        typeof obj.ticks === "number" ? obj.ticks : 0,
        obj.ticksOrigin,
        obj.ticksVariableId,
        "int",
        "Wait"
    );
    return ticks === null ? 0 : ticks;
}

export default class WaitStep extends TimedStep {
    ticksOrigin?: WaitStepDesc["ticksOrigin"];
    ticksVariableId?: string;
    hardcodedTicks: number;

    constructor(obj: WaitStepDesc) {
        const ticks = resolvedWaitTicks(obj);
        super(obj, ticks);
        this.hardcodedTicks = typeof obj.ticks === "number" ? obj.ticks : 0;
        this.ticksOrigin = obj.ticksOrigin;
        this.ticksVariableId = obj.ticksVariableId;
    }

    protected onProgress(_run: StepRunContext, _t: number): void {
        // Wait only advances time.
    }

    getDataToPersist(): object {
        return {
            type: "wait",
            ticks: this.hardcodedTicks,
            ...(this.ticksOrigin === "variable" ? {ticksOrigin: "variable", ticksVariableId: this.ticksVariableId || ""} : {})
        };
    }
}
