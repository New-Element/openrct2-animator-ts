import Trigger from "../../../model/animation/trigger/trigger";
import {EventUiModule} from "./eventUiTypes";
import {VariableThresholdFields} from "./fields/variableThresholdFields";

export function createVariableThresholdEventUi(fields: VariableThresholdFields): EventUiModule {
    return {
        kind: "variableThreshold",
        editorLabel: "Variable Crosses Threshold",
        createStub: () => ({
            type: "variableThreshold",
            variableId: "",
            direction: "above",
            threshold: 0
        }),
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
