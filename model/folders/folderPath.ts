/** Root folder path stored on items and in the empty-folder list. */
export const ROOT_FOLDER = "";

export function normalizeFolder(value: unknown): string {
    if (typeof value !== "string") {
        return ROOT_FOLDER;
    }
    const parts: string[] = [];
    const raw = value.split("/");
    for (let i = 0; i < raw.length; i++) {
        const part = raw[i].trim();
        if (!part || part === "." || part === "..") {
            continue;
        }
        parts.push(part);
    }
    return parts.join("/");
}

export function readFolderField(obj: {folder?: unknown}): string {
    return normalizeFolder(obj.folder);
}

export function writeFolderField(
    data: {folder?: string},
    folder: string
): void {
    const normalized = normalizeFolder(folder);
    if (normalized) {
        data.folder = normalized;
    }
}

export function displayFolderPath(folder: string): string {
    const normalized = normalizeFolder(folder);
    return normalized ? `./${normalized}/` : "./";
}

export function parentFolder(folder: string): string {
    const normalized = normalizeFolder(folder);
    const slash = normalized.lastIndexOf("/");
    if (slash === -1) {
        return ROOT_FOLDER;
    }
    return normalized.slice(0, slash);
}

export function folderLeafName(folder: string): string {
    const normalized = normalizeFolder(folder);
    const slash = normalized.lastIndexOf("/");
    if (slash === -1) {
        return normalized;
    }
    return normalized.slice(slash + 1);
}

export function joinFolder(parent: string, name: string): string {
    const parentPath = normalizeFolder(parent);
    const leaf = name.trim();
    if (!leaf) {
        return parentPath;
    }
    return parentPath ? `${parentPath}/${leaf}` : leaf;
}

export function isUnderFolder(folder: string, ancestor: string): boolean {
    const path = normalizeFolder(folder);
    const root = normalizeFolder(ancestor);
    if (!root) {
        return true;
    }
    return path === root || path.indexOf(root + "/") === 0;
}

export function ancestorFolderPaths(folder: string): string[] {
    const normalized = normalizeFolder(folder);
    if (!normalized) {
        return [];
    }
    const parts = normalized.split("/");
    const paths: string[] = [];
    let current = "";
    for (let i = 0; i < parts.length; i++) {
        current = current ? `${current}/${parts[i]}` : parts[i];
        paths.push(current);
    }
    return paths;
}

export function childFolderPaths(allFolders: string[], parent: string): string[] {
    const parentPath = normalizeFolder(parent);
    const prefix = parentPath ? parentPath + "/" : "";
    const seen: {[name: string]: string} = {};
    const names: string[] = [];
    for (let i = 0; i < allFolders.length; i++) {
        const folder = normalizeFolder(allFolders[i]);
        if (!folder) {
            continue;
        }
        if (parentPath) {
            if (folder === parentPath || folder.indexOf(prefix) !== 0) {
                continue;
            }
            const rest = folder.slice(prefix.length);
            const slash = rest.indexOf("/");
            const childName = slash === -1 ? rest : rest.slice(0, slash);
            const childPath = joinFolder(parentPath, childName);
            if (!seen[childName]) {
                seen[childName] = childPath;
                names.push(childName);
            }
        } else {
            const slash = folder.indexOf("/");
            const childName = slash === -1 ? folder : folder.slice(0, slash);
            if (!seen[childName]) {
                seen[childName] = childName;
                names.push(childName);
            }
        }
    }
    names.sort(compareFolderNames);
    const children: string[] = [];
    for (let i = 0; i < names.length; i++) {
        children.push(seen[names[i]]);
    }
    return children;
}

export function collectFolderPaths(
    storedFolders: string[],
    itemFolders: string[]
): string[] {
    const seen: {[path: string]: true} = {};
    const out: string[] = [];
    function add(path: string): void {
        const ancestors = ancestorFolderPaths(path);
        for (let i = 0; i < ancestors.length; i++) {
            const ancestor = ancestors[i];
            if (!seen[ancestor]) {
                seen[ancestor] = true;
                out.push(ancestor);
            }
        }
    }
    for (let i = 0; i < storedFolders.length; i++) {
        add(storedFolders[i]);
    }
    for (let i = 0; i < itemFolders.length; i++) {
        add(itemFolders[i]);
    }
    return out;
}

export function rewriteFolderPrefix(
    path: string,
    from: string,
    to: string
): string {
    const current = normalizeFolder(path);
    const source = normalizeFolder(from);
    const dest = normalizeFolder(to);
    if (!source) {
        return dest ? joinFolder(dest, current) : current;
    }
    if (current === source) {
        return dest;
    }
    if (current.indexOf(source + "/") === 0) {
        const rest = current.slice(source.length + 1);
        return dest ? `${dest}/${rest}` : rest;
    }
    return current;
}

export function existingFolderOrAncestor(
    folder: string,
    allFolders: string[]
): string {
    let current = normalizeFolder(folder);
    const present: {[path: string]: true} = {};
    for (let i = 0; i < allFolders.length; i++) {
        present[normalizeFolder(allFolders[i])] = true;
    }
    while (current && !present[current]) {
        current = parentFolder(current);
    }
    return current;
}

export function compareFolderNames(a: string, b: string): number {
    const left = a.toLowerCase();
    const right = b.toLowerCase();
    if (left < right) {
        return -1;
    }
    if (left > right) {
        return 1;
    }
    return 0;
}

export type FolderNameError = "empty" | "slash" | "reserved" | "exists";

export function validateFolderName(
    name: string,
    siblingNames: string[],
    ignoreName?: string
): FolderNameError | null {
    const trimmed = name.trim();
    if (!trimmed) {
        return "empty";
    }
    if (trimmed.indexOf("/") !== -1) {
        return "slash";
    }
    if (trimmed === "." || trimmed === "..") {
        return "reserved";
    }
    const ignore = ignoreName ? ignoreName.trim().toLowerCase() : "";
    const wanted = trimmed.toLowerCase();
    for (let i = 0; i < siblingNames.length; i++) {
        const sibling = siblingNames[i].trim().toLowerCase();
        if (sibling === wanted && sibling !== ignore) {
            return "exists";
        }
    }
    return null;
}

export function folderNameErrorMessage(error: FolderNameError): string {
    switch (error) {
        case "empty":
            return "Enter A Folder Name.";
        case "slash":
            return "Folder Names Cannot Contain /.";
        case "reserved":
            return "That Folder Name Is Reserved.";
        case "exists":
            return "A Folder With This Name Already Exists.";
        default:
            return "Cannot Create Folder.";
    }
}

export function siblingFolderNames(allFolders: string[], parent: string): string[] {
    const children = childFolderPaths(allFolders, parent);
    const names: string[] = [];
    for (let i = 0; i < children.length; i++) {
        names.push(folderLeafName(children[i]));
    }
    return names;
}
