/// <reference path="./../../openrct2.d.ts" />

import TileCoords from "../../game/tileCoords";

// --- Trigger events ---

export interface TriggerEventDescBase {
    type: string;
}

/** Travel direction along the track. Missing on old saves = either. */
export type TravelDirection = "forwards" | "backwards" | "either";

export interface CarEntersEventDesc extends TriggerEventDescBase {
    type: "carEnters";
    rideId: number;
    tiles: TileCoords[];
    /** @deprecated Soft-loaded into tiles; kept for reading old park storage. */
    tile?: TileCoords;
    /** Missing = either. */
    direction?: TravelDirection;
    /** Ticks between location checks. Missing or invalid = 1 (every tick). */
    checkEveryTicks?: number;
}

export interface TrainEntersEventDesc extends TriggerEventDescBase {
    type: "trainEnters";
    rideId: number;
    tiles: TileCoords[];
    /** @deprecated Soft-loaded into tiles; kept for reading old park storage. */
    tile?: TileCoords;
    /** Missing = either. */
    direction?: TravelDirection;
    /** Ticks between location checks. Missing or invalid = 1 (every tick). */
    checkEveryTicks?: number;
}

/** @deprecated Soft-loaded as carEnters / trainEnters; kept for reading old park storage. */
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

export interface EveryNTicksEventDesc extends TriggerEventDescBase {
    type: "everyNTicks";
    /** Ticks between fires. Clamped to at least 1 on load. */
    ticks: number;
}

export interface EveryDayEventDesc extends TriggerEventDescBase {
    type: "everyDay";
}

/** Fires once when this park session starts. Not polled on later ticks. */
export interface ParkLoadedEventDesc extends TriggerEventDescBase {
    type: "parkLoaded";
}

export interface RideBreakdownEventDesc extends TriggerEventDescBase {
    type: "rideBreakdown";
    /** Omitted = any ride. */
    rideId?: number;
}

export interface VehicleCrashEventDesc extends TriggerEventDescBase {
    type: "vehicleCrash";
    /** Omitted = any ride. */
    rideId?: number;
}

export interface GuestGenerationEventDesc extends TriggerEventDescBase {
    type: "guestGeneration";
}

export interface WeatherChangeEventDesc extends TriggerEventDescBase {
    type: "weatherChange";
}

export type VariableThresholdDirection = "above" | "below" | "either";

export interface VariableThresholdEventDesc extends TriggerEventDescBase {
    type: "variableThreshold";
    variableId: string;
    direction: VariableThresholdDirection;
    threshold: number;
}

export type TriggerEventDesc =
    | CarEntersEventDesc
    | TrainEntersEventDesc
    | VehicleEntersEventDesc
    | SingleImmediateEventDesc
    | StaffEventDesc
    | VariableChangeEventDesc
    | EveryNTicksEventDesc
    | EveryDayEventDesc
    | ParkLoadedEventDesc
    | RideBreakdownEventDesc
    | VehicleCrashEventDesc
    | GuestGenerationEventDesc
    | WeatherChangeEventDesc
    | VariableThresholdEventDesc
    | TriggerEventDescBase;

// --- Park variables ---

export type VariableValueType = "int" | "float" | "string" | "tile" | "coords" | "direction";

export interface VariableTileValue {
    x: number;
    y: number;
}

export interface VariableCoordsValue {
    x: number;
    y: number;
    z: number;
}

export type VariableStoredValue = number | string | VariableTileValue | VariableCoordsValue;

export type VariableValueKind = "stored" | "formula";

export interface VariableDesc {
    id: string;
    name: string;
    valueType: VariableValueType;
    value: VariableStoredValue;
    defaultValue: VariableStoredValue;
    /** Missing or "stored" = editable value. "formula" = typed-in formula. */
    valueKind?: VariableValueKind;
    formula?: string;
    lastError?: string;
    /** Folder path from root, e.g. "Coasters/Drop". Missing or empty = root. */
    folder?: string;
}

// --- Conditions ---

export interface ConditionDescBase {
    type: string;
}

export type CompareOp = "eq" | "ne" | "lt" | "le" | "gt" | "ge";
export type MatchOp = "is" | "isNot";
export type OnOff = "on" | "off";
export type ExistsOp = "exists" | "doesNotExist";
export type OccupancyOp = "on" | "notOn";
export type EmptyOp = "empty" | "notEmpty";
export type HasOp = "has" | "doesNotHave";
export type DateField = "day" | "month" | "year" | "monthsElapsed";
export type RideBreakdownMode = "broken" | "notBroken" | "typeIs" | "typeIsNot";
export type VehicleLocationMode = "onTile" | "atStation" | "trackProgress";
export type GuestNeedField =
    | "happiness"
    | "happinessTarget"
    | "hunger"
    | "thirst"
    | "toilet"
    | "nausea"
    | "nauseaTarget"
    | "energy"
    | "energyTarget";
export type EntityScope = "any" | "this";
export type VariableRhsKind = "constant" | "variable";
export type BlockBrakeOp = "open" | "closed";

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

export interface WeatherStatusConditionDesc extends ConditionDescBase {
    type: "weatherStatus";
    op: MatchOp;
    weather: WeatherType;
}

export interface TemperatureConditionDesc extends ConditionDescBase {
    type: "temperature";
    op: CompareOp;
    value: number;
}

