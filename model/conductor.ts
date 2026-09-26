/// <reference path="./../openrct2.d.ts" />

import AnimationsArray from "./animation/animationsArray";
import TriggersArray from "./animation/triggersArray";
import VariablesArray from "./animation/variablesArray";
import BuildingsArray from "./lookInside/buildingsArray";
import TodosArray from "./todos/todosArray";
import AnimationRun from "./animation/animationRun";
import Animation from "./animation/animation";
import createAnimationRun from "./animation/createAnimationRun";
import { STATIC_ANIMATIONS, STATIC_TRIGGERS } from "./staticAnimations";
import { bindFireTrigger } from "./animation/triggerFireLookup";
import { bindFindVariable, bindFindVariableByName } from "./animation/variableLookup";
import { bindMutateVariable } from "./animation/variableMutateLookup";
import { VariableStoredValue } from "./animation/jsonTypes";
import { isNumericVariableType } from "./animation/variable/variable";
import { bindFormulaItems, recomputeAllFormulas } from "./animation/variable/recomputeFormulas";
import Trigger from "./animation/trigger/trigger";
import TriggerContext from "./animation/trigger/triggerContext";
import {
    collectRideIdsForCarTileEvents,
    collectRideIdsForTrainTileEvents,
    prepareRideCarSnapshots,
    prepareRideTrainHeadSnapshots
} from "./animation/trigger/rideCarSnapshot";
import {bindHookInbox, clearHookInbox} from "./animation/trigger/event/hookInbox";
import {withParkLoadPass} from "./animation/trigger/event/parkLoadedEvent";
import {advanceTileEventPollClocks} from "./animation/trigger/event/tileEventPoll";
import {
    loadRuntimeStateFromParkStorage,
    saveRuntimeStateToParkStorage
} from "./animation/runtimeState";
import {
    isParkEditedWithNewerPlugin,
    readLastPluginVersion,
    saveLastPluginVersionStamp
} from "./pluginVersionStamp";
import {error, log} from "./logger";
import {reportTriggerFired} from "./triggerFireFeedback";
import {openVersionMismatchWarning} from "../view/info/versionMismatchWarning";
import {
    bindLookInsideHover,
    onLookInsideMapChange,
    pollLookInsideHover
} from "./lookInside/lookInsideHover";

// *** DEVELOPMENT MODE FLAG ***
// Set to true to use static triggers/animations from staticAnimations.ts
// Set to false to load from park storage (normal behavior)
const USE_STATIC_ANIMATIONS = false;
/** Hard cap so stage-trigger loops cannot unbounded-grow concurrent runs. */
const MAX_CONCURRENT_ANIMATION_RUNS = 1000;

function formatRunContextParts(context: TriggerContext): string[] {
    const parts: string[] = [];
    if (typeof context.trainIndex === "number") {
        parts.push(`train=${context.trainIndex}`);
    }
    if (typeof context.carIndex === "number") {
        parts.push(`car=${context.carIndex}`);
    }
    return parts;
}

function sameCarTarget(a: TriggerContext, b: TriggerContext): boolean {
    return "carId" in a.target && "carId" in b.target && a.target.carId === b.target.carId;
}

function sameTrainContext(a: TriggerContext, b: TriggerContext): boolean {
    return (
        typeof a.rideId === "number" &&
        typeof a.trainIndex === "number" &&
        a.rideId === b.rideId &&
        a.trainIndex === b.trainIndex
    );
}

function sameFireTile(a: TriggerContext, b: TriggerContext): boolean {
    const aTile = a.tile;
    const bTile = b.tile;
    return !!(aTile && bTile && aTile.x === bTile.x && aTile.y === bTile.y);
}

export default class Conductor {
    triggersArray: TriggersArray;
    animationsArray: AnimationsArray;
    variablesArray: VariablesArray;
    buildingsArray: BuildingsArray;
    todosArray: TodosArray;
    tickCount: number = 0;
    animationRuns: AnimationRun[];
    animationRunI: number;
    paused: boolean;

