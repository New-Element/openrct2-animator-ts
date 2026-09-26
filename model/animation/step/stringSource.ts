import {error} from "../../logger";
import {StringSourceOrigin} from "../jsonTypes";
import {findVariableById} from "../variableLookup";

export function readStringOrigin(origin: string | undefined): StringSourceOrigin {
    return origin === "variable" ? "variable" : "hardcoded";
}

export function persistStringSource(
    hardcoded: string,
    origin: StringSourceOrigin,
    variableId: string
): {value: string; origin?: StringSourceOrigin; variableId?: string} {
    if (origin === "variable") {
        return {
            value: hardcoded,
            origin: "variable",
            variableId: variableId || ""
        };
    }
    return {value: hardcoded};
}

export function resolveStringSource(
    hardcoded: string,
    origin: StringSourceOrigin | undefined,
    variableId: string | undefined,
    label: string,
    meta?: {animationId?: string; triggerId?: string}
): string | null {
    if (readStringOrigin(origin) !== "variable") {
        return typeof hardcoded === "string" ? hardcoded : "";
    }
    const variable = findVariableById(variableId || "");
    if (!variable || variable.valueType !== "string") {
        error("step", `${label}: string variable is missing`, undefined, meta);
        return null;
    }
    return String(variable.value);
}
