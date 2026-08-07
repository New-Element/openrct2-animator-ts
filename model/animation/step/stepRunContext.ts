import {AnimationTarget} from "../animationTarget";
import AnimationState from "../animationState";
import TriggerContext from "../trigger/triggerContext";

/**
 * Narrow run surface passed into steps (avoids circular imports with AnimationRun).
 */
export default interface StepRunContext {
    state: AnimationState;
    target: AnimationTarget;
    triggerContext: TriggerContext;
}
