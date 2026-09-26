import Animation from "./animation";
import {AnimationTarget} from "./animationTarget";
import AnimationState from "./animationState";
import {setCurrentTriggerContext} from "./currentTriggerContext";
import {error, log} from "../logger";
import Step from "./step/step";
import TriggerContext from "./trigger/triggerContext";
import {getTriggerContextInvalidReason} from "./triggerContextValidity";

const MAX_STEPS_PER_TICK = 64;

export default class AnimationRun {
    animation: Animation;
    target: AnimationTarget;
    triggerContext: TriggerContext;
    state: AnimationState;
    i: number;
    /** Per-run step instances (cloned from the animation). */
    steps: Step[];
    /** Trigger that started this run, when known. */
    sourceTriggerId?: string;
    sourceTriggerName?: string;

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
            hasRun: false,
            betweenStepsRemaining: 0
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
            this.state.endReason = "empty";
            this.state.running = false;
            return;
        }

        const invalid = getTriggerContextInvalidReason(this.triggerContext);
        if (invalid) {
            this.state.endReason = "aborted";
            this.state.endDetail = invalid;
            this.state.running = false;
            return;
        }

        if (this.state.betweenStepsRemaining > 0) {
            this.state.betweenStepsRemaining -= 1;
            if (this.state.betweenStepsRemaining > 0) {
                return;
            }
        }

        setCurrentTriggerContext(this.triggerContext);
        try {
            let guard = 0;
            while (this.state.running && guard < MAX_STEPS_PER_TICK) {
                guard += 1;

                if (this.state.stepIndex >= this.steps.length) {
                    this.state.endReason = "complete";
                    this.state.running = false;
                    return;
                }

                const step = this.steps[this.state.stepIndex];

                if (!this.state.stepStarted) {
                    this.state.stepElapsedTicks = 0;
                    const meta: {
                        kind: "stepStarted";
                        animationId: string;
                        skipConsole: true;
                        triggerId?: string;
                        trainIndex?: number;
                        carIndex?: number;
                    } = {
                        kind: "stepStarted",
                        skipConsole: true,
                        animationId: this.animation.id
                    };
                    if (this.sourceTriggerId !== undefined) {
                        meta.triggerId = this.sourceTriggerId;
                    }
                    if (typeof this.triggerContext.trainIndex === "number") {
                        meta.trainIndex = this.triggerContext.trainIndex;
                    }
                    if (typeof this.triggerContext.carIndex === "number") {
                        meta.carIndex = this.triggerContext.carIndex;
                    }
                    log(
                        "step",
                        `Step ${this.state.stepIndex + 1}/${this.steps.length} (${step.type}) started on "${this.animation.name}"`,
                        meta
                    );
                    step.onStart(this);
                    this.state.stepStarted = true;
                    this.state.hasRun = true;
                }

                step.onTick(this);

                if (!step.isComplete(this)) {
                    return;
                }

                if (this.state.jumpTo !== undefined) {
                    const jump = this.state.jumpTo;
                    this.state.jumpTo = undefined;
                    this.state.stepStarted = false;
                    this.state.stepElapsedTicks = 0;
                    if (jump === "end") {
                        this.state.stepIndex = this.steps.length;
                        this.state.endReason = "complete";
                        this.state.running = false;
                        return;
                    }
                    if (jump < 0 || jump >= this.steps.length) {
                        error(
                            "step",
                            `Branch: step ${jump + 1} is missing`,
                            undefined,
                            {
                                animationId: this.animation.id,
                                triggerId: this.sourceTriggerId
                            }
                        );
                        this.state.stepIndex = this.steps.length;
                        this.state.endReason = "complete";
                        this.state.running = false;
                        return;
                    }
                    this.state.stepIndex = jump;
                    continue;
                }

                this.state.stepIndex += 1;
                this.state.stepStarted = false;
                this.state.stepElapsedTicks = 0;

                if (
                    this.state.stepIndex < this.steps.length &&
                    this.animation.ticksBetweenSteps > 0
                ) {
                    this.state.betweenStepsRemaining = this.animation.ticksBetweenSteps;
                    return;
                }
            }
        } finally {
            setCurrentTriggerContext(null);
        }
    }
}
