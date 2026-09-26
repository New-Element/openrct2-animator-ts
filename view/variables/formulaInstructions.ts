/// <reference path="./../../openrct2.d.ts" />

import {createInstructionsOpener} from "../ui/instructionsWindow";

const LINES = [
    "A formula is typed in.",
    "It uses other variables by name, plus numbers.",
    "The Type dropdown is what this formula should produce.",
    "",
    "Tile values use square brackets:",
    "[85, 106]",
    "[var1, var2]",
    "[tile.x, tile.y + offset]",
    "",
    "World coords use curly braces:",
    "{1200, 2400, 32}",
    "{coords.x, coords.y, coords.z}",
    "",
    "Read a field with a dot:",
    "tile.x",
    "coords.z",
    "",
    "Convert world coords to a map tile:",
    "tile(coords)",
    "",
    "Convert a map tile to world coords:",
    "world(tile)",
    "",
    "You can add, subtract, multiply, and divide.",
    "Raise to a power with ^:",
    "var1 ^ 2",
    "Use parentheses to group parts of a formula.",
    "Direction is 0 to 3 (North, East, South, West)."
];

export const openFormulaInstructions = createInstructionsOpener("Formula Instructions", LINES);
