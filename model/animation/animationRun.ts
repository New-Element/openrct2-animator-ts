import Animation from "./animation";
import {AnimationTarget} from "./animationTarget";
import AnimationState from "./animationState";
import Frame from "./frame/frame";

export default class AnimationRun {
    animation: Animation;
    target: AnimationTarget;
    state: AnimationState;
    i: number;

    constructor(i: number, animation: Animation, target: AnimationTarget) {
        this.i = i;
        this.animation = animation;
        this.target = target;
        // initialize the state to a default
        this.state = {
            index: -1,
            running: true,
            paused: false,
            hasRun: false
        };
    }

    next(): void {
        this.state.index += 1;
        let i:number, ln = this.animation.frames.length, frame: Frame;
        for (i = 0; i < ln; i += 1) {
            frame = this.animation.frames[i];
            if (frame.shouldPlayOnIndex(this.state.index)) {
                frame.play(this.target);
            }
        }
        if (this.state.index >= this.animation.length && this.animation.length >= 0) {
            this.state.running = false;
        }
    }
}