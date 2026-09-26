import {error} from "../../logger";
import {
    VariableCoordsValue,
    VariableStoredValue,
    VariableTileValue,
    VariableValueType
} from "../jsonTypes";
import {findVariableByName, isVariableLookupBound} from "../variableLookup";

export type FormulaOk = {ok: true; value: VariableStoredValue};
export type FormulaErr = {ok: false; error: string};
export type FormulaResult = FormulaOk | FormulaErr;

type RuntimeValue =
    | {kind: "number"; n: number}
    | {kind: "tile"; x: number; y: number}
    | {kind: "coords"; x: number; y: number; z: number};

type TokenKind =
    | "number"
    | "ident"
    | "lbracket"
    | "rbracket"
    | "lbrace"
    | "rbrace"
    | "lparen"
    | "rparen"
    | "comma"
    | "dot"
    | "plus"
    | "minus"
    | "star"
    | "slash"
    | "caret"
    | "eof";

type Token = {kind: TokenKind; text: string};

type LookupFn = (name: string) =>
    | {ready: false}
    | {ready: true; missing: true}
    | {ready: true; missing: false; valueType: VariableValueType; value: VariableStoredValue};

function fail(message: string): FormulaErr {
    return {ok: false, error: message};
}

function tokenize(source: string): Token[] | string {
    const tokens: Token[] = [];
    let i = 0;
    while (i < source.length) {
        const ch = source.charAt(i);
        if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
            i += 1;
            continue;
        }
        if ((ch >= "0" && ch <= "9") || (ch === "." && i + 1 < source.length && source.charAt(i + 1) >= "0" && source.charAt(i + 1) <= "9")) {
            let j = i;
            let sawDot = false;
            while (j < source.length) {
                const c = source.charAt(j);
                if (c >= "0" && c <= "9") {
                    j += 1;
                    continue;
                }
                if (c === "." && !sawDot) {
                    sawDot = true;
                    j += 1;
                    continue;
                }
                break;
            }
            tokens.push({kind: "number", text: source.slice(i, j)});
            i = j;
            continue;
        }
        if ((ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || ch === "_") {
            let j = i + 1;
            while (j < source.length) {
                const c = source.charAt(j);
                if ((c >= "A" && c <= "Z") || (c >= "a" && c <= "z") || (c >= "0" && c <= "9") || c === "_") {
                    j += 1;
                    continue;
                }
                break;
            }
            tokens.push({kind: "ident", text: source.slice(i, j)});
            i = j;
            continue;
        }
        if (ch === "[") {
            tokens.push({kind: "lbracket", text: ch});
            i += 1;
            continue;
        }
        if (ch === "]") {
            tokens.push({kind: "rbracket", text: ch});
            i += 1;
            continue;
        }
        if (ch === "{") {
            tokens.push({kind: "lbrace", text: ch});
            i += 1;
            continue;
        }
        if (ch === "}") {
            tokens.push({kind: "rbrace", text: ch});
            i += 1;
            continue;
        }
        if (ch === "(") {
            tokens.push({kind: "lparen", text: ch});
            i += 1;
            continue;
        }
        if (ch === ")") {
            tokens.push({kind: "rparen", text: ch});
            i += 1;
            continue;
        }
        if (ch === ",") {
            tokens.push({kind: "comma", text: ch});
            i += 1;
            continue;
        }
        if (ch === ".") {
            tokens.push({kind: "dot", text: ch});
            i += 1;
            continue;
        }
        if (ch === "+") {
            tokens.push({kind: "plus", text: ch});
            i += 1;
            continue;
        }
        if (ch === "-") {
            tokens.push({kind: "minus", text: ch});
            i += 1;
            continue;
        }
        if (ch === "*") {
            tokens.push({kind: "star", text: ch});
            i += 1;
            continue;
        }
        if (ch === "/") {
            tokens.push({kind: "slash", text: ch});
            i += 1;
            continue;
        }
        if (ch === "^") {
            tokens.push({kind: "caret", text: ch});
            i += 1;
            continue;
        }
        return `Unexpected Character "${ch}"`;
    }
    tokens.push({kind: "eof", text: ""});
    return tokens;
}