export interface DateStatusConditionDesc extends ConditionDescBase {
    type: "dateStatus";
    field: DateField;
    op: CompareOp;
    value: number;
}

export interface ParkRatingConditionDesc extends ConditionDescBase {
    type: "parkRating";
    op: CompareOp;
    value: number;
}

export interface ParkGuestCountConditionDesc extends ConditionDescBase {
    type: "parkGuestCount";
    op: CompareOp;
    value: number;
}

export interface ParkCashConditionDesc extends ConditionDescBase {
    type: "parkCash";
    op: CompareOp;
    value: number;
}

export interface ParkFlagConditionDesc extends ConditionDescBase {
    type: "parkFlag";
    flag: ParkFlags;
    expected: OnOff;
}

export interface ScenarioStatusConditionDesc extends ConditionDescBase {
    type: "scenarioStatus";
    op: MatchOp;
    status: ScenarioStatus;
}

export interface VariableValueConditionDesc extends ConditionDescBase {
    type: "variableValue";
    variableId: string;
    op: CompareOp;
    rhsKind: VariableRhsKind;
    constant?: number | string;
    otherVariableId?: string;
}

export interface RideStatusConditionDesc extends ConditionDescBase {
    type: "rideStatus";
    rideId?: number;
    op: MatchOp;
    status: RideStatus;
}

export interface RideBreakdownStatusConditionDesc extends ConditionDescBase {
    type: "rideBreakdownStatus";
    rideId?: number;
    mode: RideBreakdownMode;
    breakdownType?: BreakdownType;
}

export interface RideGuestCountConditionDesc extends ConditionDescBase {
    type: "rideGuestCount";
    rideId?: number;
    op: CompareOp;
    value: number;
}

export interface RideEmptyConditionDesc extends ConditionDescBase {
    type: "rideEmpty";
    rideId?: number;
    expected: EmptyOp;
}

export interface CarStatusConditionDesc extends ConditionDescBase, VehicleTargetDesc {
    type: "carStatus";
    op: MatchOp;
    status: VehicleStatus;
}

export interface CarSpeedConditionDesc extends ConditionDescBase, VehicleTargetDesc {
    type: "carSpeed";
    op: CompareOp;
    value: number;
}

export interface CarLocationConditionDesc extends ConditionDescBase, VehicleTargetDesc, TileTargetDesc {
    type: "carLocation";
    mode: VehicleLocationMode;
    stationIndex?: number;
    op?: CompareOp;
    value?: number;
}

export interface TrainLocationConditionDesc extends ConditionDescBase, VehicleTargetDesc, TileTargetDesc {
    type: "trainLocation";
    mode: VehicleLocationMode;
    stationIndex?: number;
    op?: CompareOp;
    value?: number;
}

export interface TrackChainLiftConditionDesc extends ConditionDescBase, TileTargetDesc {
    type: "trackChainLift";
    rideId: number;
    trackType: number;
    expected: OnOff;
}

export interface TrackBrakeSpeedConditionDesc extends ConditionDescBase, TileTargetDesc {
    type: "trackBrakeSpeed";
    rideId: number;
    trackType: number;
    op: CompareOp;
    value: number;
}

export interface TrackInvertedConditionDesc extends ConditionDescBase, TileTargetDesc {
    type: "trackInverted";
    rideId: number;
    trackType: number;
    expected: OnOff;
}

export interface BlockBrakeStatusConditionDesc extends ConditionDescBase, TileTargetDesc {
    type: "blockBrakeStatus";
    rideId: number;
    trackType: number;
    expected: BlockBrakeOp;
}

export interface GuestExistsConditionDesc extends ConditionDescBase {
    type: "guestExists";
    useTriggerGuest?: boolean;
    guestId?: number;
    expected: ExistsOp;
}

export interface GuestLocationConditionDesc extends ConditionDescBase, TileTargetDesc {
    type: "guestLocation";
    scope: EntityScope;
    useTriggerGuest?: boolean;
    guestId?: number;
    occupancy: OccupancyOp;
}

export interface GuestNeedConditionDesc extends ConditionDescBase {
    type: "guestNeed";
    useTriggerGuest?: boolean;
    guestId?: number;
    field: GuestNeedField;
    op: CompareOp;
    value: number;
}

export interface GuestItemConditionDesc extends ConditionDescBase {
    type: "guestItem";
    useTriggerGuest?: boolean;
    guestId?: number;
    item: GuestItemType;
    expected: HasOp;
}

export interface GuestFlagConditionDesc extends ConditionDescBase {
    type: "guestFlag";
    useTriggerGuest?: boolean;
    guestId?: number;
    flag: PeepFlags;
    expected: OnOff;
}

export interface StaffExistsConditionDesc extends ConditionDescBase {
    type: "staffExists";
    useTriggerStaff?: boolean;
    staffId?: number;
    expected: ExistsOp;
}

export interface StaffLocationConditionDesc extends ConditionDescBase, TileTargetDesc {
    type: "staffLocation";
    scope: EntityScope;
    useTriggerStaff?: boolean;
    staffId?: number;
    staffType?: StaffType;
    occupancy: OccupancyOp;
}

export interface StaffFlagConditionDesc extends ConditionDescBase {
    type: "staffFlag";
    useTriggerStaff?: boolean;
    staffId?: number;
    flag: PeepFlags;
    expected: OnOff;
}

