export type VariableMutateMode = "set" | "increment" | "decrement";

type MutateVariableFn = (
    variableId: string,
    mode: VariableMutateMode,
    value: number | string
) => boolean;

let mutateImpl: MutateVariableFn = () => {
    console.log("[VariableMutate] Conductor not bound");
    return false;
};

export function bindMutateVariable(fn: MutateVariableFn): void {
    mutateImpl = fn;
}

export function mutateVariable(
    variableId: string,
    mode: VariableMutateMode,
    value: number | string
): boolean {
    return mutateImpl(variableId, mode, value);
}
