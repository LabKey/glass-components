/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const cwd = path.resolve('./').split(path.sep);
const lkModule = cwd[cwd.length - 1];
const isProductionBuild = process.env.NODE_ENV === 'production';

// Default to the @labkey packages in the node_moules directory.
// If LINK is set we configure the paths of @labkey modules to point to the source files (see below), which enables
// hot module reload to work across packages.
// NOTE: the LABKEY_UI_COMPONENTS_HOME and LABKEY_UI_PREMIUM_HOME environment variable must be set for this to work.
let labkeyUIComponentsPath = path.resolve('./node_modules/@labkey/components');
let labkeyUIPremiumPath = path.resolve('./node_modules/@labkey/premium');
const tsconfigPath = path.resolve('./node_modules/@labkey/build/webpack/tsconfig.json');

if (process.env.LINK) {
    if (process.env.LABKEY_UI_COMPONENTS_HOME === undefined) {
        throw 'ERROR: You must set your LABKEY_UI_COMPONENTS_HOME environment variable in order to link your @labkey packages.';
    }
    if (process.env.LABKEY_UI_PREMIUM_HOME === undefined) {
        throw 'ERROR: You must set your LABKEY_UI_PREMIUM_HOME environment variable in order to link your @labkey packages.';
    }

    labkeyUIComponentsPath = process.env.LABKEY_UI_COMPONENTS_HOME + '/packages/components/src';
    console.log('Using @labkey/components path:', labkeyUIComponentsPath);

    labkeyUIPremiumPath = process.env.LABKEY_UI_PREMIUM_HOME + '/packages/premium/src';
    console.log('Using @labkey/premium path:', labkeyUIPremiumPath);
}

const watchPort = process.env.WATCH_PORT || 3001;

// These minification options are a re-declaration of the default minification options
// for the HtmlWebpackPlugin with the addition of `caseSensitive` because LabKey's
// view templates can contain case-sensitive elements (e.g. `<permissionClasses>`).
// For more information see https://github.com/jantimon/html-webpack-plugin#minification.
const minifyTemplateOptions = {
    caseSensitive: true,
    collapseWhitespace: isProductionBuild,
    keepClosingSlash: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
}

const SASS_PLUGINS = [
    {
        loader: 'css-loader',
        options: {
            importLoaders: 1
        }
    },
    {
        loader: 'resolve-url-loader',
        options: {
            silent: !isProductionBuild
        }
    },
    {
        loader: 'sass-loader',
        options: {
            implementation: require('sass'),
            sassOptions: {
                quietDeps: !isProductionBuild
            },
            // "sourceMap" must be set to true when resolve-url-loader is used downstream
            sourceMap: true
        }
    }
];

const BABEL_PLUGINS = [
    // These make up @babel/preset-react, we cannot use preset-react because we need to ensure that the
    // typescript plugins run before the class properties plugins in order for allowDeclareFields to work
    // properly. We can use preset-react and stop using allowDeclareFields if we stop using Immutable.
    '@babel/plugin-syntax-jsx',
    '@babel/plugin-transform-react-jsx',
    '@babel/plugin-transform-react-display-name',

    // These make up @babel/preset-typescript
    ['@babel/plugin-transform-typescript', {
        allExtensions: true, // required when using isTSX
        allowDeclareFields: true,
        isTSX: true,
    }],

    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
];

const BABEL_CONFIG = {
    loader: 'babel-loader',
    options: {
        babelrc: false,
        cacheDirectory: true,
        presets: [
            [
                '@babel/preset-env',
                {
                    // support async/await
                    'targets': 'last 2 versions, not dead, not IE 11, > 5%',
                }
            ],
        ],
        plugins: BABEL_PLUGINS,
    }
};

const BABEL_DEV_CONFIG = {
    ...BABEL_CONFIG,
    options: {
        ...BABEL_CONFIG.options,
        plugins: ['react-hot-loader/babel'].concat(BABEL_PLUGINS),
    }
};

const TS_CHECKER_CONFIG = {
    typescript: {
        configFile: tsconfigPath,
        configOverwrite: {
            include: ["src/client/**/*"],
            // excluding spec files shaves time off the build
            exclude: ["node_modules", "**/*.spec.*", "src/test", "resources", "packages"],
        },
        context: '.',
        diagnosticOptions: {
            semantic: true,
            syntactic: true,
        },
    }
};

const TS_CHECKER_DEV_CONFIG = {
    ...TS_CHECKER_CONFIG,
    typescript: {
        ...TS_CHECKER_CONFIG.typescript,
        configOverwrite: {
            include: ["src/client/**/*"],
            exclude: ["node_modules", "**/*.spec.*", "src/test", "resources", "packages"],
            compilerOptions: {
                "paths": {
                    "@labkey/components": [labkeyUIComponentsPath],
                    "@labkey/components/entities": [labkeyUIComponentsPath + '/entities'],
                    "@labkey/premium": [labkeyUIPremiumPath],
                    "@labkey/premium/assay": [labkeyUIPremiumPath + '/assay'],
                    "@labkey/premium/eln": [labkeyUIPremiumPath + '/eln'],
                    "@labkey/premium/workflow": [labkeyUIPremiumPath + '/workflow'],
                    "@labkey/premium/storage": [labkeyUIPremiumPath + '/storage'],
                }
            }
        },
    }
};

