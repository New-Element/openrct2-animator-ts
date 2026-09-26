import {error} from "../../logger";
import {StepDescBase} from "../jsonTypes";
import InstantStep from "./instantStep";
import StepRunContext from "./stepRunContext";

/**
 * Preserves unknown / legacy step payloads; never applies.
 */
export default class UnknownStep extends InstantStep {
    private raw: StepDescBase;

    constructor(obj: StepDescBase) {
        super(obj);
        this.raw = obj;
        error("step", `Unknown step type: ${obj.type}`);
    }

    protected apply(_run: StepRunContext): void {
        // no-op
    }

    getDataToPersist(): object {
        return this.raw;
    }
}
