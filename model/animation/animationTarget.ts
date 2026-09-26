import TileCoords from "../../game/tileCoords";

export interface CarTarget {
    carId: number;
}

export interface TileTarget {
    tile: TileCoords
}

export interface StaticTarget {
    static: true
}

export interface StaffTarget {
    staffId: number;
}

export interface GuestTarget {
    guestId: number;
}

export type AnimationTarget = CarTarget | TileTarget | StaticTarget | StaffTarget | GuestTarget;