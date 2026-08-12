import Trigger from "../../../model/animation/trigger/trigger";
import {EventUiModule} from "./eventUiTypes";
import {RideTileFields} from "./fields/rideTileFields";

export function createTrainEntersEventUi(fields: RideTileFields): EventUiModule {
    return {
        kind: "trainEnters",
        editorLabel: "Train Enters",
        createStub: () => ({
            type: "trainEnters",
            rideId: 0,
            tile: {x: 0, y: 0}
        }),
        hide: () => fields.hide(),
        load: (trigger: Trigger) => fields.load(trigger),
        save: (trigger: Trigger) => fields.save(trigger),
        conditionVariableNames: () => ["Train Index"]
    };
}