export type ConditionDesc =
    | TrainModuloConditionDesc
    | CarModuloConditionDesc
    | CarEqualsConditionDesc
    | RideOpenConditionDesc
    | WeatherStatusConditionDesc
    | TemperatureConditionDesc
    | DateStatusConditionDesc
    | ParkRatingConditionDesc
    | ParkGuestCountConditionDesc
    | ParkCashConditionDesc
    | ParkFlagConditionDesc
    | ScenarioStatusConditionDesc
    | VariableValueConditionDesc
    | RideStatusConditionDesc
    | RideBreakdownStatusConditionDesc
    | RideGuestCountConditionDesc
    | RideEmptyConditionDesc
    | CarStatusConditionDesc
    | CarSpeedConditionDesc
    | CarLocationConditionDesc
    | TrainLocationConditionDesc
    | TrackChainLiftConditionDesc
    | TrackBrakeSpeedConditionDesc
    | TrackInvertedConditionDesc
    | BlockBrakeStatusConditionDesc
    | GuestExistsConditionDesc
    | GuestLocationConditionDesc
    | GuestNeedConditionDesc
    | GuestItemConditionDesc
    | GuestFlagConditionDesc
    | StaffExistsConditionDesc
    | StaffLocationConditionDesc
    | StaffFlagConditionDesc;
// --- Top-level trigger ---

export interface TriggerDesc {
    id: string;
    name: string;
    event: TriggerEventDesc | null;
    conditions?: ConditionDesc[];
    animationIds: string[];
    /**
     * Missing, or anything other than explicit false / "no" / "n", means enabled.
     */
    enabled?: boolean | string;
    /** Folder path from root, e.g. "Coasters/Drop". Missing or empty = root. */
    folder?: string;
}

// --- Animation steps ---

export interface StepDescBase {
    type: string;
    /** Optional user label for the steps list / editor. Omitted = type default label. */
    name?: string;
}

export type NumberSourceOrigin = "hardcoded" | "variable";
export type StringSourceOrigin = "hardcoded" | "variable";

export interface WaitStepDesc extends StepDescBase {
    type: "wait";
    ticks: number;
    ticksOrigin?: NumberSourceOrigin;
    ticksVariableId?: string;
}

export type CoordsSourceOrigin = "hardcoded" | "variable";

export interface CoordsSourceDesc {
    coordsOrigin?: CoordsSourceOrigin;
    x?: number;
    y?: number;
    z?: number;
    coordsVariableId?: string;
}

export type TileTargetOrigin = "fixed" | "trigger" | "variable";

/** Shared map-tile targeting for steps that act on a tile. */
export interface TileTargetDesc {
    /** When true, `offset` is added to the tile the trigger fired on. Old saves. */
    relativeToTrigger?: boolean;
    /** `variable` = origin is a Tile variable. Missing = Fixed or Trigger from `relativeToTrigger`. */
    origin?: TileTargetOrigin;
    /** World tile when origin is fixed. Old saves always used this. */
    tile?: TileCoords;
    /** Tile offset from the fire tile or Tile variable. */
    offset?: TileCoords;
    /** Variable id when origin is `variable`. */
    tileVariableId?: string;
}

export type ContextSlot = "ride" | "train" | "car" | "guest" | "staff" | "tile";

export type ContextOperation = "set" | "add" | "remove";

export type ContextSelectorKind =
    | "pick"
    | "allTrainsOfRide"
    | "carsOfContextTrains"
    | "carsOfTrain"
    | "onTile";

export interface ContextMutateStepDesc extends StepDescBase {
    type: "contextMutate";
    operation: ContextOperation;
    slot: ContextSlot;
    selector: ContextSelectorKind;
    /** All trains of every ride already in context (default for allTrainsOfRide). */
    useContextRide?: boolean;
    /** Guests/staff on every tile already in context (default for onTile). */
    useContextTiles?: boolean;
    rideId?: number;
    trainIndex?: number;
    carIndex?: number;
    guestId?: number;
    staffId?: number;
    tile?: TileCoords;
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
    bodyOrigin?: NumberSourceOrigin;
    bodyVariableId?: string;
    trimOrigin?: NumberSourceOrigin;
    trimVariableId?: string;
    tertiaryOrigin?: NumberSourceOrigin;
    tertiaryVariableId?: string;
}

export interface TrainEditColourStepDesc extends StepDescBase, VehicleTargetDesc {
    type: "trainEditColour";
    value: VehicleColour;
    bodyOrigin?: NumberSourceOrigin;
    bodyVariableId?: string;
    trimOrigin?: NumberSourceOrigin;
    trimVariableId?: string;
    tertiaryOrigin?: NumberSourceOrigin;
    tertiaryVariableId?: string;
}

export interface VariableSetStepDesc extends StepDescBase {
    type: "variableSet";
    variableId: string;
    value: VariableStoredValue;
}

export interface VariableIncrementStepDesc extends StepDescBase {
    type: "variableIncrement";
    variableId: string;
    amount: number;
    amountOrigin?: NumberSourceOrigin;
    amountVariableId?: string;
}

export interface VariableDecrementStepDesc extends StepDescBase {
    type: "variableDecrement";
    variableId: string;
    amount: number;
    amountOrigin?: NumberSourceOrigin;
    amountVariableId?: string;
}

/** Set a stored int variable to a random integer from min through max, inclusive. */
export interface VariableRandomIntStepDesc extends StepDescBase {
    type: "variableRandomInt";
    variableId: string;
    min: number;
    max: number;
}

