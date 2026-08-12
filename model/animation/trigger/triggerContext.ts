import TileCoords from "../../../game/tileCoords";
import {AnimationTarget} from "../animationTarget";

/**
 * Context available when evaluating conditions / starting animations from a trigger fire.
 */
export default interface TriggerContext {
    target: AnimationTarget;
    rideId?: number;
    trainIndex?: number;
    /** 0-based position of the firer car within its train. */
    carIndex?: number;
    /** Tile from a tile-based event (e.g. carEnters / trainEnters lock point). */
    tile?: TileCoords;
    /**
     * When true, the run may continue after the train leaves context.tile
     * (e.g. Lift/Drop Track exit + return phases).
     */
    allowOffTile?: boolean;
    /** Watched park variable for variableChange events. */
    variableId?: string;
    /** Current value of the watched variable after a change. */
    variableValue?: number | string;
}
