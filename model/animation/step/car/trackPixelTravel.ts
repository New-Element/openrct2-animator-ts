/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";

/**
 * OpenRCT2 keeps taking forward track steps while remainingDistance is at least this.
 * See Vehicle::updateTrackMotionCar (0x368A).
 */
const MOTION_CUTOFF = 13962;
/**
 * Margin below the cutoff so the last planned step still counts, matching Ride Vehicle Editor.
 * The smallest real step cost is 6554, so 3277 is enough.
 */
const MOTION_MARGIN = 3277;
const FORWARD_LAND = MOTION_CUTOFF - MOTION_MARGIN;
const BACKWARD_LAND = MOTION_MARGIN;

/** travelBy cost when a step changes x, y, and/or z. Index is an axis mask. */
const TRANSLATION_COST = [0, 8716, 8716, 12327, 6554, 10905, 10905, 13961];

const MAX_STEPS = 20000;

interface Xyz {
    x: number;
    y: number;
    z: number;
}

interface StepMove {
    pixels: number;
    cost: number;
}

interface PendingPiece {
    subs: TrackSubposition[];
    origin: CoordsXYZD;
}

interface Walk {
    iterator: TrackIterator;
    subs: TrackSubposition[];
    origin: CoordsXYZD;
    progress: number;
    subposition: number;
    pending: PendingPiece | null;
}

export interface TrackPixelTravel {
    /**
     * Signed travelBy spread across the step duration. This is only the cost of the track steps.
     */
    travel: number;
    /**
     * Signed travelBy applied once at the start, so remaining distance sits where those steps
     * will be taken and then the car will stop. It does not move the car by itself.
     */
    settle: number;
    /** False when the track ended, or the step cap was hit, before the pixel distance was covered. */
    reached: boolean;
}

const subpositionCache: {[key: string]: TrackSubposition[]} = {};

function cachedSubs(segment: TrackSegment, subposition: number, direction: Direction): TrackSubposition[] {
    const key = `${segment.type}:${subposition}:${direction}`;
    const cached = subpositionCache[key];
    if (cached) {
        return cached;
    }
    const subs = segment.getSubpositions(subposition, direction);
    subpositionCache[key] = subs;
    return subs;
}

function worldAt(origin: CoordsXYZ, sub: CoordsXYZ): Xyz {
    return {
        x: origin.x + sub.x,
        y: origin.y + sub.y,
        z: origin.z + sub.z
    };
}

function translationCost(from: Xyz, to: Xyz): number {
    const mask = (from.x !== to.x ? 1 : 0) | (from.y !== to.y ? 2 : 0) | (from.z !== to.z ? 4 : 0);
    return TRANSLATION_COST[mask];
}

function pixelSpan(from: Xyz, to: Xyz): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function trackElementIndex(loc: CarTrackLocation): number | null {
    const tile = MapTile.atXY(Math.floor(loc.x / 32), Math.floor(loc.y / 32));
    if (!tile) {
        return null;
    }
    for (let i = 0; i < tile.numElements; i++) {
        const element = tile.getElement(i);
        if (element.type !== "track") {
            continue;
        }
        const track = element as TrackElement;
        if (track.baseZ === loc.z && track.direction === loc.direction && track.trackType === loc.trackType) {
            return i;
        }
    }
    return null;
}

function moveBetween(from: Xyz, to: Xyz): StepMove {
    return {pixels: pixelSpan(from, to), cost: translationCost(from, to)};
}

function peekForward(state: Walk): StepMove | null {
    state.pending = null;
    const count = state.subs.length;
    if (count === 0) {
        return null;
    }
    if (state.progress + 1 < count) {
        const from = worldAt(state.origin, state.subs[state.progress]);
        const to = worldAt(state.origin, state.subs[state.progress + 1]);
        return moveBetween(from, to);
    }
    if (!state.iterator.next()) {
        return null;
    }
    const origin = state.iterator.position;
    const segment = state.iterator.segment;
    if (!segment) {
        state.iterator.previous();
        return null;
    }
    const subs = cachedSubs(segment, state.subposition, origin.direction);
    if (subs.length === 0) {
        state.iterator.previous();
        return null;
    }
    const from = worldAt(state.origin, state.subs[count - 1]);
    const to = worldAt(origin, subs[0]);
    state.pending = {subs, origin};
    return moveBetween(from, to);
}