export interface TrackSetHeightStepDesc extends StepDescBase, TileTargetDesc {
    type: "trackSetHeight";
    rideId: number;
    trackType: number;
    baseHeight: number;
    baseHeightOrigin?: NumberSourceOrigin;
    baseHeightVariableId?: string;
}

/** Cycle a ride's stacked track pieces on a tile (TI / Advanced Track Switch Track). */
export interface SwitchTiTrackOrderStepDesc extends StepDescBase, TileTargetDesc {
    type: "switchTiTrackOrder";
    rideId: number;
}

export type TrackChainLiftMode = "on" | "off" | "toggle";

/** Set or toggle chain lift on one track piece (tile + ride + trackType). */
export interface TrackChainLiftStepDesc extends StepDescBase, TileTargetDesc {
    type: "trackChainLift";
    rideId: number;
    trackType: number;
    mode: TrackChainLiftMode;
}

/** Optional triggers fired once at each Lift/Drop lifecycle stage. */
export interface LiftDropStageTriggers {
    trainEnters?: string;
    verticalMoveStarts?: string;
    verticalMoveEnds?: string;
    restoreStarts?: string;
    restoreEnds?: string;
}

/** Advanced Track Lift/Drop Track parity: stop, travel, release, return. */
export interface LiftDropTrackStepDesc extends StepDescBase, VehicleTargetDesc {
    type: "liftDropTrack";
    /** Start height in land units (runtime converts × 8 to pixels). */
    startHeight?: number;
    startHeightOrigin?: NumberSourceOrigin;
    startHeightVariableId?: string;
    /** End height in land units (runtime converts × 8 to pixels). */
    endHeight?: number;
    endHeightOrigin?: NumberSourceOrigin;
    endHeightVariableId?: string;
    /** Travel speed percent (AT default 100). */
    speed: number;
    speedOrigin?: NumberSourceOrigin;
    speedVariableId?: string;
    /**
     * When true, exit with the negated entry velocity (opposite direction).
     * Default false: restore entry velocity as captured.
     */
    reverseExitDirection?: boolean;
    /**
     * Ticks to hold the train stopped after it is stopped, before vertical movement.
     * Omitted means 50 (the previous fixed pause).
     */
    waitBeforeMoveTicks?: number;
    /**
     * Ticks to hold the train stopped after vertical movement, before speed is restored.
     * Omitted means 0 (restore speed on the next tick, as before).
     */
    waitAfterMoveTicks?: number;
    /** Optional trigger ids to fire at lifecycle stages (original run context). */
    stageTriggers?: LiftDropStageTriggers;
    /** @deprecated Legacy pixel fields — migrated to startHeight/endHeight on load. */
    startZ?: number;
    /** @deprecated Legacy pixel fields — migrated to startHeight/endHeight on load. */
    endZ?: number;
    /** @deprecated Removed — exit wait is no longer supported. */
    exitWaitTicks?: number;
}

export interface EntityCoordsOverTimeStepDesc extends StepDescBase {
    deltaX?: number;
    deltaXOrigin?: NumberSourceOrigin;
    deltaXVariableId?: string;
    deltaY?: number;
    deltaYOrigin?: NumberSourceOrigin;
    deltaYVariableId?: string;
    deltaZ?: number;
    deltaZOrigin?: NumberSourceOrigin;
    deltaZVariableId?: string;
    durationTicks: number;
    durationTicksOrigin?: NumberSourceOrigin;
    durationTicksVariableId?: string;
}

export interface CarCoordsOverTimeStepDesc extends EntityCoordsOverTimeStepDesc, VehicleTargetDesc {
    type: "carCoordsOverTime";
}

export interface TrainCoordsOverTimeStepDesc extends EntityCoordsOverTimeStepDesc {
    type: "trainCoordsOverTime";
}

/**
 * Move a train along the track over time.
 * position: pixels the front car travels. Positive is forward along the track.
 * spacing: extra pixels between each car and the one in front. Positive opens the gaps.
 */
export interface TrackPositionOverTimeStepDesc extends StepDescBase, VehicleTargetDesc {
    type: "trackPositionOverTime";
    position?: number;
    positionOrigin?: NumberSourceOrigin;
    positionVariableId?: string;
    spacing?: number;
    spacingOrigin?: NumberSourceOrigin;
    spacingVariableId?: string;
    durationTicks: number;
    durationTicksOrigin?: NumberSourceOrigin;
    durationTicksVariableId?: string;
}

export type SceneryObjectType = "small_scenery" | "large_scenery" | "wall";

export type SceneryVisibilityMode = "visible" | "invisible" | "toggle";
export type OnOffToggle = "on" | "off" | "toggle";
export type PatrolMode = "set" | "add" | "remove" | "clear";
export type CameraMoveMode = "move" | "scroll";
export type PauseMode = "pause" | "unpause" | "toggle";
export type GrassLength = 0 | 1 | 2 | 3;

/**
 * Instantly set or toggle isHidden on matching scenery on one tile.
 * Omitted optional fields mean Any (not filtered).
 */
