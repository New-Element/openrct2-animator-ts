/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import {error} from "../../../logger";
import {RideStationStartSource, RideStationStartStepDesc} from "../../jsonTypes";
import {resolveTriggerCars, resolveTriggerTrainHeads} from "../car/resolveCars";
import InstantStep from "../instantStep";
import {
    logMetaFromRun,
    persistRideIdFields,
    resolveStepGuests,
    resolveStepRides,
    resolveStepStaffMembers
} from "../stepHelpers";
import StepRunContext from "../stepRunContext";

const LABEL = "Ride Station Start";
/** Map units per tile. Station start uses the same units as car.x/y. */
const MAP_UNITS_PER_TILE = 32;

function isSource(value: string | undefined): value is RideStationStartSource {
    return value === "train" || value === "car" || value === "guest" || value === "staff" || value === "tile";
}

function coordsFromTile(
    tile: {x: number; y: number} | undefined,
    meta: {animationId?: string; triggerId?: string}
): {x: number; y: number; z: number} | null {
    if (!tile || typeof tile.x !== "number" || typeof tile.y !== "number") {
        error("step", `${LABEL}: no tile`, undefined, meta);
        return null;
    }
    const tileX = Math.floor(tile.x);
    const tileY = Math.floor(tile.y);
    const mapTile = MapTile.atXY(tileX, tileY);
    if (!mapTile) {
        error("step", `${LABEL}: tile is off the map`, undefined, meta);
        return null;
    }
    const surface = mapTile.surface();
    return {
        x: tileX * MAP_UNITS_PER_TILE,
        y: tileY * MAP_UNITS_PER_TILE,
        z: surface ? surface.baseZ : 0
    };
}

function coordsFromContext(
    run: StepRunContext,
    source: RideStationStartSource,
    tile: {x: number; y: number} | undefined
): {x: number; y: number; z: number} | null {
    const meta = logMetaFromRun(run);
    if (source === "tile") {
        return coordsFromTile(tile, meta);
    }
    if (source === "train") {
        const heads = resolveTriggerTrainHeads(run);
        if (heads.length === 0) {
            error("step", `${LABEL}: no train`, undefined, meta);
            return null;
        }
        return {x: heads[0].x, y: heads[0].y, z: heads[0].z};
    }
    if (source === "car") {
        const cars = resolveTriggerCars(run);
        if (cars.length === 0) {
            error("step", `${LABEL}: no car`, undefined, meta);
            return null;
        }
        return {x: cars[0].x, y: cars[0].y, z: cars[0].z};
    }
    if (source === "guest") {
        const guests = resolveStepGuests(run, true, undefined, LABEL);
        if (guests.length === 0) {
            return null;
        }
        return {x: guests[0].x, y: guests[0].y, z: guests[0].z};
    }
    const staff = resolveStepStaffMembers(run, true, undefined, LABEL);
    if (staff.length === 0) {
        return null;
    }
    return {x: staff[0].x, y: staff[0].y, z: staff[0].z};
}

export class RideStationStartStep extends InstantStep {
    useTriggerRide?: boolean;
    rideId?: number;
    source: RideStationStartSource;
    tile?: {x: number; y: number};

    constructor(obj: RideStationStartStepDesc) {
        super(obj);
        this.useTriggerRide = obj.useTriggerRide;
        this.rideId = obj.rideId;
        this.source = isSource(obj.source) ? obj.source : "train";
        if (obj.tile && typeof obj.tile.x === "number" && typeof obj.tile.y === "number") {
            this.tile = {x: obj.tile.x, y: obj.tile.y};
        }
    }

    protected apply(run: StepRunContext): void {
        const coords = coordsFromContext(run, this.source, this.tile);
        if (!coords) {
            return;
        }
        const meta = logMetaFromRun(run);
        const rides = resolveStepRides(run, this.useTriggerRide, this.rideId, LABEL);
        for (let i = 0; i < rides.length; i++) {
            const stations = rides[i].stations;
            if (!stations || stations.length === 0 || !stations[0]) {
                error("step", `${LABEL}: ride has no station`, undefined, meta);
                continue;
            }
            stations[0].start = {x: coords.x, y: coords.y, z: coords.z};
        }
    }

    getDataToPersist(): object {
        return {
            type: "rideStationStart",
            source: this.source,
            ...(this.tile ? {tile: {x: this.tile.x, y: this.tile.y}} : {}),
            ...persistRideIdFields(this.useTriggerRide, this.rideId)
        };
    }
}
