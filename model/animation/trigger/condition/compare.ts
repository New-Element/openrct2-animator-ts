import {CompareOp} from "../../jsonTypes";

export const COMPARE_OPS: CompareOp[] = ["eq", "ne", "lt", "le", "gt", "ge"];
export const COMPARE_LABELS = ["=", "≠", "<", "≤", ">", "≥"];

export function compareOpIndex(op: CompareOp): number {
    for (let i = 0; i < COMPARE_OPS.length; i++) {
        if (COMPARE_OPS[i] === op) {
            return i;
        }
    }
    return 0;
}

export function compareOpLabel(op: CompareOp): string {
    const index = compareOpIndex(op);
    return COMPARE_LABELS[index] || "=";
}

export function compareNumbers(left: number, op: CompareOp, right: number): boolean {
    switch (op) {
        case "eq":
            return left === right;
        case "ne":
            return left !== right;
        case "lt":
            return left < right;
        case "le":
            return left <= right;
        case "gt":
            return left > right;
        case "ge":
            return left >= right;
        default:
            return false;
    }
}

/**
 * Numbers use numeric compare. Strings only support equal / not equal.
 * Ordering on strings fails closed.
 */
export function compareValues(
    left: number | string,
    op: CompareOp,
    right: number | string
): boolean {
    if (typeof left === "number" && typeof right === "number") {
        return compareNumbers(left, op, right);
    }
    const leftText = String(left);
    const rightText = String(right);
    if (op === "eq") {
        return leftText === rightText;
    }
    if (op === "ne") {
        return leftText !== rightText;
    }
    return false;
}