export interface SceneryVisibilityStepDesc extends StepDescBase, TileTargetDesc {
    type: "sceneryVisibility";
    mode: SceneryVisibilityMode;
    objectType?: SceneryObjectType;
    /** LoadedObject.identifier — resolved to the current slot at apply time. */
    objectIdentifier?: string;
    /** Land units (TileElement.baseHeight). */
    baseHeight?: number;
    baseHeightOrigin?: NumberSourceOrigin;
    baseHeightVariableId?: string;
    /** Small scenery quadrant, or wall edge direction. Ignored for large scenery / Any type. */
    tileLocation?: number;
    tileLocationOrigin?: NumberSourceOrigin;
    tileLocationVariableId?: string;
    primaryColour?: number;
    primaryColourOrigin?: NumberSourceOrigin;
    primaryColourVariableId?: string;
    secondaryColour?: number;
    secondaryColourOrigin?: NumberSourceOrigin;
    secondaryColourVariableId?: string;
    tertiaryColour?: number;
    tertiaryColourOrigin?: NumberSourceOrigin;
    tertiaryColourVariableId?: string;
}

export interface SceneryRecolourStepDesc extends StepDescBase, TileTargetDesc {
    type: "sceneryRecolour";
    objectType?: SceneryObjectType;
    objectIdentifier?: string;
    baseHeight?: number;
    baseHeightOrigin?: NumberSourceOrigin;
    baseHeightVariableId?: string;
    tileLocation?: number;
    tileLocationOrigin?: NumberSourceOrigin;
    tileLocationVariableId?: string;
    setPrimary?: number;
    setPrimaryOrigin?: NumberSourceOrigin;
    setPrimaryVariableId?: string;
    setSecondary?: number;
    setSecondaryOrigin?: NumberSourceOrigin;
    setSecondaryVariableId?: string;
    setTertiary?: number;
    setTertiaryOrigin?: NumberSourceOrigin;
    setTertiaryVariableId?: string;
}

export interface SceneryRotationStepDesc extends StepDescBase, TileTargetDesc {
    type: "sceneryRotation";
    objectType?: SceneryObjectType;
    objectIdentifier?: string;
    baseHeight?: number;
    tileLocation?: number;
    /** Facing / wall edge. OpenRCT2 Direction 0–3. */
    direction: number;
    directionOrigin?: NumberSourceOrigin;
    directionVariableId?: string;
}

export interface TrackColourSchemeStepDesc extends StepDescBase, TileTargetDesc {
    type: "trackColourScheme";
    rideId: number;
    trackType: number;
    colourScheme: number;
    colourSchemeOrigin?: NumberSourceOrigin;
    colourSchemeVariableId?: string;
}

export interface TrackSeatRotationStepDesc extends StepDescBase, TileTargetDesc {
    type: "trackSeatRotation";
    rideId: number;
    trackType: number;
    seatRotation: number;
    seatRotationOrigin?: NumberSourceOrigin;
    seatRotationVariableId?: string;
}

export interface TrackInvertedStepDesc extends StepDescBase, TileTargetDesc {
    type: "trackInverted";
    rideId: number;
    trackType: number;
    mode: OnOffToggle;
}

export interface TrackBrakeSpeedStepDesc extends StepDescBase, TileTargetDesc {
    type: "trackBrakeSpeed";
    rideId: number;
    trackType: number;
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
}

export interface TrackHighlightedStepDesc extends StepDescBase, TileTargetDesc {
    type: "trackHighlighted";
    rideId: number;
    trackType: number;
    mode: OnOffToggle;
}

export interface BlockBrakeStepDesc extends StepDescBase, TileTargetDesc {
    type: "blockBrake";
    rideId: number;
    trackType: number;
    mode: OnOffToggle;
}

export interface LandHeightStepDesc extends StepDescBase, TileTargetDesc {
    type: "landHeight";
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
}

export interface WaterHeightStepDesc extends StepDescBase, TileTargetDesc {
    type: "waterHeight";
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
}

export interface LandSlopeStepDesc extends StepDescBase, TileTargetDesc {
    type: "landSlope";
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
}

export interface SurfaceStyleStepDesc extends StepDescBase, TileTargetDesc {
    type: "surfaceStyle";
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
}

export interface EdgeStyleStepDesc extends StepDescBase, TileTargetDesc {
    type: "edgeStyle";
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
}

export interface GrassLengthStepDesc extends StepDescBase, TileTargetDesc {
    type: "grassLength";
    value: number;
}

export interface PathAdditionVandalisedStepDesc extends StepDescBase, TileTargetDesc {
    type: "pathAdditionVandalised";
    mode: OnOffToggle;
}

export interface PathBinFullStepDesc extends StepDescBase, TileTargetDesc {
    type: "pathBinFull";
    mode: OnOffToggle;
}

export interface PathLitterStepDesc extends StepDescBase, TileTargetDesc {
    type: "pathLitter";
    mode: OnOffToggle;
    litterType: LitterType;
}

/** A particle that plays in place. Crash debris that can be thrown is a later step. */
export type CreateParticleKind = "steam" | "explosionCloud" | "explosionFlare";

/** Where a Create Particle step spawns. */
export type CreateParticleLaunch = "car" | "tile";

export interface CreateParticleStepDesc extends StepDescBase, VehicleTargetDesc {
    type: "createParticle";
    particle: CreateParticleKind;
    /** Missing on the first saves of this step, which used raw coordinates. Those load as a car launch. */
    launch?: CreateParticleLaunch;
    /** Map tile when launch is tile. The particle is placed at the tile centre. */
    tile?: TileCoords;
    /** World-unit height when launch is tile. One land height step is 8. */
    z?: number;
}

