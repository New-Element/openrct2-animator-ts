import PersistentModel from "../data/persistentModel";
import {readFolderField, writeFolderField} from "../folders/folderPath";
import {error} from "../logger";
import {AnimationDesc, StepDesc} from "./jsonTypes";
import createStep from "./step/createStep";
import Step from "./step/step";

export default class Animation implements PersistentModel {

    id: string;
    name: string = "animation";
    folder: string = "";
    steps: Step[];
    ticksBetweenSteps: number = 0;

    constructor(obj: AnimationDesc) {
        this.id = obj.id;
        this.folder = readFolderField(obj);
        if (obj.name !== undefined) {
            this.name = obj.name;
        }
        if (typeof obj.ticksBetweenSteps === "number") {
            this.ticksBetweenSteps = Math.max(0, obj.ticksBetweenSteps | 0);
        }
        this.steps = [];

        if (Array.isArray(obj.steps)) {
            for (let i = 0; i < obj.steps.length; i++) {
                this.steps.push(createStep(obj.steps[i]));
            }
        } else if (obj.frames !== undefined) {
            error(
                "animation",
                `Animation "${this.id}" uses legacy frames; loaded with empty steps`
            );
        }
    }

    getDataToPersist(): object {
        const data: {
            id: string;
            name: string;
            steps: object[];
            ticksBetweenSteps?: number;
            folder?: string;
        } = {
            id: this.id,
            name: this.name,
            steps: this.getStepsDataToPersist()
        };
        if (this.ticksBetweenSteps > 0) {
            data.ticksBetweenSteps = this.ticksBetweenSteps;
        }
        writeFolderField(data, this.folder);
        return data;
    }

    getStepsDataToPersist(): object[] {
        const data: object[] = [];
        for (let i = 0; i < this.steps.length; i++) {
            data.push(this.steps[i].persistData());
        }
        return data;
    }

    /** Fresh step instances for a run (avoids shared mutable step state). */
    createRunSteps(): Step[] {
        const steps: Step[] = [];
        for (let i = 0; i < this.steps.length; i++) {
            steps.push(createStep(this.steps[i].persistData() as StepDesc));
        }
        return steps;
    }
}
