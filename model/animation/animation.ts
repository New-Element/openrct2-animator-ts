import PersistentModel from "../data/persistentModel";
import reportPluginError from "../reportPluginError";
import {AnimationDesc, StepDesc} from "./jsonTypes";
import createStep from "./step/createStep";
import Step from "./step/step";

export default class Animation implements PersistentModel {

    id: string;
    name: string = "animation";
    steps: Step[];

    constructor(obj: AnimationDesc) {
        this.id = obj.id;
        if (obj.name !== undefined) {
            this.name = obj.name;
        }
        this.steps = [];

        if (Array.isArray(obj.steps)) {
            for (let i = 0; i < obj.steps.length; i++) {
                this.steps.push(createStep(obj.steps[i]));
            }
        } else if (obj.frames !== undefined) {
            reportPluginError(
                "animation",
                `Animation "${this.id}" uses legacy frames; loaded with empty steps`
            );
        }
    }

    getDataToPersist(): object {
        return {
            id: this.id,
            name: this.name,
            steps: this.getStepsDataToPersist()
        };
    }

    getStepsDataToPersist(): object[] {
        const data: object[] = [];
        for (let i = 0; i < this.steps.length; i++) {
            data.push(this.steps[i].getDataToPersist());
        }
        return data;
    }

    /** Fresh step instances for a run (avoids shared mutable step state). */
    createRunSteps(): Step[] {
        const steps: Step[] = [];
        for (let i = 0; i < this.steps.length; i++) {
            steps.push(createStep(this.steps[i].getDataToPersist() as StepDesc));
        }
        return steps;
    }
}
