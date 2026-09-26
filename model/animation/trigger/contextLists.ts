/// <reference path="./../../../openrct2.d.ts" />

import TileCoords from "../../../game/tileCoords";
import {CarIdentity, identifyCar, TrainIdentity} from "../entityRematch";
import {walkRide} from "./rideCarSnapshot";
import TriggerContext from "./triggerContext";

export function emptyContextLists(): {
    rides: number[];
    trains: TrainIdentity[];
    cars: CarIdentity[];
    guests: number[];
    staff: number[];
    tiles: TileCoords[];
} {
    return {
        rides: [],
        trains: [],
        cars: [],
        guests: [],
        staff: [],
        tiles: []
    };
}

function copyTile(tile: TileCoords): TileCoords {
    return {x: tile.x, y: tile.y};
}

function copyTrain(train: TrainIdentity): TrainIdentity {
    return {rideId: train.rideId, trainIndex: train.trainIndex};
}

function copyCar(car: CarIdentity): CarIdentity {
    return {rideId: car.rideId, trainIndex: car.trainIndex, carIndex: car.carIndex};
}

export function sameTrain(a: TrainIdentity, b: TrainIdentity): boolean {
    return a.rideId === b.rideId && a.trainIndex === b.trainIndex;
}

export function sameCar(a: CarIdentity, b: CarIdentity): boolean {
    return a.rideId === b.rideId && a.trainIndex === b.trainIndex && a.carIndex === b.carIndex;
}

export function sameTile(a: TileCoords, b: TileCoords): boolean {
    return a.x === b.x && a.y === b.y;
}

function listsFromFire(context: TriggerContext): ReturnType<typeof emptyContextLists> {
    const lists = emptyContextLists();

    if (typeof context.rideId === "number") {
        lists.rides.push(context.rideId);
    }

    if (typeof context.rideId === "number" && typeof context.trainIndex === "number") {
        lists.trains.push({rideId: context.rideId, trainIndex: context.trainIndex});
    }

    if (
        typeof context.rideId === "number" &&
        typeof context.trainIndex === "number" &&
        typeof context.carIndex === "number"
    ) {
        lists.cars.push({
            rideId: context.rideId,
            trainIndex: context.trainIndex,
            carIndex: context.carIndex
        });
    } else if (typeof context.vehicleId === "number") {
        const fromCrash = identifyCar(context.vehicleId);
        if (fromCrash) {
            lists.cars.push(fromCrash);
            if (lists.trains.length === 0) {
                lists.trains.push({rideId: fromCrash.rideId, trainIndex: fromCrash.trainIndex});
            }
            if (lists.rides.length === 0) {
                lists.rides.push(fromCrash.rideId);
            }
        }
    } else if ("carId" in context.target) {
        const fromTarget = identifyCar(context.target.carId);
        if (fromTarget) {
            lists.cars.push(fromTarget);
            if (lists.trains.length === 0) {
                lists.trains.push({rideId: fromTarget.rideId, trainIndex: fromTarget.trainIndex});
            }
            if (lists.rides.length === 0) {
                lists.rides.push(fromTarget.rideId);
            }
        }
    }

    if (typeof context.guestId === "number") {
        lists.guests.push(context.guestId);
    } else if ("guestId" in context.target) {
        lists.guests.push(context.target.guestId);
    }

    if ("staffId" in context.target) {
        lists.staff.push(context.target.staffId);
    }

    if (context.tile) {
        lists.tiles.push(copyTile(context.tile));
    }

    return lists;
}

/**
 * Fill working lists from fire-time scalars / target. Events call this once.
 */
export function withContextLists(context: TriggerContext): TriggerContext {
    const lists = listsFromFire(context);
    context.rides = lists.rides;
    context.trains = lists.trains;
    context.cars = lists.cars;
    context.guests = lists.guests;
    context.staff = lists.staff;
    context.tiles = lists.tiles;
    return context;
}

export function copyContextLists(from: TriggerContext, to: TriggerContext): void {
    if (from.rides) {
        to.rides = from.rides.slice();
    }
    if (from.trains) {
        to.trains = [];
        for (let i = 0; i < from.trains.length; i++) {
            to.trains.push(copyTrain(from.trains[i]));
        }
    }
    if (from.cars) {
        to.cars = [];
        for (let i = 0; i < from.cars.length; i++) {
            to.cars.push(copyCar(from.cars[i]));
        }
    }
    if (from.guests) {
        to.guests = from.guests.slice();
    }
    if (from.staff) {
        to.staff = from.staff.slice();
    }
    if (from.tiles) {
        to.tiles = [];
        for (let i = 0; i < from.tiles.length; i++) {
            to.tiles.push(copyTile(from.tiles[i]));
        }
    }
}

