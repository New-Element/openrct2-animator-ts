import Building from "../../model/lookInside/building";
import {clearRoofElementCache} from "../../model/lookInside/roofVisibility";
import {
    RoofObjectIdentity,
    roofObjectMatchesIdentity
} from "../../model/lookInside/roofObjectIdentity";
import getConductor from "../../model/getConductor";

export function buildingDisplayName(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed : "(Unnamed)";
}

function buildingsArray() {
    return getConductor().buildingsArray;
}

export function getBuildings(): Building[] {
    return buildingsArray().items;
}

export function findBuildingById(id: string): Building | undefined {
    return buildingsArray().findById(id);
}

export function findBuildingByTile(x: number, y: number): Building | undefined {
    return buildingsArray().findByTile(x, y);
}

export function findBuildingByRoofObject(identity: RoofObjectIdentity): Building | undefined {
    const buildings = getBuildings();
    for (let i = 0; i < buildings.length; i++) {
        const objects = buildings[i].roofObjects;
        for (let o = 0; o < objects.length; o++) {
            if (roofObjectMatchesIdentity(objects[o], identity)) {
                return buildings[i];
            }
        }
    }
    return undefined;
}

export function buildingHasRoofObject(building: Building, identity: RoofObjectIdentity): boolean {
    for (let i = 0; i < building.roofObjects.length; i++) {
        if (roofObjectMatchesIdentity(building.roofObjects[i], identity)) {
            return true;
        }
    }
    return false;
}

export function addBuilding(building: Building): void {
    const array = buildingsArray();
    array.items.push(building);
    array.save();
}

/** Returns false if the id was already gone. */
export function removeBuildingById(id: string): boolean {
    const array = buildingsArray();
    const removed = array.removeById(id);
    if (removed) {
        clearRoofElementCache(id);
        array.save();
    }
    return removed;
}

export function saveBuildings(): void {
    buildingsArray().save();
}
