import {error} from "../../logger";
import {setScriptRoofMode} from "../../lookInside/scriptRoofMode";
import {VariableStoredValue} from "../jsonTypes";
import {findVariableByName} from "../variableLookup";
import {mutateVariable} from "../variableMutateLookup";
import {logMetaFromRun} from "./stepHelpers";
import StepRunContext from "./stepRunContext";

export type AnimatorRunSnapshot = {
    animationId?: string;
    animationName?: string;
    rideId?: number;
    trainIndex?: number;
    carIndex?: number;
    tile?: {x: number; y: number};
    guestId?: number;
    vehicleId?: number;
    weather?: string;
    day?: number;
    month?: number;
    year?: number;
    variableId?: string;
    variableValue?: VariableStoredValue;
    breakdownReason?: string;
    crashIntoType?: string;
};

export type AnimatorApi = {
    get: (name: string) => VariableStoredValue | undefined;
    set: (name: string, value: VariableStoredValue) => boolean;
    /** "showAll", "hideAll", or "cursorHover". Same change as Shift+A. */
    setRoofMode: (mode: string) => boolean;
    run: AnimatorRunSnapshot;
};

type RunWithAnimation = StepRunContext & {
    animation?: {id: string; name: string};
};

function copyRunSnapshot(run: StepRunContext): AnimatorRunSnapshot {
    const withAnim = run as RunWithAnimation;
    const ctx = run.triggerContext;
    const snapshot: AnimatorRunSnapshot = {};
    if (withAnim.animation) {
        snapshot.animationId = withAnim.animation.id;
        snapshot.animationName = withAnim.animation.name;
    }
    if (typeof ctx.rideId === "number") {
        snapshot.rideId = ctx.rideId;
    }
    if (typeof ctx.trainIndex === "number") {
        snapshot.trainIndex = ctx.trainIndex;
    }
    if (typeof ctx.carIndex === "number") {
        snapshot.carIndex = ctx.carIndex;
    }
    if (ctx.tile) {
        snapshot.tile = {x: ctx.tile.x, y: ctx.tile.y};
    }
    if (typeof ctx.guestId === "number") {
        snapshot.guestId = ctx.guestId;
    }
    if (typeof ctx.vehicleId === "number") {
        snapshot.vehicleId = ctx.vehicleId;
    }
    if (typeof ctx.weather === "string") {
        snapshot.weather = ctx.weather;
    }
    if (typeof ctx.day === "number") {
        snapshot.day = ctx.day;
    }
    if (typeof ctx.month === "number") {
        snapshot.month = ctx.month;
    }
    if (typeof ctx.year === "number") {
        snapshot.year = ctx.year;
    }
    if (typeof ctx.variableId === "string") {
        snapshot.variableId = ctx.variableId;
    }
    if (ctx.variableValue !== undefined) {
        snapshot.variableValue = ctx.variableValue;
    }
    if (typeof ctx.breakdownReason === "string") {
        snapshot.breakdownReason = ctx.breakdownReason;
    }
    if (typeof ctx.crashIntoType === "string") {
        snapshot.crashIntoType = ctx.crashIntoType;
    }
    return snapshot;
}

export function createAnimatorApi(run: StepRunContext): AnimatorApi {
    return {
        get(name: string): VariableStoredValue | undefined {
            const variable = findVariableByName(name);
            if (!variable) {
                return undefined;
            }
            return variable.value;
        },
        set(name: string, value: VariableStoredValue): boolean {
            const variable = findVariableByName(name);
            if (!variable) {
                error(
                    "step",
                    `Custom Javascript: variable "${name}" not found`,
                    undefined,
                    logMetaFromRun(run)
                );
                return false;
            }
            return mutateVariable(variable.id, "set", value);
        },
        setRoofMode(mode: string): boolean {
            return setScriptRoofMode(mode);
        },
        run: copyRunSnapshot(run)
    };
}