const labkeyPackagesDev = process.env.LINK
    ? {
        // Note that for modules that don't have these packages, the aliases are just ignored and don't
        // seem to cause any problems.
        '@labkey/components': labkeyUIComponentsPath,
        '@labkey/components/entities': labkeyUIComponentsPath + '/entities',
        '@labkey/premium': labkeyUIPremiumPath,
        '@labkey/premium/assay': labkeyUIPremiumPath + '/assay',
        '@labkey/premium/eln': labkeyUIPremiumPath + '/eln',
        '@labkey/premium/workflow': labkeyUIPremiumPath + '/workflow',
        '@labkey/premium/storage': labkeyUIPremiumPath + '/storage',
    }
    : {};

module.exports = {
    lkModule,
    labkeyUIComponentsPath,
    labkeyUIPremiumPath,
    tsconfigPath,
    watchPort,
    TS_CHECKER_CONFIG,
    TS_CHECKER_DEV_CONFIG,
    context: path.resolve(lkModule, '..'),
    extensions: {
        TYPESCRIPT: [ '.jsx', '.js', '.tsx', '.ts' ]
    },
    loaders: {
        FILES: [
            {
                test: /\.(woff|woff2)$/,
                type: 'asset',
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
            },
            {
                test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
            }
        ],
        STYLE: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            },
            {
                test: /\.s[ac]ss$/i,
                use: [MiniCssExtractPlugin.loader].concat(SASS_PLUGINS),
            },
        ],
        STYLE_DEV: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.s[ac]ss$/i,
                use: ['style-loader'].concat(SASS_PLUGINS),
            },
        ],
        TYPESCRIPT: [
            {
                test: /^(?!.*spec\.tsx?$).*\.tsx?$/,
                use: [BABEL_CONFIG]
            }
        ],
        TYPESCRIPT_WATCH: [
            {
                test: /^(?!.*spec\.tsx?$).*\.tsx?$/,
                use: [BABEL_DEV_CONFIG]
            }
        ]
    },
    aliases: {
        LABKEY_PACKAGES: {
            '@labkey/components-scss': labkeyUIComponentsPath + '/dist/assets/scss/theme',
            '@labkey/components-app-scss': labkeyUIComponentsPath + '/dist/assets/scss/theme/app',
            '@labkey/premium-scss': labkeyUIPremiumPath + '/dist/assets/scss/theme',
        },
        LABKEY_PACKAGES_DEV: {
            ...labkeyPackagesDev,
            // need to set the path based on the LINK var
            '@labkey/components-scss': labkeyUIComponentsPath + (process.env.LINK ? '/theme' : '/dist/assets/scss/theme'),
            '@labkey/components-app-scss': labkeyUIComponentsPath + (process.env.LINK ? '/theme/app' : '/dist/assets/scss/theme/app'),
            '@labkey/premium-scss': labkeyUIPremiumPath + (process.env.LINK ? '/theme' : '/dist/assets/scss/theme'),
        },
    },
    outputPath: path.resolve('./resources/web/gen'),
    processEntries: function(entryPoints) {
        return entryPoints.apps.reduce((entries, app) => {
            entries[app.name] = app.path + '/app.tsx';
            return entries;
        }, {});
    },
    processPlugins: function(entryPoints) {
        let allPlugins = entryPoints.apps.reduce((plugins, app) => {
            // Generate dependencies via lib.xml rather than view.xml
            if (app.generateLib === true) {
                plugins = plugins.concat([
                    new HtmlWebpackPlugin({
                        inject: false,
                        module: lkModule,
                        name: app.name,
                        title: app.title,
                        permission: app.permission,
                        viewTemplate: app.template,
                        filename: '../../web/gen/' + app.name + '.lib.xml',
                        template: 'node_modules/@labkey/build/webpack/lib.template.xml',
                        minify: minifyTemplateOptions
                    }),
                ]);
            } else {
                plugins = plugins.concat([
                    new HtmlWebpackPlugin({
                        inject: false,
                        module: lkModule,
                        name: app.name,
                        title: app.title,
                        permission: app.permission,
                        permissionClasses: app.permissionClasses,
                        viewTemplate: app.template,
                        filename: '../../views/gen/' + app.name + '.view.xml',
                        template: 'node_modules/@labkey/build/webpack/app.view.template.xml',
                        minify: minifyTemplateOptions
                    }),
                    new HtmlWebpackPlugin({
                        inject: false,
                        filename: '../../views/gen/' + app.name + '.html',
                        template: 'node_modules/@labkey/build/webpack/app.template.html',
                        minify: minifyTemplateOptions
                    }),
                    new HtmlWebpackPlugin({
                        inject: false,
                        mode: 'dev',
                        module: lkModule,
                        name: app.name,
                        title: app.title,
                        permission: app.permission,
                        permissionClasses: app.permissionClasses,
                        viewTemplate: app.template,
                        filename: '../../views/gen/' + app.name + 'Dev.view.xml',
                        template: 'node_modules/@labkey/build/webpack/app.view.template.xml',
                        minify: minifyTemplateOptions
                    }),
                    new HtmlWebpackPlugin({
                        inject: false,
                        mode: 'dev',
                        port: watchPort,
                        name: app.name,
                        filename: '../../views/gen/' + app.name + 'Dev.html',
                        template: 'node_modules/@labkey/build/webpack/app.template.html',
                        minify: minifyTemplateOptions
                    })
                ]);
            }
            return plugins;
        }, []);

        allPlugins.push(new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
        }));

        allPlugins.push(new ForkTsCheckerWebpackPlugin(TS_CHECKER_CONFIG));

        allPlugins.push(new CircularDependencyPlugin({
            exclude: /node_modules/,
            include: /src/,
            failOnError: false, // TODO: When all App circular deps have been resolved this should be set to true
        }));

        if (process.env.ANALYZE) {
            allPlugins.push(new BundleAnalyzerPlugin());
        }

        return allPlugins;
    }
};
