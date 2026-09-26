import {store} from "openrct2-flexui";
import Animation from "../../model/animation/animation";
import {unlinkAnimationFromAllTriggers} from "../../model/animation/triggerAnimationLinks";
import getConductor from "../../model/getConductor";
import uuidV4 from "../../model/util/uuid";
import {createFolderExplorer} from "../ui/folderExplorer";
import {openAnimationEditor} from "./animationEditor";
import {logsListModel} from "../logs/logsListModel";

const searchText = store<string>("");

function displayName(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed : "(Unnamed)";
}

function matchesSearch(animation: Animation, query: string): boolean {
    if (!query) {
        return true;
    }
    return animation.name.toLowerCase().indexOf(query) !== -1 ||
        displayName(animation.name).toLowerCase().indexOf(query) !== -1;
}

const explorer = createFolderExplorer<Animation>({
    collection: "animations",
    itemNoun: "Animation",
    extraColumnCount: 1,
    getItems: () => getConductor().animationsArray.items,
    extraColumns: (animation) => [String(animation.steps.length)],
    itemMatchesSearch: matchesSearch,
    displayName: (animation) => displayName(animation.name),
    getSearchQuery: () => searchText.get(),
    clearSearch: () => searchText.set(""),
    onOpenItem: (animation) => {
        openAnimationEditor(animation.id, refreshAnimationsList);
    },
    onRenameItem: (animation, name) => {
        animation.name = name;
    },
    deleteItem: (animation) => {
        unlinkAnimationFromAllTriggers(animation.id);
        getConductor().animationsArray.removeById(animation.id);
    },
    saveItems: () => {
        getConductor().animationsArray.save();
    }
});

export function refreshAnimationsList(): void {
    explorer.refresh();
    logsListModel.refreshFilterOptions();
}

export function addUntitledAnimation(): void {
    const id = uuidV4();
    const animation = new Animation({
        id: id,
        name: "Untitled Animation",
        steps: [],
        folder: explorer.currentFolderPath()
    });
    const conductor = getConductor();
    conductor.animationsArray.items.push(animation);
    conductor.animationsArray.save();
    refreshAnimationsList();
    openAnimationEditor(id, refreshAnimationsList);
}

export const animationsListModel = {
    searchText,
    pathText: explorer.pathText,
    listItems: explorer.listItems,
    selectedCell: explorer.selectedCell,
    refresh: refreshAnimationsList,
    onRowClick: explorer.onRowClick,
    addUntitledAnimation,
    newFolder: explorer.newFolder,
    renameSelected: explorer.renameSelected,
    moveSelected: explorer.moveSelected,
    deleteSelected: explorer.deleteSelected
};
