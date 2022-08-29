# @labkey/build

### version TBD
*Released*: TBD
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
