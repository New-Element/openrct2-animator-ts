import {AnimationTarget} from "./animationTarget";
import Animation from "./animation";
import AnimationRun from "./animationRun";

export default function createAnimationRun(i: number, animation: Animation, target: AnimationTarget): AnimationRun {
    return new AnimationRun(i, animation, target);
}