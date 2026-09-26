import {store} from "openrct2-flexui";
import {
    childFolderPaths,
    compareFolderNames,
    displayFolderPath,
    existingFolderOrAncestor,
    folderLeafName,
    folderNameErrorMessage,
    isUnderFolder,
    joinFolder,
    normalizeFolder,
    parentFolder,
    rewriteFolderPrefix,
    ROOT_FOLDER,
    siblingFolderNames,
    validateFolderName
} from "../../model/folders/folderPath";
import {
    addStoredFolder,
    allFolderPaths,
    FolderCollection,
    removeStoredFoldersUnder,
    rewriteStoredFolders
} from "../../model/folders/folderStore";
import {showAlert} from "./alertMessage";
import {confirmDelete} from "./confirmDelete";
import {openFolderMovePicker} from "./folderMovePicker";
import {openNamePrompt} from "./namePrompt";

export type FolderRow =
    | {kind: "up"}
    | {kind: "folder"; path: string}
    | {kind: "item"; id: string};

export type FolderedItem = {
    id: string;
    name: string;
    folder: string;
};

export type FolderExplorer<T extends FolderedItem> = {
    currentFolder: ReturnType<typeof store<string>>;
    pathText: ReturnType<typeof store<string>>;
    listItems: ReturnType<typeof store<string[][]>>;
    selectedCell: ReturnType<typeof store<RowColumn | null>>;
    itemSelected: ReturnType<typeof store<boolean>>;
    folderSelected: ReturnType<typeof store<boolean>>;
    refresh: () => void;
    onRowClick: (index: number) => void;
    newFolder: () => void;
    renameSelected: () => void;
    moveSelected: () => void;
    deleteSelected: () => void;
    currentFolderPath: () => string;
    selectedItem: () => T | undefined;
};

export type FolderExplorerOptions<T extends FolderedItem> = {
    collection: FolderCollection;
    itemNoun: string;
    extraColumnCount: number;
    getItems: () => T[];
    extraColumns: (item: T) => string[];
    folderExtraColumns?: (path: string) => string[];
    /** When false, a second click on an item only keeps it selected. Folders still open. */
    openOnSecondClick?: boolean;
    itemMatchesSearch: (item: T, query: string) => boolean;
    displayName: (item: T) => string;
    getSearchQuery: () => string;
    clearSearch?: () => void;
    onOpenItem: (item: T) => void;
    onRenameItem: (item: T, name: string) => void;
    /** When false, Rename only applies to folders (open the item to change its name). */
    renameItems?: boolean;
    deleteItem: (item: T) => void;
    saveItems: () => void;
};

function padRow(name: string, extras: string[], extraCount: number): string[] {
    const row = [name];
    for (let i = 0; i < extraCount; i++) {
        row.push(i < extras.length ? extras[i] : "");
    }
    return row;
}

function itemFoldersOf<T extends FolderedItem>(items: T[]): string[] {
    const folders: string[] = [];
    for (let i = 0; i < items.length; i++) {
        folders.push(items[i].folder);
    }
    return folders;
}

function findItem<T extends FolderedItem>(items: T[], id: string): T | undefined {
    for (let i = 0; i < items.length; i++) {
        if (items[i].id === id) {
            return items[i];
        }
    }
    return undefined;
}

function countItemsUnder<T extends FolderedItem>(items: T[], folder: string): number {
    let count = 0;
    for (let i = 0; i < items.length; i++) {
        if (isUnderFolder(items[i].folder, folder)) {
            count += 1;
        }
    }
    return count;
}

function moveDestinations(allFolders: string[], movingFolder?: string): string[] {
    if (!movingFolder) {
        return allFolders.slice();
    }
    const dest: string[] = [];
    for (let i = 0; i < allFolders.length; i++) {
        if (!isUnderFolder(allFolders[i], movingFolder)) {
            dest.push(allFolders[i]);
        }
    }
    return dest;
}

