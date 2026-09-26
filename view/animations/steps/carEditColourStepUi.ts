import {StepDesc} from "../../../model/animation/jsonTypes";
import {unselectedVehicleColour} from "../../../model/animation/step/car/vehicleColour";
import {ColourFields} from "./fields/colourFields";
import {VehicleTargetFields} from "./fields/vehicleTargetFields";
import {StepUiModule} from "./stepUiTypes";

export function createCarEditColourStepUi(
    colour: ColourFields,
    vehicleTarget: VehicleTargetFields
): StepUiModule {
    return {
        type: "carEditColour",
        addLabel: "Recolour Car",
        rowLabel: () => "Recolour Car",
        createStub: () => ({
            type: "carEditColour",
            value: unselectedVehicleColour(),
            useTriggerTarget: true
        }),
        load: (desc: StepDesc) => {
            if (desc.type !== "carEditColour") {
                return;
            }
            colour.load(desc);
            vehicleTarget.load(desc, true);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "carEditColour") {
                return null;
            }
            const target = vehicleTarget.readTarget();
            return {
                type: "carEditColour",
                ...colour.read(),
                useTriggerTarget: target.useTriggerTarget,
                rideId: target.rideId,
                trainIndex: target.trainIndex,
                carIndex: target.carIndex
            };
        }
    };
}
