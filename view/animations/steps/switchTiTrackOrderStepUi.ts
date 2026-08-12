import {StepDesc} from "../../../model/animation/jsonTypes";
import {SwitchTiTrackOrderFields} from "./fields/switchTiTrackOrderFields";
import {StepUiModule} from "./stepUiTypes";

export function createSwitchTiTrackOrderStepUi(fields: SwitchTiTrackOrderFields): StepUiModule {
    return {
        type: "switchTiTrackOrder",
        addLabel: "Switch TI Track Order",
        rowLabel: () => "Switch TI Track Order",
        createStub: () => ({
            type: "switchTiTrackOrder",
            tile: {x: 0, y: 0},
            rideId: 0
        }),
        load: (desc: StepDesc) => {
            if (desc.type !== "switchTiTrackOrder") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "switchTiTrackOrder") {
                return null;
            }
            return fields.persist();
        }
    };
}
