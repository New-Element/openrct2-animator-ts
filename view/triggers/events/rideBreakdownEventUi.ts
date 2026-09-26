import Trigger from "../../../model/animation/trigger/trigger";
import {EventUiModule} from "./eventUiTypes";
import {OptionalRideFields} from "./fields/optionalRideFields";

export function createRideBreakdownEventUi(fields: OptionalRideFields): EventUiModule {
    return {
        kind: "rideBreakdown",
        editorLabel: "Ride Breaks Down",
        createStub: () => ({type: "rideBreakdown"}),
        hide: () => fields.hide(),
        load: (trigger: Trigger) => fields.load(trigger),
        save: (trigger: Trigger) => fields.save(trigger),
        conditionVariableNames: () => []
    };
}
