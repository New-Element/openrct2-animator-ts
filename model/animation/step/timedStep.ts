import {StepDescBase} from "../jsonTypes";
import Step from "./step";
import StepRunContext from "./stepRunContext";

/**
 * Runs for durationTicks, using run.state.stepElapsedTicks as the clock.
 */
export default abstract class TimedStep extends Step {
    durationTicks: number;

    constructor(obj: StepDescBase, durationTicks: number) {
        super(obj);
        this.durationTicks = Math.max(0, durationTicks | 0);
    }

    onStart(run: StepRunContext): void {
        run.state.stepElapsedTicks = 0;
        this.onTimedStart(run);
        if (this.durationTicks <= 0) {
            this.onProgress(run, 1);
        }
    }

    onTick(run: StepRunContext): void {
        if (this.durationTicks <= 0) {
            return;
        }
        run.state.stepElapsedTicks += 1;
        const t = Math.min(1, run.state.stepElapsedTicks / this.durationTicks);
        this.onProgress(run, t);
    }

    isComplete(run: StepRunContext): boolean {
        if (this.durationTicks <= 0) {
            return true;
        }
        return run.state.stepElapsedTicks >= this.durationTicks;
    }

    protected onTimedStart(_run: StepRunContext): void {
        // Optional hook for subclasses.
    }

    protected abstract onProgress(run: StepRunContext, t: number): void;
}
