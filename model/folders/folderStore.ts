/// <reference path="./../../openrct2.d.ts" />

import {
    collectFolderPaths,
    isUnderFolder,
    normalizeFolder,
    rewriteFolderPrefix
} from "./folderPath";

export type FolderCollection =
    | "animations"
    | "triggers"
    | "variables"
    | "buildings"
    | "todos";

type FolderStoreData = {
    animations: string[];
    triggers: string[];
    variables: string[];
    buildings: string[];
    todos: string[];
};

const STORAGE_KEY = "animator.folders";

let cache: FolderStoreData | null = null;

function normalizeList(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }
    const seen: {[path: string]: true} = {};
    const out: string[] = [];
    for (let i = 0; i < value.length; i++) {
        const path = normalizeFolder(value[i]);
        if (!path || seen[path]) {
            continue;
        }
        seen[path] = true;
        out.push(path);
    }
    return out;
}

function readStore(): FolderStoreData {
    if (cache) {
        return cache;
    }
    const raw = context.getParkStorage().get(STORAGE_KEY, {}) as {
        animations?: unknown;
        triggers?: unknown;
        variables?: unknown;
        buildings?: unknown;
        todos?: unknown;
    };
    cache = {
        animations: normalizeList(raw.animations),
        triggers: normalizeList(raw.triggers),
        variables: normalizeList(raw.variables),
        buildings: normalizeList(raw.buildings),
        todos: normalizeList(raw.todos)
    };
    return cache;
}

function writeStore(): void {
    const data = readStore();
    context.getParkStorage().set(STORAGE_KEY, {
        animations: data.animations.slice(),
        triggers: data.triggers.slice(),
        variables: data.variables.slice(),
        buildings: data.buildings.slice(),
        todos: data.todos.slice()
    });
}

export function getStoredFolders(collection: FolderCollection): string[] {
    return readStore()[collection].slice();
}

export function setStoredFolders(
    collection: FolderCollection,
    paths: string[]
): void {
    readStore()[collection] = normalizeList(paths);
    writeStore();
}

export function addStoredFolder(
    collection: FolderCollection,
    path: string
): boolean {
    const normalized = normalizeFolder(path);
    if (!normalized) {
        return false;
    }
    const folders = getStoredFolders(collection);
    for (let i = 0; i < folders.length; i++) {
        if (folders[i] === normalized) {
            return false;
        }
    }
    folders.push(normalized);
    setStoredFolders(collection, folders);
    return true;
}

export function removeStoredFoldersUnder(
    collection: FolderCollection,
    path: string
): void {
    const folders = getStoredFolders(collection);
    const next: string[] = [];
    for (let i = 0; i < folders.length; i++) {
        if (!isUnderFolder(folders[i], path)) {
            next.push(folders[i]);
        }
    }
    setStoredFolders(collection, next);
}

export function rewriteStoredFolders(
    collection: FolderCollection,
    from: string,
    to: string
): void {
    const folders = getStoredFolders(collection);
    const next: string[] = [];
    for (let i = 0; i < folders.length; i++) {
        next.push(rewriteFolderPrefix(folders[i], from, to));
    }
    setStoredFolders(collection, next);
}

export function allFolderPaths(
    collection: FolderCollection,
    itemFolders: string[]
): string[] {
    return collectFolderPaths(getStoredFolders(collection), itemFolders);
}
