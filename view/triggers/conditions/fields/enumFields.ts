/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, horizontal, label, store, twoway} from "openrct2-flexui";
import {indexOfValue} from "../labels";

export function createEnumFields<T extends string>(
    onPersist: () => void,
    title: string,
    values: T[],
    labels: string[]
) {
    const visibility = store<"visible" | "none">("none");
    const selectedIndex = store<number>(0);

    function hide(): void {
        visibility.set("none");
    }

    function load(value: string): void {
        visibility.set("visible");
        selectedIndex.set(indexOfValue(values, value as T));
    }

    function read(): T {
        return values[selectedIndex.get()] || values[0];
    }

    const widgets = [
        horizontal([
            label({
                text: title,
                width: 70,
                visibility
            }),
            dropdown({
                items: labels,
                selectedIndex: twoway(selectedIndex),
                visibility,
                onChange: (index) => {
                    selectedIndex.set(index);
                    onPersist();
                }
            })
        ])
    ];

    return {hide, load, read, widgets};
}

export function createOptionalEnumFields<T extends string>(
    onPersist: () => void,
    title: string,
    values: T[],
    labels: string[],
    noneLabel: string
) {
    const visibility = store<"visible" | "none">("none");
    const selectedIndex = store<number>(0);
    const items = [noneLabel].concat(labels);

    function hide(): void {
        visibility.set("none");
    }

    function load(value: string | undefined): void {
        visibility.set("visible");
        if (value === undefined) {
            selectedIndex.set(0);
            return;
        }
        selectedIndex.set(indexOfValue(values, value as T) + 1);
    }

    function read(): T | undefined {
        const index = selectedIndex.get();
        if (index <= 0) {
            return undefined;
        }
        return values[index - 1];
    }

    const widgets = [
        horizontal([
            label({
                text: title,
                width: 70,
                visibility
            }),
            dropdown({
                items: items,
                selectedIndex: twoway(selectedIndex),
                visibility,
                onChange: (index) => {
                    selectedIndex.set(index);
                    onPersist();
                }
            })
        ])
    ];

    return {hide, load, read, widgets};
}

export type EnumFields = {
    hide(): void;
    load(value: string): void;
    read(): string;
    widgets: unknown[];
};

export type OptionalEnumFields = {
    hide(): void;
    load(value: string | undefined): void;
    read(): string | undefined;
    widgets: unknown[];
};
