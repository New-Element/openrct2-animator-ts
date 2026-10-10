import {StepDesc} from "../../../model/animation/jsonTypes";
import {StartFireworksFields} from "./fields/startFireworksFields";
import {StepUiModule} from "./stepUiTypes";

export function createStartFireworksStepUi(fields: StartFireworksFields): StepUiModule {
    return {
        type: "startFireworks",
        addLabel: "Start Fireworks",
        rowLabel: () => "Start Fireworks",
        createStub: () => ({type: "startFireworks", showName: ""}),
        load: (desc: StepDesc) => {
            if (desc.type !== "startFireworks") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "startFireworks") {
                return null;
            }
            return fields.persist();
        }
    };
}
