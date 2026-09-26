import {error} from "../../../logger";
import {VariableSetStepDesc, VariableStoredValue} from "../../jsonTypes";
import {findVariableById} from "../../variableLookup";
import {mutateVariable} from "../../variableMutateLookup";
import InstantStep from "../instantStep";
import {logMetaFromRun} from "../stepHelpers";
import StepRunContext from "../stepRunContext";

export default class VariableSetStep extends InstantStep {
    variableId: string;
    value: VariableStoredValue;

    constructor(obj: VariableSetStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.value = obj.value;
    }

    protected apply(run: StepRunContext): void {
        const variable = findVariableById(this.variableId);
        if (!variable || variable.isFormula()) {
            error("step", "Set Variable: destination is missing or is a formula", undefined, logMetaFromRun(run));
            return;
        }
        mutateVariable(this.variableId, "set", this.value);
    }

    getDataToPersist(): object {
        return {
            type: "variableSet",
            variableId: this.variableId,
            value: this.value
        };
    }
}
