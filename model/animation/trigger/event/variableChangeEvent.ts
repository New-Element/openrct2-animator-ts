import {VariableChangeEventDesc, VariableStoredValue} from "../../jsonTypes";
import {findVariableById} from "../../variableLookup";
import {withContextLists} from "../contextLists";
import TriggerContext from "../triggerContext";
import TriggerEvent from "./triggerEvent";

export default class VariableChangeEvent extends TriggerEvent {
    type: "variableChange" = "variableChange";
    variableId: string;

    private seeded: boolean = false;
    private lastValue: VariableStoredValue | undefined;

    constructor(obj: VariableChangeEventDesc) {
        super(obj);
        this.type = "variableChange";
        this.variableId = obj.variableId;
    }

    setVariableId(variableId: string): void {
        if (this.variableId === variableId) {
            return;
        }
        this.variableId = variableId;
        this.seeded = false;
        this.lastValue = undefined;
    }

    tryFire(): TriggerContext[] {
        if (!this.variableId) {
            return [];
        }
        const variable = findVariableById(this.variableId);
        if (!variable) {
            return [];
        }
        const current = variable.value;
        if (!this.seeded) {
            this.seeded = true;
            this.lastValue = current;
            return [];
        }
        if (current === this.lastValue) {
            return [];
        }
        this.lastValue = current;
        return [
            withContextLists({
                target: { static: true },
                variableId: this.variableId,
                variableValue: current
            })
        ];
    }

    getDataToPersist(): object {
        return {
            type: "variableChange",
            variableId: this.variableId
        };
    }
}
