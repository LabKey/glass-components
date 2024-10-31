/*
 * Copyright (c) 2016-2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const constants = require('./constants');
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const CircularDependencyPlugin = require('circular-dependency-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const tsCheckerConfig = {
    ...constants.TS_CHECKER_CONFIG,
    typescript: {
        ...constants.TS_CHECKER_CONFIG.typescript,
        mode: 'write-dts',
        configOverwrite: {
            compilerOptions: { outDir: 'dist/' },
            include: ['src/**/*'],
            // excluding spec/test files shaves time off the build
            exclude: ['node_modules', '**/__mocks__/**/*', '**/*.spec.*', '**/*.test.*', 'src/test']
        }
    }
};

const plugins = [
    new ForkTsCheckerWebpackPlugin(tsCheckerConfig),
    new CopyWebpackPlugin({
        patterns: [
            {
                // copy theme scss files into the dist dir to be used by LabKey module apps
                from: 'src/theme',
                to: 'assets/scss/theme'
            }
        ]
    }),
    new CircularDependencyPlugin({
        exclude: /node_modules/,
        include: /src/,
        failOnError: true,
    }),
];
if (process.env.ANALYZE) {
    plugins.push(new BundleAnalyzerPlugin());
}

module.exports = {
    entry: './src/index.ts',
    target: 'web',
    mode: 'production',
    module: {
        rules: constants.loaders.TYPESCRIPT,
    },
    resolve: {
        extensions: [ '.jsx', '.js', '.tsx', '.ts' ]
    },
    optimization: {
        // don't minimize the code from packages, the code will get minimized during app builds
        minimize: false
    },
    output: {
        path: path.resolve('./dist'),
        publicPath: '',
        filename: constants.lkModule + '.js',
        library: {
            name: '@labkey/' + constants.lkModule,
            type: 'umd'
        },
    },
    plugins,
    externals: [
        // Note: If there is a package (of our own, or 3rd party) that is a dependency of one of our packages AND one of
        // our apps, then it should be in the list of externals.
        '@atlaskit/tree',
        '@fortawesome/fontawesome-free',
        '@fortawesome/fontawesome-svg-core',
        '@fortawesome/free-regular-svg-icons',
        '@fortawesome/free-solid-svg-icons',
        '@fortawesome/react-fontawesome',
        '@hello-pangea/dnd',
        '@labkey/api',
        '@labkey/components',
        '@labkey/premium/assay',
        '@labkey/premium/eln',
        '@labkey/premium/entities',
        '@labkey/premium/workflow',
        '@labkey/premium/storage',
        '@labkey/premium/search',
        '@remirror/pm',
        '@remix-run/router',
        '@testing-library/jest-dom',
        '@testing-library/react',
        '@testing-library/user-event',
        'boostrap-sass',
        'classnames',
        'date-fns',
        'date-fns/format',
        'date-fns-tz',
        'enzyme',
        'enzyme-adapter-react-16',
        'enzyme-to-json',
        'execa',
        'font-awesome',
        'formsy-react',
        'formsy-react-components',
        'history',
        'immutable',
        'immer',
        'jest',
        'jest-cli',
        'jest-environment-jsdom',
        'jquery',
        'lodash',
        'normalizr',
        'numeral',
        'prosemirror',
        'react',
        'react-bootstrap',
        'react-bootstrap-toggle',
        'react-color',
        'react-datepicker',
        'react-dom',
        'react-dom/test-utils',
        'react-redux',
        'react-router',
        'react-router-dom',
        'react-select',
        'react-select/async',
        'react-select/async-creatable',
        'react-select/creatable',
        'react-sticky',
        'react-test-renderer',
        'react-treebeard',
        'redux',
        'remirror',
        '@remirror',
        '@remirror/core',
        '@remirror/core-types',
        '@remirror/pm/state',
        '@remirror/react',
        '@remirror/pm/suggest',
        'remirror/extensions',
        '@remirror/pm/tables',
        'ts-jest',
        'use-immer',
        'vis-network',
    ]
};
