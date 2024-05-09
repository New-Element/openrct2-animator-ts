import TileCoords from "../../game/tileCoords";

export interface CarTarget {
    carId: number;
}

export interface TileTarget {
    tile: TileCoords
}

export type AnimationTarget = CarTarget | TileTarget;