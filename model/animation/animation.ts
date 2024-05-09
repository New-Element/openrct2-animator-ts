import Trigger from "./trigger/trigger";
import PersistentModel from "../data/persistentModel";
import Frame from "./frame/frame";
import createTrigger from "./trigger/createTrigger";
import {AnimationTarget} from "./animationTarget";

export default class Animation implements PersistentModel {

    id: string;
    name: string = 'animation';
    intervalTicks: number = 1;
    length: number = 0;
    repeats: Boolean|number = false;

    trigger: Trigger;

    frames: Frame[];

    constructor(obj: object) {
        let key:string;
        // let's apply them all, except for the trigger where we need to make an instance of that.
        for (key in obj) {
            if (key === 'trigger') {
                this.setTrigger(obj[key]);
            } else if (key === 'frames') {
                this.setFrames(obj[key]);
            } else {
                this[key] = obj[key];
            }
        }
    }

    setTrigger(data): void {
        this.trigger = createTrigger(data);
    }

    setFrames(data): void {
        this.frames = [];
        for (const item of data) {
            this.frames.push(new Frame(item));
        }
    }

    getDataToPersist(): object {
        return {
            id: this.id,
            name: this.name,
            frameIntervalTicks: this.intervalTicks,
            length: this.length,
            trigger: this.trigger.getDataToPersist(),
            frames: this.getFramesDataToPersist()
        }
    }

    getFramesDataToPersist(): object[] {
        let data = [];
        for (const frame of this.frames) {
            data.push(frame.getDataToPersist());
        }
        return data;
    }

    getStartTarget(): false|AnimationTarget {
        return this.trigger.test();
    }
};