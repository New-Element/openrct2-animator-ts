/// <reference path="./../openrct2.d.ts" />

export type LogLevel = "log" | "error";

export type LogKind =
    | "triggerFired"
    | "animationStarted"
    | "animationConcluded"
    | "stepStarted"
    | "error"
    | "message";

export interface LogMeta {
    kind?: LogKind;
    triggerId?: string;
    animationId?: string;
    trainIndex?: number;
    carIndex?: number;
    detail?: unknown;
    /** Step start skips the game console. That line runs on every step and is slow. */
    skipConsole?: boolean;
}

export interface LogEntry {
    tick: number;
    level: LogLevel;
    kind: LogKind;
    area: string;
    message: string;
    triggerId?: string;
    animationId?: string;
    trainIndex?: number;
    carIndex?: number;
    detail?: string;
}

const MAX_RECENT = 100;
const recentLogs: LogEntry[] = [];

/** Called with a new entry, or null when the buffer was cleared. */
type LogListener = (entry: LogEntry | null) => void;
const listeners: LogListener[] = [];

function detailToString(detail: unknown): string {
    if (detail instanceof Error) {
        return detail.message;
    }
    if (typeof detail === "string") {
        return detail;
    }
    try {
        return JSON.stringify(detail);
    } catch (_e) {
        return String(detail);
    }
}

function currentTick(): number {
    if (typeof date !== "undefined" && typeof date.ticksElapsed === "number") {
        return date.ticksElapsed;
    }
    return 0;
}

function formatLine(
    level: LogLevel,
    area: string,
    message: string,
    detailStr?: string
): string {
    const prefix =
        level === "error"
            ? `[Animator][error][${area}]`
            : `[Animator][${area}]`;
    if (detailStr !== undefined) {
        return `${prefix} ${message}: ${detailStr}`;
    }
    return `${prefix} ${message}`;
}

function append(entry: LogEntry): void {
    recentLogs.push(entry);
    if (recentLogs.length > MAX_RECENT) {
        recentLogs.shift();
    }
    for (let i = 0; i < listeners.length; i++) {
        listeners[i](entry);
    }
}

function emit(level: LogLevel, area: string, message: string, meta?: LogMeta): void {
    const detailStr =
        meta && meta.detail !== undefined ? detailToString(meta.detail) : undefined;
    const kind: LogKind =
        meta && meta.kind
            ? meta.kind
            : level === "error"
              ? "error"
              : "message";
    // OpenRCT2 Console only exposes log(); differentiate via [error] in the prefix.
    // Step-start lines skip the console; they still go to the Logs tab.
    if (!meta || meta.skipConsole !== true) {
        console.log(formatLine(level, area, message, detailStr));
    }
    const entry: LogEntry = {
        tick: currentTick(),
        level: level,
        kind: kind,
        area: area,
        message: detailStr !== undefined ? `${message}: ${detailStr}` : message
    };
    if (meta) {
        if (meta.triggerId !== undefined) {
            entry.triggerId = meta.triggerId;
        }
        if (meta.animationId !== undefined) {
            entry.animationId = meta.animationId;
        }
        if (meta.trainIndex !== undefined) {
            entry.trainIndex = meta.trainIndex;
        }
        if (meta.carIndex !== undefined) {
            entry.carIndex = meta.carIndex;
        }
        if (detailStr !== undefined) {
            entry.detail = detailStr;
        }
    }
    append(entry);
}

/**
 * Info / lifecycle log. Prefer this for expected runtime events.
 */
export function log(area: string, message: string, meta?: LogMeta): void {
    emit("log", area, message, meta);
}

/**
 * Plugin error. Prefer this over throwing during load/tick paths.
 * Optional meta can stamp triggerId / animationId for Logs-tab filters.
 */
export function error(
    area: string,
    message: string,
    detail?: unknown,
    meta?: LogMeta
): void {
    const merged: LogMeta = {
        kind: "error",
        detail: detail
    };
    if (meta) {
        if (meta.triggerId !== undefined) {
            merged.triggerId = meta.triggerId;
        }
        if (meta.animationId !== undefined) {
            merged.animationId = meta.animationId;
        }
        if (meta.trainIndex !== undefined) {
            merged.trainIndex = meta.trainIndex;
        }
        if (meta.carIndex !== undefined) {
            merged.carIndex = meta.carIndex;
        }
    }
    emit("error", area, message, merged);
}

export function getRecentLogs(): LogEntry[] {
    return recentLogs.slice();
}

export function subscribe(listener: LogListener): void {
    listeners.push(listener);
}

export function unsubscribe(listener: LogListener): void {
    for (let i = listeners.length - 1; i >= 0; i--) {
        if (listeners[i] === listener) {
            listeners.splice(i, 1);
        }
    }
}

export function clearLogs(): void {
    recentLogs.length = 0;
    for (let i = 0; i < listeners.length; i++) {
        listeners[i](null);
    }
}
