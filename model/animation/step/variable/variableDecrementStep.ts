import {error} from "../../../logger";
import {NumberSourceOrigin, VariableDecrementStepDesc} from "../../jsonTypes";
import {findVariableById} from "../../variableLookup";
import {mutateVariable} from "../../variableMutateLookup";
import InstantStep from "../instantStep";
import {resolveNumberSource} from "../numberSource";
import {logMetaFromRun} from "../stepHelpers";
import StepRunContext from "../stepRunContext";

export default class VariableDecrementStep extends InstantStep {
    variableId: string;
    amount: number;
    amountOrigin?: NumberSourceOrigin;
    amountVariableId?: string;

    constructor(obj: VariableDecrementStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.amount = typeof obj.amount === "number" ? obj.amount : 1;
        this.amountOrigin = obj.amountOrigin;
        this.amountVariableId = obj.amountVariableId;
    }

    protected apply(run: StepRunContext): void {
        const variable = findVariableById(this.variableId);
        if (!variable || variable.isFormula()) {
            error("step", "Decrement Variable: destination is missing or is a formula", undefined, logMetaFromRun(run));
            return;
        }
        const amount = resolveNumberSource(
            this.amount,
            this.amountOrigin,
            this.amountVariableId,
            variable.valueType === "float" ? "float" : "int",
            "Decrement Variable",
            logMetaFromRun(run)
        );
        if (amount === null) {
            return;
        }
        mutateVariable(this.variableId, "decrement", amount);
    }

    getDataToPersist(): object {
        return {
            type: "variableDecrement",
            variableId: this.variableId,
            amount: this.amount,
            ...(this.amountOrigin === "variable" ? {amountOrigin: "variable", amountVariableId: this.amountVariableId || ""} : {})
        };
    }
}
