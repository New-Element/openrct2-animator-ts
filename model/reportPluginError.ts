export interface PluginErrorEntry {
    area: string;
    message: string;
    detail?: string;
}

const MAX_RECENT = 50;
const recentErrors: PluginErrorEntry[] = [];

function detailToString(detail: unknown): string {
    if (detail instanceof Error) {
        return detail.message;
    }
    if (typeof detail === "string") {
        return detail;
    }
    try {
        return JSON.stringify(detail);
    } catch (_e) {
        return String(detail);
    }
}

/**
 * Log a plugin error consistently and keep a short recent list for later UI.
 * Prefer this over throwing during load/tick paths.
 */
export default function reportPluginError(
    area: string,
    message: string,
    detail?: unknown
): void {
    const detailStr = detail === undefined ? undefined : detailToString(detail);
    if (detailStr !== undefined) {
        console.log(`[Animator][${area}] ${message}: ${detailStr}`);
    } else {
        console.log(`[Animator][${area}] ${message}`);
    }
    recentErrors.push({
        area: area,
        message: message,
        detail: detailStr
    });
    if (recentErrors.length > MAX_RECENT) {
        recentErrors.shift();
    }
}

export function getRecentPluginErrors(): PluginErrorEntry[] {
    return recentErrors.slice();
}
