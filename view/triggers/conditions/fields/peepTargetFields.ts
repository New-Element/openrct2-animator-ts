/// <reference path="./../../../../openrct2.d.ts" />

import {checkbox, compute, dropdown, horizontal, label, store, twoway} from "openrct2-flexui";
import {goToEntityButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickGuest} from "../../../ui/pickGuest";
import {pickStaff} from "../../../ui/pickStaff";

function entityName(id: number | undefined, type: "guest" | "staff"): string {
    if (typeof id !== "number") {
        return type === "guest" ? "(No Guest)" : "(No Staff)";
    }
    const entity = map.getEntity(id);
    if (!entity || entity.type !== type) {
        return `${type === "guest" ? "Guest" : "Staff"} #${id}`;
    }
    const named = entity as Guest | Staff;
    const name = named.name && named.name.trim() ? named.name : "";
    return name ? name : `${type === "guest" ? "Guest" : "Staff"} #${id}`;
}

function listStaffOptions(): {id: number; name: string}[] {
    const staff = map.getAllEntities("staff");
    const options: {id: number; name: string}[] = [];
    for (let i = 0; i < staff.length; i++) {
        if (staff[i].id === null) {
            continue;
        }
        options.push({
            id: staff[i].id as number,
            name: staff[i].name && staff[i].name.trim() ? staff[i].name : `Staff #${staff[i].id}`
        });
    }
    return options;
}

export function createPeepTargetFields(
    onPersist: () => void,
    kind: "guest" | "staff"
) {
    const visibility = store<"visible" | "none">("none");
    const pickVisibility = store<"visible" | "none">("none");
    const useTrigger = store<boolean>(true);
    const nameLabel = store<string>(kind === "guest" ? "(Trigger Guest)" : "(Trigger Staff)");
    const staffItems = store<string[]>(["(No Staff)"]);
    const staffIndex = store<number>(0);
    const hasPickedEntity = store<boolean>(false);
    let pickedId: number | undefined;
    let staffOptions: {id: number; name: string}[] = [];

    function syncPickVisibility(): void {
        pickVisibility.set(visibility.get() === "visible" && !useTrigger.get() ? "visible" : "none");
    }

    function refreshStaffOptions(preferredId?: number): void {
        staffOptions = listStaffOptions();
        if (staffOptions.length === 0) {
            staffItems.set(["(No Staff)"]);
            staffIndex.set(0);
            return;
        }
        const labels: string[] = [];
        let selected = 0;
        for (let i = 0; i < staffOptions.length; i++) {
            labels.push(staffOptions[i].name);
            if (preferredId !== undefined && staffOptions[i].id === preferredId) {
                selected = i;
            }
        }
        staffItems.set(labels);
        staffIndex.set(selected);
        pickedId = staffOptions[selected].id;
        hasPickedEntity.set(true);
    }

    function hide(): void {
        visibility.set("none");
        pickVisibility.set("none");
    }

    function load(useTriggerValue: boolean, id: number | undefined): void {
        visibility.set("visible");
        useTrigger.set(useTriggerValue);
        pickedId = id;
        hasPickedEntity.set(typeof id === "number");
        if (kind === "staff" && !useTriggerValue) {
            refreshStaffOptions(id);
        }
        nameLabel.set(
            useTriggerValue
                ? (kind === "guest" ? "(Trigger Guest)" : "(Trigger Staff)")
                : entityName(id, kind)
        );
        syncPickVisibility();
    }

    function read(): {useTrigger: boolean; id: number | undefined} {
        return {
            useTrigger: useTrigger.get(),
            id: useTrigger.get() ? undefined : pickedId
        };
    }

    const widgets = [
        checkbox({
            text: kind === "guest" ? "Use Trigger Guest" : "Use Trigger Staff",
            isChecked: twoway(useTrigger),
            visibility,
            onChange: (checked) => {
                useTrigger.set(checked);
                if (!checked && kind === "staff") {
                    refreshStaffOptions(pickedId);
                }
                nameLabel.set(
                    checked
                        ? (kind === "guest" ? "(Trigger Guest)" : "(Trigger Staff)")
                        : entityName(pickedId, kind)
                );
                syncPickVisibility();
                onPersist();
            }
        }),
        label({
            text: nameLabel,
            visibility
        }),
        horizontal({
            content: [
                dropdown({
                    items: staffItems,
                    selectedIndex: twoway(staffIndex),
                    visibility: kind === "staff" ? pickVisibility : store<"visible" | "none">("none"),
                    onChange: (index) => {
                        staffIndex.set(index);
                        if (index >= 0 && index < staffOptions.length) {
                            pickedId = staffOptions[index].id;
                            hasPickedEntity.set(true);
                            nameLabel.set(entityName(pickedId, "staff"));
                        }
                        onPersist();
                    }
                }),
                pickIconButton({
                    tooltip: kind === "guest" ? "Pick Guest" : "Pick Staff",
                    visibility: pickVisibility,
                    onClick: () => {
                        const picker = kind === "guest" ? pickGuest : pickStaff;
                        picker((id) => {
                            pickedId = id;
                            hasPickedEntity.set(true);
                            if (kind === "staff") {
                                refreshStaffOptions(id);
                            }
                            nameLabel.set(entityName(id, kind));
                            onPersist();
                        });
                    }
                }),
                goToEntityButton({
                    tooltip: kind === "guest" ? "Go To Guest" : "Go To Staff",
                    visibility: pickVisibility,
                    disabled: compute(hasPickedEntity, (picked) => !picked),
                    getEntityId: () => pickedId
                })
            ]
        })
    ];

    return {hide, load, read, widgets};
}

export type PeepTargetFields = ReturnType<typeof createPeepTargetFields>;
