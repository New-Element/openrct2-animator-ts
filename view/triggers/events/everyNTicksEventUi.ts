import Trigger from "../../../model/animation/trigger/trigger";
import {EventUiModule} from "./eventUiTypes";
import {EveryNTicksFields} from "./fields/everyNTicksFields";

export function createEveryNTicksEventUi(fields: EveryNTicksFields): EventUiModule {
    return {
        kind: "everyNTicks",
        editorLabel: "Every N Ticks",
        createStub: () => ({type: "everyNTicks", ticks: 40}),
        hide: () => fields.hide(),
        load: (trigger: Trigger) => fields.load(trigger),
        save: (trigger: Trigger) => fields.save(trigger),
        conditionVariableNames: () => []
    };
}
