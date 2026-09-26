import Trigger from "../../../model/animation/trigger/trigger";
import {EventUiModule} from "./eventUiTypes";
import {RideTileFields} from "./fields/rideTileFields";

export function createCarEntersEventUi(fields: RideTileFields): EventUiModule {
    return {
        kind: "carEnters",
        editorLabel: "Car Enters",
        createStub: () => ({
            type: "carEnters",
            rideId: 0,
            tiles: [],
            direction: "either",
            checkEveryTicks: 1
        }),
        hide: () => fields.hide(),
        load: (trigger: Trigger) => fields.load(trigger),
        save: (trigger: Trigger) => fields.save(trigger),
        conditionVariableNames: () => ["Train Index", "Car Index"]
    };
}
