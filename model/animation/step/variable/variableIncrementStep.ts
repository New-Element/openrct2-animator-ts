import {VariableIncrementStepDesc} from "../../jsonTypes";
import {mutateVariable} from "../../variableMutateLookup";
import InstantStep from "../instantStep";
import StepRunContext from "../stepRunContext";

export default class VariableIncrementStep extends InstantStep {
    variableId: string;
    amount: number;

    constructor(obj: VariableIncrementStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.amount = typeof obj.amount === "number" ? obj.amount : 1;
    }

    protected apply(_run: StepRunContext): void {
        mutateVariable(this.variableId, "increment", this.amount);
    }

    getDataToPersist(): object {
        return {
            type: "variableIncrement",
            variableId: this.variableId,
            amount: this.amount
        };
    }
}
