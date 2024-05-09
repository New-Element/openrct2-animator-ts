import {
    name,
    version
} from './package.json';

import terser from '@rollup/plugin-terser';
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: "./src/main.ts",
    output: {
        format: "iife",
        file: `./build/${name}-${version}.js`,
    },
    plugins: [
        typescript(),
        nodeResolve(),
        terser({
            format: {
                preamble: "// Copyright (c) 2024 deanosrs",
            },
        }),
    ],
};