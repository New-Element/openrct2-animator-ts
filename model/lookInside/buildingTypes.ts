import {SceneryObjectType} from "../animation/jsonTypes";

export type TabRoofMode = "showAll" | "hideAll" | "cursorHover";

export type BuildingTile = {
    x: number;
    y: number;
};

export type RoofObject = {
    id: string;
    tile: BuildingTile;
    objectType: SceneryObjectType;
    objectIdentifier: string;
    objectName: string;
    baseHeight: number;
    tileLocation?: number;
    primaryColour: number;
    secondaryColour: number;
    tertiaryColour: number;
    hideNorth: boolean;
    hideSouth: boolean;
    hideEast: boolean;
    hideWest: boolean;
};

export type BuildingDesc = {
    id: string;
    name: string;
    tiles: BuildingTile[];
    roofObjects: RoofObject[];
    /** Folder path from root, e.g. "Coasters/Drop". Missing or empty = root. */
    folder?: string;
};
