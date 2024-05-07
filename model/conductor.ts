/// <reference path="./../openrct2.d.ts" />

import _ from "lodash";
import AnimationsArray from "./animation/animationsArray";

export default class Conductor {
    animationsArray: AnimationsArray;
    tickCount: number = 0;

    constructor() {
        this.animationsArray = new AnimationsArray();
        this.animationsArray.load();
        context.subscribe('interval.tick', this.tick.bind(this));
    }

    tick() {
        this.tickCount += 1;
        if (this.tickCount === 1000) {
            this.tickCount = 0; // just prevent dealing with stupidly high numbers here
        }
        this.animationsArray.items.forEach(this.tickAnimation.bind(this));
    }

    tickAnimation(animation) {
        if (animation.hasRun && animation.startType === 'once' && !animation.running) {
            return;
        }
        if (!animation.running) {
            this.maybeStartAnimation(animation);
        }
        if (animation.running) {
            if (this.tickCount % animation.frameIntervalTicks === 0) {
                animation.nextFrame();
            }
        }
    }

    maybeStartAnimation(animation) {
        if (animation.running) {
            return; // can't start an animation that's already running!
        }
        if (animation.trigger.test()) {
            animation.start();
        }
    }

    /*getAnimation(id) {
        let animation = false;
        _.each(this.animations, (animationI) => {
            if (animationI.id === id) {
                animation = animationI;
                return false;
            }
        });
        return animation;
    }*/
}