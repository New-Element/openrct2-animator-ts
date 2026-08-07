import {StepDescBase} from "../jsonTypes";
import Step from "./step";
import StepRunContext from "./stepRunContext";

/**
 * Applies once on start and completes on the same tick.
 */
export default abstract class InstantStep extends Step {
    private applied: boolean = false;

    constructor(obj: StepDescBase) {
        super(obj);
    }

    onStart(run: StepRunContext): void {
        this.applied = false;
        this.apply(run);
        this.applied = true;
    }

    onTick(_run: StepRunContext): void {
        // Instant steps do all work in onStart.
    }

    isComplete(_run: StepRunContext): boolean {
        return this.applied;
    }

    protected abstract apply(run: StepRunContext): void;
}
