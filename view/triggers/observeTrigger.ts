import {
    Colour,
    listview,
    store,
    window
} from "openrct2-flexui";
import {
    bindTriggerFireFeedback,
    TriggerFireInfo
} from "../../model/triggerFireFeedback";

const titleText = store<string>("Observe Trigger");
const listItems = store<string[][]>([]);

let observingTriggerId: string | null = null;

function formatIndex(value: number | undefined): string {
    if (value === undefined) {
        return "-";
    }
    return String(value);
}

function onTriggerFired(info: TriggerFireInfo): void {
    if (!observingTriggerId || info.triggerId !== observingTriggerId) {
        return;
    }
    const rows = listItems.get().slice();
    rows.push([
        String(info.tick),
        formatIndex(info.trainIndex),
        formatIndex(info.carIndex)
    ]);
    listItems.set(rows);
}

const observeWindow = window({
    title: titleText,
    colours: [Colour.DarkOliveGreen, Colour.DarkOliveGreen],
    width: { value: 360, min: 300, max: 560 },
    height: { value: 280, min: 200, max: 500 },
    position: "center",
    padding: 8,
    content: [
        listview({
            items: listItems,
            columns: [
                { header: "Tick", width: "90px", canSort: true },
                { header: "Train Index", canSort: true },
                { header: "Car Index", canSort: true }
            ],
            scrollbars: "vertical",
            isStriped: true,
            height: "1w"
        })
    ],
    onClose: () => {
        observingTriggerId = null;
        listItems.set([]);
        bindTriggerFireFeedback(null);
    }
});

/**
 * Open an ephemeral fire log for a trigger. Logging only happens while open.
 */
export function openObserveTrigger(triggerId: string, triggerName: string): void {
    observingTriggerId = triggerId;
    listItems.set([]);
    titleText.set(`Observe Trigger: ${triggerName}`);
    bindTriggerFireFeedback(onTriggerFired);
    observeWindow.open();
}
