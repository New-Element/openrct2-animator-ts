import {SceneryObjectType} from "../animation/jsonTypes";
import {RoofObject} from "./buildingTypes";

export type RoofObjectIdentity = {
    tileX: number;
    tileY: number;
    objectType: SceneryObjectType;
    objectIdentifier: string;
    baseHeight: number;
    tileLocation?: number;
    primaryColour: number;
    secondaryColour: number;
    tertiaryColour: number;
};

function tileLocationEqual(a: number | undefined, b: number | undefined): boolean {
    if (a === undefined && b === undefined) {
        return true;
    }
    return a === b;
}

export function roofObjectMatchesIdentity(object: RoofObject, identity: RoofObjectIdentity): boolean {
    return object.tile.x === identity.tileX &&
        object.tile.y === identity.tileY &&
        object.objectType === identity.objectType &&
        object.objectIdentifier === identity.objectIdentifier &&
        object.baseHeight === identity.baseHeight &&
        object.primaryColour === identity.primaryColour &&
        object.secondaryColour === identity.secondaryColour &&
        object.tertiaryColour === identity.tertiaryColour &&
        tileLocationEqual(object.tileLocation, identity.tileLocation);
}

export function identityFromRoofObject(object: RoofObject): RoofObjectIdentity {
    const identity: RoofObjectIdentity = {
        tileX: object.tile.x,
        tileY: object.tile.y,
        objectType: object.objectType,
        objectIdentifier: object.objectIdentifier,
        baseHeight: object.baseHeight,
        primaryColour: object.primaryColour,
        secondaryColour: object.secondaryColour,
        tertiaryColour: object.tertiaryColour
    };
    if (object.tileLocation !== undefined) {
        identity.tileLocation = object.tileLocation;
    }
    return identity;
}