function storedToRuntime(valueType: VariableValueType, value: VariableStoredValue): RuntimeValue | string {
    if (valueType === "int" || valueType === "float" || valueType === "direction") {
        if (typeof value !== "number" || isNaN(value)) {
            return "Variable Value Is Not A Number";
        }
        return {kind: "number", n: value};
    }
    if (valueType === "tile") {
        if (!value || typeof value !== "object") {
            return "Variable Value Is Not A Tile";
        }
        const tile = value as VariableTileValue;
        return {kind: "tile", x: tile.x, y: tile.y};
    }
    if (valueType === "coords") {
        if (!value || typeof value !== "object") {
            return "Variable Value Is Not Coords";
        }
        const coords = value as VariableCoordsValue;
        return {kind: "coords", x: coords.x, y: coords.y, z: coords.z};
    }
    return "String Values Cannot Be Used In A Formula";
}

function asNumber(value: RuntimeValue, context: string): number | string {
    if (value.kind !== "number") {
        return `${context} Needs A Number`;
    }
    return value.n;
}

function runtimeToStored(expectedType: VariableValueType, value: RuntimeValue): FormulaResult {
    if (expectedType === "int") {
        if (value.kind !== "number") {
            return fail("Formula Must Produce An Int");
        }
        return {ok: true, value: Math.floor(value.n)};
    }
    if (expectedType === "float") {
        if (value.kind !== "number") {
            return fail("Formula Must Produce A Float");
        }
        return {ok: true, value: value.n};
    }
    if (expectedType === "direction") {
        if (value.kind !== "number") {
            return fail("Formula Must Produce A Direction");
        }
        let direction = Math.floor(value.n);
        if (direction < 0) {
            direction = 0;
        }
        if (direction > 3) {
            direction = 3;
        }
        return {ok: true, value: direction};
    }
    if (expectedType === "tile") {
        if (value.kind !== "tile") {
            return fail("Formula Must Produce A Tile");
        }
        return {ok: true, value: {x: Math.floor(value.x), y: Math.floor(value.y)}};
    }
    if (expectedType === "coords") {
        if (value.kind !== "coords") {
            return fail("Formula Must Produce Coords");
        }
        return {ok: true, value: {x: value.x, y: value.y, z: value.z}};
    }
    return fail("String Formulas Are Not Supported");
}

class Parser {
    tokens: Token[];
    index: number;
    selfName: string;
    lookup: LookupFn;

    constructor(tokens: Token[], selfName: string, lookup: LookupFn) {
        this.tokens = tokens;
        this.index = 0;
        this.selfName = selfName;
        this.lookup = lookup;
    }

    peek(): Token {
        return this.tokens[this.index];
    }

    take(): Token {
        const token = this.tokens[this.index];
        if (token.kind !== "eof") {
            this.index += 1;
        }
        return token;
    }

    expect(kind: TokenKind, message: string): Token | string {
        const token = this.take();
        if (token.kind !== kind) {
            return message;
        }
        return token;
    }

    parseExpression(): RuntimeValue | string {
        return this.parseAdd();
    }

    parseAdd(): RuntimeValue | string {
        let left = this.parseMul();
        if (typeof left === "string") {
            return left;
        }
        while (this.peek().kind === "plus" || this.peek().kind === "minus") {
            const op = this.take().kind;
            const right = this.parseMul();
            if (typeof right === "string") {
                return right;
            }
            const a = asNumber(left, "Addition");
            if (typeof a === "string") {
                return a;
            }
            const b = asNumber(right, "Addition");
            if (typeof b === "string") {
                return b;
            }
            left = {kind: "number", n: op === "plus" ? a + b : a - b};
        }
        return left;
    }

    parseMul(): RuntimeValue | string {
        let left = this.parsePower();
        if (typeof left === "string") {
            return left;
        }
        while (this.peek().kind === "star" || this.peek().kind === "slash") {
            const op = this.take().kind;
            const right = this.parsePower();
            if (typeof right === "string") {
                return right;
            }
            const a = asNumber(left, "Multiplication");
            if (typeof a === "string") {
                return a;
            }
            const b = asNumber(right, "Multiplication");
            if (typeof b === "string") {
                return b;
            }
            if (op === "slash") {
                if (b === 0) {
                    return "Division By Zero";
                }
                left = {kind: "number", n: a / b};
            } else {
                left = {kind: "number", n: a * b};
            }
        }
        return left;
    }

