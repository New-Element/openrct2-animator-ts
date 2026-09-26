/// <reference path="./../../openrct2.d.ts" />

import {button, horizontal, label, vertical, window} from "openrct2-flexui";
import {WINDOW_COLOURS} from "./windowColours";

const WINDOW_WIDTH = 400;
const TITLE_BAR = 15;
const FRAME_PADDING = 8;
const LINE_HEIGHT = 10;
const SPACING = 6;
/** Measured on the 400px help window: prose fits about one character per 5.2 pixels. */
const PX_PER_CHAR = 5.2;
const TEXT_INSET = 4;

function rctLiteral(text: string): string {
    return text.replace(/\{/g, "{{");
}

function maxLineChars(): number {
    const contentWidth = WINDOW_WIDTH - (FRAME_PADDING * 2) - TEXT_INSET;
    return Math.max(20, Math.floor(contentWidth / PX_PER_CHAR));
}

/** FlexUI labels do not wrap. OpenRCT2 only breaks them on newline characters. */
function wrapParagraph(text: string): string[] {
    const maxChars = maxLineChars();
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (!word) {
            continue;
        }
        if (current.length === 0) {
            current = word;
            continue;
        }
        if (current.length + 1 + word.length > maxChars) {
            lines.push(current);
            current = word;
        } else {
            current += ` ${word}`;
        }
    }
    if (current.length > 0) {
        lines.push(current);
    }
    if (lines.length === 0) {
        lines.push("");
    }
    return lines;
}

function labelHeight(lineCount: number): number {
    return Math.max(LINE_HEIGHT, lineCount * LINE_HEIGHT);
}

function windowHeight(lineCounts: number[]): number {
    let stack = 0;
    for (let i = 0; i < lineCounts.length; i++) {
        stack += labelHeight(lineCounts[i]);
    }
    if (lineCounts.length > 1) {
        stack += SPACING * (lineCounts.length - 1);
    }
    return TITLE_BAR + (FRAME_PADDING * 2) + stack;
}

const openers: {[title: string]: () => void} = {};

/**
 * Opens a help window. FlexUI labels do not wrap, so paragraphs are broken
 * into newline-separated lines and the window height follows the line count.
 */
export function openHelpWindow(title: string, paragraphs: string[]): void {
    const cached = openers[title];
    if (cached) {
        cached();
        return;
    }
    const wrapped = paragraphs.map(wrapParagraph);
    const helpWindow = window({
        title: `${title} Help`,
        colours: WINDOW_COLOURS,
        width: WINDOW_WIDTH,
        height: windowHeight(wrapped.map((lines) => lines.length)),
        position: "center",
        padding: FRAME_PADDING,
        content: [
            vertical({
                spacing: SPACING,
                content: [
                    ...wrapped.map((lines) => label({
                        text: rctLiteral(lines.join("\n")),
                        width: "1w",
                        height: labelHeight(lines.length)
                    }))
                ]
            })
        ]
    });
    const open = () => {
        helpWindow.open();
    };
    openers[title] = open;
    open();
}

/**
 * Top-right Help button. Opens a short window with one or two paragraphs.
 */
export function tabHelpButton(title: string, paragraphs: string[]) {
    return horizontal([
        label({
            text: "",
            width: "1w",
            height: 14
        }),
        button({
            text: "Help",
            width: 46,
            height: 14,
            tooltip: `${title} Help`,
            onClick: () => {
                openHelpWindow(title, paragraphs);
            }
        })
    ]);
}
