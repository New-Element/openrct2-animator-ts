import Animation from "./animation";
import AnimationRun from "./animationRun";
import TriggerContext from "./trigger/triggerContext";

export default function createAnimationRun(i: number, animation: Animation, triggerContext: TriggerContext): AnimationRun {
    return new AnimationRun(i, animation, triggerContext);
}
