import PersistentModel from "../../data/persistentModel";
import {StepDescBase} from "../jsonTypes";
import StepRunContext from "./stepRunContext";

export default abstract class Step implements PersistentModel {
    type: string;
    name?: string;

    constructor(obj: StepDescBase) {
        this.type = obj.type;
        const n = typeof obj.name === "string" ? obj.name.trim() : "";
        if (n) {
            this.name = n;
        }
    }

    abstract onStart(run: StepRunContext): void;

    abstract onTick(run: StepRunContext): void;

    abstract isComplete(run: StepRunContext): boolean;

    abstract getDataToPersist(): object;

    persistData(): object {
        const data = {...(this.getDataToPersist() as {[key: string]: unknown})};
        if (this.name) {
            data.name = this.name;
        }
        return data;
    }
}
