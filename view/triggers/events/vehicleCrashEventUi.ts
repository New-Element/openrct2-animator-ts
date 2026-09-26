import Trigger from "../../../model/animation/trigger/trigger";
import {EventUiModule} from "./eventUiTypes";
import {OptionalRideFields} from "./fields/optionalRideFields";

export function createVehicleCrashEventUi(fields: OptionalRideFields): EventUiModule {
    return {
        kind: "vehicleCrash",
        editorLabel: "Vehicle Crashes",
        createStub: () => ({type: "vehicleCrash"}),
        hide: () => fields.hide(),
        load: (trigger: Trigger) => fields.load(trigger),
        save: (trigger: Trigger) => fields.save(trigger),
        conditionVariableNames: () => []
    };
}
