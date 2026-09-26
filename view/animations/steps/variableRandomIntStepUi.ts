import {StepDesc} from "../../../model/animation/jsonTypes";
import {VariableRandomIntFields} from "./fields/variableRandomIntFields";
import {StepUiModule} from "./stepUiTypes";

export function createVariableRandomIntStepUi(fields: VariableRandomIntFields): StepUiModule {
    return {
        type: "variableRandomInt",
        addLabel: "Random Integer",
        rowLabel: () => "Random Integer",
        createStub: () => ({type: "variableRandomInt", variableId: "", min: 1, max: 10}),
        load: (desc: StepDesc) => {
            if (desc.type !== "variableRandomInt") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "variableRandomInt") {
                return null;
            }
            return fields.persist();
        }
    };
}
