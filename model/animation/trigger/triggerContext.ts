import {AnimationTarget} from "../animationTarget";

/**
 * Context available when evaluating conditions / starting animations from a trigger fire.
 */
export default interface TriggerContext {
    target: AnimationTarget;
    rideId?: number;
    trainIndex?: number;
    /** 0-based position of the firer car within its train. */
    carIndex?: number;
    /** Watched park variable for variableChange events. */
    variableId?: string;
    /** Current value of the watched variable after a change. */
    variableValue?: number | string;
}
