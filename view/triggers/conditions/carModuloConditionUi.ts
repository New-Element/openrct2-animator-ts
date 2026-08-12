import {ConditionDesc} from "../../../model/animation/jsonTypes";
import {ConditionUiModule} from "./conditionUiTypes";
import {ModuloFields} from "./fields/moduloFields";

export function createCarModuloConditionUi(fields: ModuloFields): ConditionUiModule {
    return {
        type: "carModulo",
        addLabel: "Car Modulo",
        rowLabel: (desc: ConditionDesc) => {
            if (desc.type !== "carModulo") {
                return "Car Modulo";
            }
            return `Car Modulo: ${desc.modulo}, Remainder ${desc.remainder}`;
        },
        createStub: () => ({type: "carModulo", modulo: 2, remainder: 0}),
        hide: () => fields.hide(),
        load: (desc: ConditionDesc) => {
            if (desc.type !== "carModulo") {
                return;
            }
            fields.load(desc.modulo, desc.remainder);
        },
        persist: (desc: ConditionDesc) => {
            if (desc.type !== "carModulo") {
                return;
            }
            const values = fields.read();
            desc.modulo = values.modulo;
            desc.remainder = values.remainder;
        }
    };
}
