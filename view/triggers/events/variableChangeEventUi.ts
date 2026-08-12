import Trigger from "../../../model/animation/trigger/trigger";
import {EventUiModule} from "./eventUiTypes";
import {VariableChangeFields} from "./fields/variableChangeFields";

export function createVariableChangeEventUi(fields: VariableChangeFields): EventUiModule {
    return {
        kind: "variableChange",
        editorLabel: "On Variable Change",
        createStub: () => ({type: "variableChange", variableId: ""}),
        hide: () => fields.hide(),
        load: (trigger: Trigger) => fields.load(trigger),
        save: (trigger: Trigger) => fields.save(trigger),
        conditionVariableNames: (variableName?: string) => {
            if (variableName && variableName.trim()) {
                return [variableName.trim()];
            }
            return ["Variable Value"];
        }
    };
}
