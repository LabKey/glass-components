/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import sass from "rollup-plugin-sass";
import copy from 'rollup-plugin-copy';

const input = 'src/index.ts';

const globals = {
    'immutable': 'immutable',
    'react': 'React',
    'react-dom': 'ReactDOM'
};
const external = Object.keys(globals);

const namedExports = {
    // Named exports for packages
    // (when you get an error like: Error: 'getGlobal' is not exported by ../../node_modules/reactn/index.js)
    'reactn': ['getGlobal', 'setGlobal'],
};

export default [
    {
        external: external,
        input: input,
        output: {
            file: 'dist/base.cjs.js',
            format: 'cjs'
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript({
                objectHashIgnoreUnknownHack: true,
                clean: true
            }),
            sass({
                output: 'dist/base.css'
            }),
            copy({
                targets: {
                    'src/typings/react-bootstrap.d.ts': 'dist/typings/react-bootstrap.d.ts'
                }
            })
        ]
    },
    {
        external: external,
        input: input,
        output: {
            file: 'dist/base.es.js',
            format: 'es',
            name: 'base'
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript(),
            sass()
        ]
    }
]