function peekBackward(state: Walk): StepMove | null {
    state.pending = null;
    const count = state.subs.length;
    if (count === 0) {
        return null;
    }
    if (state.progress > 0) {
        const from = worldAt(state.origin, state.subs[state.progress]);
        const to = worldAt(state.origin, state.subs[state.progress - 1]);
        return moveBetween(from, to);
    }
    if (!state.iterator.previous()) {
        return null;
    }
    const origin = state.iterator.position;
    const segment = state.iterator.segment;
    if (!segment) {
        state.iterator.next();
        return null;
    }
    const subs = cachedSubs(segment, state.subposition, origin.direction);
    if (subs.length === 0) {
        state.iterator.next();
        return null;
    }
    const from = worldAt(state.origin, state.subs[0]);
    const to = worldAt(origin, subs[subs.length - 1]);
    state.pending = {subs, origin};
    return moveBetween(from, to);
}

function commit(state: Walk, forward: boolean): void {
    if (state.pending) {
        state.subs = state.pending.subs;
        state.origin = state.pending.origin;
        state.progress = forward ? 0 : state.subs.length - 1;
        state.pending = null;
        return;
    }
    state.progress += forward ? 1 : -1;
}

function reject(state: Walk, forward: boolean): void {
    if (!state.pending) {
        return;
    }
    if (forward) {
        state.iterator.previous();
    } else {
        state.iterator.next();
    }
    state.pending = null;
}

function sumCosts(costs: number[]): number {
    let sum = 0;
    for (let i = 0; i < costs.length; i++) {
        sum += costs[i];
    }
    return sum;
}

/**
 * How far to travelBy so the car moves `pixels` along the track.
 * Positive pixels move forward (the direction track progress increases).
 * Null when the car's track piece cannot be walked.
 */
export function travelForTrackPixels(car: Car, pixels: number): TrackPixelTravel | null {
    if (pixels === 0) {
        return {travel: 0, settle: 0, reached: true};
    }
    const forward = pixels > 0;
    let pixelsLeft = Math.abs(pixels);

    const loc = car.trackLocation;
    const elementIndex = trackElementIndex(loc);
    if (elementIndex === null) {
        return null;
    }
    const iterator = map.getTrackIterator({x: loc.x, y: loc.y}, elementIndex);
    if (!iterator || !iterator.segment) {
        return null;
    }
    const origin = iterator.position;
    const subs = cachedSubs(iterator.segment, car.subposition, origin.direction);
    if (subs.length === 0) {
        return null;
    }

    let progress = car.trackProgress;
    if (progress < 0) {
        progress = 0;
    }
    if (progress >= subs.length) {
        progress = subs.length - 1;
    }

    const state: Walk = {
        iterator,
        subs,
        origin,
        progress,
        subposition: car.subposition,
        pending: null
    };

    const costs: number[] = [];
    let steps = 0;
    let zeroSteps = 0;
    let reached = true;

    while (pixelsLeft > 0 && steps < MAX_STEPS) {
        steps++;
        const step = forward ? peekForward(state) : peekBackward(state);
        if (!step) {
            reached = false;
            break;
        }
        const include = step.pixels <= 0 || step.pixels <= pixelsLeft || pixelsLeft * 2 >= step.pixels;
        if (!include) {
            reject(state, forward);
            break;
        }
        costs.push(step.cost);
        if (step.pixels > 0) {
            pixelsLeft -= step.pixels;
            if (pixelsLeft < 0) {
                pixelsLeft = 0;
            }
            zeroSteps = 0;
        } else {
            zeroSteps++;
            if (zeroSteps > 64) {
                commit(state, forward);
                reached = false;
                break;
            }
        }
        commit(state, forward);
    }
    if (steps >= MAX_STEPS && pixelsLeft > 0) {
        reached = false;
    }
    if (costs.length === 0) {
        return {travel: 0, settle: 0, reached};
    }
    const sum = sumCosts(costs);
    if (forward) {
        return {
            travel: sum,
            settle: Math.round(FORWARD_LAND - car.remainingDistance),
            reached
        };
    }
    return {
        travel: -sum,
        settle: Math.round(BACKWARD_LAND - car.remainingDistance),
        reached
    };
}
