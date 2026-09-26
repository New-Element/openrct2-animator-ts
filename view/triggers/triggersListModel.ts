import {store} from "openrct2-flexui";
import getConductor from "../../model/getConductor";
import createTrigger from "../../model/animation/trigger/createTrigger";
import Trigger from "../../model/animation/trigger/trigger";
import uuidV4 from "../../model/util/uuid";
import {
    eventKindFromTrigger,
    eventKindLabel,
    kindFromFilterIndex
} from "./eventType";
import {openTriggerEditor} from "./triggerEditor";
import {logsListModel} from "../logs/logsListModel";
import {createFolderExplorer} from "../ui/folderExplorer";

const searchText = store<string>("");
const filterEventIndex = store<number>(0);

function matchesFilters(trigger: Trigger, query: string): boolean {
    if (query && trigger.name.toLowerCase().indexOf(query) === -1) {
        return false;
    }
    const eventLabel = eventKindLabel(eventKindFromTrigger(trigger));
    const kind = kindFromFilterIndex(filterEventIndex.get());
    if (kind !== "all" && eventKindLabel(kind) !== eventLabel) {
        return false;
    }
    return true;
}

const explorer = createFolderExplorer<Trigger>({
    collection: "triggers",
    itemNoun: "Trigger",
    extraColumnCount: 2,
    getItems: () => getConductor().triggersArray.items,
    extraColumns: (trigger) => [
        eventKindLabel(eventKindFromTrigger(trigger)),
        trigger.enabled ? "Y" : "N"
    ],
    itemMatchesSearch: matchesFilters,
    displayName: (trigger) => trigger.name,
    getSearchQuery: () => searchText.get(),
    clearSearch: () => searchText.set(""),
    onOpenItem: (trigger) => {
        openTriggerEditor(trigger.id, refreshTriggersList);
    },
    onRenameItem: (trigger, name) => {
        trigger.setName(name);
    },
    deleteItem: (trigger) => {
        getConductor().triggersArray.removeById(trigger.id);
    },
    saveItems: () => {
        getConductor().triggersArray.save();
    }
});

export function refreshTriggersList(): void {
    explorer.refresh();
    logsListModel.refreshFilterOptions();
}

export function addUntitledTrigger(): void {
    const id = uuidV4();
    const trigger = createTrigger({
        id: id,
        name: "Untitled trigger",
        event: null,
        conditions: [],
        animationIds: [],
        folder: explorer.currentFolderPath()
    });
    const conductor = getConductor();
    conductor.triggersArray.items.push(trigger);
    conductor.triggersArray.save();
    refreshTriggersList();
    openTriggerEditor(id, refreshTriggersList);
}

export const triggersListModel = {
    searchText,
    filterEventIndex,
    pathText: explorer.pathText,
    listItems: explorer.listItems,
    selectedCell: explorer.selectedCell,
    refresh: refreshTriggersList,
    onRowClick: explorer.onRowClick,
    addUntitledTrigger,
    newFolder: explorer.newFolder,
    renameSelected: explorer.renameSelected,
    moveSelected: explorer.moveSelected,
    deleteSelected: explorer.deleteSelected
};