export interface ShootParticlesStepDesc extends StepDescBase, VehicleTargetDesc {
    type: "shootParticles";
    launch?: CreateParticleLaunch;
    tile?: TileCoords;
    /** World-unit height when launch is tile. One land height step is 8. */
    z?: number;
    /** How many crash-debris sprites to throw. */
    count: number;
    /** Degrees around the map. 0 is +Y, 90 is +X. */
    direction: number;
    /** Degrees up from flat. 0 skims, 90 goes straight up. */
    tilt: number;
    /** Random degrees either side of direction and tilt. */
    spread: number;
    /** How far the shot should travel, in tiles. */
    distance: number;
    /** Ticks until the debris is removed. A tick is one game step, 40 per real second. */
    lifetime: number;
    body: number;
    trim: number;
    body2: number;
    trim2: number;
}

export interface BannerTextStepDesc extends StepDescBase, TileTargetDesc {
    type: "bannerText";
    text: string;
    textOrigin?: StringSourceOrigin;
    textVariableId?: string;
}

export interface BannerColoursStepDesc extends StepDescBase, TileTargetDesc {
    type: "bannerColours";
    primaryColour?: number;
    primaryColourOrigin?: NumberSourceOrigin;
    primaryColourVariableId?: string;
    secondaryColour?: number;
    secondaryColourOrigin?: NumberSourceOrigin;
    secondaryColourVariableId?: string;
    tertiaryColour?: number;
    tertiaryColourOrigin?: NumberSourceOrigin;
    tertiaryColourVariableId?: string;
}

export interface BannerNoEntryStepDesc extends StepDescBase, TileTargetDesc {
    type: "bannerNoEntry";
    mode: OnOffToggle;
}

export interface CarNumberStepDesc extends StepDescBase, VehicleTargetDesc {
    type:
        | "carVelocity"
        | "carAcceleration"
        | "carMass"
        | "carBankRotation"
        | "carSpin"
        | "carPoweredAcceleration"
        | "carPoweredMaxSpeed"
        | "carTravelBy";
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
}

export interface CarToggleStepDesc extends StepDescBase, VehicleTargetDesc {
    type: "carReversed" | "carCrashed";
    mode: OnOffToggle;
}

export interface CarStatusStepDesc extends StepDescBase, VehicleTargetDesc {
    type: "carStatus";
    status: VehicleStatus;
}

export interface CarMoveToTrackStepDesc extends StepDescBase, VehicleTargetDesc, TileTargetDesc {
    type: "carMoveToTrack";
    rideId?: number;
    trackType: number;
}

export interface RideIdStepDesc extends StepDescBase {
    useTriggerRide?: boolean;
    rideId?: number;
}

export interface RideStatusStepDesc extends RideIdStepDesc {
    type: "rideStatus";
    status: RideStatus;
}

export interface RideVehicleColoursStepDesc extends RideIdStepDesc {
    type: "rideVehicleColours";
    colourIndex: number;
    colourIndexOrigin?: NumberSourceOrigin;
    colourIndexVariableId?: string;
    value: VehicleColour;
    bodyOrigin?: NumberSourceOrigin;
    bodyVariableId?: string;
    trimOrigin?: NumberSourceOrigin;
    trimVariableId?: string;
    tertiaryOrigin?: NumberSourceOrigin;
    tertiaryVariableId?: string;
}

export interface RideTrackColoursStepDesc extends RideIdStepDesc {
    type: "rideTrackColours";
    schemeIndex: number;
    schemeIndexOrigin?: NumberSourceOrigin;
    schemeIndexVariableId?: string;
    main: number;
    mainOrigin?: NumberSourceOrigin;
    mainVariableId?: string;
    additional: number;
    additionalOrigin?: NumberSourceOrigin;
    additionalVariableId?: string;
    supports: number;
    supportsOrigin?: NumberSourceOrigin;
    supportsVariableId?: string;
}

export interface RideNumberStepDesc extends RideIdStepDesc {
    type:
        | "rideStationStyle"
        | "rideMode"
        | "rideDepartFlags"
        | "rideMinWait"
        | "rideMaxWait"
        | "rideLiftHillSpeed";
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
}

/**
 * Sets ride.music to a loaded music object.
 * musicObjectIdentifier is LoadedObject.identifier, resolved to the current slot at apply time.
 * value is the old slot number, used only when no identifier was saved.
 */
export interface RideMusicStepDesc extends RideIdStepDesc {
    type: "rideMusic";
    musicObjectIdentifier?: string;
    value?: number;
    /** Play Music checkbox. Omitted on older steps, treated as on. */
    playMusic?: boolean;
}

/**
 * Whose live x/y/z is copied onto ride.stations[0].start.
 * "tile" uses a fixed tile; x/y are tile numbers, converted to map units on apply.
 */
export type RideStationStartSource = "train" | "car" | "guest" | "staff" | "tile";

export interface RideStationStartStepDesc extends RideIdStepDesc {
    type: "rideStationStart";
    source: RideStationStartSource;
    /** Tile numbers. Used when source is "tile". */
    tile?: {x: number; y: number};
}

export interface RideBreakdownStepDesc extends RideIdStepDesc {
    type: "rideBreakdown";
    breakdownType: BreakdownType;
}

export interface RideFixBreakdownStepDesc extends RideIdStepDesc {
    type: "rideFixBreakdown";
}

