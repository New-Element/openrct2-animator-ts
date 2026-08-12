import {ConditionDesc} from "../../../model/animation/jsonTypes";
import {ConditionUiModule} from "./conditionUiTypes";
import {EqualsFields} from "./fields/equalsFields";

export function createCarEqualsConditionUi(fields: EqualsFields): ConditionUiModule {
    return {
        type: "carEquals",
        addLabel: "Car Equals",
        rowLabel: (desc: ConditionDesc) => {
            if (desc.type !== "carEquals") {
                return "Car Equals";
            }
            return `Car Equals: ${desc.value}`;
        },
        createStub: () => ({type: "carEquals", value: 0}),
        hide: () => fields.hide(),
        load: (desc: ConditionDesc) => {
            if (desc.type !== "carEquals") {
                return;
            }
            fields.load(desc.value);
        },
        persist: (desc: ConditionDesc) => {
            if (desc.type !== "carEquals") {
                return;
            }
            desc.value = fields.read();
        }
    };
}
