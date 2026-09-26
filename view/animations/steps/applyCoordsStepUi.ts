import {StepDesc} from "../../../model/animation/jsonTypes";
import {ApplyCoordsFields} from "./fields/applyCoordsFields";
import {VehicleTargetFields} from "./fields/vehicleTargetFields";
import {StepUiModule} from "./stepUiTypes";

function vehicleFrom(target: ReturnType<VehicleTargetFields["readTarget"]>) {
    return {
        useTriggerTarget: target.useTriggerTarget,
        rideId: target.rideId,
        trainIndex: target.trainIndex,
        carIndex: target.carIndex
    };
}

export function createSetCarCoordsStepUi(
    fields: ApplyCoordsFields,
    vehicleTarget: VehicleTargetFields
): StepUiModule {
    return {
        type: "setCarCoords",
        addLabel: "Set Car Coords",
        rowLabel: () => "Set Car Coords",
        createStub: () => ({type: "setCarCoords", useTriggerTarget: true, coordsOrigin: "hardcoded", x: 0, y: 0, z: 0}),
        load: (desc: StepDesc) => {
            if (desc.type !== "setCarCoords") {
                return;
            }
            fields.loadCar(desc);
            vehicleTarget.load(desc, true);
        },
        persist: (current: StepDesc) => {
            if (current.type !== "setCarCoords") {
                return null;
            }
            return {
                type: "setCarCoords",
                ...fields.readCoords(),
                ...vehicleFrom(vehicleTarget.readTarget())
            };
        }
    };
}

export function createSetStaffCoordsStepUi(fields: ApplyCoordsFields): StepUiModule {
    return {
        type: "setStaffCoords",
        addLabel: "Set Staff Coords",
        rowLabel: () => "Set Staff Coords",
        createStub: () => ({type: "setStaffCoords", useTriggerStaff: true, coordsOrigin: "hardcoded", x: 0, y: 0, z: 0}),
        load: (desc: StepDesc) => {
            if (desc.type === "setStaffCoords") {
                fields.loadStaff(desc, desc.useTriggerStaff !== false, desc.staffId);
            }
        },
        persist: (current: StepDesc) => {
            if (current.type !== "setStaffCoords") {
                return null;
            }
            const staff = fields.readStaff();
            return {
                type: "setStaffCoords",
                ...fields.readCoords(),
                useTriggerStaff: staff.useTrigger,
                staffId: staff.id
            };
        }
    };
}