export interface GuestTargetDesc {
    useTriggerGuest?: boolean;
    guestId?: number;
}

export interface StaffTargetDesc {
    useTriggerStaff?: boolean;
    staffId?: number;
}

export interface WriteTriggerTileStepDesc extends StepDescBase {
    type: "writeTriggerTile";
    variableId: string;
}

export interface WriteCarCoordsStepDesc extends StepDescBase, VehicleTargetDesc {
    type: "writeCarCoords";
    variableId: string;
}

export interface WriteGuestCoordsStepDesc extends StepDescBase, GuestTargetDesc {
    type: "writeGuestCoords";
    variableId: string;
}

export interface WriteStaffCoordsStepDesc extends StepDescBase, StaffTargetDesc {
    type: "writeStaffCoords";
    variableId: string;
}

export interface WriteCameraRotationStepDesc extends StepDescBase {
    type: "writeCameraRotation";
    variableId: string;
}

export interface WriteGuestDirectionStepDesc extends StepDescBase, GuestTargetDesc {
    type: "writeGuestDirection";
    variableId: string;
}

export interface WriteStaffDirectionStepDesc extends StepDescBase, StaffTargetDesc {
    type: "writeStaffDirection";
    variableId: string;
}

export interface WriteCarTrackDirectionStepDesc extends StepDescBase, VehicleTargetDesc {
    type: "writeCarTrackDirection";
    variableId: string;
}

export interface GuestNeedStepDesc extends StepDescBase, GuestTargetDesc {
    type: "guestNeed";
    field: GuestNeedField;
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
}

export interface GuestClothesStepDesc extends StepDescBase, GuestTargetDesc {
    type: "guestClothes";
    tshirtColour?: number;
    tshirtColourOrigin?: NumberSourceOrigin;
    tshirtColourVariableId?: string;
    trousersColour?: number;
    trousersColourOrigin?: NumberSourceOrigin;
    trousersColourVariableId?: string;
    hatColour?: number;
    hatColourOrigin?: NumberSourceOrigin;
    hatColourVariableId?: string;
    balloonColour?: number;
    balloonColourOrigin?: NumberSourceOrigin;
    balloonColourVariableId?: string;
    umbrellaColour?: number;
    umbrellaColourOrigin?: NumberSourceOrigin;
    umbrellaColourVariableId?: string;
}

export interface GuestFavouriteRideStepDesc extends StepDescBase, GuestTargetDesc {
    type: "guestFavouriteRide";
    rideId?: number;
}

export interface GuestItemStepDesc extends StepDescBase, GuestTargetDesc {
    type: "guestGiveItem" | "guestRemoveItem";
    item: GuestItemType;
}

export interface GuestAnimationStepDesc extends StepDescBase, GuestTargetDesc {
    type: "guestAnimation";
    animation: GuestAnimation;
}

export interface GuestFlagStepDesc extends StepDescBase, GuestTargetDesc {
    type: "guestFlag";
    flag: PeepFlags;
    mode: OnOffToggle;
}

export interface GuestMoveStepDesc extends StepDescBase, GuestTargetDesc, CoordsSourceDesc {
    type: "guestMove";
}

export interface SetCarCoordsStepDesc extends StepDescBase, VehicleTargetDesc, CoordsSourceDesc {
    type: "setCarCoords";
}

export interface SetStaffCoordsStepDesc extends StepDescBase, StaffTargetDesc, CoordsSourceDesc {
    type: "setStaffCoords";
}

export interface StaffCostumeStepDesc extends StepDescBase, StaffTargetDesc {
    type: "staffCostume";
    costume: StaffCostume;
}

export interface StaffOrdersStepDesc extends StepDescBase, StaffTargetDesc {
    type: "staffOrders";
    orders: number;
    ordersOrigin?: NumberSourceOrigin;
    ordersVariableId?: string;
}

export interface StaffPatrolStepDesc extends StepDescBase, StaffTargetDesc {
    type: "staffPatrol";
    mode: PatrolMode;
    tiles: TileCoords[];
}

export interface StaffAnimationStepDesc extends StepDescBase, StaffTargetDesc {
    type: "staffAnimation";
    animation: StaffAnimation;
}

export interface StaffFlagStepDesc extends StepDescBase, StaffTargetDesc {
    type: "staffFlag";
    flag: PeepFlags;
    mode: OnOffToggle;
}

export interface SpawnGuestStepDesc extends StepDescBase {
    type: "spawnGuest";
}

export interface ParkMessageStepDesc extends StepDescBase {
    type: "parkMessage";
    text: string;
    textOrigin?: StringSourceOrigin;
    textVariableId?: string;
    messageType: ParkMessageType;
    subject?: number;
}

export interface FreezeWeatherStepDesc extends StepDescBase {
    type: "freezeWeather";
    mode: OnOffToggle;
}

export interface ParkCashStepDesc extends StepDescBase {
    type: "parkCash";
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
}

export interface ParkRatingStepDesc extends StepDescBase {
    type: "parkRating";
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;
}

export interface GrantAwardStepDesc extends StepDescBase {
    type: "grantAward";
    award: AwardType;
}

export interface ClearAwardsStepDesc extends StepDescBase {
    type: "clearAwards";
}

export interface GamePauseStepDesc extends StepDescBase {
    type: "gamePause";
    mode: PauseMode;
}

