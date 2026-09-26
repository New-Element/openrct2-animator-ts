import {error} from "../../../logger";
import {VariableRandomIntStepDesc} from "../../jsonTypes";
import {findVariableById} from "../../variableLookup";
import {mutateVariable} from "../../variableMutateLookup";
import InstantStep from "../instantStep";
import {logMetaFromRun} from "../stepHelpers";
import StepRunContext from "../stepRunContext";

function finiteInt(value: number, fallback: number): number {
    if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
        return fallback;
    }
    return Math.floor(value);
}

/** Inclusive. The lower end is the smaller of the two bounds. */
function randomIntInclusive(min: number, max: number): number {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export default class VariableRandomIntStep extends InstantStep {
    variableId: string;
    min: number;
    max: number;

    constructor(obj: VariableRandomIntStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.min = finiteInt(obj.min, 1);
        this.max = finiteInt(obj.max, 10);
    }

    protected apply(run: StepRunContext): void {
        const variable = findVariableById(this.variableId);
        if (!variable || variable.isFormula() || variable.valueType !== "int") {
            error(
                "step",
                "Random Integer: destination is missing, is a formula, or is not an int",
                undefined,
                logMetaFromRun(run)
            );
            return;
        }
        mutateVariable(this.variableId, "set", randomIntInclusive(this.min, this.max));
    }

    getDataToPersist(): object {
        return {
            type: "variableRandomInt",
            variableId: this.variableId,
            min: this.min,
            max: this.max
        };
    }
}
