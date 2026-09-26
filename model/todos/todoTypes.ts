import TileCoords from "../../game/tileCoords";

export type TodoPriority = "urgent" | "high" | "normal" | "low";

export type TodoDesc = {
    id: string;
    name?: string;
    folder?: string;
    priority?: TodoPriority;
    done?: boolean;
    tile?: TileCoords;
};
