/// <reference path="./../../openrct2.d.ts" />

import {error} from "../logger";
import Animation from "./animation";
import AnimationRun from "./animationRun";
import {AnimationTarget} from "./animationTarget";
import AnimationState from "./animationState";
import createAnimationRun from "./createAnimationRun";
import {
    CarIdentity,
    getGuestName,
    getStaffName,
    identifyCar,
    resolveCarId,
    resolveGuestIdByName,
    resolveStaffIdByName,
    TrainIdentity
} from "./entityRematch";
import {withContextLists} from "./trigger/contextLists";
import CarEntersEvent from "./trigger/event/carEntersEvent";
import TrainEntersEvent from "./trigger/event/trainEntersEvent";
import TriggerContext from "./trigger/triggerContext";

export const RUNTIME_STATE_KEY = "animator.runtimeState";
export const RUNTIME_STATE_VERSION = 2;

export type RuntimeTargetKind = "car" | "tile" | "static" | "staff" | "guest";

export interface PersistedRunContext {
    targetKind: RuntimeTargetKind;
    rideId?: number;
    trainIndex?: number;
    carIndex?: number;
    staffName?: string;
    guestName?: string;
    tile?: { x: number; y: number };
    allowOffTile?: boolean;
    rides?: number[];
    trains?: TrainIdentity[];
    cars?: CarIdentity[];
    guestNames?: string[];
    staffNames?: string[];
    tiles?: { x: number; y: number }[];
}

export interface PersistedRun {
    animationId: string;
    state: AnimationState;
    context: PersistedRunContext;
}

export interface PersistedCarOnTile {
    rideId: number;
    trainIndex: number;
    carIndex: number;
    tileX: number;
    tileY: number;
}

export interface RuntimeStateSnapshot {
    version: number;
    tickCount: number;
    paused: boolean;
    animationRunI: number;
    runs: PersistedRun[];
    carsOnTiles: PersistedCarOnTile[];
    /** Lead cars on tiles for trainEnters edge detection (optional on older saves). */
    trainsOnTiles?: PersistedCarOnTile[];
}

/**
 * Narrow host surface so this module does not import Conductor (avoids cycles).
 */
export interface RuntimeStateHost {
    tickCount: number;
    paused: boolean;
    animationRunI: number;
    animationRuns: AnimationRun[];
    animationsArray: {
        findById(id: string): Animation | undefined;
    };
}

function targetKindOf(target: AnimationTarget): RuntimeTargetKind | null {
    if ("carId" in target) {
        return "car";
    }
    if ("tile" in target) {
        return "tile";
    }
    if ("static" in target) {
        return "static";
    }
    if ("staffId" in target) {
        return "staff";
    }
    if ("guestId" in target) {
        return "guest";
    }
    return null;
}

function persistContextLists(context: TriggerContext, persisted: PersistedRunContext): void {
    if (context.rides) {
        persisted.rides = context.rides.slice();
    }
    if (context.trains) {
        persisted.trains = [];
        for (let i = 0; i < context.trains.length; i++) {
            persisted.trains.push({
                rideId: context.trains[i].rideId,
                trainIndex: context.trains[i].trainIndex
            });
        }
    }
    if (context.cars) {
        persisted.cars = [];
        for (let i = 0; i < context.cars.length; i++) {
            persisted.cars.push({
                rideId: context.cars[i].rideId,
                trainIndex: context.cars[i].trainIndex,
                carIndex: context.cars[i].carIndex
            });
        }
    }
    if (context.guests) {
        persisted.guestNames = [];
        for (let i = 0; i < context.guests.length; i++) {
            const name = getGuestName(context.guests[i]);
            if (name) {
                persisted.guestNames.push(name);
            }
        }
    }
    if (context.staff) {
        persisted.staffNames = [];
        for (let i = 0; i < context.staff.length; i++) {
            const name = getStaffName(context.staff[i]);
            if (name) {
                persisted.staffNames.push(name);
            }
        }
    }
    if (context.tiles) {
        persisted.tiles = [];
        for (let i = 0; i < context.tiles.length; i++) {
            persisted.tiles.push({x: context.tiles[i].x, y: context.tiles[i].y});
        }
    }
}

