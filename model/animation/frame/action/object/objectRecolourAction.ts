/// <reference path="./../../../../../openrct2.d.ts" />

import {Colour} from "openrct2-flexui";
import ObjectAction from "./objectAction";

type colourArg = number | false;
type RandomizeArgs = {
    factor: number,
    maxFactor: number,
    viewport: {
        centerMul: number,
        maxDistance: number,
        outsideMul: number,
        excludedMul: number,
        heightAdjust: boolean,
        zoomMultiply: boolean
    }
} | false;

export default class ObjectRecolourAction extends ObjectAction {

    primaryColour: colourArg;
    secondaryColour: colourArg;
    tertiaryColour: colourArg;
    randomize: RandomizeArgs;
    setHiddenIfInvisible: false;


    getDataToPersist(): object {
        return {
            type: this.type,
            primaryColour: this.primaryColour,
            secondaryColour: this.secondaryColour,
            tertiaryColour: this.tertiaryColour,
            tiles: this.tiles,
            object: this.object,
            randomize: this.randomize,
            setHiddenIfInvisible: this.setHiddenIfInvisible
        };
    }

    getRandomizeFactor(element, tile): number {

        if (typeof(this.randomize) === 'undefined' || this.randomize === false) {
            return 0; // don't randomize - so always do it
        }

        let factor = this.randomize.factor,
            x = tile.x,
            y = tile.y,
            heightDiff,
            rotation,
            maxDistance = this.randomize.viewport.maxDistance,
            excludedMul = this.randomize.viewport.excludedMul,
            centerMul = this.randomize.viewport.centerMul,
            outsideMul = this.randomize.viewport.outsideMul,
            mathZoom = this.applyState.viewport.zoom + 3;

        if (this.randomize.viewport.heightAdjust) {
            rotation = this.applyState.viewport.rotation;
            heightDiff = element.baseHeight / 4;
            x = (rotation === 1 || rotation === 2) ? (x + heightDiff) : (x - heightDiff);
            y = (rotation >= 2) ? (y + heightDiff) : (y - heightDiff);
        }

        if (this.randomize.viewport.zoomMultiply) {
            maxDistance *= mathZoom;
            excludedMul *= mathZoom;
            centerMul *= mathZoom;
            outsideMul *= mathZoom;
        }

        // good bit of gcse maths here
        let distance =
            Math.pow(
                Math.pow(Math.abs(x - this.applyState.viewport.center.x), 2) +
                Math.pow(Math.abs(y - this.applyState.viewport.center.y), 2),
                0.5);

        if (distance > maxDistance) {
            factor *= excludedMul;
        } else {
            factor *=
                ((1 - (distance/maxDistance)) * centerMul) +
                ((distance/maxDistance) * outsideMul);
        }

        return Math.ceil(factor);
    }

    passesRandomize(factor): boolean {
        if (factor === 0) {
            return true; // don't randomize - so always do it
        }
        return context.getRandom(0, factor) === 1;
    }

    applyToElement(element, tile): void {

        if (this.primaryColour === element.primaryColour &&
            this.secondaryColour === element.secondaryColour &&
            this.tertiaryColour === element.tertiaryColour) {
            return;
        }

        let factor = this.getRandomizeFactor(element, tile);

        if (!(typeof(this.randomize) === 'undefined' || this.randomize === false) && factor > this.randomize.maxFactor) {
            return; // so unlikely, let's not bother with the work
        }

        if (this.primaryColour !== false && element.primaryColour !== this.primaryColour && this.passesRandomize(factor)) {
            element.primaryColour = this.primaryColour;
        }
        if (this.secondaryColour !== false && element.secondaryColour !== this.secondaryColour && this.passesRandomize(factor)) {
            element.secondaryColour = this.secondaryColour;
        }
        if (this.tertiaryColour !== false && element.tertiaryColour !== this.tertiaryColour && this.passesRandomize(factor)) {
            element.tertiaryColour = this.tertiaryColour;
        }
        if (this.setHiddenIfInvisible) {
            if (element.primaryColour === Colour.Invisible &&
                element.secondaryColour === Colour.Invisible &&
                element.tertiaryColour === Colour.Invisible) {
                element.isHidden = true;
            }
        }
    }

}