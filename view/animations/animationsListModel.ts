import {store} from "openrct2-flexui";
import Animation from "../../model/animation/animation";
import getConductor from "../../model/getConductor";
import uuidV4 from "../../model/util/uuid";
import {openAnimationEditor} from "./animationEditor";

const searchText = store<string>("");
const listItems = store<string[][]>([]);

/** Animation ids matching the current filtered list order (for row click). */
let visibleAnimationIds: string[] = [];

function displayName(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed : "(Unnamed)";
}

function matchesSearch(name: string): boolean {
    const query = searchText.get().trim().toLowerCase();
    if (!query) {
        return true;
    }
    return name.toLowerCase().indexOf(query) !== -1 ||
        displayName(name).toLowerCase().indexOf(query) !== -1;
}

export function refreshAnimationsList(): void {
    const animations = getConductor().animationsArray.items;
    const rows: string[][] = [];
    const ids: string[] = [];

    for (let i = 0; i < animations.length; i++) {
        const animation = animations[i];
        if (!matchesSearch(animation.name)) {
            continue;
        }
        rows.push([
            displayName(animation.name),
            String(animation.steps.length)
        ]);
        ids.push(animation.id);
    }

    visibleAnimationIds = ids;
    listItems.set(rows);
}

export function addUntitledAnimation(): void {
    const id = uuidV4();
    const animation = new Animation({
        id: id,
        name: "Untitled Animation",
        steps: []
    });
    const conductor = getConductor();
    conductor.animationsArray.items.push(animation);
    conductor.animationsArray.save();
    refreshAnimationsList();
    openAnimationEditor(id, refreshAnimationsList);
}

export function openAnimationAtListIndex(index: number): void {
    if (index < 0 || index >= visibleAnimationIds.length) {
        return;
    }
    openAnimationEditor(visibleAnimationIds[index], refreshAnimationsList);
}

export const animationsListModel = {
    searchText,
    listItems,
    refresh: refreshAnimationsList,
    addUntitledAnimation,
    openAnimationAtListIndex
};
