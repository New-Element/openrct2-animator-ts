/// <reference path="./../openrct2.d.ts" />

import AnimationsArray from "./animation/animationsArray";
import TriggersArray from "./animation/triggersArray";
import VariablesArray from "./animation/variablesArray";
import AnimationRun from "./animation/animationRun";
import Animation from "./animation/animation";
import createAnimationRun from "./animation/createAnimationRun";
import { STATIC_ANIMATIONS, STATIC_TRIGGERS } from "./staticAnimations";
import { bindFireTrigger } from "./animation/triggerFireLookup";
import { bindFindVariable } from "./animation/variableLookup";
import { bindMutateVariable } from "./animation/variableMutateLookup";
import Trigger from "./animation/trigger/trigger";
import TriggerContext from "./animation/trigger/triggerContext";
import {
    collectRideIdsForCarTileEvents,
    collectRideIdsForTrainTileEvents,
    prepareRideCarSnapshots,
    prepareRideTrainHeadSnapshots
} from "./animation/trigger/rideCarSnapshot";
import {
    loadRuntimeStateFromParkStorage,
    saveRuntimeStateToParkStorage
} from "./animation/runtimeState";
import {
    isParkEditedWithNewerPlugin,
    readLastPluginVersion,
    saveLastPluginVersionStamp
} from "./pluginVersionStamp";
import reportPluginError from "./reportPluginError";
import {reportTriggerFired} from "./triggerFireFeedback";
import {openVersionMismatchWarning} from "../view/info/versionMismatchWarning";

// *** DEVELOPMENT MODE FLAG ***
// Set to true to use static triggers/animations from staticAnimations.ts
// Set to false to load from park storage (normal behavior)
const USE_STATIC_ANIMATIONS = false;

export default class Conductor {
    triggersArray: TriggersArray;
    animationsArray: AnimationsArray;
    variablesArray: VariablesArray;
    tickCount: number = 0;
    animationRuns: AnimationRun[];
    animationRunI: number;
    paused: boolean;

    constructor() {
        this.triggersArray = new TriggersArray();
        this.animationsArray = new AnimationsArray();
        this.variablesArray = new VariablesArray();
        this.animationRuns = [];
        this.animationRunI = 0;
        this.paused = false;
        bindFireTrigger((triggerId, context) => this.fireTrigger(triggerId, context));
        bindFindVariable((id) => this.variablesArray.findById(id));
        bindMutateVariable((variableId, mode, value) => this.mutateVariable(variableId, mode, value));

        if (USE_STATIC_ANIMATIONS) {
            console.log('[Animator] Loading STATIC triggers and animations for development');
            this.triggersArray.load(STATIC_TRIGGERS);
            this.animationsArray.load(STATIC_ANIMATIONS);
            this.variablesArray.load([]);
            console.log(`[Animator] Loaded ${this.triggersArray.items.length} triggers, ${this.animationsArray.items.length} animations`);
        } else {
            console.log('[Animator] Loading triggers, animations, and variables from park storage');
            this.triggersArray.load(false);
            // AnimationsArray.load normalizes/migrates lift-drop heights and may save.
            this.animationsArray.load(false);
            this.variablesArray.load(false);
        }

        // Restore runs / side-state before any tick can fire (avoids singleImmediate duplicates).
        loadRuntimeStateFromParkStorage(this);

        if (typeof ui !== "undefined" && isParkEditedWithNewerPlugin()) {
            const parkVersion = readLastPluginVersion();
            if (parkVersion !== undefined) {
                openVersionMismatchWarning(parkVersion);
            }
        }

        context.subscribe("map.save", () => {
            saveRuntimeStateToParkStorage(this);
            saveLastPluginVersionStamp();
        });
        context.subscribe('interval.tick', this.tick.bind(this));
    }

    /**
     * Set a park variable's current value (coerced by type).
     * Returns true if the stored value changed. Caller is responsible for save().
     */
    setVariableValue(id: string, value: number | string): boolean {
        const variable = this.variablesArray.findById(id);
        if (!variable) {
            reportPluginError("variable", `Variable "${id}" not found`);
            return false;
        }
        return variable.setValue(value);
    }

    /**
     * Mutate a variable from an animation step. Saves when the value changes.
     */
    mutateVariable(
        id: string,
        mode: "set" | "increment" | "decrement",
        value: number | string
    ): boolean {
        const variable = this.variablesArray.findById(id);
        if (!variable) {
            reportPluginError("variable", `Variable "${id}" not found`);
            return false;
        }

        let next: number | string;
        if (mode === "set") {
            next = value;
        } else {
            if (variable.valueType === "string") {
                reportPluginError(
                    "variable",
                    `Cannot ${mode} string variable "${id}"`
                );
                return false;
            }
            const current = typeof variable.value === "number" ? variable.value : Number(variable.value);
            const amount = typeof value === "number" ? value : Number(value);
            if (isNaN(current) || isNaN(amount)) {
                reportPluginError("variable", `Invalid numeric ${mode} for "${id}"`);
                return false;
            }
            next = mode === "increment" ? current + amount : current - amount;
        }

        const changed = variable.setValue(next);
        if (changed) {
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
            reportPluginError("variable", `Variable "${id}" not found`);
            return false;
        }
        return variable.resetToDefault();
    }

