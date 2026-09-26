import {error} from "../../logger";
import {CoordsSourceDesc, CoordsSourceOrigin, VariableCoordsValue} from "../jsonTypes";
import {findVariableById} from "../variableLookup";

export function readCoordsSourceOrigin(desc: CoordsSourceDesc): CoordsSourceOrigin {
    return desc.coordsOrigin === "variable" ? "variable" : "hardcoded";
}

export function persistCoordsSource(source: {
    origin: CoordsSourceOrigin;
    x: number;
    y: number;
    z: number;
    coordsVariableId: string;
}): CoordsSourceDesc {
    if (source.origin === "variable") {
        return {
            coordsOrigin: "variable",
            coordsVariableId: source.coordsVariableId || ""
        };
    }
    return {
        coordsOrigin: "hardcoded",
        x: source.x,
        y: source.y,
        z: source.z
    };
}

export function resolveCoordsSource(
    desc: CoordsSourceDesc,
    label: string,
    meta?: {animationId?: string; triggerId?: string}
): VariableCoordsValue | null {
    if (readCoordsSourceOrigin(desc) === "variable") {
        const variable = findVariableById(desc.coordsVariableId || "");
        if (!variable || variable.valueType !== "coords") {
            error("step", `${label}: coords variable is missing`, undefined, meta);
            return null;
        }
        const value = variable.value;
        if (!value || typeof value !== "object") {
            error("step", `${label}: coords variable has no coords value`, undefined, meta);
            return null;
        }
        const coords = value as VariableCoordsValue;
        return {x: coords.x, y: coords.y, z: coords.z};
    }
    return {
        x: typeof desc.x === "number" ? desc.x : 0,
        y: typeof desc.y === "number" ? desc.y : 0,
        z: typeof desc.z === "number" ? desc.z : 0
    };
}