    constructor() {
        this.triggersArray = new TriggersArray();
        this.animationsArray = new AnimationsArray();
        this.variablesArray = new VariablesArray();
        this.buildingsArray = new BuildingsArray();
        this.todosArray = new TodosArray();
        this.animationRuns = [];
        this.animationRunI = 0;
        this.paused = false;
        bindFireTrigger((triggerId, context) => this.fireTrigger(triggerId, context));
        bindFindVariable((id) => this.variablesArray.findById(id));
        bindFindVariableByName((name) => this.variablesArray.findByName(name));
        bindFormulaItems(() => this.variablesArray.items);
        bindMutateVariable((variableId, mode, value) => this.mutateVariable(variableId, mode, value));

        if (USE_STATIC_ANIMATIONS) {
            this.triggersArray.load(STATIC_TRIGGERS);
            this.animationsArray.load(STATIC_ANIMATIONS);
            this.variablesArray.load([]);
            this.buildingsArray.load([]);
            this.todosArray.load([]);
        } else {
            this.triggersArray.load(false);
            // AnimationsArray.load normalizes/migrates lift-drop heights and may save.
            this.animationsArray.load(false);
            this.variablesArray.load(false);
            this.buildingsArray.load(false);
            this.todosArray.load(false);
        }
        if (recomputeAllFormulas(this.variablesArray.items)) {
            this.variablesArray.save();
        }

        // Restore runs / side-state before any tick can fire (avoids singleImmediate duplicates).
        loadRuntimeStateFromParkStorage(this);
        // UI used to set paused while the Animator window was open; that value was
        // persisted and could leave the park stuck not starting animations.
        this.paused = false;

        // Once per park session, after saved runs are restored and before the first tick.
        this.fireParkLoadedTriggers();

        if (typeof ui !== "undefined" && isParkEditedWithNewerPlugin()) {
            const parkVersion = readLastPluginVersion();
            if (parkVersion !== undefined) {
                openVersionMismatchWarning(parkVersion);
            }
        }

        bindLookInsideHover(this.buildingsArray);

        context.subscribe("map.save", () => {
            saveRuntimeStateToParkStorage(this);
            saveLastPluginVersionStamp();
        });
        context.subscribe("map.change", () => {
            onLookInsideMapChange();
        });
        context.subscribe('interval.tick', this.tick.bind(this));
        bindHookInbox();
    }

    /**
     * Set a park variable's current value (coerced by type).
     * Returns true if the stored value changed. Caller is responsible for save().
     */
    setVariableValue(id: string, value: VariableStoredValue): boolean {
        const variable = this.variablesArray.findById(id);
        if (!variable) {
            error("variable", `Variable "${id}" not found`);
            return false;
        }
        if (variable.isFormula()) {
            return false;
        }
        const changed = variable.setValue(value);
        if (changed) {
            recomputeAllFormulas(this.variablesArray.items);
        }
        return changed;
    }

    /**
     * Mutate a variable from an animation step. Saves when the value changes.
     */
    mutateVariable(
        id: string,
        mode: "set" | "increment" | "decrement",
        value: VariableStoredValue
    ): boolean {
        const variable = this.variablesArray.findById(id);
        if (!variable) {
            error("variable", `Variable "${id}" not found`);
            return false;
        }
        if (variable.isFormula()) {
            error("variable", `Cannot ${mode} formula variable "${id}"`);
            return false;
        }

        let next: VariableStoredValue;
        if (mode === "set") {
            next = value;
        } else {
            if (!isNumericVariableType(variable.valueType)) {
                error(
                    "variable",
                    `Cannot ${mode} ${variable.valueType} variable "${id}"`
                );
                return false;
            }
            const current = typeof variable.value === "number" ? variable.value : Number(variable.value);
            const amount = typeof value === "number" ? value : Number(value);
            if (isNaN(current) || isNaN(amount)) {
                error("variable", `Invalid numeric ${mode} for "${id}"`);
                return false;
            }
            next = mode === "increment" ? current + amount : current - amount;
        }

        const changed = variable.setValue(next);
        if (changed) {
            recomputeAllFormulas(this.variablesArray.items);
            this.variablesArray.save();
        }
        return changed;
    }

    /**
     * Reset one variable's current value to its default. Returns true if changed.
     */
    resetVariableToDefault(id: string): boolean {
        const variable = this.variablesArray.findById(id);
        if (!variable) {
            error("variable", `Variable "${id}" not found`);
            return false;
        }
        if (variable.isFormula()) {
            return false;
        }
        const changed = variable.resetToDefault();
        if (changed) {
            recomputeAllFormulas(this.variablesArray.items);
        }
        return changed;
    }

    /**
     * Reset every variable's current value to its default.
     * Returns how many variables changed. Caller is responsible for save().
     */
    resetAllVariables(): number {
        let changed = 0;
        for (let i = 0; i < this.variablesArray.items.length; i++) {
            if (this.variablesArray.items[i].isFormula()) {
                continue;
            }
            if (this.variablesArray.items[i].resetToDefault()) {
                changed += 1;
            }
        }
        if (changed > 0) {
            recomputeAllFormulas(this.variablesArray.items);
        }
        return changed;
    }

