/// <reference path="./../../../openrct2.d.ts" />

import {error} from "../../logger";
import {StartFireworksStepDesc} from "../jsonTypes";
import InstantStep from "./instantStep";
import {logMetaFromRun} from "./stepHelpers";
import StepRunContext from "./stepRunContext";

const ACTION = "fireworks-start-show";

export default class StartFireworksStep extends InstantStep {
    showName: string;

    constructor(obj: StartFireworksStepDesc) {
        super(obj);
        this.showName = typeof obj.showName === "string" ? obj.showName.trim() : "";
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        if (!this.showName) {
            error("step", "Start Fireworks: show name is empty", undefined, meta);
            return;
        }
        try {
            context.executeAction(ACTION, {name: this.showName});
        } catch (e) {
            error("step", "Start Fireworks: could not start the show", e, meta);
        }
    }

    getDataToPersist(): object {
        const data: StartFireworksStepDesc = {
            type: "startFireworks",
            showName: this.showName
        };
        return data;
    }
}
