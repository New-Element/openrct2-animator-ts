import {CustomJavascriptStepDesc, StepDesc} from "../../../model/animation/jsonTypes";
import {CustomJavascriptFields} from "./fields/customJavascriptFields";
import {StepUiModule} from "./stepUiTypes";

export function createCustomJavascriptStepUi(fields: CustomJavascriptFields): StepUiModule {
    return {
        type: "customJavascript",
        addLabel: "Run Custom Javascript",
        rowLabel: () => "Run Custom Javascript",
        createStub: () => ({type: "customJavascript", code: ""}),
        load: (desc: StepDesc) => {
            if (desc.type !== "customJavascript") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "customJavascript") {
                return null;
            }
            return fields.persist() as CustomJavascriptStepDesc;
        }
    };
}
