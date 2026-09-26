import {StepDesc} from "../../../model/animation/jsonTypes";
import {CoordsFields} from "./fields/coordsFields";
import {VehicleTargetFields} from "./fields/vehicleTargetFields";
import {StepUiModule} from "./stepUiTypes";

export function createCarCoordsOverTimeStepUi(
    fields: CoordsFields,
    vehicleTarget: VehicleTargetFields
): StepUiModule {
    return {
        type: "carCoordsOverTime",
        addLabel: "Car Coords Over Time",
        rowLabel: () => "Car Coords Over Time",
        createStub: () => ({
            type: "carCoordsOverTime",
            deltaZ: -16,
            durationTicks: 40,
            useTriggerTarget: true
        }),
        load: (desc: StepDesc) => {
            if (desc.type !== "carCoordsOverTime") {
                return;
            }
            fields.load(desc);
            vehicleTarget.load(desc, true);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "carCoordsOverTime") {
                return null;
            }
            const coords = fields.readCoords();
            const target = vehicleTarget.readTarget();
            return {
                type: "carCoordsOverTime",
                ...coords,
                useTriggerTarget: target.useTriggerTarget,
                rideId: target.rideId,
                trainIndex: target.trainIndex,
                carIndex: target.carIndex
            };
        }
    };
}
