import {StepDesc} from "../../../model/animation/jsonTypes";
import {VariableStepFields} from "./fields/variableStepFields";
import {StepUiModule} from "./stepUiTypes";

export function createVariableIncrementStepUi(fields: VariableStepFields): StepUiModule {
    return {
        type: "variableIncrement",
        addLabel: "Increment Variable",
        rowLabel: () => "Increment Variable",
        createStub: () => ({type: "variableIncrement", variableId: "", amount: 1}),
        load: (desc: StepDesc) => {
            if (desc.type !== "variableIncrement") {
                return;
            }
            fields.loadAmount(desc.variableId, desc.amount, desc.amountOrigin, desc.amountVariableId);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "variableIncrement") {
                return null;
            }
            const amount = fields.readAmountSource();
            return {
                type: "variableIncrement",
                variableId: fields.selectedVariableId(),
                amount: amount.value,
                ...(amount.origin === "variable" ? {amountOrigin: "variable", amountVariableId: amount.variableId || ""} : {})
            };
        }
    };
}
