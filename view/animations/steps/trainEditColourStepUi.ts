import {StepDesc} from "../../../model/animation/jsonTypes";
import {unselectedVehicleColour} from "../../../model/animation/step/car/vehicleColour";
import {ColourFields} from "./fields/colourFields";
import {VehicleTargetFields} from "./fields/vehicleTargetFields";
import {StepUiModule} from "./stepUiTypes";

export function createTrainEditColourStepUi(
    colour: ColourFields,
    vehicleTarget: VehicleTargetFields
): StepUiModule {
    return {
        type: "trainEditColour",
        addLabel: "Recolour Train",
        rowLabel: () => "Recolour Train",
        createStub: () => ({
            type: "trainEditColour",
            value: unselectedVehicleColour(),
            useTriggerTarget: true
        }),
        load: (desc: StepDesc) => {
            if (desc.type !== "trainEditColour") {
                return;
            }
            colour.load(desc.value);
            vehicleTarget.load(desc, false);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "trainEditColour") {
                return null;
            }
            const target = vehicleTarget.readTarget();
            return {
                type: "trainEditColour",
                value: colour.readValue(),
                useTriggerTarget: target.useTriggerTarget,
                rideId: target.rideId,
                trainIndex: target.trainIndex
            };
        }
    };
}
