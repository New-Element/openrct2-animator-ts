/// <reference path="./../../openrct2.d.ts" />

import TileCoords from "../../game/tileCoords";

// --- Trigger events ---

export interface TriggerEventDescBase {
    type: string;
}

export interface CarEntersEventDesc extends TriggerEventDescBase {
    type: "carEnters";
    rideId: number;
    tile: TileCoords;
}

/** @deprecated Soft-loaded as carEnters; kept for reading old park storage. */
export interface VehicleEntersEventDesc extends TriggerEventDescBase {
    type: "vehicleEnters";
    rideId: number;
    tile: TileCoords;
    detect?: "car" | "train";
}

export interface SingleImmediateEventDesc extends TriggerEventDescBase {
    type: "singleImmediate";
}

export interface StaffEventDesc extends TriggerEventDescBase {
    type: "staff";
    staffId: number;
}

export interface VariableChangeEventDesc extends TriggerEventDescBase {
    type: "variableChange";
    variableId: string;
}

export type TriggerEventDesc =
    | CarEntersEventDesc
    | VehicleEntersEventDesc
    | SingleImmediateEventDesc
    | StaffEventDesc
    | VariableChangeEventDesc
    | TriggerEventDescBase;

// --- Park variables ---

export type VariableValueType = "int" | "float" | "string";

export interface VariableDesc {
    id: string;
    name: string;
    valueType: VariableValueType;
    value: number | string;
    defaultValue: number | string;
}

// --- Conditions ---

export interface ConditionDescBase {
    type: string;
}

export interface TrainModuloConditionDesc extends ConditionDescBase {
    type: "trainModulo";
    modulo: number;
    remainder: number;
}

export interface CarModuloConditionDesc extends ConditionDescBase {
    type: "carModulo";
    modulo: number;
    remainder: number;
}

export interface CarEqualsConditionDesc extends ConditionDescBase {
    type: "carEquals";
    value: number;
}

export interface RideOpenConditionDesc extends ConditionDescBase {
    type: "rideOpen";
    rideId?: number;
}

export type ConditionDesc =
    | TrainModuloConditionDesc
    | CarModuloConditionDesc
    | CarEqualsConditionDesc
    | RideOpenConditionDesc;
// --- Top-level trigger ---

export interface TriggerDesc {
    id: string;
    name: string;
    event: TriggerEventDesc | null;
    conditions?: ConditionDesc[];
    animationIds: string[];
}

// --- Animation steps ---

export interface StepDescBase {
    type: string;
}

export interface WaitStepDesc extends StepDescBase {
    type: "wait";
    ticks: number;
}

/** Shared vehicle targeting for steps that act on a car/train. */
export interface VehicleTargetDesc {
    /** When true/omitted, use the car from the trigger that started the run. */
    useTriggerTarget?: boolean;
    rideId?: number;
    /** 0-based index into ride.vehicles (train head). */
    trainIndex?: number;
    /** 0-based index along the train; car-scoped steps only. */
    carIndex?: number;
}

export interface CarEditColourStepDesc extends StepDescBase, VehicleTargetDesc {
    type: "carEditColour";
    value: VehicleColour;
}

export interface TrainEditColourStepDesc extends StepDescBase, VehicleTargetDesc {
    type: "trainEditColour";
    value: VehicleColour;
}

export interface VariableSetStepDesc extends StepDescBase {
    type: "variableSet";
    variableId: string;
    value: number | string;
}

export interface VariableIncrementStepDesc extends StepDescBase {
    type: "variableIncrement";
    variableId: string;
    amount: number;
}

export interface VariableDecrementStepDesc extends StepDescBase {
    type: "variableDecrement";
    variableId: string;
    amount: number;
}

export interface TrackSetHeightStepDesc extends StepDescBase {
    type: "trackSetHeight";
    tile: TileCoords;
    rideId: number;
    trackType: number;
    baseHeight: number;
}

export interface EntityCoordsOverTimeStepDesc extends StepDescBase {
    deltaX?: number;
    deltaY?: number;
    deltaZ?: number;
    durationTicks: number;
}

export interface CarCoordsOverTimeStepDesc extends EntityCoordsOverTimeStepDesc {
    type: "carCoordsOverTime";
}

export interface TrainCoordsOverTimeStepDesc extends EntityCoordsOverTimeStepDesc {
    type: "trainCoordsOverTime";
}

export type StepDesc =
    | WaitStepDesc
    | CarEditColourStepDesc
    | TrainEditColourStepDesc
    | VariableSetStepDesc
    | VariableIncrementStepDesc
    | VariableDecrementStepDesc
    | TrackSetHeightStepDesc
    | CarCoordsOverTimeStepDesc
    | TrainCoordsOverTimeStepDesc;

export interface AnimationDesc {
    id: string;
    name?: string;
    steps?: StepDesc[];
    /** @deprecated Legacy frame timeline; soft-loaded as empty steps. */
    frames?: unknown;
}

export interface AnimatorDocumentDesc {
    triggers: TriggerDesc[];
    animations: AnimationDesc[];
    variables?: VariableDesc[];
}
