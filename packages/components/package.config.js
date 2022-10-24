/*
 * Copyright (c) 2016-2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const { merge } = require('webpack-merge');
const baseConfig = require('./node_modules/@labkey/build/webpack/package.config');

module.exports = merge(baseConfig, {
    entry: {
        components: './src/index.ts',
        entities: {
            import: './src/entities/index.ts',
            dependOn: 'components',
        },
        assay: {
            import: './src/assay/index.ts',
            dependOn: 'components',
        },
    },
    output: {
        filename: '[name].js',
    },
});
