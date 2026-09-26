import {error} from "../../logger";
import {NumberSourceOrigin, VariableValueType} from "../jsonTypes";
import {findVariableById} from "../variableLookup";

export function readNumberOrigin(origin: string | undefined): NumberSourceOrigin {
    return origin === "variable" ? "variable" : "hardcoded";
}

export function persistNumberSource(
    hardcoded: number,
    origin: NumberSourceOrigin,
    variableId: string
): {value: number; origin?: NumberSourceOrigin; variableId?: string} {
    if (origin === "variable") {
        return {
            value: hardcoded,
            origin: "variable",
            variableId: variableId || ""
        };
    }
    return {value: hardcoded};
}

export function resolveNumberSource(
    hardcoded: number,
    origin: NumberSourceOrigin | undefined,
    variableId: string | undefined,
    expectedType: VariableValueType | "int-or-float",
    label: string,
    meta?: {animationId?: string; triggerId?: string}
): number | null {
    if (readNumberOrigin(origin) !== "variable") {
        return typeof hardcoded === "number" && !isNaN(hardcoded) ? hardcoded : 0;
    }
    const variable = findVariableById(variableId || "");
    const typeOk = variable && (
        expectedType === "int-or-float"
            ? variable.valueType === "int" || variable.valueType === "float"
            : variable.valueType === expectedType
    );
    if (!variable || !typeOk) {
        error("step", `${label}: number variable is missing`, undefined, meta);
        return null;
    }
    const value = variable.value;
    if (typeof value !== "number" || isNaN(value)) {
        error("step", `${label}: number variable has no number value`, undefined, meta);
        return null;
    }
    return expectedType === "int" ? Math.floor(value) : value;
}