export interface GameSpeedStepDesc extends StepDescBase {
    type: "gameSpeed";
    speed: number;
    speedOrigin?: NumberSourceOrigin;
    speedVariableId?: string;
}

export interface ParkDateStepDesc extends StepDescBase {
    type: "parkDate";
    year: number;
    yearOrigin?: NumberSourceOrigin;
    yearVariableId?: string;
    month: number;
}

export type CameraTileOrigin = "hardcoded" | "variable";
export type CameraRotationOrigin = "unset" | "hardcoded" | "variable";

export interface ViewportCameraStepDesc extends StepDescBase {
    type: "viewportCamera";
    x: number;
    y: number;
    z?: number;
    zOrigin?: NumberSourceOrigin;
    zVariableId?: string;
    zoom?: number;
    zoomOrigin?: NumberSourceOrigin;
    zoomVariableId?: string;
    rotation?: number;
    mode: CameraMoveMode;
    tileOrigin?: CameraTileOrigin;
    tileVariableId?: string;
    rotationOrigin?: CameraRotationOrigin;
    rotationVariableId?: string;
}

export interface CustomJavascriptStepDesc extends StepDescBase {
    type: "customJavascript";
    code: string;
}

/** Where a Branch step goes. A number is a 0-based step index. */
export type BranchTarget = number | "end";

export interface BranchStepDesc extends StepDescBase {
    type: "branch";
    conditions: ConditionDesc[];
    /** Taken when every condition passes. */
    passTo: BranchTarget;
    /** Taken when any condition fails. */
    failTo: BranchTarget;
}

export type StepDesc =
    | WaitStepDesc
    | CarEditColourStepDesc
    | TrainEditColourStepDesc
    | VariableSetStepDesc
    | VariableIncrementStepDesc
    | VariableDecrementStepDesc
    | VariableRandomIntStepDesc
    | WriteTriggerTileStepDesc
    | WriteCarCoordsStepDesc
    | WriteGuestCoordsStepDesc
    | WriteStaffCoordsStepDesc
    | WriteCameraRotationStepDesc
    | WriteGuestDirectionStepDesc
    | WriteStaffDirectionStepDesc
    | WriteCarTrackDirectionStepDesc
    | TrackSetHeightStepDesc
    | SwitchTiTrackOrderStepDesc
    | TrackChainLiftStepDesc
    | LiftDropTrackStepDesc
    | CarCoordsOverTimeStepDesc
    | TrainCoordsOverTimeStepDesc
    | TrackPositionOverTimeStepDesc
    | SceneryVisibilityStepDesc
    | SceneryRecolourStepDesc
    | SceneryRotationStepDesc
    | TrackColourSchemeStepDesc
    | TrackSeatRotationStepDesc
    | TrackInvertedStepDesc
    | TrackBrakeSpeedStepDesc
    | TrackHighlightedStepDesc
    | BlockBrakeStepDesc
    | LandHeightStepDesc
    | WaterHeightStepDesc
    | LandSlopeStepDesc
    | SurfaceStyleStepDesc
    | EdgeStyleStepDesc
    | GrassLengthStepDesc
    | PathAdditionVandalisedStepDesc
    | PathBinFullStepDesc
    | PathLitterStepDesc
    | CreateParticleStepDesc
    | ShootParticlesStepDesc
    | BannerTextStepDesc
    | BannerColoursStepDesc
    | BannerNoEntryStepDesc
    | CarNumberStepDesc
    | CarToggleStepDesc
    | CarStatusStepDesc
    | CarMoveToTrackStepDesc
    | RideStatusStepDesc
    | RideVehicleColoursStepDesc
    | RideTrackColoursStepDesc
    | RideNumberStepDesc
    | RideMusicStepDesc
    | RideStationStartStepDesc
    | RideBreakdownStepDesc
    | RideFixBreakdownStepDesc
    | GuestNeedStepDesc
    | GuestClothesStepDesc
    | GuestFavouriteRideStepDesc
    | GuestItemStepDesc
    | GuestAnimationStepDesc
    | GuestFlagStepDesc
    | GuestMoveStepDesc
    | SetCarCoordsStepDesc
    | SetStaffCoordsStepDesc
    | StaffCostumeStepDesc
    | StaffOrdersStepDesc
    | StaffPatrolStepDesc
    | StaffAnimationStepDesc
    | StaffFlagStepDesc
    | SpawnGuestStepDesc
    | ParkMessageStepDesc
    | FreezeWeatherStepDesc
    | ParkCashStepDesc
    | ParkRatingStepDesc
    | GrantAwardStepDesc
    | ClearAwardsStepDesc
    | GamePauseStepDesc
    | GameSpeedStepDesc
    | ParkDateStepDesc
    | ViewportCameraStepDesc
    | CustomJavascriptStepDesc
    | ContextMutateStepDesc
    | BranchStepDesc;

export interface AnimationDesc {
    id: string;
    name?: string;
    steps?: StepDesc[];
    /** Ticks to wait after each step before starting the next. Default 0. */
    ticksBetweenSteps?: number;
    /** Folder path from root, e.g. "Coasters/Drop". Missing or empty = root. */
    folder?: string;
    /** @deprecated Legacy frame timeline; soft-loaded as empty steps. */
    frames?: unknown;
}

export interface AnimatorDocumentDesc {
    triggers: TriggerDesc[];
    animations: AnimationDesc[];
    variables?: VariableDesc[];
}
