import {VariableSetStepDesc} from "../../jsonTypes";
import {mutateVariable} from "../../variableMutateLookup";
import InstantStep from "../instantStep";
import StepRunContext from "../stepRunContext";

export default class VariableSetStep extends InstantStep {
    variableId: string;
    value: number | string;

    constructor(obj: VariableSetStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.value = obj.value;
    }

    protected apply(_run: StepRunContext): void {
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
