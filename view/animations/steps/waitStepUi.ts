import {StepDesc, WaitStepDesc} from "../../../model/animation/jsonTypes";
import {WaitFields} from "./fields/waitFields";
import {StepUiModule} from "./stepUiTypes";

export function createWaitStepUi(fields: WaitFields): StepUiModule {
    return {
        type: "wait",
        addLabel: "Wait",
        rowLabel: () => "Wait",
        createStub: () => ({type: "wait", ticks: 40}),
        load: (desc: StepDesc) => {
            if (desc.type !== "wait") {
                return;
            }
            fields.load(desc.ticks);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "wait") {
                return null;
            }
            return fields.persist() as WaitStepDesc;
        }
    };
}
