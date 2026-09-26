import {VariableThresholdDirection, VariableThresholdEventDesc} from "../../jsonTypes";
import {findVariableById} from "../../variableLookup";
import {withContextLists} from "../contextLists";
import TriggerContext from "../triggerContext";
import TriggerEvent from "./triggerEvent";

function normalizeDirection(direction: string | undefined): VariableThresholdDirection {
    if (direction === "below" || direction === "either") {
        return direction;
    }
    return "above";
}

function normalizeThreshold(threshold: number | undefined): number {
    if (typeof threshold !== "number" || isNaN(threshold)) {
        return 0;
    }
    return threshold;
}

function numericValue(value: unknown): number | null {
    if (typeof value === "number" && !isNaN(value)) {
        return value;
    }
    return null;
}

function crossed(
    direction: VariableThresholdDirection,
    last: number,
    current: number,
    threshold: number
): boolean {
    const above = last < threshold && current >= threshold;
    const below = last > threshold && current <= threshold;
    if (direction === "above") {
        return above;
    }
    if (direction === "below") {
        return below;
    }
    return above || below;
}

export default class VariableThresholdEvent extends TriggerEvent {
    type: "variableThreshold" = "variableThreshold";
    variableId: string;
    direction: VariableThresholdDirection;
    threshold: number;

    private seeded: boolean = false;
    private lastValue: number | undefined;

    constructor(obj: VariableThresholdEventDesc) {
        super(obj);
        this.type = "variableThreshold";
        this.variableId = obj.variableId;
        this.direction = normalizeDirection(obj.direction);
        this.threshold = normalizeThreshold(obj.threshold);
    }

    setVariableId(variableId: string): void {
        if (this.variableId === variableId) {
            return;
        }
        this.variableId = variableId;
        this.seeded = false;
        this.lastValue = undefined;
    }

    setDirection(direction: VariableThresholdDirection): void {
        this.direction = normalizeDirection(direction);
    }

    setThreshold(threshold: number): void {
        this.threshold = normalizeThreshold(threshold);
    }

    tryFire(): TriggerContext[] {
        if (!this.variableId) {
            return [];
        }
        const variable = findVariableById(this.variableId);
        if (!variable || variable.valueType === "string") {
            return [];
        }
        const current = numericValue(variable.value);
        if (current === null) {
            return [];
        }
        if (!this.seeded) {
            this.seeded = true;
            this.lastValue = current;
            return [];
        }
        const last = this.lastValue;
        this.lastValue = current;
        if (typeof last !== "number" || !crossed(this.direction, last, current, this.threshold)) {
            return [];
        }
        return [
            withContextLists({
                target: {static: true},
                variableId: this.variableId,
                variableValue: current
            })
        ];
    }

    getDataToPersist(): object {
        return {
            type: "variableThreshold",
            variableId: this.variableId,
            direction: this.direction,
            threshold: this.threshold
        };
    }
}
