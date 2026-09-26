/// <reference path="./../../../openrct2.d.ts" />

import {button, dropdown, groupbox, horizontal, listview, store, twoway, vertical, window} from "openrct2-flexui";
import {ConditionDesc} from "../../../model/animation/jsonTypes";
import {WINDOW_COLOURS} from "../../ui/windowColours";
import {createConditionEditorUi} from "./conditionUi";

export function createConditionListEditor(
    onPersist: () => void,
    options?: {listHeader?: object[]; listHeight?: number | "1w"; initiallyVisible?: boolean}
) {
    const visibility = store<"visible" | "none">(
        options && options.initiallyVisible === false ? "none" : "visible"
    );
    const listItems = store<string[]>([]);
    const selectedIndex = store<number>(-1);
    const selectedCell = store<RowColumn | null>(null);
    const addIndex = store<number>(0);
    const popupTitle = store<string>("Condition");
    const listHeight = options && options.listHeight !== undefined ? options.listHeight : "1w";
    const listHeader = options && options.listHeader ? options.listHeader : [];

    let descs: ConditionDesc[] = [];
    let suppressPersist = 0;

    const conditionUi = createConditionEditorUi(() => persistSelected());

    function setSelected(index: number): void {
        selectedIndex.set(index);
        if (index < 0) {
            selectedCell.set(null);
            return;
        }
        selectedCell.set({row: index, column: 0});
    }

    function conditionTitle(index: number): string {
        return `Condition (${index + 1}): ${conditionUi.conditionRowLabel(descs[index])}`;
    }

    function closePopup(): void {
        editorWindow.close();
    }

    function openPopup(): void {
        const index = selectedIndex.get();
        if (index < 0 || index >= descs.length) {
            return;
        }
        popupTitle.set(conditionTitle(index));
        editorWindow.open();
    }

    function syncSelectedFields(): void {
        const selected = selectedIndex.get();
        if (selected < 0 || selected >= descs.length) {
            conditionUi.hideAllConditionSections();
            return;
        }
        popupTitle.set(conditionTitle(selected));
        conditionUi.loadCondition(descs[selected]);
    }

    function refreshRows(): void {
        const rows: string[] = [];
        for (let i = 0; i < descs.length; i++) {
            rows.push(conditionUi.conditionRowLabel(descs[i]));
        }
        listItems.set(rows);
        const selected = selectedIndex.get();
        if (selected < 0 || selected >= descs.length) {
            setSelected(-1);
            conditionUi.hideAllConditionSections();
            closePopup();
            return;
        }
        selectedCell.set({row: selected, column: 0});
        syncSelectedFields();
    }

    function writeSelected(): void {
        const index = selectedIndex.get();
        if (index < 0 || index >= descs.length) {
            return;
        }
        conditionUi.persistCondition(descs[index]);
    }

    function updateRowLabels(): void {
        const rows: string[] = [];
        for (let i = 0; i < descs.length; i++) {
            rows.push(conditionUi.conditionRowLabel(descs[i]));
        }
        listItems.set(rows);
        const selected = selectedIndex.get();
        if (selected >= 0 && selected < descs.length) {
            popupTitle.set(conditionTitle(selected));
        }
    }

    function persistSelected(): void {
        if (suppressPersist > 0) {
            return;
        }
        suppressPersist += 1;
        try {
            writeSelected();
            updateRowLabels();
            onPersist();
        } finally {
            suppressPersist -= 1;
        }
    }

    function load(next: ConditionDesc[]): void {
        suppressPersist += 1;
        try {
            descs = [];
            for (let i = 0; i < next.length; i++) {
                descs.push(next[i]);
            }
            visibility.set("visible");
            closePopup();
            refreshRows();
        } finally {
            suppressPersist -= 1;
        }
    }

    function clearSelection(): void {
        setSelected(-1);
        conditionUi.hideAllConditionSections();
        closePopup();
    }

    function read(): ConditionDesc[] {
        writeSelected();
        const out: ConditionDesc[] = [];
        for (let i = 0; i < descs.length; i++) {
            out.push(descs[i]);
        }
        return out;
    }

    function hide(): void {
        visibility.set("none");
        conditionUi.hideAllConditionSections();
        closePopup();
    }

    function addCondition(): void {
        descs.push(conditionUi.createConditionStub(addIndex.get()));
        setSelected(descs.length - 1);
        refreshRows();
        onPersist();
        openPopup();
    }

    function deleteSelected(): void {
        const index = selectedIndex.get();
        if (index < 0 || index >= descs.length) {
            return;
        }
        const next: ConditionDesc[] = [];
        for (let i = 0; i < descs.length; i++) {
            if (i !== index) {
                next.push(descs[i]);
            }
        }
        descs = next;
        setSelected(-1);
        refreshRows();
        onPersist();
    }

    const editorWindow = window({
        title: popupTitle,
        colours: WINDOW_COLOURS,
        width: {value: 420, min: 320, max: 640},
        height: {value: 380, min: 220, max: 640},
        position: "center",
        padding: 8,
        content: [
            vertical({
                spacing: 4,
                content: [
                    button({
                        text: "Delete",
                        width: 55,
                        height: 14,
                        onClick: () => deleteSelected()
                    }),
                    ...(conditionUi.widgets as [])
                ]
            })
        ]
    });

    const widgets = [
        groupbox({
            text: "Conditions",
            height: "1w",
            visibility,
            content: [
                ...(listHeader as []),
                listview({
                    items: listItems,
                    scrollbars: "vertical",
                    canSelect: true,
                    selectedCell: twoway(selectedCell),
                    height: listHeight,
                    visibility,
                    onClick: (item: number) => {
                        setSelected(item);
                        refreshRows();
                        openPopup();
                    }
                }),
                horizontal([
                    dropdown({
                        items: conditionUi.ADD_CONDITION_LABELS,
                        selectedIndex: twoway(addIndex),
                        width: 140,
                        visibility
                    }),
                    button({
                        text: "Add",
                        width: 40,
                        height: 14,
                        visibility,
                        onClick: () => addCondition()
                    })
                ])
            ]
        })
    ];

    return {widgets, load, read, hide, clearSelection, close: closePopup, visibility};
}

export type ConditionListEditor = ReturnType<typeof createConditionListEditor>;
