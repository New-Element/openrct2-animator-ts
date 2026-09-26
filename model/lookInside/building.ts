import PersistentModel from "../data/persistentModel";
import {readFolderField, writeFolderField} from "../folders/folderPath";
import {
    BuildingDesc,
    BuildingTile,
    RoofObject
} from "./buildingTypes";

function copyTiles(tiles: BuildingTile[] | undefined): BuildingTile[] {
    const out: BuildingTile[] = [];
    if (!tiles) {
        return out;
    }
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (!tile || typeof tile.x !== "number" || typeof tile.y !== "number") {
            continue;
        }
        out.push({x: tile.x, y: tile.y});
    }
    return out;
}

function isSceneryObjectType(value: unknown): value is RoofObject["objectType"] {
    return value === "small_scenery" || value === "large_scenery" || value === "wall";
}

function copyRoofObject(object: RoofObject): RoofObject | null {
    if (!object || typeof object.id !== "string" || object.id.length === 0) {
        return null;
    }
    if (!object.tile || typeof object.tile.x !== "number" || typeof object.tile.y !== "number") {
        return null;
    }
    if (!isSceneryObjectType(object.objectType) || typeof object.objectIdentifier !== "string") {
        return null;
    }
    const copied: RoofObject = {
        id: object.id,
        tile: {x: object.tile.x, y: object.tile.y},
        objectType: object.objectType,
        objectIdentifier: object.objectIdentifier,
        objectName: typeof object.objectName === "string" ? object.objectName : object.objectIdentifier,
        baseHeight: typeof object.baseHeight === "number" ? object.baseHeight : 0,
        primaryColour: typeof object.primaryColour === "number" ? object.primaryColour : 0,
        secondaryColour: typeof object.secondaryColour === "number" ? object.secondaryColour : 0,
        tertiaryColour: typeof object.tertiaryColour === "number" ? object.tertiaryColour : 0,
        hideNorth: object.hideNorth !== false,
        hideSouth: object.hideSouth !== false,
        hideEast: object.hideEast !== false,
        hideWest: object.hideWest !== false
    };
    if (typeof object.tileLocation === "number") {
        copied.tileLocation = object.tileLocation;
    }
    return copied;
}

function copyRoofObjects(objects: RoofObject[] | undefined): RoofObject[] {
    const out: RoofObject[] = [];
    if (!objects) {
        return out;
    }
    for (let i = 0; i < objects.length; i++) {
        const copied = copyRoofObject(objects[i]);
        if (copied) {
            out.push(copied);
        }
    }
    return out;
}

export default class Building implements PersistentModel {
    id: string;
    name: string;
    folder: string = "";
    tiles: BuildingTile[];
    roofObjects: RoofObject[];

    constructor(obj: BuildingDesc) {
        this.id = obj.id;
        this.name = typeof obj.name === "string" ? obj.name : "";
        this.folder = readFolderField(obj);
        this.tiles = copyTiles(obj.tiles);
        this.roofObjects = copyRoofObjects(obj.roofObjects);
    }

    getDataToPersist(): object {
        const data: {
            id: string;
            name: string;
            tiles: BuildingTile[];
            roofObjects: RoofObject[];
            folder?: string;
        } = {
            id: this.id,
            name: this.name,
            tiles: copyTiles(this.tiles),
            roofObjects: copyRoofObjects(this.roofObjects)
        };
        writeFolderField(data, this.folder);
        return data;
    }
}
