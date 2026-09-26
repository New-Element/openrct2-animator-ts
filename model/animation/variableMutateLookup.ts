import {error} from "../logger";
import {VariableStoredValue} from "./jsonTypes";

export type VariableMutateMode = "set" | "increment" | "decrement";

type MutateVariableFn = (
    variableId: string,
    mode: VariableMutateMode,
    value: VariableStoredValue
) => boolean;

let mutateImpl: MutateVariableFn = () => {
    error("variable", "Conductor not bound for mutate");
    return false;
};

export function bindMutateVariable(fn: MutateVariableFn): void {
    mutateImpl = fn;
}

export function mutateVariable(
    variableId: string,
    mode: VariableMutateMode,
    value: VariableStoredValue
): boolean {
    return mutateImpl(variableId, mode, value);
}
