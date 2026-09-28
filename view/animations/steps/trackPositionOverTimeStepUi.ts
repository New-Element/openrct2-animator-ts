import {StepDesc} from "../../../model/animation/jsonTypes";
import {TrackPositionOverTimeFields} from "./fields/trackPositionOverTimeFields";
import {VehicleTargetFields} from "./fields/vehicleTargetFields";
import {StepUiModule} from "./stepUiTypes";

export function createTrackPositionOverTimeStepUi(
    fields: TrackPositionOverTimeFields,
    vehicleTarget: VehicleTargetFields
): StepUiModule {
    return {
        type: "trackPositionOverTime",
        addLabel: "Track Position Over Time",
        rowLabel: () => "Track Position Over Time",
        createStub: () => ({
            type: "trackPositionOverTime",
            position: 32,
            spacing: 0,
            durationTicks: 40,
            useTriggerTarget: true
        }),
        load: (desc: StepDesc) => {
            if (desc.type !== "trackPositionOverTime") {
                return;
            }
            fields.load(desc);
            vehicleTarget.load(desc, false);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "trackPositionOverTime") {
                return null;
            }
            const move = fields.read();
            const target = vehicleTarget.readTarget();
            return {
                type: "trackPositionOverTime",
                ...move,
                useTriggerTarget: target.useTriggerTarget,
                rideId: target.rideId,
                trainIndex: target.trainIndex
            };
        }
    };
}