    reset() {
        this.animationRuns = [];
        this.animationRunI = 0;
        this.tickCount = 0;
    }

    tick(): void {
        this.tickCount += 1;
        if (this.tickCount === 1000) {
            this.tickCount = 0;
        }

        // One walk per watched ride; tile events read the snapshot.
        // carEnters walks every car; trainEnters walks train heads only (unless
        // the same ride already has a full car walk this tick).
        // Advance poll clocks first so collect/tryFire agree on which events are due.
        advanceTileEventPollClocks(this.triggersArray.items);
        const carRideIds = collectRideIdsForCarTileEvents(this.triggersArray.items);
        const trainRideIds = collectRideIdsForTrainTileEvents(this.triggersArray.items);
        prepareRideCarSnapshots(carRideIds);
        prepareRideTrainHeadSnapshots(trainRideIds, carRideIds);

        for (let i = 0; i < this.triggersArray.items.length; i++) {
            this.maybeFireEventedTrigger(this.triggersArray.items[i]);
        }
        clearHookInbox();

        if (!this.paused) {
            for (let i = 0; i < this.animationRuns.length; i++) {
                this.maybeIterateRun(this.animationRuns[i]);
            }
        }

        pollLookInsideHover(this.tickCount);
    }

    /**
     * Park Loaded triggers only. Other events stay on the tick poll.
     */
    fireParkLoadedTriggers(): void {
        withParkLoadPass(() => {
            for (let i = 0; i < this.triggersArray.items.length; i++) {
                const trigger = this.triggersArray.items[i];
                if (!trigger.event || trigger.event.type !== "parkLoaded") {
                    continue;
                }
                this.maybeFireEventedTrigger(trigger);
            }
        });
    }

    maybeFireEventedTrigger(trigger: Trigger): void {
        try {
            const contexts = trigger.tryFireFromEvent();
            for (let i = 0; i < contexts.length; i++) {
                reportTriggerFired(trigger.id, trigger.name, contexts[i]);
                if (this.paused) {
                    log(
                        "animation",
                        `Trigger "${trigger.name}" fired but animations skipped (conductor paused)`,
                        {triggerId: trigger.id}
                    );
                    continue;
                }
                this.startTriggerAnimations(trigger, contexts[i]);
            }
        } catch (e) {
            error(
                "tick",
                `Trigger "${trigger.name}" failed while polling event`,
                e,
                {triggerId: trigger.id}
            );
        }
    }

    fireTrigger(triggerId: string, context: TriggerContext): void {
        try {
            const trigger = this.triggersArray.findById(triggerId);
            if (!trigger) {
                error("fireTrigger", `Trigger "${triggerId}" not found`);
                return;
            }
            const passed = trigger.tryFireWithContext(context);
            if (!passed) {
                return;
            }
            reportTriggerFired(trigger.id, trigger.name, passed);
            if (this.paused) {
                log(
                    "animation",
                    `Trigger "${trigger.name}" fired but animations skipped (conductor paused)`,
                    {triggerId: trigger.id}
                );
                return;
            }
            this.startTriggerAnimations(trigger, passed);
        } catch (e) {
            error("fireTrigger", `Trigger "${triggerId}" failed`, e, {
                triggerId: triggerId
            });
        }
    }

    startTriggerAnimations(trigger: Trigger, context: TriggerContext): void {
        if (trigger.animationIds.length === 0) {
            log(
                "animation",
                `Trigger "${trigger.name}" fired with no linked animations`,
                {triggerId: trigger.id}
            );
            return;
        }
        for (let i = 0; i < trigger.animationIds.length; i++) {
            const animationId = trigger.animationIds[i];
            try {
                const animation = this.animationsArray.findById(animationId);
                if (!animation) {
                    error(
                        "trigger",
                        `Animation "${animationId}" not found for trigger "${trigger.name}"`,
                        undefined,
                        {triggerId: trigger.id, animationId: animationId}
                    );
                    continue;
                }
                this.maybeStartRun(animation, context, trigger);
            } catch (e) {
                error(
                    "trigger",
                    `Failed starting animation "${animationId}" for trigger "${trigger.name}"`,
                    e,
                    {triggerId: trigger.id, animationId: animationId}
                );
            }
        }
    }

