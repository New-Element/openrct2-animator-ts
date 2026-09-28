/// <reference path="./../../../openrct2.d.ts" />

import TileCoords from "../../../game/tileCoords";
import {CreateParticleLaunch, VehicleTargetDesc} from "../jsonTypes";
import {resolveStepCars} from "./stepHelpers";
import StepRunContext from "./stepRunContext";

const TILE_SIZE = 32;

export function readParticleLaunch(launch: string | undefined): CreateParticleLaunch {
    return launch === "tile" ? "tile" : "car";
}

export function readParticleTile(tile: TileCoords | undefined): TileCoords {
    if (!tile || typeof tile.x !== "number" || typeof tile.y !== "number") {
        return {x: 0, y: 0};
    }
    return {x: tile.x, y: tile.y};
}

export function readParticleTarget(desc: VehicleTargetDesc): VehicleTargetDesc {
    return {
        useTriggerTarget: false,
        rideId: typeof desc.rideId === "number" ? desc.rideId : 0,
        trainIndex: typeof desc.trainIndex === "number" ? desc.trainIndex : 0,
        carIndex: typeof desc.carIndex === "number" ? desc.carIndex : 0
    };
}

/** World position for a car launch or the centre of a tile at a fixed height. */
export function resolveParticleLaunch(
    run: StepRunContext,
    label: string,
    launch: CreateParticleLaunch,
    target: VehicleTargetDesc,
    tile: TileCoords,
    z: number
): CoordsXYZ | null {
    if (launch === "tile") {
        return {
            x: tile.x * TILE_SIZE + TILE_SIZE / 2,
            y: tile.y * TILE_SIZE + TILE_SIZE / 2,
            z: z
        };
    }
    const cars = resolveStepCars(run, target, label);
    if (cars.length === 0) {
        return null;
    }
    const car = cars[0];
    return {x: car.x, y: car.y, z: car.z};
}
