import {
    name
} from './package.json';
import typescript from "@rollup/plugin-typescript";

export default {
    input: "./src/main.ts",
    output: {
        format: "iife",
        file: `/Users/simonshepherd/Library/Application Support/OpenRCT2/plugin/${name}-develop.js`,
    },
    plugins: [
        typescript(),
    ],
};