import Variable from "./variable/variable";

type FindVariable = (id: string) => Variable | undefined;
type FindVariableByName = (name: string) => Variable | undefined;

let findVariable: FindVariable | null = null;
let findVariableByNameImpl: FindVariableByName | null = null;

export function bindFindVariable(fn: FindVariable): void {
    findVariable = fn;
}

export function bindFindVariableByName(fn: FindVariableByName): void {
    findVariableByNameImpl = fn;
}

export function findVariableById(id: string): Variable | undefined {
    if (!findVariable) {
        return undefined;
    }
    return findVariable(id);
}

export function findVariableByName(name: string): Variable | undefined {
    if (!findVariableByNameImpl) {
        return undefined;
    }
    return findVariableByNameImpl(name);
}

export function isVariableLookupBound(): boolean {
    return findVariableByNameImpl !== null;
}
