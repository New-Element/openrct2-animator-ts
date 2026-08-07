import Animation from "./animation";
import {AnimationTarget} from "./animationTarget";
import AnimationState from "./animationState";
import {setCurrentTriggerContext} from "./currentTriggerContext";
import Step from "./step/step";
import TriggerContext from "./trigger/triggerContext";

const MAX_STEPS_PER_TICK = 64;

export default class AnimationRun {
    animation: Animation;
    target: AnimationTarget;
    triggerContext: TriggerContext;
    state: AnimationState;
    i: number;
    /** Per-run step instances (cloned from the animation). */
    steps: Step[];

    constructor(i: number, animation: Animation, triggerContext: TriggerContext) {
        this.i = i;
        this.animation = animation;
        this.triggerContext = triggerContext;
        this.target = triggerContext.target;
        this.steps = animation.createRunSteps();
        this.state = {
            stepIndex: 0,
            stepElapsedTicks: 0,
            stepStarted: false,
            running: true,
            paused: false,
            hasRun: false
        };
    }

    /**
     * Advance this run by one tick. Instant steps may chain in the same tick.
     */
    tick(): void {
        if (!this.state.running || this.state.paused) {
            return;
        }

        if (this.steps.length === 0) {
            this.state.running = false;
            return;
        }

        setCurrentTriggerContext(this.triggerContext);
        try {
            let guard = 0;
            while (this.state.running && guard < MAX_STEPS_PER_TICK) {
                guard += 1;

                if (this.state.stepIndex >= this.steps.length) {
                    this.state.running = false;
                    return;
                }

                const step = this.steps[this.state.stepIndex];

                if (!this.state.stepStarted) {
                    this.state.stepElapsedTicks = 0;
                    step.onStart(this);
                    this.state.stepStarted = true;
                    this.state.hasRun = true;
                }

                step.onTick(this);

                if (!step.isComplete(this)) {
                    return;
                }

                this.state.stepIndex += 1;
                this.state.stepStarted = false;
                this.state.stepElapsedTicks = 0;
            }
        } finally {
            setCurrentTriggerContext(null);
        }
    }
}