export function createFolderExplorer<T extends FolderedItem>(
    options: FolderExplorerOptions<T>
): FolderExplorer<T> {
    const currentFolder = store<string>(ROOT_FOLDER);
    const pathText = store<string>(displayFolderPath(ROOT_FOLDER));
    const listItems = store<string[][]>([]);
    const selectedCell = store<RowColumn | null>(null);
    const itemSelected = store<boolean>(false);
    const folderSelected = store<boolean>(false);
    let visibleRows: FolderRow[] = [];
    let selectedIndex = -1;

    function clearSelection(): void {
        selectedIndex = -1;
        selectedCell.set(null);
        itemSelected.set(false);
        folderSelected.set(false);
    }

    function selectRow(index: number): void {
        if (index < 0 || index >= visibleRows.length) {
            clearSelection();
            return;
        }
        selectedIndex = index;
        selectedCell.set({row: index, column: 0});
        itemSelected.set(visibleRows[index].kind === "item");
        folderSelected.set(visibleRows[index].kind === "folder");
    }

    function selectedRow(): FolderRow | undefined {
        if (selectedIndex < 0 || selectedIndex >= visibleRows.length) {
            return undefined;
        }
        return visibleRows[selectedIndex];
    }

    function knownFolders(): string[] {
        return allFolderPaths(options.collection, itemFoldersOf(options.getItems()));
    }

    function setCurrentFolder(folder: string): void {
        const next = existingFolderOrAncestor(folder, knownFolders());
        currentFolder.set(next);
        pathText.set(displayFolderPath(next));
    }

    function refresh(): void {
        const items = options.getItems();
        const folders = allFolderPaths(options.collection, itemFoldersOf(items));
        const query = options.getSearchQuery().trim().toLowerCase();
        const current = existingFolderOrAncestor(currentFolder.get(), folders);
        if (current !== currentFolder.get()) {
            currentFolder.set(current);
        }
        pathText.set(displayFolderPath(current));

        const rows: FolderRow[] = [];
        const table: string[][] = [];

        if (!query) {
            if (current) {
                rows.push({kind: "up"});
                table.push(padRow("../", [], options.extraColumnCount));
            }
            const children = childFolderPaths(folders, current);
            for (let i = 0; i < children.length; i++) {
                const path = children[i];
                rows.push({kind: "folder", path: path});
                table.push(padRow(
                    `${folderLeafName(path)}/`,
                    options.folderExtraColumns ? options.folderExtraColumns(path) : [],
                    options.extraColumnCount
                ));
            }
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (normalizeFolder(item.folder) !== current) {
                    continue;
                }
                if (!options.itemMatchesSearch(item, "")) {
                    continue;
                }
                rows.push({kind: "item", id: item.id});
                table.push(padRow(
                    options.displayName(item),
                    options.extraColumns(item),
                    options.extraColumnCount
                ));
            }
        } else {
            const matchingFolders = folders.filter((path) => {
                return folderLeafName(path).toLowerCase().indexOf(query) !== -1;
            }).sort(compareFolderNames);
            for (let i = 0; i < matchingFolders.length; i++) {
                const path = matchingFolders[i];
                rows.push({kind: "folder", path: path});
                table.push(padRow(
                    `${path}/`,
                    options.folderExtraColumns ? options.folderExtraColumns(path) : [],
                    options.extraColumnCount
                ));
            }
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (!options.itemMatchesSearch(item, query)) {
                    continue;
                }
                rows.push({kind: "item", id: item.id});
                table.push(padRow(
                    options.displayName(item),
                    options.extraColumns(item),
                    options.extraColumnCount
                ));
            }
        }

        visibleRows = rows;
        listItems.set(table);
        clearSelection();
    }

    function navigateTo(folder: string): void {
        if (options.clearSearch) {
            options.clearSearch();
        }
        setCurrentFolder(folder);
        refresh();
    }

    function onRowClick(index: number): void {
        if (index < 0 || index >= visibleRows.length) {
            return;
        }
        if (index !== selectedIndex) {
            selectRow(index);
            return;
        }
        const row = visibleRows[index];
        if (row.kind === "up") {
            navigateTo(parentFolder(currentFolder.get()));
            return;
        }
        if (row.kind === "folder") {
            navigateTo(row.path);
            return;
        }
        if (options.openOnSecondClick === false) {
            return;
        }
        const item = findItem(options.getItems(), row.id);
        if (item) {
            options.onOpenItem(item);
        }
    }

    function newFolder(): void {
        const parent = currentFolder.get();
        const siblings = siblingFolderNames(knownFolders(), parent);
        openNamePrompt({
            title: "Add Folder",
            description: "Enter A Name For The Folder",
            onSubmit: (name) => {
                const error = validateFolderName(name, siblings);
                if (error) {
                    showAlert("Cannot Create Folder", folderNameErrorMessage(error));
                    return;
                }
                addStoredFolder(options.collection, joinFolder(parent, name.trim()));
                refresh();
            }
        });
    }

    function renameSelected(): void {
        const row = selectedRow();
        if (!row || row.kind === "up") {
            showAlert("Cannot Rename", "Select A Folder Or Item First.");
            return;
        }
        if (row.kind === "folder") {
            const parent = parentFolder(row.path);
            const currentName = folderLeafName(row.path);
            const siblings = siblingFolderNames(knownFolders(), parent);
            openNamePrompt({
                title: "Rename Folder",
                description: "Enter A New Name For This Folder",
                initialValue: currentName,
                onSubmit: (name) => {
                    const error = validateFolderName(name, siblings, currentName);
                    if (error) {
                        showAlert("Cannot Rename Folder", folderNameErrorMessage(error));
                        return;
                    }
                    const dest = joinFolder(parent, name.trim());
                    if (dest === row.path) {
                        return;
                    }
                    rewriteItemFolders(row.path, dest);
                    rewriteStoredFolders(options.collection, row.path, dest);
                    options.saveItems();
                    if (isUnderFolder(currentFolder.get(), row.path)) {
                        setCurrentFolder(rewriteFolderPrefix(
                            currentFolder.get(),
                            row.path,
                            dest
                        ));
                    }
                    refresh();
                }
            });
            return;
        }
        if (options.renameItems === false) {
            showAlert("Cannot Rename", `Open The ${options.itemNoun} To Change Its Name.`);
            return;
        }
        const item = findItem(options.getItems(), row.id);
        if (!item) {
            return;
        }
        openNamePrompt({
            title: `Rename ${options.itemNoun}`,
            description: `Enter A New Name For This ${options.itemNoun}`,
            initialValue: item.name,
            onSubmit: (name) => {
                options.onRenameItem(item, name);
                options.saveItems();
                refresh();
            }
        });
    }

    function rewriteItemFolders(from: string, to: string): void {
        const items = options.getItems();
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (isUnderFolder(item.folder, from)) {
                item.folder = rewriteFolderPrefix(item.folder, from, to);
            }
        }
    }

    function moveSelected(): void {
        const row = selectedRow();
        if (!row || row.kind === "up") {
            showAlert("Cannot Move", "Select A Folder Or Item First.");
            return;
        }
        const folders = knownFolders();
        if (row.kind === "folder") {
            openFolderMovePicker(moveDestinations(folders, row.path), (destParent) => {
                const dest = joinFolder(destParent, folderLeafName(row.path));
                if (dest === row.path) {
                    return;
                }
                const siblings = siblingFolderNames(folders, destParent);
                const error = validateFolderName(folderLeafName(row.path), siblings);
                if (error) {
                    showAlert("Cannot Move Folder", folderNameErrorMessage(error));
                    return;
                }
                rewriteItemFolders(row.path, dest);
                rewriteStoredFolders(options.collection, row.path, dest);
                options.saveItems();
                if (isUnderFolder(currentFolder.get(), row.path)) {
                    setCurrentFolder(rewriteFolderPrefix(
                        currentFolder.get(),
                        row.path,
                        dest
                    ));
                }
                refresh();
            });
            return;
        }
        const item = findItem(options.getItems(), row.id);
        if (!item) {
            return;
        }
        openFolderMovePicker(folders, (dest) => {
            item.folder = dest;
            options.saveItems();
            refresh();
        });
    }

    function deleteSelected(): void {
        const row = selectedRow();
        if (!row || row.kind === "up") {
            showAlert("Cannot Delete", "Select A Folder Or Item First.");
            return;
        }
        if (row.kind === "folder") {
            const items = options.getItems();
            const count = countItemsUnder(items, row.path);
            const folderName = folderLeafName(row.path);
            const message = count === 0
                ? `Delete folder "${folderName}"? This cannot be undone.`
                : `Delete folder "${folderName}" and ${count} item${count === 1 ? "" : "s"} inside? This cannot be undone.`;
            confirmDelete({
                title: "Delete Folder",
                message: message,
                onConfirm: () => {
                    const latest = options.getItems();
                    for (let i = latest.length - 1; i >= 0; i--) {
                        if (isUnderFolder(latest[i].folder, row.path)) {
                            options.deleteItem(latest[i]);
                        }
                    }
                    removeStoredFoldersUnder(options.collection, row.path);
                    options.saveItems();
                    if (isUnderFolder(currentFolder.get(), row.path)) {
                        setCurrentFolder(parentFolder(row.path));
                    }
                    refresh();
                }
            });
            return;
        }
        const item = findItem(options.getItems(), row.id);
        if (!item) {
            return;
        }
        confirmDelete({
            title: `Delete ${options.itemNoun}`,
            message: `Delete "${options.displayName(item)}"? This cannot be undone.`,
            onConfirm: () => {
                options.deleteItem(item);
                options.saveItems();
                refresh();
            }
        });
    }

    return {
        currentFolder,
        pathText,
        listItems,
        selectedCell,
        itemSelected,
        folderSelected,
        refresh,
        onRowClick,
        newFolder,
        renameSelected,
        moveSelected,
        deleteSelected,
        currentFolderPath: () => currentFolder.get(),
        selectedItem: () => {
            const row = selectedRow();
            if (!row || row.kind !== "item") {
                return undefined;
            }
            return findItem(options.getItems(), row.id);
        }
    };
}
