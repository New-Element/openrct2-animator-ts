/// <reference path="./../../../openrct2.d.ts" />

import {BranchStepDesc, BranchTarget, ConditionDesc} from "../jsonTypes";
import createCondition, {evaluateAll} from "../trigger/condition/createCondition";
import InstantStep from "./instantStep";
import StepRunContext from "./stepRunContext";

function normalizeTarget(value: BranchTarget | undefined): BranchTarget {
    if (value === "end") {
        return "end";
    }
    if (typeof value === "number" && value >= 0) {
        return Math.floor(value);
    }
    return "end";
}

function copyConditions(value: ConditionDesc[] | undefined): ConditionDesc[] {
    if (!value) {
        return [];
    }
    const out: ConditionDesc[] = [];
    for (let i = 0; i < value.length; i++) {
        out.push(value[i]);
    }
    return out;
}

export default class BranchStep extends InstantStep {
    conditions: ConditionDesc[];
    passTo: BranchTarget;
    failTo: BranchTarget;

    constructor(obj: BranchStepDesc) {
        super(obj);
        this.conditions = copyConditions(obj.conditions);
        this.passTo = normalizeTarget(obj.passTo);
        this.failTo = normalizeTarget(obj.failTo);
    }

    protected apply(run: StepRunContext): void {
        const built = [];
        for (let i = 0; i < this.conditions.length; i++) {
            built.push(createCondition(this.conditions[i]));
        }
        const passed = evaluateAll(built, run.triggerContext);
        run.state.jumpTo = passed ? this.passTo : this.failTo;
    }

    getDataToPersist(): object {
        const conditions = [];
        for (let i = 0; i < this.conditions.length; i++) {
            conditions.push(createCondition(this.conditions[i]).getDataToPersist());
        }
        return {
            type: "branch",
            conditions: conditions,
            passTo: this.passTo,
            failTo: this.failTo
        };
    }
}
