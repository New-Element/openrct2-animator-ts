import TileCoords from "../../game/tileCoords";
import PersistentModel from "../data/persistentModel";
import {readFolderField, writeFolderField} from "../folders/folderPath";
import {TodoDesc, TodoPriority} from "./todoTypes";

function isTodoPriority(value: unknown): value is TodoPriority {
    return (
        value === "urgent" ||
        value === "high" ||
        value === "normal" ||
        value === "low"
    );
}

function copyTile(tile: unknown): TileCoords | undefined {
    if (!tile || typeof tile !== "object") {
        return undefined;
    }
    const raw = tile as {x?: unknown; y?: unknown};
    if (typeof raw.x !== "number" || typeof raw.y !== "number") {
        return undefined;
    }
    return {x: raw.x, y: raw.y};
}

export default class Todo implements PersistentModel {
    id: string;
    name: string;
    folder: string = "";
    priority: TodoPriority;
    done: boolean;
    tile?: TileCoords;

    constructor(obj: TodoDesc) {
        this.id = obj.id;
        this.name = typeof obj.name === "string" ? obj.name : "";
        this.folder = readFolderField(obj);
        this.priority = isTodoPriority(obj.priority) ? obj.priority : "normal";
        this.done = obj.done === true;
        this.tile = copyTile(obj.tile);
    }

    getDataToPersist(): object {
        const data: {
            id: string;
            name: string;
            priority: TodoPriority;
            folder?: string;
            done?: boolean;
            tile?: TileCoords;
        } = {
            id: this.id,
            name: this.name,
            priority: isTodoPriority(this.priority) ? this.priority : "normal"
        };
        writeFolderField(data, this.folder);
        if (this.done === true) {
            data.done = true;
        }
        const tile = copyTile(this.tile);
        if (tile) {
            data.tile = tile;
        }
        return data;
    }
}
