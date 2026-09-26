/// <reference path="./../../../../openrct2.d.ts" />

export type MusicObjectOption = {
    index: number;
    identifier: string;
    name: string;
};

function compareNames(a: string, b: string): number {
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

/** Loaded music objects, alphabetical by the name the ride Music tab shows. */
export function listMusicObjects(): MusicObjectOption[] {
    if (typeof objectManager === "undefined") {
        return [];
    }
    const loaded = objectManager.getAllObjects("music");
    const options: MusicObjectOption[] = [];
    for (let i = 0; i < loaded.length; i++) {
        const object = loaded[i];
        options.push({
            index: object.index,
            identifier: object.identifier,
            name: object.name || object.identifier
        });
    }
    options.sort((a, b) => compareNames(a.name, b.name));
    return options;
}

export function findMusicObjectByIdentifier(identifier: string): MusicObjectOption | null {
    const options = listMusicObjects();
    for (let i = 0; i < options.length; i++) {
        if (options[i].identifier === identifier) {
            return options[i];
        }
    }
    return null;
}

export function findMusicObjectByIndex(index: number): MusicObjectOption | null {
    const options = listMusicObjects();
    for (let i = 0; i < options.length; i++) {
        if (options[i].index === index) {
            return options[i];
        }
    }
    return null;
}
