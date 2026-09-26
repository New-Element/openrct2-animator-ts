import {CompareOp, VariableRhsKind, VariableStoredValue, VariableValueConditionDesc} from "../../jsonTypes";
import {findVariableById} from "../../variableLookup";
import {formatVariableValue} from "../../variable/variable";
import TriggerContext from "../triggerContext";
import {compareValues} from "./compare";
import Condition from "./condition";

export default class VariableValueCondition extends Condition {
    type: "variableValue" = "variableValue";
    variableId: string;
    op: CompareOp;
    rhsKind: VariableRhsKind;
    constant: number | string;
    otherVariableId?: string;

    constructor(obj: VariableValueConditionDesc) {
        super(obj);
        this.variableId = obj.variableId;
        this.op = obj.op;
        this.rhsKind = obj.rhsKind;
        this.constant = obj.constant !== undefined ? obj.constant : 0;
        if (obj.otherVariableId !== undefined) {
            this.otherVariableId = obj.otherVariableId;
        }
    }

    evaluate(_context: TriggerContext): boolean {
        const left = findVariableById(this.variableId);
        if (!left) {
            return false;
        }
        let right: VariableStoredValue;
        if (this.rhsKind === "variable") {
            if (!this.otherVariableId) {
                return false;
            }
            const other = findVariableById(this.otherVariableId);
            if (!other) {
                return false;
            }
            right = other.value;
        }
        else {
            right = this.constant;
        }
        if (typeof left.value === "object" || typeof right === "object") {
            const leftText = formatVariableValue(left.valueType, left.value);
            const rightText = typeof right === "object"
                ? formatVariableValue(left.valueType, right)
                : String(right);
            if (this.op === "eq") {
                return leftText === rightText;
            }
            if (this.op === "ne") {
                return leftText !== rightText;
            }
            return false;
        }
        return compareValues(left.value, this.op, right);
    }

    getDataToPersist(): object {
        const data: VariableValueConditionDesc = {
            type: "variableValue",
            variableId: this.variableId,
            op: this.op,
            rhsKind: this.rhsKind
        };
        if (this.rhsKind === "variable") {
            if (this.otherVariableId !== undefined) {
                data.otherVariableId = this.otherVariableId;
            }
        }
        else {
            data.constant = this.constant;
        }
        return data;
    }
}