export function contextRideIds(context: TriggerContext): number[] {
    if (context.rides) {
        return context.rides.slice();
    }
    if (typeof context.rideId === "number") {
        return [context.rideId];
    }
    return [];
}

export function contextTrains(context: TriggerContext): TrainIdentity[] {
    if (context.trains) {
        const out: TrainIdentity[] = [];
        for (let i = 0; i < context.trains.length; i++) {
            out.push(copyTrain(context.trains[i]));
        }
        return out;
    }
    if (typeof context.rideId === "number" && typeof context.trainIndex === "number") {
        return [{rideId: context.rideId, trainIndex: context.trainIndex}];
    }
    return [];
}

export function contextCars(context: TriggerContext): CarIdentity[] {
    if (context.cars) {
        const out: CarIdentity[] = [];
        for (let i = 0; i < context.cars.length; i++) {
            out.push(copyCar(context.cars[i]));
        }
        return out;
    }
    if (
        typeof context.rideId === "number" &&
        typeof context.trainIndex === "number" &&
        typeof context.carIndex === "number"
    ) {
        return [
            {
                rideId: context.rideId,
                trainIndex: context.trainIndex,
                carIndex: context.carIndex
            }
        ];
    }
    if (typeof context.vehicleId === "number") {
        const identity = identifyCar(context.vehicleId);
        return identity ? [identity] : [];
    }
    if ("carId" in context.target) {
        const identity = identifyCar(context.target.carId);
        return identity ? [identity] : [];
    }
    return [];
}

export function contextGuestIds(context: TriggerContext): number[] {
    if (context.guests) {
        return context.guests.slice();
    }
    if (typeof context.guestId === "number") {
        return [context.guestId];
    }
    if ("guestId" in context.target) {
        return [context.target.guestId];
    }
    return [];
}

export function contextStaffIds(context: TriggerContext): number[] {
    if (context.staff) {
        return context.staff.slice();
    }
    if ("staffId" in context.target) {
        return [context.target.staffId];
    }
    return [];
}

export function contextTiles(context: TriggerContext): TileCoords[] {
    if (context.tiles) {
        const out: TileCoords[] = [];
        for (let i = 0; i < context.tiles.length; i++) {
            out.push(copyTile(context.tiles[i]));
        }
        return out;
    }
    if (context.tile) {
        return [copyTile(context.tile)];
    }
    return [];
}

export function trainsOfRide(rideId: number): TrainIdentity[] {
    const ride = map.getRide(rideId);
    if (!ride) {
        return [];
    }
    const out: TrainIdentity[] = [];
    for (let i = 0; i < ride.vehicles.length; i++) {
        const headId = ride.vehicles[i];
        if (headId === null || headId === undefined) {
            continue;
        }
        out.push({rideId: rideId, trainIndex: i});
    }
    return out;
}

export function carsOfTrain(rideId: number, trainIndex: number): CarIdentity[] {
    const walked = walkRide(rideId);
    const out: CarIdentity[] = [];
    for (let i = 0; i < walked.length; i++) {
        if (walked[i].trainIndex === trainIndex) {
            out.push({
                rideId: rideId,
                trainIndex: trainIndex,
                carIndex: walked[i].carIndex
            });
        }
    }
    return out;
}

function worldCoordsForTile(tile: TileCoords): CoordsXY {
    return {x: tile.x * 32, y: tile.y * 32};
}

function entityIdsOnTile(type: "guest" | "staff", tile: TileCoords): number[] {
    const entities = map.getAllEntitiesOnTile(type, worldCoordsForTile(tile));
    const out: number[] = [];
    for (let i = 0; i < entities.length; i++) {
        const id = entities[i].id;
        if (typeof id === "number") {
            out.push(id);
        }
    }
    return out;
}

export function guestsOnTiles(tiles: TileCoords[]): number[] {
    const seen: {[id: number]: boolean} = {};
    const out: number[] = [];
    for (let i = 0; i < tiles.length; i++) {
        const ids = entityIdsOnTile("guest", tiles[i]);
        for (let j = 0; j < ids.length; j++) {
            if (seen[ids[j]]) {
                continue;
            }
            seen[ids[j]] = true;
            out.push(ids[j]);
        }
    }
    return out;
}

