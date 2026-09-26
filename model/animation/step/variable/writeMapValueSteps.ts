/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";
import {
    VariableStoredValue,
    VariableValueType,
    WriteCameraRotationStepDesc,
    WriteCarCoordsStepDesc,
    WriteCarTrackDirectionStepDesc,
    WriteGuestCoordsStepDesc,
    WriteGuestDirectionStepDesc,
    WriteStaffCoordsStepDesc,
    WriteStaffDirectionStepDesc,
    WriteTriggerTileStepDesc
} from "../../jsonTypes";
import {contextTiles} from "../../trigger/contextLists";
import {findVariableById} from "../../variableLookup";
import {mutateVariable} from "../../variableMutateLookup";
import {persistVehicleTargetFields, resolveTargetHeadCars} from "../car/vehicleTarget";
import InstantStep from "../instantStep";
import {logMetaFromRun, persistGuestTarget, persistStaffTarget, resolveStepGuests, resolveStepStaffMembers} from "../stepHelpers";
import StepRunContext from "../stepRunContext";

function writeStoredValue(
    variableId: string,
    valueType: VariableValueType,
    value: VariableStoredValue,
    label: string,
    meta: {animationId?: string; triggerId?: string}
): void {
    if (!variableId) {
        return;
    }
    const variable = findVariableById(variableId);
    if (!variable || variable.isFormula() || variable.valueType !== valueType) {
        error("step", `${label}: destination variable is missing`, undefined, meta);
        return;
    }
    mutateVariable(variableId, "set", value);
}

export class WriteTriggerTileStep extends InstantStep {
    variableId: string;

    constructor(obj: WriteTriggerTileStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const tiles = contextTiles(run.triggerContext);
        if (tiles.length === 0) {
            error(
                "step",
                "Write Trigger Tile: relative tile needs a trigger that fired on a tile",
                undefined,
                meta
            );
            return;
        }
        writeStoredValue(this.variableId, "tile", {x: tiles[0].x, y: tiles[0].y}, "Write Trigger Tile", meta);
    }

    getDataToPersist(): object {
        return {
            type: "writeTriggerTile",
            variableId: this.variableId
        };
    }
}

export class WriteCarCoordsStep extends InstantStep {
    variableId: string;
    useTriggerTarget?: boolean;
    rideId?: number;
    trainIndex?: number;
    carIndex?: number;

    constructor(obj: WriteCarCoordsStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.useTriggerTarget = obj.useTriggerTarget;
        this.rideId = obj.rideId;
        this.trainIndex = obj.trainIndex;
        this.carIndex = obj.carIndex;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const cars = resolveTargetHeadCars(run, this);
        if (cars.length === 0) {
            error("step", "Write Car Coords: no car", undefined, meta);
            return;
        }
        writeStoredValue(
            this.variableId,
            "coords",
            {x: cars[0].x, y: cars[0].y, z: cars[0].z},
            "Write Car Coords",
            meta
        );
    }

    getDataToPersist(): object {
        return {
            type: "writeCarCoords",
            variableId: this.variableId,
            ...persistVehicleTargetFields(this)
        };
    }
}

export class WriteGuestCoordsStep extends InstantStep {
    variableId: string;
    useTriggerGuest?: boolean;
    guestId?: number;

    constructor(obj: WriteGuestCoordsStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.useTriggerGuest = obj.useTriggerGuest;
        this.guestId = obj.guestId;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const guests = resolveStepGuests(run, this.useTriggerGuest, this.guestId, "Write Guest Coords");
        if (guests.length === 0) {
            return;
        }
        writeStoredValue(
            this.variableId,
            "coords",
            {x: guests[0].x, y: guests[0].y, z: guests[0].z},
            "Write Guest Coords",
            meta
        );
    }

    getDataToPersist(): object {
        return {
            type: "writeGuestCoords",
            variableId: this.variableId,
            ...persistGuestTarget(this.useTriggerGuest !== false, this.guestId)
        };
    }
}

