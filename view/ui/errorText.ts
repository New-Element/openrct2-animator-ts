/**
 * Formats UI copy as an error (red via OpenRCT2 format codes).
 * Use for list cells, labels, and any other widget text that should read as an error.
 */
export function formatErrorText(text: string): string {
    return `{RED}${text}`;
}
