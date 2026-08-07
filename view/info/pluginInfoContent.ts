import {
    groupbox,
    label,
    type FlexiblePosition,
    type WidgetCreator,
} from "openrct2-flexui";
import {
    PLUGIN_GITHUB_URL,
    PLUGIN_INSTALL_LINES,
    PLUGIN_RELEASES_URL,
    PLUGIN_VERSION,
} from "../../model/pluginInfo";

const URL_TOOLTIP = "Open This URL In A Browser";

/**
 * Shared version / links / install steps for the Info tab and mismatch warning.
 */
export function createPluginInfoContent(): WidgetCreator<FlexiblePosition>[] {
    return [
        groupbox({
            text: "Version",
            content: [
                label({
                    text: `Current Version: ${PLUGIN_VERSION}`,
                }),
            ],
        }),
        groupbox({
            text: "Links",
            content: [
                label({
                    text: PLUGIN_GITHUB_URL,
                    tooltip: URL_TOOLTIP,
                    alignment: "centred",
                    disabled: true,
                }),
                label({
                    text: PLUGIN_RELEASES_URL,
                    tooltip: URL_TOOLTIP,
                    alignment: "centred",
                    disabled: true,
                }),
            ],
        }),
        groupbox({
            text: "How To Install Or Update",
            content: PLUGIN_INSTALL_LINES.map((line) =>
                label({
                    text: line,
                })
            ),
        }),
    ];
}
