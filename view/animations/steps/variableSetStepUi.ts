import {StepDesc} from "../../../model/animation/jsonTypes";
import {VariableStepFields} from "./fields/variableStepFields";
import {StepUiModule} from "./stepUiTypes";

export function createVariableSetStepUi(fields: VariableStepFields): StepUiModule {
    return {
        type: "variableSet",
        addLabel: "Set Variable",
        rowLabel: () => "Set Variable",
        createStub: () => ({type: "variableSet", variableId: "", value: 0}),
        load: (desc: StepDesc) => {
            if (desc.type !== "variableSet") {
                return;
            }
            fields.loadSet(desc.variableId, desc.value);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "variableSet") {
                return null;
            }
            return {
                type: "variableSet",
                variableId: fields.selectedVariableId(),
                value: fields.readSetValue()
            };
        }
    };
}
