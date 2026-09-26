import TileCoords from "../../../game/tileCoords";
import {AnimationTarget} from "../animationTarget";
import {CarIdentity, TrainIdentity} from "../entityRematch";
import {VariableStoredValue} from "../jsonTypes";

/**
 * Context available when evaluating conditions / starting animations from a trigger fire.
 * Scalar fields are fire-time aliases for conditions. Working lists are what
 * "use trigger" steps apply to (and what Set/Add/Remove context mutates).
 */
export default interface TriggerContext {
    target: AnimationTarget;
    rideId?: number;
    trainIndex?: number;
    /** 0-based position of the firer car within its train. */
    carIndex?: number;
    /** Tile from a tile-based event (e.g. carEnters / trainEnters lock point). */
    tile?: TileCoords;
    rides?: number[];
    trains?: TrainIdentity[];
    cars?: CarIdentity[];
    guests?: number[];
    staff?: number[];
    tiles?: TileCoords[];
    /**
     * When true, the run may continue after the train can no longer be resolved
     * (e.g. Lift/Drop Track return after the train has left).
     */
    allowOffTile?: boolean;
    /** Watched park variable for variableChange / variableThreshold events. */
    variableId?: string;
    /** Current value of the watched variable after a change or crossing. */
    variableValue?: VariableStoredValue;
    /** Calendar date from everyDay. */
    day?: number;
    month?: number;
    year?: number;
    /** Current weather after weatherChange. */
    weather?: string;
    /** New guest from guestGeneration (also on `target.guestId`). */
    guestId?: number;
    /** Crashed vehicle entity id from vehicleCrash. */
    vehicleId?: number;
    /** Ride breakdown reason from rideBreakdown, when the hook provides it. */
    breakdownReason?: string;
    /** What the vehicle hit, from vehicleCrash. */
    crashIntoType?: string;
}
