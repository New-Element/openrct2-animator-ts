import {error} from "../../logger";
import {evaluateFormula, formulaInputNames, FormulaVariable} from "./evaluateFormula";

type ItemsFn = () => FormulaVariable[];

let itemsFn: ItemsFn | null = null;

export function bindFormulaItems(fn: ItemsFn): void {
    itemsFn = fn;
}

function writeResult(variable: FormulaVariable, result: ReturnType<typeof evaluateFormula>): boolean {
    if (result.ok) {
        const valueChanged = variable.setValue(result.value);
        if (variable.lastError) {
            variable.setLastError("");
            return true;
        }
        return valueChanged;
    }
    if (variable.lastError === result.error) {
        return false;
    }
    variable.setLastError(result.error);
    error("variable", result.error, undefined, {detail: variable.id});
    return true;
}

function formulaItems(all: FormulaVariable[]): FormulaVariable[] {
    const out: FormulaVariable[] = [];
    for (let i = 0; i < all.length; i++) {
        if (all[i].isFormula()) {
            out.push(all[i]);
        }
    }
    return out;
}

function indexByName(all: FormulaVariable[]): {[name: string]: FormulaVariable} {
    const map: {[name: string]: FormulaVariable} = {};
    for (let i = 0; i < all.length; i++) {
        if (!map[all[i].name]) {
            map[all[i].name] = all[i];
        }
    }
    return map;
}

/**
 * Recalculate every formula in dependency order. Cycle members get Last Error
 * and keep their Current Value. Returns true if any value or Last Error changed.
 */
export function recomputeAllFormulas(all?: FormulaVariable[]): boolean {
    const items = all || (itemsFn ? itemsFn() : []);
    if (items.length === 0) {
        return false;
    }
    const formulas = formulaItems(items);
    const byName = indexByName(items);
    const idToFormula: {[id: string]: FormulaVariable} = {};
    const deps: {[id: string]: string[]} = {};
    const incoming: {[id: string]: number} = {};

    for (let i = 0; i < formulas.length; i++) {
        const formula = formulas[i];
        idToFormula[formula.id] = formula;
        incoming[formula.id] = 0;
        deps[formula.id] = [];
    }

    for (let i = 0; i < formulas.length; i++) {
        const formula = formulas[i];
        const names = formulaInputNames(formula.formula);
        for (let n = 0; n < names.length; n++) {
            const input = byName[names[n]];
            if (!input || !input.isFormula() || input.id === formula.id) {
                continue;
            }
            deps[formula.id].push(input.id);
            incoming[formula.id] += 1;
        }
    }

    const queue: string[] = [];
    for (let i = 0; i < formulas.length; i++) {
        if (incoming[formulas[i].id] === 0) {
            queue.push(formulas[i].id);
        }
    }

    const ordered: FormulaVariable[] = [];
    const remainingIncoming: {[id: string]: number} = {};
    for (const id in incoming) {
        if (incoming.hasOwnProperty(id)) {
            remainingIncoming[id] = incoming[id];
        }
    }

    while (queue.length > 0) {
        const id = queue.shift() as string;
        ordered.push(idToFormula[id]);
        for (let i = 0; i < formulas.length; i++) {
            const other = formulas[i];
            const otherDeps = deps[other.id];
            let uses = false;
            for (let d = 0; d < otherDeps.length; d++) {
                if (otherDeps[d] === id) {
                    uses = true;
                    break;
                }
            }
            if (!uses) {
                continue;
            }
            remainingIncoming[other.id] -= 1;
            if (remainingIncoming[other.id] === 0) {
                queue.push(other.id);
            }
        }
    }

    const inOrder: {[id: string]: boolean} = {};
    for (let i = 0; i < ordered.length; i++) {
        inOrder[ordered[i].id] = true;
    }

    const cycle: FormulaVariable[] = [];
    for (let i = 0; i < formulas.length; i++) {
        if (!inOrder[formulas[i].id]) {
            cycle.push(formulas[i]);
        }
    }

    let changed = false;
    if (cycle.length > 0) {
        const names: string[] = [];
        for (let i = 0; i < cycle.length; i++) {
            names.push(cycle[i].name);
        }
        const message = "Formula Cycle: " + names.join(", ");
        error("variable", message);
        for (let i = 0; i < cycle.length; i++) {
            if (cycle[i].lastError !== message) {
                cycle[i].setLastError(message);
                changed = true;
            }
        }
    }

    for (let i = 0; i < ordered.length; i++) {
        const formula = ordered[i];
        const result = evaluateFormula(formula.formula, formula.valueType, formula.name);
        if (writeResult(formula, result)) {
            changed = true;
        }
    }
    return changed;
}

/** Returns true when the shared list was bound and recomputed (skip the one-variable fallback). */
export function recomputeAllFormulasIfBound(): boolean {
    if (!itemsFn) {
        return false;
    }
    recomputeAllFormulas(itemsFn());
    return true;
}
