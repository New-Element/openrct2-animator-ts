import {StepDesc} from "../../../model/animation/jsonTypes";
import {VehicleTargetFields} from "./fields/vehicleTargetFields";
import {WriteMapValueFields} from "./fields/writeMapValueFields";
import {StepUiModule} from "./stepUiTypes";

function vehicleFrom(target: ReturnType<VehicleTargetFields["readTarget"]>) {
    return {
        useTriggerTarget: target.useTriggerTarget,
        rideId: target.rideId,
        trainIndex: target.trainIndex,
        carIndex: target.carIndex
    };
}

export function createWriteTriggerTileStepUi(fields: WriteMapValueFields): StepUiModule {
    return {
        type: "writeTriggerTile",
        addLabel: "Write Trigger Tile",
        rowLabel: () => "Write Trigger Tile",
        createStub: () => ({type: "writeTriggerTile", variableId: ""}),
        load: (desc: StepDesc) => {
            if (desc.type === "writeTriggerTile") {
                fields.loadTileDestination(desc.variableId);
            }
        },
        persist: (current: StepDesc) => {
            if (current.type !== "writeTriggerTile") {
                return null;
            }
            return {type: "writeTriggerTile", variableId: fields.tileVariableId()};
        }
    };
}

export function createWriteCarCoordsStepUi(
    fields: WriteMapValueFields,
    vehicleTarget: VehicleTargetFields
): StepUiModule {
    return {
        type: "writeCarCoords",
        addLabel: "Write Car Coords",
        rowLabel: () => "Write Car Coords",
        createStub: () => ({type: "writeCarCoords", variableId: "", useTriggerTarget: true}),
        load: (desc: StepDesc) => {
            if (desc.type !== "writeCarCoords") {
                return;
            }
            fields.hide();
            fields.loadCoordsDestination(desc.variableId);
            vehicleTarget.load(desc, true);
        },
        persist: (current: StepDesc) => {
            if (current.type !== "writeCarCoords") {
                return null;
            }
            return {
                type: "writeCarCoords",
                variableId: fields.coordsVariableId(),
                ...vehicleFrom(vehicleTarget.readTarget())
            };
        }
    };
}

export function createWriteGuestCoordsStepUi(fields: WriteMapValueFields): StepUiModule {
    return {
        type: "writeGuestCoords",
        addLabel: "Write Guest Coords",
        rowLabel: () => "Write Guest Coords",
        createStub: () => ({type: "writeGuestCoords", variableId: "", useTriggerGuest: true}),
        load: (desc: StepDesc) => {
            if (desc.type === "writeGuestCoords") {
                fields.loadGuest(desc.variableId, desc.useTriggerGuest !== false, desc.guestId);
            }
        },
        persist: (current: StepDesc) => {
            if (current.type !== "writeGuestCoords") {
                return null;
            }
            const guest = fields.readGuest();
            return {
                type: "writeGuestCoords",
                variableId: fields.coordsVariableId(),
                useTriggerGuest: guest.useTrigger,
                guestId: guest.id
            };
        }
    };
}

export function createWriteStaffCoordsStepUi(fields: WriteMapValueFields): StepUiModule {
    return {
        type: "writeStaffCoords",
        addLabel: "Write Staff Coords",
        rowLabel: () => "Write Staff Coords",
        createStub: () => ({type: "writeStaffCoords", variableId: "", useTriggerStaff: true}),
        load: (desc: StepDesc) => {
            if (desc.type === "writeStaffCoords") {
                fields.loadStaff(desc.variableId, desc.useTriggerStaff !== false, desc.staffId);
            }
        },
        persist: (current: StepDesc) => {
            if (current.type !== "writeStaffCoords") {
                return null;
            }
            const staff = fields.readStaff();
            return {
                type: "writeStaffCoords",
                variableId: fields.coordsVariableId(),
                useTriggerStaff: staff.useTrigger,
                staffId: staff.id
            };
        }
    };
}

export function createWriteCameraRotationStepUi(fields: WriteMapValueFields): StepUiModule {
    return {
        type: "writeCameraRotation",
        addLabel: "Write Camera Rotation",
        rowLabel: () => "Write Camera Rotation",
        createStub: () => ({type: "writeCameraRotation", variableId: ""}),
        load: (desc: StepDesc) => {
            if (desc.type === "writeCameraRotation") {
                fields.hide();
                fields.loadDirectionDestination(desc.variableId);
            }
        },
        persist: (current: StepDesc) => {
            if (current.type !== "writeCameraRotation") {
                return null;
            }
            return {type: "writeCameraRotation", variableId: fields.directionVariableId()};
        }
    };
}

export function createWriteGuestDirectionStepUi(fields: WriteMapValueFields): StepUiModule {
    return {
        type: "writeGuestDirection",
        addLabel: "Write Guest Direction",
        rowLabel: () => "Write Guest Direction",
        createStub: () => ({type: "writeGuestDirection", variableId: "", useTriggerGuest: true}),
        load: (desc: StepDesc) => {
            if (desc.type === "writeGuestDirection") {
                fields.loadGuestDirection(desc.variableId, desc.useTriggerGuest !== false, desc.guestId);
            }
        },
        persist: (current: StepDesc) => {
            if (current.type !== "writeGuestDirection") {
                return null;
            }
            const guest = fields.readGuest();
            return {
                type: "writeGuestDirection",
                variableId: fields.directionVariableId(),
                useTriggerGuest: guest.useTrigger,
                guestId: guest.id
            };
        }
    };
}

export function createWriteStaffDirectionStepUi(fields: WriteMapValueFields): StepUiModule {
    return {
        type: "writeStaffDirection",
        addLabel: "Write Staff Direction",
        rowLabel: () => "Write Staff Direction",
        createStub: () => ({type: "writeStaffDirection", variableId: "", useTriggerStaff: true}),
        load: (desc: StepDesc) => {
            if (desc.type === "writeStaffDirection") {
                fields.loadStaffDirection(desc.variableId, desc.useTriggerStaff !== false, desc.staffId);
            }
        },
        persist: (current: StepDesc) => {
            if (current.type !== "writeStaffDirection") {
                return null;
            }
            const staff = fields.readStaff();
            return {
                type: "writeStaffDirection",
                variableId: fields.directionVariableId(),
                useTriggerStaff: staff.useTrigger,
                staffId: staff.id
            };
        }
    };
}

export function createWriteCarTrackDirectionStepUi(
    fields: WriteMapValueFields,
    vehicleTarget: VehicleTargetFields
): StepUiModule {
    return {
        type: "writeCarTrackDirection",
        addLabel: "Write Car Track Direction",
        rowLabel: () => "Write Car Track Direction",
        createStub: () => ({type: "writeCarTrackDirection", variableId: "", useTriggerTarget: true}),
        load: (desc: StepDesc) => {
            if (desc.type !== "writeCarTrackDirection") {
                return;
            }
            fields.hide();
            fields.loadDirectionDestination(desc.variableId);
            vehicleTarget.load(desc, true);
        },
        persist: (current: StepDesc) => {
            if (current.type !== "writeCarTrackDirection") {
                return null;
            }
            return {
                type: "writeCarTrackDirection",
                variableId: fields.directionVariableId(),
                ...vehicleFrom(vehicleTarget.readTarget())
            };
        }
    };
}