    parsePower(): RuntimeValue | string {
        const left = this.parseUnary();
        if (typeof left === "string") {
            return left;
        }
        if (this.peek().kind !== "caret") {
            return left;
        }
        this.take();
        const right = this.parsePower();
        if (typeof right === "string") {
            return right;
        }
        const a = asNumber(left, "Power");
        if (typeof a === "string") {
            return a;
        }
        const b = asNumber(right, "Power");
        if (typeof b === "string") {
            return b;
        }
        return {kind: "number", n: Math.pow(a, b)};
    }

    parseUnary(): RuntimeValue | string {
        if (this.peek().kind === "minus") {
            this.take();
            const inner = this.parseUnary();
            if (typeof inner === "string") {
                return inner;
            }
            const n = asNumber(inner, "Negation");
            if (typeof n === "string") {
                return n;
            }
            return {kind: "number", n: -n};
        }
        return this.parsePrimary();
    }

    parsePrimary(): RuntimeValue | string {
        const token = this.peek();
        if (token.kind === "number") {
            this.take();
            return {kind: "number", n: Number(token.text)};
        }
        if (token.kind === "ident") {
            return this.parseIdent();
        }
        if (token.kind === "lbracket") {
            return this.parseTileLiteral();
        }
        if (token.kind === "lbrace") {
            return this.parseCoordsLiteral();
        }
        if (token.kind === "lparen") {
            this.take();
            const inner = this.parseExpression();
            if (typeof inner === "string") {
                return inner;
            }
            const close = this.expect("rparen", "Expected )");
            if (typeof close === "string") {
                return close;
            }
            return inner;
        }
        return "Unexpected Token In Formula";
    }

    parseIdent(): RuntimeValue | string {
        const ident = this.take();
        if (ident.kind !== "ident") {
            return "Expected A Name";
        }
        if ((ident.text === "tile" || ident.text === "world") && this.peek().kind === "lparen") {
            return this.parseConverter(ident.text);
        }
        if (ident.text === this.selfName) {
            return "Formula Refers To Itself";
        }
        const found = this.lookup(ident.text);
        if (!found.ready) {
            return "Variables Are Not Ready";
        }
        if (found.missing) {
            return `Unknown Variable "${ident.text}"`;
        }
        if (found.valueType === "string") {
            return `Variable "${ident.text}" Is A String`;
        }
        const runtime = storedToRuntime(found.valueType, found.value);
        if (typeof runtime === "string") {
            return runtime;
        }
        if (this.peek().kind !== "dot") {
            return runtime;
        }
        this.take();
        const field = this.take();
        if (field.kind !== "ident") {
            return "Expected A Field Name After .";
        }
        if (runtime.kind === "tile") {
            if (field.text === "x") {
                return {kind: "number", n: runtime.x};
            }
            if (field.text === "y") {
                return {kind: "number", n: runtime.y};
            }
            return `Tile Has No Field "${field.text}"`;
        }
        if (runtime.kind === "coords") {
            if (field.text === "x") {
                return {kind: "number", n: runtime.x};
            }
            if (field.text === "y") {
                return {kind: "number", n: runtime.y};
            }
            if (field.text === "z") {
                return {kind: "number", n: runtime.z};
            }
            return `Coords Have No Field "${field.text}"`;
        }
        return `Cannot Read .${field.text} On A Number`;
    }

    parseConverter(name: string): RuntimeValue | string {
        this.take();
        const arg = this.parseExpression();
        if (typeof arg === "string") {
            return arg;
        }
        const close = this.expect("rparen", `Expected ) After ${name}(`);
        if (typeof close === "string") {
            return close;
        }
        if (name === "tile") {
            if (arg.kind !== "coords") {
                return "tile() Expects Coords";
            }
            return {kind: "tile", x: Math.floor(arg.x / 32), y: Math.floor(arg.y / 32)};
        }
        if (arg.kind !== "tile") {
            return "world() Expects A Tile";
        }
        return {kind: "coords", x: arg.x * 32, y: arg.y * 32, z: 0};
    }

