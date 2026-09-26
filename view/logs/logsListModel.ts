import {store} from "openrct2-flexui";
import getConductor from "../../model/getConductor";
import {
    clearLogs,
    getRecentLogs,
    LogEntry,
    subscribe,
    unsubscribe
} from "../../model/logger";

const ALL_TRIGGERS_LABEL = "All Triggers";
const ALL_ANIMATIONS_LABEL = "All Animations";

const listItems = store<string[][]>([]);
const filterTriggerIndex = store<number>(0);
const filterAnimationIndex = store<number>(0);
const triggerFilterLabels = store<string[]>([ALL_TRIGGERS_LABEL]);
const animationFilterLabels = store<string[]>([ALL_ANIMATIONS_LABEL]);

/** Ids aligned with dropdown labels (index 0 = All → null). */
let triggerFilterIds: (string | null)[] = [null];
let animationFilterIds: (string | null)[] = [null];

let subscribed = false;

function formatLevel(level: string): string {
    if (level === "error") {
        return "Error";
    }
    return "Log";
}

function entryToRow(entry: LogEntry): string[] {
    return [
        String(entry.tick),
        formatLevel(entry.level),
        entry.area,
        entry.message
    ];
}

function selectedTriggerId(): string | null {
    const index = filterTriggerIndex.get();
    if (index < 0 || index >= triggerFilterIds.length) {
        return null;
    }
    return triggerFilterIds[index];
}

function selectedAnimationId(): string | null {
    const index = filterAnimationIndex.get();
    if (index < 0 || index >= animationFilterIds.length) {
        return null;
    }
    return animationFilterIds[index];
}

function entryMatchesFilters(entry: LogEntry): boolean {
    const triggerId = selectedTriggerId();
    if (triggerId !== null && entry.triggerId !== triggerId) {
        return false;
    }
    const animationId = selectedAnimationId();
    if (animationId !== null && entry.animationId !== animationId) {
        return false;
    }
    return true;
}

function rowsFromBuffer(): string[][] {
    const entries = getRecentLogs();
    const rows: string[][] = [];
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entryMatchesFilters(entry)) {
            rows.push(entryToRow(entry));
        }
    }
    return rows;
}

function onLogEntry(_entry: LogEntry | null): void {
    listItems.set(rowsFromBuffer());
}

export function refreshFilterOptions(): void {
    const conductor = getConductor();

    const triggerLabels = [ALL_TRIGGERS_LABEL];
    const triggerIds: (string | null)[] = [null];
    const triggers = conductor.triggersArray.items;
    for (let i = 0; i < triggers.length; i++) {
        triggerLabels.push(triggers[i].name);
        triggerIds.push(triggers[i].id);
    }
    triggerFilterLabels.set(triggerLabels);
    triggerFilterIds = triggerIds;

    const animationLabels = [ALL_ANIMATIONS_LABEL];
    const animationIds: (string | null)[] = [null];
    const animations = conductor.animationsArray.items;
    for (let i = 0; i < animations.length; i++) {
        animationLabels.push(animations[i].name);
        animationIds.push(animations[i].id);
    }
    animationFilterLabels.set(animationLabels);
    animationFilterIds = animationIds;
}

export function resetLogFilters(): void {
    filterTriggerIndex.set(0);
    filterAnimationIndex.set(0);
}

export function refreshLogsList(): void {
    listItems.set(rowsFromBuffer());
}

export function ensureLogsSubscription(): void {
    if (subscribed) {
        return;
    }
    subscribe(onLogEntry);
    subscribed = true;
}

export function releaseLogsSubscription(): void {
    if (!subscribed) {
        return;
    }
    unsubscribe(onLogEntry);
    subscribed = false;
}

export function clearLogsList(): void {
    clearLogs();
}

export const logsListModel = {
    listItems: listItems,
    filterTriggerIndex: filterTriggerIndex,
    filterAnimationIndex: filterAnimationIndex,
    triggerFilterLabels: triggerFilterLabels,
    animationFilterLabels: animationFilterLabels,
    refresh: refreshLogsList,
    refreshFilterOptions: refreshFilterOptions,
    resetFilters: resetLogFilters,
    ensureSubscription: ensureLogsSubscription,
    releaseSubscription: releaseLogsSubscription,
    clear: clearLogsList
};
