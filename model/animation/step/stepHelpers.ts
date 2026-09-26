/// <reference path="./../../../openrct2.d.ts" />

import MapTile from "../../../game/mapTile";
import {error} from "../../logger";
import {OnOffToggle, TileTargetDesc, VehicleTargetDesc} from "../jsonTypes";
import {contextGuestIds, contextRideIds, contextStaffIds} from "../trigger/contextLists";
import {persistVehicleTargetFields, resolveTargetHeadCars} from "./car/vehicleTarget";
import StepRunContext from "./stepRunContext";
import {LoadedTileTarget, persistTileTargetFields, resolveStepTiles} from "./tileTarget";

export function logMetaFromRun(run: StepRunContext): {animationId?: string; triggerId?: string} {
    const r = run as StepRunContext & {animation?: {id: string}; sourceTriggerId?: string};
    const meta: {animationId?: string; triggerId?: string} = {};
    if (r.animation && typeof r.animation.id === "string") {
        meta.animationId = r.animation.id;
    }
    if (typeof r.sourceTriggerId === "string") {
        meta.triggerId = r.sourceTriggerId;
    }
    return meta;
}

export function applyOnOffToggle(current: boolean, mode: OnOffToggle): boolean {
    if (mode === "on") {
        return true;
    }
    if (mode === "off") {
        return false;
    }
    return !current;
}

export function resolveStepRides(
    run: StepRunContext,
    useTriggerRide: boolean | undefined,
    rideId: number | undefined,
    label: string
): Ride[] {
    const ids = useTriggerRide !== false
        ? contextRideIds(run.triggerContext)
        : (typeof rideId === "number" ? [rideId] : []);
    if (ids.length === 0) {
        error("step", `${label}: no ride`, undefined, logMetaFromRun(run));
        return [];
    }
    const rides: Ride[] = [];
    for (let i = 0; i < ids.length; i++) {
        const ride = map.getRide(ids[i]);
        if (!ride) {
            continue;
        }
        rides.push(ride);
    }
    if (rides.length === 0) {
        error("step", `${label}: ride not found`, undefined, logMetaFromRun(run));
    }
    return rides;
}

export function persistRideIdFields(useTriggerRide: boolean | undefined, rideId: number | undefined): {
    useTriggerRide: boolean;
    rideId?: number;
} {
    if (useTriggerRide !== false) {
        return {useTriggerRide: true};
    }
    return {useTriggerRide: false, rideId: typeof rideId === "number" ? rideId : 0};
}

export function resolveStepCars(
    run: StepRunContext,
    target: VehicleTargetDesc,
    label: string
): Car[] {
    const cars = resolveTargetHeadCars(run, target);
    if (cars.length === 0) {
        error("step", `${label}: no car`, undefined, logMetaFromRun(run));
    }
    return cars;
}

export function resolveStepGuests(
    run: StepRunContext,
    useTrigger: boolean | undefined,
    guestId: number | undefined,
    label: string
): Guest[] {
    const ids = useTrigger !== false
        ? contextGuestIds(run.triggerContext)
        : (typeof guestId === "number" ? [guestId] : []);
    if (ids.length === 0) {
        error("step", `${label}: no guest`, undefined, logMetaFromRun(run));
        return [];
    }
    const guests: Guest[] = [];
    for (let i = 0; i < ids.length; i++) {
        const entity = map.getEntity(ids[i]);
        if (!entity || entity.type !== "guest") {
            continue;
        }
        guests.push(entity as Guest);
    }
    if (guests.length === 0) {
        error("step", `${label}: guest not found`, undefined, logMetaFromRun(run));
    }
    return guests;
}

export function resolveStepStaffMembers(
    run: StepRunContext,
    useTrigger: boolean | undefined,
    staffId: number | undefined,
    label: string
): Staff[] {
    const ids = useTrigger !== false
        ? contextStaffIds(run.triggerContext)
        : (typeof staffId === "number" ? [staffId] : []);
    if (ids.length === 0) {
        error("step", `${label}: no staff`, undefined, logMetaFromRun(run));
        return [];
    }
    const staff: Staff[] = [];
    for (let i = 0; i < ids.length; i++) {
        const entity = map.getEntity(ids[i]);
        if (!entity || entity.type !== "staff") {
            continue;
        }
        staff.push(entity as Staff);
    }
    if (staff.length === 0) {
        error("step", `${label}: staff not found`, undefined, logMetaFromRun(run));
    }
    return staff;
}

export function resolveStepMapTiles(
    run: StepRunContext,
    tileTarget: LoadedTileTarget,
    label: string
): MapTile[] {
    const tiles = resolveStepTiles(run, tileTarget, label);
    const mapTiles: MapTile[] = [];
    for (let i = 0; i < tiles.length; i++) {
        const mapTile = MapTile.at(tiles[i]);
        if (!mapTile) {
            continue;
        }
        mapTiles.push(mapTile);
    }
    if (tiles.length > 0 && mapTiles.length === 0) {
        error("step", `${label}: no tile`, undefined, logMetaFromRun(run));
    }
    return mapTiles;
}

export function resolveStepTracks(
    run: StepRunContext,
    tileTarget: LoadedTileTarget,
    rideId: number,
    trackType: number,
    label: string
): TrackElement[] {
    const mapTiles = resolveStepMapTiles(run, tileTarget, label);
    const tracks: TrackElement[] = [];
    for (let i = 0; i < mapTiles.length; i++) {
        const track = mapTiles[i].findTrack(rideId, trackType);
        if (track) {
            tracks.push(track);
        }
    }
    if (mapTiles.length > 0 && tracks.length === 0) {
        error(
            "step",
            `${label}: no track for ride ${rideId} type ${trackType}`,
            undefined,
            logMetaFromRun(run)
        );
    }
    return tracks;
}

export function persistTrackPiece(
    tileTarget: LoadedTileTarget,
    rideId: number,
    trackType: number
): TileTargetDesc & {rideId: number; trackType: number} {
    return {
        ...persistTileTargetFields(tileTarget),
        rideId: rideId,
        trackType: trackType
    };
}

export function persistVehicleFields(target: VehicleTargetDesc): VehicleTargetDesc {
    return persistVehicleTargetFields(target);
}

export function persistGuestTarget(useTrigger: boolean, guestId: number | undefined): {
    useTriggerGuest: boolean;
    guestId?: number;
} {
    if (useTrigger) {
        return {useTriggerGuest: true};
    }
    const data: {useTriggerGuest: boolean; guestId?: number} = {useTriggerGuest: false};
    if (typeof guestId === "number") {
        data.guestId = guestId;
    }
    return data;
}

export function persistStaffTarget(useTrigger: boolean, staffId: number | undefined): {
    useTriggerStaff: boolean;
    staffId?: number;
} {
    if (useTrigger) {
        return {useTriggerStaff: true};
    }
    const data: {useTriggerStaff: boolean; staffId?: number} = {useTriggerStaff: false};
    if (typeof staffId === "number") {
        data.staffId = staffId;
    }
    return data;
}