function hasPersistedLists(persisted: PersistedRunContext): boolean {
    return (
        Array.isArray(persisted.rides) ||
        Array.isArray(persisted.trains) ||
        Array.isArray(persisted.cars) ||
        Array.isArray(persisted.guestNames) ||
        Array.isArray(persisted.staffNames) ||
        Array.isArray(persisted.tiles)
    );
}

function restoreContextLists(persisted: PersistedRunContext, context: TriggerContext): void {
    if (!hasPersistedLists(persisted)) {
        withContextLists(context);
        return;
    }
    if (Array.isArray(persisted.rides)) {
        context.rides = persisted.rides.slice();
    } else {
        context.rides = [];
    }
    if (Array.isArray(persisted.trains)) {
        context.trains = [];
        for (let i = 0; i < persisted.trains.length; i++) {
            context.trains.push({
                rideId: persisted.trains[i].rideId,
                trainIndex: persisted.trains[i].trainIndex
            });
        }
    } else {
        context.trains = [];
    }
    if (Array.isArray(persisted.cars)) {
        context.cars = [];
        for (let i = 0; i < persisted.cars.length; i++) {
            context.cars.push({
                rideId: persisted.cars[i].rideId,
                trainIndex: persisted.cars[i].trainIndex,
                carIndex: persisted.cars[i].carIndex
            });
        }
    } else {
        context.cars = [];
    }
    if (Array.isArray(persisted.guestNames)) {
        context.guests = [];
        for (let i = 0; i < persisted.guestNames.length; i++) {
            const guestId = resolveGuestIdByName(persisted.guestNames[i]);
            if (guestId !== null) {
                context.guests.push(guestId);
            }
        }
    } else {
        context.guests = [];
    }
    if (Array.isArray(persisted.staffNames)) {
        context.staff = [];
        for (let i = 0; i < persisted.staffNames.length; i++) {
            const staffId = resolveStaffIdByName(persisted.staffNames[i]);
            if (staffId !== null) {
                context.staff.push(staffId);
            }
        }
    } else {
        context.staff = [];
    }
    if (Array.isArray(persisted.tiles)) {
        context.tiles = [];
        for (let i = 0; i < persisted.tiles.length; i++) {
            context.tiles.push({x: persisted.tiles[i].x, y: persisted.tiles[i].y});
        }
    } else {
        context.tiles = [];
    }
}

