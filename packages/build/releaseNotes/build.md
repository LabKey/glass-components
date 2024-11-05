# @labkey/build

### version 8.3.0
*Released*: 5 November 2024
- Package updates

### version 8.2.0
*Released*: 31 October 2024
- Add `__mocks__` to `tsconfig.json` excludes

### version 8.0.0
*Released*: 29 October 2024
- support "dependencies" on entry points
- remove "passwordGauge.js", "vis/vis", and "vis/genericChart/genericChartHelper.js" dependencies from default generated view.xml
- retain "clientapi" dependency in default generated view.xml

### version 7.7.1
*Released*: 10 September 2024
- Add `date-fns/format` and `date-fns-tz` to list of external packages.

### version 7.7.0
*Released*: 9 September 2024
- Update external dependencies for drag-n-drop packages.

### version 7.6.0
*Released*: 29 August 2024
- Remove moment-specific processing in package bundling.
- Update external dependencies for these date packages.

### version 7.5.0
*Released*: 27 July 2024
- Add option to add requiresLogin and requiresNoPermission to entry points

### version 7.4.0
*Released*: 24 July 2024
- Package updates
- Update TypeScript compiler `target` option to `"ES2021"'
- Update TypeScript compiler `lib` option to `["ES2021", "DOM", "DOM.Iterable"]`

### version 7.3.0
*Released*: 26 March 2024
- Package updates

### version 7.2.0
*Released*: 13 March 2024
- Issue 49870: add passwordGauge.js dependency to app.template.xml

### version 7.1.0
*Released*: 29 February 2024
- add `isAppview` attribute to app.template.xml

### version 7.0.2
*Released*: 27 December  2023
- Update TypeScript compiler `lib` option to `["es2019", "dom", "dom.iterable"]`

### version 7.0.1
*Released*: 26 December  2023
- Issue 49331: Include `nonce` in `app.template.xml` to support CSP in `appDev.view`

### version 7.0.0
*Released*: 20 December  2023
- Replace `react-hot-loader` with `react-refresh`
- Add dependency on `@pmmmwh/react-refresh-webpack-plugin` for `ReactRefreshWebpackPlugin`
- Add `@remix-run/router`, `normalizr` and `react-router-dom` to externals

### version 6.16.1
*Released*: 20 October  2023
* Export @labkey/api path in link mode

### version 6.16.0
*Released*: 13 October 2023
* Add @labkey/ehr to start-link paths
* Make start-link paths optional

### version 6.15.0
*Released*: 21 September 2023
* Package updates

### version 6.14.0
*Released* : 26 July 2023
* Add JSX files to loaders test.

### version 6.13.0
*Released*: 12 July 2023
* Add support for @labkey/premium/search package

### version 6.12.0
*Released* : 6 June 2023
* declare `@testing-library` as externals.
* skip processing of `**/*.*test.*` files

### version 6.11.0
*Released* : 23 May 2023
* webpack updates for `@labkey/premium/entities` package
  * move of `@labkey/components/entities` from ui-components repo to `@labkey/premium/entities`

### version 6.10.0
*Released*: 14 April 2023
* Exclude `.ispec.tsx?` files from compilation
* Remove `redux-actions` from externals dependencies

### version 6.9.0
*Released*: 6 January 2023
* Package updates
* Disable "collapse_vars" minification optimization in production build

### version 6.8.1
*Released*: 30 December 2022
* Update path for premium package src after code move within that repo

### version 6.8.0
*Released*: 19 December 2022
* webpack updates for `@labkey/premium/storage` package
  * move of `@labkey/freezermanager` from inventory module to `@labkey/premium/storage`

### version 6.7.0
*Released*: 16 December 2022
* webpack updates for `@labkey/premium/workflow` package
  * move of `@labkey/workflow` from sampleManagement module to `@labkey/premium/workflow`

### version 6.6.0
*Released*: 12 December 2022
* webpack updates for `@labkey/premium/eln` package
  * move of `@labkey/eln` from labbook module to `@labkey/premium/eln`

### version 6.5.0
*Released*: 8 December 2022
* webpack updates for `@labkey/premium` package
  * move of `@labkey/components/assay` subpackage to `@labkey/premium/assay`

### version 6.4.0
*Released*: 2 November 2022
* Package updates

### version 6.3.2
*Released*: 26 October 2022
* webpack alias fix for `npm run start`

### version 6.3.1
*Released*: 20 October 2022
* webpack updates for @labkey/components `assay` subpackage
  * add `@labkey/components/assay` alias for `npm run start-link`
  * add `@labkey/components/assay` to "externals" to keep it out of bundles

### version 6.3.0
*Released*: 10 October 2022
* Revert changes for build packages as ES Modules
* webpack updates for @labkey/components `entities` subpackage
  * add `@labkey/components/entities` alias for `npm run start-link`
  * add `@labkey/components/entities` to "externals" to keep it out of bundles
  * add `BundleAnalyzerPlugin` to package.config.js

### version 6.2.1
*Released*: 23 September 2022
* Update typescript_dev module loader rule regex to match Windows and Unix path operators.

### version 6.2.0
*Released*: 14 September 2022
* Build packages as ES Modules
* Add babel.config.js for jest tests
  * Needed for any package or app that consumes our packages, see the note in the file for more info.
* Add optional `ANALYZE` flag to our build
  * Add `ANALYZE=true` to build args to enable the webpack bundle analyzer

### version 6.1.7
*Released*: 30 August 2022
* Add CircularDependencyPlugin to package.config.js

### version 6.1.6
*Released*: 18 August 2022
* Pin versions to latest equivalent version

### version 6.1.5
*Released*: 22 July 2022
* Bump webpack, wepback-cli, webpack-dev-server dependencies

### version 6.1.4
*Released*: 21 July 2022
* Add additional packages to externals
* Remove reactn from externals

### version 6.1.3
*Released*: 17 May 2022
* Remove `moment-jdateformatparser` from external dependency list.

### version 6.1.2
*Released*: 9 May 2022
* Add remirror and redux dependencies to package build excludes
* Add eln to aliases in dev build

### version 6.1.1
*Released:* 28 April 2022
* Exclude test files from dev build

### version 6.1.0
*Released*: 27 April 2002
* Add shared package build (package.config.js)
* Update tsconfig.json
* Add eln path to shared app builds

### version 6.0.0
*Released*: 27 March 2022
* Package updates.
* Refactor builds to use `sass` instead of `node-sass`.
* Suppress logging of scss warnings in development builds. Continue to be logged in production builds.

### version 5.0.1
*Released*: 21 March 2022
* Bump node-sass to 7.0.1
* Bump sass-loader to 12.6.0

### version 5.0.0
*Released*: 5 January 2022
* Migrate webpack-dev-server from v3 to v4
* Update webpack, npm v8 compatible package-lock.json

### version 4.0.1
*Released*: 1 September 2021
* Dependabot package updates

### version 4.0.0
*Released*: 9 June 2021
* Move build output to resources/gen
    * This is a breaking change because this change requires you to update the path you import your scripts from if you
      use `LABKEY.requiresScript` or `dependencies.add` in a JSP. Examples:
        * `LABKEY.requiresScript('<module_name>/gen/<scriptName>', () => {})` -> `LABKEY.requiresScript('gen/<scriptName>', () => {})`
        * `dependencies.add("<module_name>/gen/<scriptName>");` -> `dependencies.add("gen/<scriptName>");`

### version 3.1.0
*Released*: 3 June 2021
* Use current working directory to determine module name and modules directory
    * This removes the need for LK_MODULE and LK_MODULE_CONTAINER build vars

### version 3.0.0
*Released*: 1 June 2021
* Package updates

### version 2.1.0
*Released*: 10 March 2021
* Changes to support webpack aliases from /src and theme/SCSS assets
    * update to use /src path for LINK
    * update to include aliases for theme/scss assets (for both dev/prod build and watch case)
    * update to watchOptions ignored to use undefined instead of empty array in LINK case

### version 2.0.1
*Released 5 March 2021*
* Fix generation of file paths in lib.template.xml

### version 2.0.0
*Released 4 March 2021*
* Upgrade to Webpack 5
  * Also upgraded all other build plugins
* Use babel loaders instead of ts-loader for typescript
* Refactor constants to re-use more configurations across builds
* Add tsconfig.json

### version 1.1.2
*Released*: 12 January 2021
* Add minify options to HtmlWebpackPlugin configurations

### version 1.1.1
*Released*: 12 January 2021
* Remove, no longer used, postcss-loader

### version 1.1.0
*Released*: 11 January 2021
* Add option to add permissionClasses to entry points

### version 1.0.0
*Released*: 7 January 2021
* postcss-loader: inline the postcss.config.js properties

### version 0.5.1
*Released*: 22 December 2020
* Dependabot package updates

### version 0.5.0
*Released*: 16 December 2020
* Item 8226: Add support for webpack aliasing of @labkey/workflow package

### version 0.4.1
*Released*: 11 November 2020
* Add tsconfig path for freezerManagerPath

### version 0.4.0
*Released*: 28 October 2020
* Add explicit package.json dependencies for @labkey/build

### version 0.3.0
*Released*: 28 October 2020
* Generate files into views/gen instead of views for better cleaning and caching possibilities

### 0.2.0
*Released*: 27 October 2020
* Use a LABKEY_UI_COMPONENTS_HOME environment variable from the user's setup to define the
    path for the webpack aliasing of @labkey packages when using "npm run start-link"

### version 0.1.0
*Released*: 26 October 2020
* Initial package contents with webpack config assets ported over from platform/webpack (with additions to fit scenarios from other modules)
* Conditionalize labkeyUIComponentsPath in webpack/constants.js based on LK_MODULE_CONTAINER
* Add optional npm start port WATCH_PORT webpack env var
* Add optional LINK webpack env var to toggle @labkey/components resolve alias path
* Add optional PROD_SOURCE_MAP webpack env var to allow a module to override the default devtool setting of 'nosources-source-map'
* Allow for entryPoint configs to define "template" property for use in app.view.xml
