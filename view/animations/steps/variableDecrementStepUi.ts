import {StepDesc} from "../../../model/animation/jsonTypes";
import {VariableStepFields} from "./fields/variableStepFields";
import {StepUiModule} from "./stepUiTypes";

export function createVariableDecrementStepUi(fields: VariableStepFields): StepUiModule {
    return {
        type: "variableDecrement",
        addLabel: "Decrement Variable",
        rowLabel: () => "Decrement Variable",
        createStub: () => ({type: "variableDecrement", variableId: "", amount: 1}),
        load: (desc: StepDesc) => {
            if (desc.type !== "variableDecrement") {
                return;
            }
            fields.loadAmount(desc.variableId, desc.amount, desc.amountOrigin, desc.amountVariableId);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "variableDecrement") {
                return null;
            }
            const amount = fields.readAmountSource();
            return {
                type: "variableDecrement",
                variableId: fields.selectedVariableId(),
                amount: amount.value,
                ...(amount.origin === "variable" ? {amountOrigin: "variable", amountVariableId: amount.variableId || ""} : {})
            };
        }
    };
}