function persistRunContext(context: TriggerContext): PersistedRunContext | null {
    const kind = targetKindOf(context.target);
    if (!kind) {
        error("runtimeState", "Cannot persist run with unknown target kind");
        return null;
    }

    const persisted: PersistedRunContext = {
        targetKind: kind
    };

    if (kind === "car") {
        const carId = (context.target as { carId: number }).carId;
        const identity = identifyCar(carId);
        if (!identity) {
            if (
                typeof context.rideId === "number" &&
                typeof context.trainIndex === "number" &&
                typeof context.carIndex === "number"
            ) {
                persisted.rideId = context.rideId;
                persisted.trainIndex = context.trainIndex;
                persisted.carIndex = context.carIndex;
                if (context.tile) {
                    persisted.tile = { x: context.tile.x, y: context.tile.y };
                }
                if (context.allowOffTile) {
                    persisted.allowOffTile = true;
                }
                persistContextLists(context, persisted);
                return persisted;
            }
            error(
                "runtimeState",
                `Cannot identify car ${carId} for run persistence; skipping run`
            );
            return null;
        }
        persisted.rideId = identity.rideId;
        persisted.trainIndex = identity.trainIndex;
        persisted.carIndex = identity.carIndex;
        if (context.tile) {
            persisted.tile = { x: context.tile.x, y: context.tile.y };
        }
        if (context.allowOffTile) {
            persisted.allowOffTile = true;
        }
        persistContextLists(context, persisted);
        return persisted;
    }

    if (kind === "tile") {
        const tile = (context.target as { tile: { x: number; y: number } }).tile;
        persisted.tile = { x: tile.x, y: tile.y };
        if (typeof context.rideId === "number") {
            persisted.rideId = context.rideId;
        }
        if (typeof context.trainIndex === "number") {
            persisted.trainIndex = context.trainIndex;
        }
        if (typeof context.carIndex === "number") {
            persisted.carIndex = context.carIndex;
        }
        persistContextLists(context, persisted);
        return persisted;
    }

    if (kind === "static") {
        persistContextLists(context, persisted);
        return persisted;
    }

    if (kind === "guest") {
        const guestId = (context.target as { guestId: number }).guestId;
        const guestName = getGuestName(guestId);
        if (!guestName) {
            error(
                "runtimeState",
                `Cannot resolve guest name for id ${guestId}; skipping run`
            );
            return null;
        }
        persisted.guestName = guestName;
        if (context.tile) {
            persisted.tile = { x: context.tile.x, y: context.tile.y };
        }
        persistContextLists(context, persisted);
        return persisted;
    }

    const staffId = (context.target as { staffId: number }).staffId;
    const staffName = getStaffName(staffId);
    if (!staffName) {
        error(
            "runtimeState",
            `Cannot resolve staff name for id ${staffId}; skipping run`
        );
        return null;
    }
    persisted.staffName = staffName;
    persistContextLists(context, persisted);
    return persisted;
}

function restoreTriggerContext(persisted: PersistedRunContext): TriggerContext | null {
    if (persisted.targetKind === "car") {
        if (
            typeof persisted.rideId !== "number" ||
            typeof persisted.trainIndex !== "number" ||
            typeof persisted.carIndex !== "number"
        ) {
            error("runtimeState", "Car run missing ride/train/car identity; skipping");
            return null;
        }
        const carId = resolveCarId({
            rideId: persisted.rideId,
            trainIndex: persisted.trainIndex,
            carIndex: persisted.carIndex
        });
        if (carId === null) {
            error(
                "runtimeState",
                `Could not rematch car ride=${persisted.rideId} train=${persisted.trainIndex} car=${persisted.carIndex}; skipping run`
            );
            return null;
        }
        const carCtx: TriggerContext = {
            target: { carId: carId },
            rideId: persisted.rideId,
            trainIndex: persisted.trainIndex,
            carIndex: persisted.carIndex
        };
        if (persisted.tile) {
            carCtx.tile = { x: persisted.tile.x, y: persisted.tile.y };
        }
        if (persisted.allowOffTile) {
            carCtx.allowOffTile = true;
        }
        restoreContextLists(persisted, carCtx);
        return carCtx;
    }

    if (persisted.targetKind === "tile") {
        if (!persisted.tile) {
            error("runtimeState", "Tile run missing tile; skipping");
            return null;
        }
        const ctx: TriggerContext = {
            target: { tile: { x: persisted.tile.x, y: persisted.tile.y } }
        };
        if (typeof persisted.rideId === "number") {
            ctx.rideId = persisted.rideId;
        }
        if (typeof persisted.trainIndex === "number") {
            ctx.trainIndex = persisted.trainIndex;
        }
        if (typeof persisted.carIndex === "number") {
            ctx.carIndex = persisted.carIndex;
        }
        restoreContextLists(persisted, ctx);
        return ctx;
    }

    if (persisted.targetKind === "static") {
        const staticCtx: TriggerContext = {
            target: { static: true }
        };
        restoreContextLists(persisted, staticCtx);
        return staticCtx;
    }

    if (persisted.targetKind === "staff") {
        if (!persisted.staffName) {
            error("runtimeState", "Staff run missing staffName; skipping");
            return null;
        }
        const staffId = resolveStaffIdByName(persisted.staffName);
        if (staffId === null) {
            error(
                "runtimeState",
                `Could not rematch staff named "${persisted.staffName}"; skipping run`
            );
            return null;
        }
        const staffCtx: TriggerContext = {
            target: { staffId: staffId }
        };
        restoreContextLists(persisted, staffCtx);
        return staffCtx;
    }

    if (persisted.targetKind === "guest") {
        if (!persisted.guestName) {
            error("runtimeState", "Guest run missing guestName; skipping");
            return null;
        }
        const guestId = resolveGuestIdByName(persisted.guestName);
        if (guestId === null) {
            error(
                "runtimeState",
                `Could not rematch guest named "${persisted.guestName}"; skipping run`
            );
            return null;
        }
        const guestCtx: TriggerContext = {
            target: { guestId: guestId },
            guestId: guestId
        };
        if (persisted.tile) {
            guestCtx.tile = { x: persisted.tile.x, y: persisted.tile.y };
        }
        restoreContextLists(persisted, guestCtx);
        return guestCtx;
    }

    error("runtimeState", `Unknown targetKind "${(persisted as PersistedRunContext).targetKind}"; skipping run`);
    return null;
}

