import {
    button,
    Colour,
    compute,
    label,
    store,
    vertical,
    window,
} from "openrct2-flexui";
import { PLUGIN_VERSION } from "../../model/pluginInfo";
import { createPluginInfoContent } from "./pluginInfoContent";
import { formatErrorText } from "../ui/errorText";

const parkVersion = store("");

const warningWindow = window({
    title: "Animator Version Warning",
    colours: [Colour.DarkOliveGreen, Colour.DarkOliveGreen],
    width: 400,
    height: 420,
    position: "center",
    padding: 8,
    content: [
        vertical({
            spacing: 4,
            content: [
                label({
                    text: formatErrorText(
                        "This park will not work as intended without the latest Animator plugin."
                    ),
                }),
                label({
                    text: compute(
                        parkVersion,
                        (version: string) =>
                            `This park was last edited with Animator ${version}.`
                    ),
                }),
                label({
                    text: `You have Animator ${PLUGIN_VERSION} installed.`,
                }),
                ...createPluginInfoContent(),
                button({
                    text: "Close",
                    width: 60,
                    height: 14,
                    onClick: () => {
                        warningWindow.close();
                    },
                }),
            ],
        }),
    ],
});

/**
 * Open the downgrade warning for a park stamped with a newer plugin version.
 * Does not pause the conductor.
 */
export function openVersionMismatchWarning(parkPluginVersion: string): void {
    parkVersion.set(parkPluginVersion);
    warningWindow.open();
}
