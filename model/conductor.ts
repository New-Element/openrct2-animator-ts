/// <reference path="./../openrct2.d.ts" />

import AnimationsArray from "./animation/animationsArray";
import AnimationRun from "./animation/animationRun";
import Animation from "./animation/animation";
import {AnimationTarget} from "./animation/animationTarget";
import createAnimationRun from "./animation/createAnimationRun";

export default class Conductor {
    animationsArray: AnimationsArray;
    tickCount: number = 0;
    animationRuns: AnimationRun[];
    animationRunI: number;
    paused: boolean;

    constructor() {
        this.animationsArray = new AnimationsArray();
        this.animationsArray.load(false);
        context.subscribe('interval.tick', this.tick.bind(this));
        this.animationRuns = [];
        this.animationRunI = 0;
        this.paused = false;
    }

    reset() {
        this.animationRuns = [];
        this.animationRunI = 0;
        this.tickCount = 0;
    }

    tick(): void {
        if (this.paused) {
            return;
        }
        this.tickCount += 1;
        if (this.tickCount === 1000) {
            this.tickCount = 0; // just prevent dealing with stupidly high numbers here
        }

        for (const animation in this.animationsArray.items) {
            this.maybeStartRun(this.animationsArray.items[animation]);
        }

        for (const run in this.animationRuns) {
            this.maybeIterateRun(this.animationRuns[run]);
        }
    }

    maybeStartRun(animation: Animation): void {
        let target = animation.getStartTarget();
        if (!target) {
            return;
        }

        if (!this.isRunningAnimationWithTarget(animation, <AnimationTarget>target)) {
            let animationRun = createAnimationRun(this.animationRunI, animation, <AnimationTarget>target);
            this.animationRuns.push(animationRun);
            this.animationRunI += 1;
        }
    }

    isRunningAnimationWithTarget(animation: Animation, target: AnimationTarget): boolean {
        let run: AnimationRun,
            i: number,
            ln = this.animationRuns.length;

        for (i = 0; i < ln; i += 1) {
            run = this.animationRuns[i];
            if (typeof(run) === 'undefined') {
                continue;
            }
            if (run.animation.id === animation.id && JSON.stringify(target) === JSON.stringify(run.target)) {
                return true;
            }
        }
        return false;
    }

    maybeIterateRun(animationRun: AnimationRun): void {

        if (typeof(animationRun) === 'undefined') {
            return;
        }


        if (this.tickCount % animationRun.animation.intervalTicks === 0) {
            animationRun.next();
        }
        if (!animationRun.state.running) {
            this.removeAnimationRun(animationRun);
        }
    }

    removeAnimationRun(animationRun: AnimationRun): void {
        let newRuns: AnimationRun[] = [];
        let i:number;
        let ln = this.animationRuns.length;
        let animationRunI:AnimationRun;

        for (i = 0; i < ln; i += 1) {
            animationRunI = this.animationRuns[i];
            if (animationRunI !== animationRun) {
                newRuns.push(animationRunI);
            }
        }

        this.animationRuns = newRuns;

    }
}