    parseTileLiteral(): RuntimeValue | string {
        this.take();
        const x = this.parseExpression();
        if (typeof x === "string") {
            return x;
        }
        const comma = this.expect("comma", "Expected , In Tile [x, y]");
        if (typeof comma === "string") {
            return comma;
        }
        const y = this.parseExpression();
        if (typeof y === "string") {
            return y;
        }
        const close = this.expect("rbracket", "Expected ] After Tile");
        if (typeof close === "string") {
            return close;
        }
        const xn = asNumber(x, "Tile X");
        if (typeof xn === "string") {
            return xn;
        }
        const yn = asNumber(y, "Tile Y");
        if (typeof yn === "string") {
            return yn;
        }
        return {kind: "tile", x: xn, y: yn};
    }

    parseCoordsLiteral(): RuntimeValue | string {
        this.take();
        const x = this.parseExpression();
        if (typeof x === "string") {
            return x;
        }
        const comma1 = this.expect("comma", "Expected , In Coords {x, y, z}");
        if (typeof comma1 === "string") {
            return comma1;
        }
        const y = this.parseExpression();
        if (typeof y === "string") {
            return y;
        }
        const comma2 = this.expect("comma", "Expected , In Coords {x, y, z}");
        if (typeof comma2 === "string") {
            return comma2;
        }
        const z = this.parseExpression();
        if (typeof z === "string") {
            return z;
        }
        const close = this.expect("rbrace", "Expected } After Coords");
        if (typeof close === "string") {
            return close;
        }
        const xn = asNumber(x, "Coords X");
        if (typeof xn === "string") {
            return xn;
        }
        const yn = asNumber(y, "Coords Y");
        if (typeof yn === "string") {
            return yn;
        }
        const zn = asNumber(z, "Coords Z");
        if (typeof zn === "string") {
            return zn;
        }
        return {kind: "coords", x: xn, y: yn, z: zn};
    }
}

function conductorLookup(): LookupFn {
    return (name: string) => {
        if (!isVariableLookupBound()) {
            return {ready: false};
        }
        const found = findVariableByName(name);
        if (!found) {
            return {ready: true, missing: true};
        }
        return {
            ready: true,
            missing: false,
            valueType: found.valueType,
            value: found.value
        };
    };
}

export function formulaInputNames(formula: string): string[] {
    const tokens = tokenize(formula.replace(/^\s+|\s+$/g, ""));
    if (typeof tokens === "string") {
        return [];
    }
    const names: string[] = [];
    const seen: {[name: string]: boolean} = {};
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.kind !== "ident") {
            continue;
        }
        const prev = i > 0 ? tokens[i - 1] : undefined;
        if (prev && prev.kind === "dot") {
            continue;
        }
        const next = tokens[i + 1];
        if ((token.text === "tile" || token.text === "world") && next && next.kind === "lparen") {
            continue;
        }
        if (!seen[token.text]) {
            seen[token.text] = true;
            names.push(token.text);
        }
    }
    return names;
}

export function evaluateFormula(
    formula: string,
    expectedType: VariableValueType,
    selfName: string,
    lookup?: LookupFn
): FormulaResult {
    if (expectedType === "string") {
        return fail("String Formulas Are Not Supported");
    }
    const trimmed = formula.replace(/^\s+|\s+$/g, "");
    if (!trimmed) {
        return fail("Formula Is Blank");
    }
    if (!lookup && !isVariableLookupBound()) {
        return fail("Variables Are Not Ready");
    }
    const resolve = lookup || conductorLookup();
    const tokens = tokenize(trimmed);
    if (typeof tokens === "string") {
        return fail(tokens);
    }
    const parser = new Parser(tokens, selfName, resolve);
    const value = parser.parseExpression();
    if (typeof value === "string") {
        return fail(value);
    }
    if (parser.peek().kind !== "eof") {
        return fail("Unexpected Extra Text In Formula");
    }
    return runtimeToStored(expectedType, value);
}

export type FormulaVariable = {
    id: string;
    name: string;
    valueType: VariableValueType;
    formula: string;
    lastError: string;
    isFormula(): boolean;
    setValue(value: VariableStoredValue): boolean;
    setLastError(lastError: string): void;
};

export function applyFormulaToVariable(variable: FormulaVariable): void {
    if (!variable.isFormula()) {
        return;
    }
    const result = evaluateFormula(variable.formula, variable.valueType, variable.name);
    if (result.ok) {
        variable.setValue(result.value);
        variable.setLastError("");
        return;
    }
    variable.setLastError(result.error);
    error("variable", result.error, undefined, {detail: variable.id});
}
