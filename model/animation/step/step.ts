import PersistentModel from "../../data/persistentModel";
import {StepDescBase} from "../jsonTypes";
import StepRunContext from "./stepRunContext";

export default abstract class Step implements PersistentModel {
    type: string;

    constructor(obj: StepDescBase) {
        this.type = obj.type;
    }

    abstract onStart(run: StepRunContext): void;

    abstract onTick(run: StepRunContext): void;

    abstract isComplete(run: StepRunContext): boolean;

    abstract getDataToPersist(): object;
}
