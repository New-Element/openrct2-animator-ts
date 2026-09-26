import Building from "./building";
import {BuildingDesc} from "./buildingTypes";

export default function createBuilding(data: object): Building {
    const raw = data as BuildingDesc;
    if (!raw || typeof raw.id !== "string" || raw.id.length === 0) {
        throw new Error("Building is missing id");
    }
    return new Building(raw);
}
