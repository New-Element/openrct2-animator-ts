import Variable from "./variable/variable";

type FindVariable = (id: string) => Variable | undefined;

let findVariable: FindVariable | null = null;

export function bindFindVariable(fn: FindVariable): void {
    findVariable = fn;
}

export function findVariableById(id: string): Variable | undefined {
    if (!findVariable) {
        return undefined;
    }
    return findVariable(id);
}
