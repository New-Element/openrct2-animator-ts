import {VariableDecrementStepDesc} from "../../jsonTypes";
import {mutateVariable} from "../../variableMutateLookup";
import InstantStep from "../instantStep";
import StepRunContext from "../stepRunContext";

export default class VariableDecrementStep extends InstantStep {
    variableId: string;
    amount: number;

    constructor(obj: VariableDecrementStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.amount = typeof obj.amount === "number" ? obj.amount : 1;
    }

    protected apply(_run: StepRunContext): void {
        mutateVariable(this.variableId, "decrement", this.amount);
    }

    getDataToPersist(): object {
        return {
            type: "variableDecrement",
            variableId: this.variableId,
            amount: this.amount
        };
    }
}