export function staffOnTiles(tiles: TileCoords[]): number[] {
    const seen: {[id: number]: boolean} = {};
    const out: number[] = [];
    for (let i = 0; i < tiles.length; i++) {
        const ids = entityIdsOnTile("staff", tiles[i]);
        for (let j = 0; j < ids.length; j++) {
            if (seen[ids[j]]) {
                continue;
            }
            seen[ids[j]] = true;
            out.push(ids[j]);
        }
    }
    return out;
}

export function unionNumbers(current: number[], add: number[]): number[] {
    const seen: {[id: number]: boolean} = {};
    const out: number[] = [];
    for (let i = 0; i < current.length; i++) {
        if (seen[current[i]]) {
            continue;
        }
        seen[current[i]] = true;
        out.push(current[i]);
    }
    for (let i = 0; i < add.length; i++) {
        if (seen[add[i]]) {
            continue;
        }
        seen[add[i]] = true;
        out.push(add[i]);
    }
    return out;
}

export function subtractNumbers(current: number[], remove: number[]): number[] {
    const drop: {[id: number]: boolean} = {};
    for (let i = 0; i < remove.length; i++) {
        drop[remove[i]] = true;
    }
    const out: number[] = [];
    for (let i = 0; i < current.length; i++) {
        if (!drop[current[i]]) {
            out.push(current[i]);
        }
    }
    return out;
}

export function unionTrains(current: TrainIdentity[], add: TrainIdentity[]): TrainIdentity[] {
    const out: TrainIdentity[] = [];
    for (let i = 0; i < current.length; i++) {
        out.push(copyTrain(current[i]));
    }
    for (let i = 0; i < add.length; i++) {
        let found = false;
        for (let j = 0; j < out.length; j++) {
            if (sameTrain(out[j], add[i])) {
                found = true;
                break;
            }
        }
        if (!found) {
            out.push(copyTrain(add[i]));
        }
    }
    return out;
}

export function subtractTrains(current: TrainIdentity[], remove: TrainIdentity[]): TrainIdentity[] {
    const out: TrainIdentity[] = [];
    for (let i = 0; i < current.length; i++) {
        let drop = false;
        for (let j = 0; j < remove.length; j++) {
            if (sameTrain(current[i], remove[j])) {
                drop = true;
                break;
            }
        }
        if (!drop) {
            out.push(copyTrain(current[i]));
        }
    }
    return out;
}

export function unionCars(current: CarIdentity[], add: CarIdentity[]): CarIdentity[] {
    const out: CarIdentity[] = [];
    for (let i = 0; i < current.length; i++) {
        out.push(copyCar(current[i]));
    }
    for (let i = 0; i < add.length; i++) {
        let found = false;
        for (let j = 0; j < out.length; j++) {
            if (sameCar(out[j], add[i])) {
                found = true;
                break;
            }
        }
        if (!found) {
            out.push(copyCar(add[i]));
        }
    }
    return out;
}

export function subtractCars(current: CarIdentity[], remove: CarIdentity[]): CarIdentity[] {
    const out: CarIdentity[] = [];
    for (let i = 0; i < current.length; i++) {
        let drop = false;
        for (let j = 0; j < remove.length; j++) {
            if (sameCar(current[i], remove[j])) {
                drop = true;
                break;
            }
        }
        if (!drop) {
            out.push(copyCar(current[i]));
        }
    }
    return out;
}

export function unionTiles(current: TileCoords[], add: TileCoords[]): TileCoords[] {
    const out: TileCoords[] = [];
    for (let i = 0; i < current.length; i++) {
        out.push(copyTile(current[i]));
    }
    for (let i = 0; i < add.length; i++) {
        let found = false;
        for (let j = 0; j < out.length; j++) {
            if (sameTile(out[j], add[i])) {
                found = true;
                break;
            }
        }
        if (!found) {
            out.push(copyTile(add[i]));
        }
    }
    return out;
}

export function subtractTiles(current: TileCoords[], remove: TileCoords[]): TileCoords[] {
    const out: TileCoords[] = [];
    for (let i = 0; i < current.length; i++) {
        let drop = false;
        for (let j = 0; j < remove.length; j++) {
            if (sameTile(current[i], remove[j])) {
                drop = true;
                break;
            }
        }
        if (!drop) {
            out.push(copyTile(current[i]));
        }
    }
    return out;
}
