import {WaitStepDesc} from "../jsonTypes";
import TimedStep from "./timedStep";
import StepRunContext from "./stepRunContext";

export default class WaitStep extends TimedStep {
    constructor(obj: WaitStepDesc) {
        super(obj, typeof obj.ticks === "number" ? obj.ticks : 0);
    }

    protected onProgress(_run: StepRunContext, _t: number): void {
        // Wait only advances time.
    }

    getDataToPersist(): object {
        return {
            type: "wait",
            ticks: this.durationTicks
        };
    }
}