    maybeStartRun(
        animation: Animation,
        context: TriggerContext,
        trigger?: Trigger
    ): void {
        const triggerId = trigger ? trigger.id : undefined;
        if (this.animationRuns.length >= MAX_CONCURRENT_ANIMATION_RUNS) {
            log(
                "animation",
                `Animation "${animation.name}" start refused (concurrent run cap ${MAX_CONCURRENT_ANIMATION_RUNS})`,
                {
                    kind: "message",
                    animationId: animation.id,
                    triggerId: triggerId,
                    trainIndex: context.trainIndex,
                    carIndex: context.carIndex
                }
            );
            return;
        }
        if (this.isRunningAnimationWithContext(animation, context, trigger)) {
            log(
                "animation",
                `Animation "${animation.name}" start skipped (already running)`,
                {
                    kind: "message",
                    animationId: animation.id,
                    triggerId: triggerId,
                    trainIndex: context.trainIndex,
                    carIndex: context.carIndex
                }
            );
            return;
        }
        const animationRun = createAnimationRun(this.animationRunI, animation, context);
        if (trigger) {
            animationRun.sourceTriggerId = trigger.id;
            animationRun.sourceTriggerName = trigger.name;
        }
        this.animationRuns.push(animationRun);
        this.animationRunI += 1;
        const parts = [
            `Animation "${animation.name}" started`,
            ...formatRunContextParts(context)
        ];
        log("animation", parts.join(" "), {
            kind: "animationStarted",
            animationId: animation.id,
            triggerId: triggerId,
            trainIndex: context.trainIndex,
            carIndex: context.carIndex
        });
    }

    /**
     * Car Enters: skip only if that car already has this animation on the same fire tile.
     * Train Enters: skip only if that train already has this animation on the same fire tile.
     * Other events: same target, or same ride/train when neither fire has a tile.
     */
    isRunningAnimationWithContext(
        animation: Animation,
        context: TriggerContext,
        trigger?: Trigger
    ): boolean {
        const eventType = trigger && trigger.event ? trigger.event.type : undefined;
        const target = context.target;
        for (let i = 0; i < this.animationRuns.length; i++) {
            const run = this.animationRuns[i];
            if (typeof run === "undefined") {
                continue;
            }
            if (run.animation.id !== animation.id) {
                continue;
            }
            const existing = run.triggerContext;
            if (eventType === "carEnters") {
                if (sameCarTarget(context, existing) && sameFireTile(context, existing)) {
                    return true;
                }
                continue;
            }
            if (eventType === "trainEnters") {
                if (sameTrainContext(context, existing) && sameFireTile(context, existing)) {
                    return true;
                }
                continue;
            }
            if (JSON.stringify(target) === JSON.stringify(run.target)) {
                return true;
            }
            if (sameTrainContext(context, existing)) {
                const aTile = context.tile;
                const bTile = existing.tile;
                if (aTile && bTile) {
                    if (aTile.x === bTile.x && aTile.y === bTile.y) {
                        return true;
                    }
                } else if (!aTile && !bTile) {
                    return true;
                }
            }
        }
        return false;
    }

    maybeIterateRun(animationRun: AnimationRun): void {
        if (typeof(animationRun) === 'undefined') {
            return;
        }

        try {
            animationRun.tick();
            if (!animationRun.state.running) {
                this.logAnimationConcluded(animationRun);
                this.removeAnimationRun(animationRun);
            }
        } catch (e) {
            animationRun.state.endReason = "error";
            error(
                "tick",
                `Animation run "${animationRun.animation.name}" failed; removing run`,
                e,
                {
                    animationId: animationRun.animation.id,
                    triggerId: animationRun.sourceTriggerId,
                    trainIndex: animationRun.triggerContext.trainIndex,
                    carIndex: animationRun.triggerContext.carIndex
                }
            );
            this.logAnimationConcluded(animationRun);
            this.removeAnimationRun(animationRun);
        }
    }

    private logAnimationConcluded(animationRun: AnimationRun): void {
        const reason = animationRun.state.endReason || "complete";
        const context = animationRun.triggerContext;
        let message =
            `Animation "${animationRun.animation.name}" concluded (${reason})`;
        if (animationRun.state.endDetail) {
            message += `: ${animationRun.state.endDetail}`;
        }
        const parts = [message, ...formatRunContextParts(context)];
        log("animation", parts.join(" "), {
            kind: "animationConcluded",
            animationId: animationRun.animation.id,
            triggerId: animationRun.sourceTriggerId,
            trainIndex: context.trainIndex,
            carIndex: context.carIndex
        });
    }

    removeAnimationRun(animationRun: AnimationRun): void {
        let newRuns: AnimationRun[] = [];
        let i:number;
        let ln = this.animationRuns.length;
        let animationRunI:AnimationRun;

        for (i = 0; i < ln; i += 1) {
            animationRunI = this.animationRuns[i];
            if (animationRunI !== animationRun) {
                newRuns.push(animationRunI);
            }
        }

        this.animationRuns = newRuns;
    }
}