function captureRuns(host: RuntimeStateHost): PersistedRun[] {
    const runs: PersistedRun[] = [];
    for (let i = 0; i < host.animationRuns.length; i++) {
        const run = host.animationRuns[i];
        if (!run || !run.state.running) {
            continue;
        }
        const context = persistRunContext(run.triggerContext);
        if (!context) {
            continue;
        }
        runs.push({
            animationId: run.animation.id,
            state: {
                stepIndex: run.state.stepIndex,
                stepElapsedTicks: run.state.stepElapsedTicks,
                stepStarted: run.state.stepStarted,
                running: run.state.running,
                paused: run.state.paused,
                hasRun: run.state.hasRun,
                betweenStepsRemaining: 0
            },
            context: context
        });
    }
    return runs;
}

function captureEntityOnTiles(
    raw: Array<{ carId: number; tileX: number; tileY: number }>,
    label: string
): PersistedCarOnTile[] {
    const out: PersistedCarOnTile[] = [];
    for (let i = 0; i < raw.length; i++) {
        const entry = raw[i];
        const identity = identifyCar(entry.carId);
        if (!identity) {
            error(
                "runtimeState",
                `Cannot identify ${label} ${entry.carId} on tile (${entry.tileX},${entry.tileY}); skipping`
            );
            continue;
        }
        out.push({
            rideId: identity.rideId,
            trainIndex: identity.trainIndex,
            carIndex: identity.carIndex,
            tileX: entry.tileX,
            tileY: entry.tileY
        });
    }
    return out;
}

function captureCarsOnTiles(): PersistedCarOnTile[] {
    return captureEntityOnTiles(CarEntersEvent.getCarsOnTilesEntries(), "car");
}

function captureTrainsOnTiles(): PersistedCarOnTile[] {
    return captureEntityOnTiles(TrainEntersEvent.getTrainsOnTilesEntries(), "train head");
}

export function captureRuntimeState(host: RuntimeStateHost): RuntimeStateSnapshot {
    return {
        version: RUNTIME_STATE_VERSION,
        tickCount: host.tickCount,
        paused: host.paused,
        animationRunI: host.animationRunI,
        runs: captureRuns(host),
        carsOnTiles: captureCarsOnTiles(),
        trainsOnTiles: captureTrainsOnTiles()
    };
}

