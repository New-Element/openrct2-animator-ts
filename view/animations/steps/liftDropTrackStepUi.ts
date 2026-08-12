import {StepDesc} from "../../../model/animation/jsonTypes";
import {LiftDropTrackFields} from "./fields/liftDropTrackFields";
import {VehicleTargetFields} from "./fields/vehicleTargetFields";
import {StepUiModule} from "./stepUiTypes";

export function createLiftDropTrackStepUi(
    fields: LiftDropTrackFields,
    vehicleTarget: VehicleTargetFields
): StepUiModule {
    return {
        type: "liftDropTrack",
        addLabel: "Lift/Drop Track",
        rowLabel: () => "Lift/Drop Track",
        createStub: () => ({
            type: "liftDropTrack",
            startHeight: 0,
            endHeight: 16,
            speed: 100,
            reverseExitDirection: false,
            useTriggerTarget: true
        }),
        load: (desc: StepDesc) => {
            if (desc.type !== "liftDropTrack") {
                return;
            }
            fields.load(desc);
            vehicleTarget.load(desc, false);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "liftDropTrack") {
                return null;
            }
            const fieldsData = fields.readFields();
            const target = vehicleTarget.readTarget();
            return {
                type: "liftDropTrack",
                startHeight: fieldsData.startHeight,
                endHeight: fieldsData.endHeight,
                speed: fieldsData.speed,
                reverseExitDirection: fieldsData.reverseExitDirection,
                useTriggerTarget: target.useTriggerTarget,
                rideId: target.rideId,
                trainIndex: target.trainIndex
            };
        }
    };
}
