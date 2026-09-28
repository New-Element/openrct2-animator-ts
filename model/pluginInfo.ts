/**
 * Single source of truth for plugin identity shown in UI and stamped into parks.
 * Keep package.json "version" in sync with PLUGIN_VERSION manually.
 */
export const PLUGIN_VERSION = "1.0.1";

export const PLUGIN_GITHUB_URL =
    "https://github.com/new-element/openrct2-animator-ts";

export const PLUGIN_RELEASES_URL = `${PLUGIN_GITHUB_URL}/releases`;

/** Multi-line install steps for Info tab and version-mismatch warning. */
export const PLUGIN_INSTALL_LINES: readonly string[] = [
    "1. Download the latest .js file from the Releases page.",
    "2. In OpenRCT2, click and hold the red toolbox button.",
    "3. Choose Open Custom Content Folder.",
    "4. Open the plugin folder inside that directory.",
    "5. Paste (or overwrite) the .js file there.",
    "6. Restart OpenRCT2 or reload the park so the new plugin loads.",
];

/**
 * Compare major.minor.patch versions.
 * Returns -1 if a < b, 0 if equal, 1 if a > b. Non-matching strings compare as equal (0).
 */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
    const parse = (v: string): number[] | null => {
        const match = v.match(/^(\d+)\.(\d+)\.(\d+)/);
        if (!match) {
            return null;
        }
        return [Number(match[1]), Number(match[2]), Number(match[3])];
    };

    const pa = parse(a);
    const pb = parse(b);
    if (!pa || !pb) {
        return 0;
    }

    for (let i = 0; i < 3; i += 1) {
        if (pa[i] < pb[i]) {
            return -1;
        }
        if (pa[i] > pb[i]) {
            return 1;
        }
    }
    return 0;
}
