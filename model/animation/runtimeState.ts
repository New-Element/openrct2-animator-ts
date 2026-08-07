/// <reference path="./../../openrct2.d.ts" />

import reportPluginError from "../reportPluginError";
import Animation from "./animation";
import AnimationRun from "./animationRun";
import {AnimationTarget} from "./animationTarget";
import AnimationState from "./animationState";
import createAnimationRun from "./createAnimationRun";
import {
    getStaffName,
    identifyCar,
    resolveCarId,
    resolveStaffIdByName
} from "./entityRematch";
import CarEntersEvent from "./trigger/event/carEntersEvent";
import TriggerContext from "./trigger/triggerContext";

export const RUNTIME_STATE_KEY = "animator.runtimeState";
export const RUNTIME_STATE_VERSION = 2;

export type RuntimeTargetKind = "car" | "tile" | "static" | "staff";

export interface PersistedRunContext {
    targetKind: RuntimeTargetKind;
    rideId?: number;
    trainIndex?: number;
    carIndex?: number;
    staffName?: string;
    tile?: { x: number; y: number };
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
    return null;
}

function persistRunContext(context: TriggerContext): PersistedRunContext | null {
    const kind = targetKindOf(context.target);
    if (!kind) {
        reportPluginError("runtimeState", "Cannot persist run with unknown target kind");
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
                return persisted;
            }
            reportPluginError(
                "runtimeState",
                `Cannot identify car ${carId} for run persistence; skipping run`
            );
            return null;
        }
        persisted.rideId = identity.rideId;
        persisted.trainIndex = identity.trainIndex;
        persisted.carIndex = identity.carIndex;
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
        return persisted;
    }

    if (kind === "static") {
        return persisted;
    }

    const staffId = (context.target as { staffId: number }).staffId;
    const staffName = getStaffName(staffId);
    if (!staffName) {
        reportPluginError(
            "runtimeState",
            `Cannot resolve staff name for id ${staffId}; skipping run`
        );
        return null;
    }
    persisted.staffName = staffName;
    return persisted;
}

function restoreTriggerContext(persisted: PersistedRunContext): TriggerContext | null {
    if (persisted.targetKind === "car") {
        if (
            typeof persisted.rideId !== "number" ||
            typeof persisted.trainIndex !== "number" ||
            typeof persisted.carIndex !== "number"
        ) {
            reportPluginError("runtimeState", "Car run missing ride/train/car identity; skipping");
            return null;
        }
        const carId = resolveCarId({
            rideId: persisted.rideId,
            trainIndex: persisted.trainIndex,
            carIndex: persisted.carIndex
        });
        if (carId === null) {
            reportPluginError(
                "runtimeState",
                `Could not rematch car ride=${persisted.rideId} train=${persisted.trainIndex} car=${persisted.carIndex}; skipping run`
            );
            return null;
        }
        return {
            target: { carId: carId },
            rideId: persisted.rideId,
            trainIndex: persisted.trainIndex,
            carIndex: persisted.carIndex
        };
    }

    if (persisted.targetKind === "tile") {
        if (!persisted.tile) {
            reportPluginError("runtimeState", "Tile run missing tile; skipping");
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
        return ctx;
    }

    if (persisted.targetKind === "static") {
        return {
            target: { static: true }
        };
    }

    if (persisted.targetKind === "staff") {
        if (!persisted.staffName) {
            reportPluginError("runtimeState", "Staff run missing staffName; skipping");
            return null;
        }
        const staffId = resolveStaffIdByName(persisted.staffName);
        if (staffId === null) {
            reportPluginError(
                "runtimeState",
                `Could not rematch staff named "${persisted.staffName}"; skipping run`
            );
            return null;
        }
        return {
            target: { staffId: staffId }
        };
    }

    reportPluginError("runtimeState", `Unknown targetKind "${(persisted as PersistedRunContext).targetKind}"; skipping run`);
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
                hasRun: run.state.hasRun
            },
            context: context
        });
    }
    return runs;
}

function captureCarsOnTiles(): PersistedCarOnTile[] {
    const raw = CarEntersEvent.getCarsOnTilesEntries();
    const out: PersistedCarOnTile[] = [];
    for (let i = 0; i < raw.length; i++) {
        const entry = raw[i];
        const identity = identifyCar(entry.carId);
        if (!identity) {
            reportPluginError(
                "runtimeState",
                `Cannot identify car ${entry.carId} on tile (${entry.tileX},${entry.tileY}); skipping`
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

export function captureRuntimeState(host: RuntimeStateHost): RuntimeStateSnapshot {
    return {
        version: RUNTIME_STATE_VERSION,
        tickCount: host.tickCount,
        paused: host.paused,
        animationRunI: host.animationRunI,
        runs: captureRuns(host),
        carsOnTiles: captureCarsOnTiles()
    };
}

function restoreRuns(host: RuntimeStateHost, runs: PersistedRun[]): void {
    const restored: AnimationRun[] = [];
    let maxI = host.animationRunI;
    for (let i = 0; i < runs.length; i++) {
        const persisted = runs[i];
        const animation = host.animationsArray.findById(persisted.animationId);
        if (!animation) {
            reportPluginError(
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
            hasRun: persisted.state.hasRun
        };
        if (run.state.running) {
            restored.push(run);
        }
    }
    host.animationRuns = restored;
    host.animationRunI = Math.max(host.animationRunI, maxI);
}

function restoreCarsOnTiles(entries: PersistedCarOnTile[]): void {
    const rematched: Array<{ carId: number; tileX: number; tileY: number }> = [];
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const carId = resolveCarId({
            rideId: entry.rideId,
            trainIndex: entry.trainIndex,
            carIndex: entry.carIndex
        });
        if (carId === null) {
            reportPluginError(
                "runtimeState",
                `Could not rematch carsOnTiles ride=${entry.rideId} train=${entry.trainIndex} car=${entry.carIndex}; skipping`
            );
            continue;
        }
        rematched.push({
            carId: carId,
            tileX: entry.tileX,
            tileY: entry.tileY
        });
    }
    CarEntersEvent.setCarsOnTilesEntries(rematched);
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
        reportPluginError(
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

    console.log(
        `[Animator] Restored runtime state: ${host.animationRuns.length} runs, tickCount=${host.tickCount}`
    );
}

export function loadRuntimeStateFromParkStorage(host: RuntimeStateHost): void {
    const data = context.getParkStorage().get(RUNTIME_STATE_KEY, undefined);
    restoreRuntimeState(host, data);
}

export function saveRuntimeStateToParkStorage(host: RuntimeStateHost): void {
    const snapshot = captureRuntimeState(host);
    context.getParkStorage().set(RUNTIME_STATE_KEY, snapshot);
}
