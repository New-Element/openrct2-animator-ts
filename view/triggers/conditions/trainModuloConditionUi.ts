import {ConditionDesc} from "../../../model/animation/jsonTypes";
import {ConditionUiModule} from "./conditionUiTypes";
import {ModuloFields} from "./fields/moduloFields";

export function createTrainModuloConditionUi(fields: ModuloFields): ConditionUiModule {
    return {
        type: "trainModulo",
        addLabel: "Train Modulo",
        rowLabel: (desc: ConditionDesc) => {
            if (desc.type !== "trainModulo") {
                return "Train Modulo";
            }
            return `Train Modulo: ${desc.modulo}, Remainder ${desc.remainder}`;
        },
        createStub: () => ({type: "trainModulo", modulo: 2, remainder: 0}),
        hide: () => fields.hide(),
        load: (desc: ConditionDesc) => {
            if (desc.type !== "trainModulo") {
                return;
            }
            fields.load(desc.modulo, desc.remainder);
        },
        persist: (desc: ConditionDesc) => {
            if (desc.type !== "trainModulo") {
                return;
            }
            const values = fields.read();
            desc.modulo = values.modulo;
            desc.remainder = values.remainder;
        }
    };
}
