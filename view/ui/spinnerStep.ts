import {
    compute,
    dropdown,
    FlexiblePosition,
    horizontal,
    label,
    store,
    twoway,
    WidgetCreator
} from "openrct2-flexui";

const TIP = "Multiplies all spinner controls by the specified amount";

/** Dropdown index: 0 = x1, 1 = x10, 2 = x100. Shared by the animation, trigger, and variable editors. */
export const spinnerStepIndex = store<number>(0);

/** Amount each [+] / [-] click adds or subtracts. */
export const spinnerStep = compute(spinnerStepIndex, (index) => 10 ** index);

export function spinnerStepSelector(): WidgetCreator<FlexiblePosition> {
    return horizontal({
        spacing: 4,
        width: 118,
        content: [
            label({
                text: "Multiplier:",
                tooltip: TIP,
                width: 62
            }),
            dropdown({
                tooltip: TIP,
                width: 48,
                items: ["x1", "x10", "x100"],
                selectedIndex: twoway(spinnerStepIndex)
            })
        ]
    });
}
