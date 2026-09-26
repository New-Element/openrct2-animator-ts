import {button, horizontal, label, listview, store, twoway, window} from "openrct2-flexui";
import {displayFolderPath, ROOT_FOLDER} from "../../model/folders/folderPath";
import {WINDOW_COLOURS} from "./windowColours";

const listItems = store<string[][]>([]);
const selectedCell = store<RowColumn | null>(null);

let destinations: string[] = [];
let selectedIndex = -1;
let onPicked: ((folder: string) => void) | null = null;

function selectRow(index: number): void {
    if (index < 0 || index >= destinations.length) {
        selectedIndex = -1;
        selectedCell.set(null);
        return;
    }
    selectedIndex = index;
    selectedCell.set({row: index, column: 0});
}

const pickerWindow = window({
    title: "Move To Folder",
    colours: WINDOW_COLOURS,
    width: 300,
    height: 260,
    position: "center",
    padding: 8,
    content: [
        label({
            text: "Choose A Destination Folder"
        }),
        listview({
            items: listItems,
            columns: [
                {header: "Folder"}
            ],
            scrollbars: "vertical",
            canSelect: true,
            isStriped: true,
            height: "1w",
            selectedCell: twoway(selectedCell),
            onClick: (item) => {
                selectRow(item);
            }
        }),
        horizontal([
            button({
                text: "Cancel",
                width: 60,
                height: 14,
                onClick: () => {
                    pickerWindow.close();
                }
            }),
            button({
                text: "Move Here",
                width: 80,
                height: 14,
                onClick: () => {
                    if (selectedIndex < 0 || selectedIndex >= destinations.length) {
                        return;
                    }
                    const folder = destinations[selectedIndex];
                    pickerWindow.close();
                    if (onPicked) {
                        onPicked(folder);
                    }
                }
            })
        ])
    ]
});

export function openFolderMovePicker(
    folders: string[],
    onPick: (folder: string) => void
): void {
    const rows: string[][] = [[displayFolderPath(ROOT_FOLDER)]];
    destinations = [ROOT_FOLDER];
    const sorted = folders.slice().sort((a, b) => {
        const left = displayFolderPath(a);
        const right = displayFolderPath(b);
        if (left < right) {
            return -1;
        }
        if (left > right) {
            return 1;
        }
        return 0;
    });
    for (let i = 0; i < sorted.length; i++) {
        destinations.push(sorted[i]);
        rows.push([displayFolderPath(sorted[i])]);
    }
    listItems.set(rows);
    selectRow(0);
    onPicked = onPick;
    pickerWindow.open();
}
