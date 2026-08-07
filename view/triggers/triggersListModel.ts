import {store} from "openrct2-flexui";
import getConductor from "../../model/getConductor";
import createTrigger from "../../model/animation/trigger/createTrigger";
import uuidV4 from "../../model/util/uuid";
import {
    eventKindFromTrigger,
    eventKindLabel,
    kindFromFilterIndex
} from "./eventType";
import {openTriggerEditor} from "./triggerEditor";

const searchText = store<string>("");
const filterEventIndex = store<number>(0);
const listItems = store<string[][]>([]);

/** Trigger ids matching the current filtered list order (for row click). */
let visibleTriggerIds: string[] = [];

function matchesFilters(name: string, eventLabel: string): boolean {
    const query = searchText.get().trim().toLowerCase();
    if (query && name.toLowerCase().indexOf(query) === -1) {
        return false;
    }
    const kind = kindFromFilterIndex(filterEventIndex.get());
    if (kind !== "all" && eventKindLabel(kind) !== eventLabel) {
        return false;
    }
    return true;
}

export function refreshTriggersList(): void {
    const triggers = getConductor().triggersArray.items;
    const rows: string[][] = [];
    const ids: string[] = [];

    for (let i = 0; i < triggers.length; i++) {
        const trigger = triggers[i];
        const eventLabel = eventKindLabel(eventKindFromTrigger(trigger));
        if (!matchesFilters(trigger.name, eventLabel)) {
            continue;
        }
        rows.push([trigger.name, eventLabel]);
        ids.push(trigger.id);
    }

    visibleTriggerIds = ids;
    listItems.set(rows);
}

export function addUntitledTrigger(): void {
    const id = uuidV4();
    const trigger = createTrigger({
        id: id,
        name: "Untitled trigger",
        event: null,
        conditions: [],
        animationIds: []
    });
    const conductor = getConductor();
    conductor.triggersArray.items.push(trigger);
    conductor.triggersArray.save();
    refreshTriggersList();
    openTriggerEditor(id, refreshTriggersList);
}

export function openTriggerAtListIndex(index: number): void {
    if (index < 0 || index >= visibleTriggerIds.length) {
        return;
    }
    openTriggerEditor(visibleTriggerIds[index], refreshTriggersList);
}

export const triggersListModel = {
    searchText,
    filterEventIndex,
    listItems,
    refresh: refreshTriggersList,
    addUntitledTrigger,
    openTriggerAtListIndex
};
