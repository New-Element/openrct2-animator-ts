/// <reference path="./../openrct2.d.ts" />

import { compareSemver, PLUGIN_VERSION } from "./pluginInfo";

export const LAST_PLUGIN_VERSION_KEY = "animator.lastPluginVersion";

/**
 * Read the plugin version stamped into this park, or undefined if never stamped.
 */
export function readLastPluginVersion(): string | undefined {
    const value = context.getParkStorage().get<string>(LAST_PLUGIN_VERSION_KEY);
    if (typeof value !== "string" || value.length === 0) {
        return undefined;
    }
    return value;
}

/**
 * Stamp the current plugin version into park storage, but never downgrade an
 * existing stamp (so a save on an older install keeps the "newer park" signal).
 */
export function saveLastPluginVersionStamp(): void {
    const stored = readLastPluginVersion();
    if (stored !== undefined && compareSemver(PLUGIN_VERSION, stored) < 0) {
        return;
    }
    context.getParkStorage().set(LAST_PLUGIN_VERSION_KEY, PLUGIN_VERSION);
}

/**
 * True when the park was last edited with a newer plugin than this install.
 */
export function isParkEditedWithNewerPlugin(): boolean {
    const stored = readLastPluginVersion();
    if (stored === undefined) {
        return false;
    }
    return compareSemver(stored, PLUGIN_VERSION) > 0;
}