export class WriteStaffCoordsStep extends InstantStep {
    variableId: string;
    useTriggerStaff?: boolean;
    staffId?: number;

    constructor(obj: WriteStaffCoordsStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.useTriggerStaff = obj.useTriggerStaff;
        this.staffId = obj.staffId;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const staff = resolveStepStaffMembers(run, this.useTriggerStaff, this.staffId, "Write Staff Coords");
        if (staff.length === 0) {
            return;
        }
        writeStoredValue(
            this.variableId,
            "coords",
            {x: staff[0].x, y: staff[0].y, z: staff[0].z},
            "Write Staff Coords",
            meta
        );
    }

    getDataToPersist(): object {
        return {
            type: "writeStaffCoords",
            variableId: this.variableId,
            ...persistStaffTarget(this.useTriggerStaff !== false, this.staffId)
        };
    }
}

export class WriteCameraRotationStep extends InstantStep {
    variableId: string;

    constructor(obj: WriteCameraRotationStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        if (typeof ui === "undefined" || !ui.mainViewport) {
            error("step", "Write Camera Rotation: no viewport", undefined, meta);
            return;
        }
        writeStoredValue(this.variableId, "direction", ui.mainViewport.rotation, "Write Camera Rotation", meta);
    }

    getDataToPersist(): object {
        return {
            type: "writeCameraRotation",
            variableId: this.variableId
        };
    }
}

export class WriteGuestDirectionStep extends InstantStep {
    variableId: string;
    useTriggerGuest?: boolean;
    guestId?: number;

    constructor(obj: WriteGuestDirectionStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.useTriggerGuest = obj.useTriggerGuest;
        this.guestId = obj.guestId;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const guests = resolveStepGuests(run, this.useTriggerGuest, this.guestId, "Write Guest Direction");
        if (guests.length === 0) {
            return;
        }
        writeStoredValue(this.variableId, "direction", guests[0].direction, "Write Guest Direction", meta);
    }

    getDataToPersist(): object {
        return {
            type: "writeGuestDirection",
            variableId: this.variableId,
            ...persistGuestTarget(this.useTriggerGuest !== false, this.guestId)
        };
    }
}

export class WriteStaffDirectionStep extends InstantStep {
    variableId: string;
    useTriggerStaff?: boolean;
    staffId?: number;

    constructor(obj: WriteStaffDirectionStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.useTriggerStaff = obj.useTriggerStaff;
        this.staffId = obj.staffId;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const staff = resolveStepStaffMembers(run, this.useTriggerStaff, this.staffId, "Write Staff Direction");
        if (staff.length === 0) {
            return;
        }
        writeStoredValue(this.variableId, "direction", staff[0].direction, "Write Staff Direction", meta);
    }

    getDataToPersist(): object {
        return {
            type: "writeStaffDirection",
            variableId: this.variableId,
            ...persistStaffTarget(this.useTriggerStaff !== false, this.staffId)
        };
    }
}

export class WriteCarTrackDirectionStep extends InstantStep {
    variableId: string;
    useTriggerTarget?: boolean;
    rideId?: number;
    trainIndex?: number;
    carIndex?: number;

    constructor(obj: WriteCarTrackDirectionStepDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.useTriggerTarget = obj.useTriggerTarget;
        this.rideId = obj.rideId;
        this.trainIndex = obj.trainIndex;
        this.carIndex = obj.carIndex;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const cars = resolveTargetHeadCars(run, this);
        if (cars.length === 0) {
            error("step", "Write Car Track Direction: no car", undefined, meta);
            return;
        }
        const track = cars[0].trackLocation;
        if (!track || typeof track.direction !== "number") {
            error("step", "Write Car Track Direction: car has no track direction", undefined, meta);
            return;
        }
        writeStoredValue(this.variableId, "direction", track.direction, "Write Car Track Direction", meta);
    }

    getDataToPersist(): object {
        return {
            type: "writeCarTrackDirection",
            variableId: this.variableId,
            ...persistVehicleTargetFields(this)
        };
    }
}
