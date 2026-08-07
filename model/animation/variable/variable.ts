import PersistentModel from "../../data/persistentModel";
import {VariableDesc, VariableValueType} from "../jsonTypes";

export function emptyValueForType(valueType: VariableValueType): number | string {
    if (valueType === "string") {
        return "";
    }
    return 0;
}

export function coerceVariableValue(
    valueType: VariableValueType,
    value: number | string
): number | string {
    if (valueType === "string") {
        return String(value);
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

export default class Variable implements PersistentModel {
    id: string;
    name: string;
    valueType: VariableValueType;
    value: number | string;
    defaultValue: number | string;

    constructor(obj: VariableDesc) {
        this.id = obj.id;
        this.name = obj.name;
        this.valueType = obj.valueType;
        this.value = coerceVariableValue(obj.valueType, obj.value);
        this.defaultValue = coerceVariableValue(obj.valueType, obj.defaultValue);
    }

    setName(name: string): void {
        this.name = name;
    }

    setValueType(valueType: VariableValueType): void {
        if (this.valueType === valueType) {
            return;
        }
        this.valueType = valueType;
        const empty = emptyValueForType(valueType);
        this.value = empty;
        this.defaultValue = empty;
    }

    setValue(value: number | string): boolean {
        const next = coerceVariableValue(this.valueType, value);
        if (this.value === next) {
            return false;
        }
        this.value = next;
        return true;
    }

    setDefaultValue(value: number | string): void {
        this.defaultValue = coerceVariableValue(this.valueType, value);
    }

    resetToDefault(): boolean {
        return this.setValue(this.defaultValue);
    }

    getDataToPersist(): object {
        return {
            id: this.id,
            name: this.name,
            valueType: this.valueType,
            value: this.value,
            defaultValue: this.defaultValue
        };
    }
}
