import Variable from "./variable";

const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isValidVariableName(name: string): boolean {
    return NAME_PATTERN.test(name);
}

export function variableNameError(name: string): string | undefined {
    if (!name) {
        return "Name Cannot Be Blank";
    }
    if (!isValidVariableName(name)) {
        return "Name Must Start With A Letter Or Underscore, Then Letters, Digits, Or Underscores. No Spaces.";
    }
    return undefined;
}

export function isVariableNameTaken(name: string, items: Variable[], exceptId?: string): boolean {
    for (let i = 0; i < items.length; i++) {
        if (exceptId && items[i].id === exceptId) {
            continue;
        }
        if (items[i].name === name) {
            return true;
        }
    }
    return false;
}

export function validateVariableName(
    name: string,
    items: Variable[],
    exceptId?: string
): string | undefined {
    const formatError = variableNameError(name);
    if (formatError) {
        return formatError;
    }
    if (isVariableNameTaken(name, items, exceptId)) {
        return "Name Must Be Unique";
    }
    return undefined;
}

export function nextVariableName(items: Variable[]): string {
    const used: { [name: string]: boolean } = {};
    for (let i = 0; i < items.length; i++) {
        used[items[i].name] = true;
    }
    let n = 1;
    let candidate = "var" + n;
    while (used[candidate]) {
        n += 1;
        candidate = "var" + n;
    }
    return candidate;
}