    /**
     * Reset every variable's current value to its default.
     * Returns how many variables changed. Caller is responsible for save().
     */
    resetAllVariables(): number {
        let changed = 0;
        for (let i = 0; i < this.variablesArray.items.length; i++) {
            if (this.variablesArray.items[i].resetToDefault()) {
                changed += 1;
            }
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
        const carRideIds = collectRideIdsForCarTileEvents(this.triggersArray.items);
        const trainRideIds = collectRideIdsForTrainTileEvents(this.triggersArray.items);
        prepareRideCarSnapshots(carRideIds);
        prepareRideTrainHeadSnapshots(trainRideIds, carRideIds);

        // Always poll events so the edit-trigger UI can show fire feedback while paused.
        for (let i = 0; i < this.triggersArray.items.length; i++) {
            this.maybeFireEventedTrigger(this.triggersArray.items[i]);
        }

        if (this.paused) {
            return;
        }

        for (let i = 0; i < this.animationRuns.length; i++) {
            this.maybeIterateRun(this.animationRuns[i]);
        }
    }

    maybeFireEventedTrigger(trigger: Trigger): void {
        try {
            const contexts = trigger.tryFireFromEvent();
            for (let i = 0; i < contexts.length; i++) {
                reportTriggerFired(trigger.id, contexts[i]);
                if (!this.paused) {
                    this.startTriggerAnimations(trigger, contexts[i]);
                }
            }
        } catch (e) {
            reportPluginError("tick", `Trigger "${trigger.id}" failed while polling event`, e);
        }
    }

    fireTrigger(triggerId: string, context: TriggerContext): void {
        try {
            const trigger = this.triggersArray.findById(triggerId);
            if (!trigger) {
                reportPluginError("fireTrigger", `Trigger "${triggerId}" not found`);
                return;
            }
            const passed = trigger.tryFireWithContext(context);
            if (!passed) {
                return;
            }
            reportTriggerFired(trigger.id, passed);
            if (!this.paused) {
                this.startTriggerAnimations(trigger, passed);
            }
        } catch (e) {
            reportPluginError("fireTrigger", `Trigger "${triggerId}" failed`, e);
        }
    }

    startTriggerAnimations(trigger: Trigger, context: TriggerContext): void {
        for (let i = 0; i < trigger.animationIds.length; i++) {
            const animationId = trigger.animationIds[i];
            try {
                const animation = this.animationsArray.findById(animationId);
                if (!animation) {
                    reportPluginError(
                        "trigger",
                        `Animation "${animationId}" not found for trigger "${trigger.id}"`
                    );
                    continue;
                }
                this.maybeStartRun(animation, context);
            } catch (e) {
                reportPluginError(
                    "trigger",
                    `Failed starting animation "${animationId}" for trigger "${trigger.id}"`,
                    e
                );
            }
        }
    }

    maybeStartRun(animation: Animation, context: TriggerContext): void {
        if (!this.isRunningAnimationWithContext(animation, context)) {
            const animationRun = createAnimationRun(this.animationRunI, animation, context);
            this.animationRuns.push(animationRun);
            this.animationRunI += 1;
        }
    }

    /**
     * True if this animation is already running for the same target, or (for car
     * triggers) the same ride/train — and same trigger tile when both have one.
     * Prevents two cars of one train starting duplicate lift/coords runs.
     */
    isRunningAnimationWithContext(animation: Animation, context: TriggerContext): boolean {
        const target = context.target;
        for (let i = 0; i < this.animationRuns.length; i++) {
            const run = this.animationRuns[i];
            if (typeof run === "undefined") {
                continue;
            }
            if (run.animation.id !== animation.id) {
                continue;
            }
            if (JSON.stringify(target) === JSON.stringify(run.target)) {
                return true;
            }
            if (
                "carId" in target &&
                "carId" in run.target &&
                typeof context.rideId === "number" &&
                typeof context.trainIndex === "number" &&
                context.rideId === run.triggerContext.rideId &&
                context.trainIndex === run.triggerContext.trainIndex
            ) {
                const aTile = context.tile;
                const bTile = run.triggerContext.tile;
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
                this.removeAnimationRun(animationRun);
            }
        } catch (e) {
            reportPluginError(
                "tick",
                `Animation run "${animationRun.animation.id}" failed; removing run`,
                e
            );
            this.removeAnimationRun(animationRun);
        }
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
