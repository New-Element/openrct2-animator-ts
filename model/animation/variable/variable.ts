import {error} from "../../logger";
import PersistentModel from "../../data/persistentModel";
import {readFolderField, writeFolderField} from "../../folders/folderPath";
import {
    VariableCoordsValue,
    VariableDesc,
    VariableStoredValue,
    VariableTileValue,
    VariableValueKind,
    VariableValueType
} from "../jsonTypes";
import {applyFormulaToVariable} from "./evaluateFormula";
import {recomputeAllFormulasIfBound} from "./recomputeFormulas";

const KNOWN_TYPES: VariableValueType[] = ["int", "float", "string", "tile", "coords", "direction"];
const DIRECTION_LABELS = ["North", "East", "South", "West"];

export function normalizeVariableValueType(valueType: string | undefined): VariableValueType {
    for (let i = 0; i < KNOWN_TYPES.length; i++) {
        if (KNOWN_TYPES[i] === valueType) {
            return KNOWN_TYPES[i];
        }
    }
    error("variable", `Unknown variable type "${String(valueType)}"; using Int`);
    return "int";
}

export function emptyValueForType(valueType: VariableValueType): VariableStoredValue {
    if (valueType === "string") {
        return "";
    }
    if (valueType === "tile") {
        return {x: 0, y: 0};
    }
    if (valueType === "coords") {
        return {x: 0, y: 0, z: 0};
    }
    return 0;
}

function readNumber(value: unknown, fallback: number): number {
    const n = typeof value === "number" ? value : Number(value);
    if (isNaN(n)) {
        return fallback;
    }
    return n;
}

function coerceTile(value: VariableStoredValue): VariableTileValue {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const obj = value as VariableTileValue;
        return {
            x: Math.floor(readNumber(obj.x, 0)),
            y: Math.floor(readNumber(obj.y, 0))
        };
    }
    return {x: 0, y: 0};
}

function coerceCoords(value: VariableStoredValue): VariableCoordsValue {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const obj = value as VariableCoordsValue;
        return {
            x: readNumber(obj.x, 0),
            y: readNumber(obj.y, 0),
            z: readNumber(obj.z, 0)
        };
    }
    return {x: 0, y: 0, z: 0};
}

function coerceDirection(value: VariableStoredValue): number {
    const n = Math.floor(readNumber(value, 0));
    if (n < 0) {
        return 0;
    }
    if (n > 3) {
        return 3;
    }
    return n;
}

export function coerceVariableValue(
    valueType: VariableValueType,
    value: VariableStoredValue
): VariableStoredValue {
    if (valueType === "string") {
        return String(value);
    }
    if (valueType === "tile") {
        return coerceTile(value);
    }
    if (valueType === "coords") {
        return coerceCoords(value);
    }
    if (valueType === "direction") {
        return coerceDirection(value);
    }
    const n = typeof value === "number" ? value : Number(value);
    if (isNaN(n)) {
        return 0;
    }
    if (valueType === "int") {
        return Math.floor(n);
    }
    return n;
}

function storedValuesEqual(a: VariableStoredValue, b: VariableStoredValue): boolean {
    if (a === b) {
        return true;
    }
    if (typeof a === "object" && typeof b === "object" && a && b) {
        const left = a as VariableCoordsValue;
        const right = b as VariableCoordsValue;
        return left.x === right.x && left.y === right.y && left.z === right.z;
    }
    return false;
}

export function directionLabel(value: number): string {
    return DIRECTION_LABELS[value] || DIRECTION_LABELS[0];
}

export function formatVariableValue(valueType: VariableValueType, value: VariableStoredValue): string {
    if (valueType === "tile" && value && typeof value === "object") {
        const tile = value as VariableTileValue;
        return "[" + tile.x + ", " + tile.y + "]";
    }
    if (valueType === "coords" && value && typeof value === "object") {
        const coords = value as VariableCoordsValue;
        return "{" + coords.x + ", " + coords.y + ", " + coords.z + "}";
    }
    if (valueType === "direction" && typeof value === "number") {
        return directionLabel(value);
    }
    return String(value);
}

export function isNumericVariableType(valueType: VariableValueType): boolean {
    return valueType === "int" || valueType === "float";
}

export default class Variable implements PersistentModel {
    id: string;
    name: string;
    folder: string = "";
    valueType: VariableValueType;
    value: VariableStoredValue;
    defaultValue: VariableStoredValue;
    valueKind: VariableValueKind;
    formula: string;
    lastError: string;

    constructor(obj: VariableDesc) {
        this.id = obj.id;
        this.name = obj.name;
        this.folder = readFolderField(obj);
        this.valueType = normalizeVariableValueType(obj.valueType);
        this.value = coerceVariableValue(this.valueType, obj.value);
        this.defaultValue = coerceVariableValue(this.valueType, obj.defaultValue);
        this.valueKind = obj.valueKind === "formula" ? "formula" : "stored";
        this.formula = this.valueKind === "formula" && typeof obj.formula === "string" ? obj.formula : "";
        this.lastError = this.valueKind === "formula" && typeof obj.lastError === "string" ? obj.lastError : "";
    }

    isFormula(): boolean {
        return this.valueKind === "formula";
    }

    setValueKind(valueKind: VariableValueKind): void {
        if (this.valueKind === valueKind) {
            return;
        }
        this.valueKind = valueKind;
        this.formula = "";
        this.lastError = "";
        if (this.valueKind === "formula") {
            if (!recomputeAllFormulasIfBound()) {
                applyFormulaToVariable(this);
            }
        }
    }

    setFormula(formula: string): void {
        this.formula = formula;
        if (!recomputeAllFormulasIfBound()) {
            applyFormulaToVariable(this);
        }
    }

    setLastError(lastError: string): void {
        this.lastError = lastError;
    }

    setName(name: string): void {
        this.name = name;
    }

    setValueType(valueType: VariableValueType): void {
        const next = normalizeVariableValueType(valueType);
        if (this.valueType === next) {
            return;
        }
        this.valueType = next;
        const empty = emptyValueForType(next);
        this.value = empty;
        this.defaultValue = empty;
        if (this.valueKind === "formula") {
            if (!recomputeAllFormulasIfBound()) {
                applyFormulaToVariable(this);
            }
        }
    }

    setValue(value: VariableStoredValue): boolean {
        const next = coerceVariableValue(this.valueType, value);
        if (storedValuesEqual(this.value, next)) {
            return false;
        }
        this.value = next;
        return true;
    }

    setDefaultValue(value: VariableStoredValue): void {
        this.defaultValue = coerceVariableValue(this.valueType, value);
    }

    resetToDefault(): boolean {
        return this.setValue(this.defaultValue);
    }

    getDataToPersist(): object {
        const data: {
            id: string;
            name: string;
            valueType: VariableValueType;
            value: VariableStoredValue;
            defaultValue: VariableStoredValue;
            valueKind?: VariableValueKind;
            formula?: string;
            lastError?: string;
            folder?: string;
        } = {
            id: this.id,
            name: this.name,
            valueType: this.valueType,
            value: this.value,
            defaultValue: this.defaultValue
        };
        if (this.valueKind === "formula") {
            data.valueKind = "formula";
            data.formula = this.formula;
            if (this.lastError) {
                data.lastError = this.lastError;
            }
        }
        writeFolderField(data, this.folder);
        return data;
    }
}