function restoreRuns(host: RuntimeStateHost, runs: PersistedRun[]): void {
    const restored: AnimationRun[] = [];
    let maxI = host.animationRunI;
    for (let i = 0; i < runs.length; i++) {
        const persisted = runs[i];
        const animation = host.animationsArray.findById(persisted.animationId);
        if (!animation) {
            error(
                "runtimeState",
                `Animation "${persisted.animationId}" not found; skipping run`
            );
            continue;
        }
        const context = restoreTriggerContext(persisted.context);
        if (!context) {
            continue;
        }
        const run = createAnimationRun(maxI, animation, context);
        maxI += 1;
        const stepIndex =
            typeof persisted.state.stepIndex === "number" ? persisted.state.stepIndex : 0;
        // Restart the current step on load (per-step ephemeral state is not persisted).
        run.state = {
            stepIndex: stepIndex,
            stepElapsedTicks: 0,
            stepStarted: false,
            running: persisted.state.running,
            paused: persisted.state.paused,
            hasRun: persisted.state.hasRun,
            betweenStepsRemaining: 0
        };
        if (run.state.running) {
            restored.push(run);
        }
    }
    host.animationRuns = restored;
    host.animationRunI = Math.max(host.animationRunI, maxI);
}

function rematchOnTilesEntries(
    entries: PersistedCarOnTile[],
    label: string
): Array<{ carId: number; tileX: number; tileY: number }> {
    const rematched: Array<{ carId: number; tileX: number; tileY: number }> = [];
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const carId = resolveCarId({
            rideId: entry.rideId,
            trainIndex: entry.trainIndex,
            carIndex: entry.carIndex
        });
        if (carId === null) {
            error(
                "runtimeState",
                `Could not rematch ${label} ride=${entry.rideId} train=${entry.trainIndex} car=${entry.carIndex}; skipping`
            );
            continue;
        }
        rematched.push({
            carId: carId,
            tileX: entry.tileX,
            tileY: entry.tileY
        });
    }
    return rematched;
}

function restoreCarsOnTiles(entries: PersistedCarOnTile[]): void {
    CarEntersEvent.setCarsOnTilesEntries(rematchOnTilesEntries(entries, "carsOnTiles"));
}

function restoreTrainsOnTiles(entries: PersistedCarOnTile[]): void {
    TrainEntersEvent.setTrainsOnTilesEntries(rematchOnTilesEntries(entries, "trainsOnTiles"));
}

function isRuntimeStateSnapshot(data: unknown): data is RuntimeStateSnapshot {
    if (!data || typeof data !== "object") {
        return false;
    }
    const obj = data as { version?: unknown };
    return obj.version === RUNTIME_STATE_VERSION;
}

/**
 * Restore runtime state from park storage data.
 * Missing / unknown versions leave runtime empty (current cold-start behavior).
 */
export function restoreRuntimeState(host: RuntimeStateHost, data: unknown): void {
    if (data === undefined || data === null) {
        return;
    }
    if (!isRuntimeStateSnapshot(data)) {
        error(
            "runtimeState",
            "Runtime state missing or unsupported version; starting with empty runtime"
        );
        return;
    }

    host.tickCount = typeof data.tickCount === "number" ? data.tickCount : 0;
    host.paused = !!data.paused;
    host.animationRunI = typeof data.animationRunI === "number" ? data.animationRunI : 0;

    restoreRuns(host, Array.isArray(data.runs) ? data.runs : []);
    restoreCarsOnTiles(Array.isArray(data.carsOnTiles) ? data.carsOnTiles : []);
    restoreTrainsOnTiles(Array.isArray(data.trainsOnTiles) ? data.trainsOnTiles : []);
}

export function loadRuntimeStateFromParkStorage(host: RuntimeStateHost): void {
    const data = context.getParkStorage().get(RUNTIME_STATE_KEY, undefined);
    restoreRuntimeState(host, data);
}

export function saveRuntimeStateToParkStorage(host: RuntimeStateHost): void {
    const snapshot = captureRuntimeState(host);
    context.getParkStorage().set(RUNTIME_STATE_KEY, snapshot);
}
