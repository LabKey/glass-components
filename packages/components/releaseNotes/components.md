# @labkey/components
Components, models, actions, and utility functions for LabKey applications and pages.

### version 2.179.4
*Released*: 10 June May 2022
* Issue 45325: SamplesTabbedGridPanel shouldn't call afterSampleActionComplete when going from bulk edit modal to grid edit

### version 2.179.3
*Released*: 9 June May 2022
* Item 10201: Sample renaming
  * Remove "Name" field from SampleBulkUpdateForm
  * Enable "Name" edit for aliquot details panel

### version 2.179.2
*Released*: 9 June 2022
* Remove experimental feature flag for ELN in LKSM

### version 2.179.1
*Released*: 6 June 2022
* Update `@labkey/api` and `@labkey/eslint-config-react` dependencies

### version 2.179.0
*Released*: 6 June 2022
* Item 10375: Save Grid Views - Save view dialog
  * Enable Save action for edited views
  * Add 'Save as custom view' option to views menu
  * Add SaveViewModal component

### version 2.178.0
*Released*: 31 May 2022
* Issue 45270: Show settings page to all admins

### version 2.177.3
*Released*: 31 May 2022
* Issue 45529: Adjust width of `.container` to use more of the screen
* Issue 45290: Adjust width of search box in NavBar for better display (with lots of notifications) in medium media
* Issue 45290: Use relative positioning for search-icon

### version 2.177.2
*Released*: 31 May 2022
* Issue 44707
  * Don't override background-color or text shadow in print styles

### version 2.177.1
*Released*: 31 May 2022
* Issue 45451: Grid drop down menu (page size, views) does not retract after selection

### version 2.177.0
*Released*: 27 May 2022
* Item 10374: Begin adding support for customizing views in our application
  * Move display of custom view name into panel header
  * Add header action for hiding a column and saving a new session view
  * Add buttons for reverting session grid customization in panel header

### version 2.176.0
*Released*: 26 May 2022
* Factor EditableGridPanelForUpdateWithLineage component out of SamplesEditableGridPanelForUpdate
* Move some entity editable grid related functions to entities/utils
* Various updates to handle Biologics lookups and MVFKs
* Add EntityAPIWrapper for data operation confirm API
* EntityLineageEditModal text and message updates for dataclasses
* Move some lineage functions to samples/actions

### version 2.175.0
*Released*: 26 May 2022
* Item 10394: Updates for incorporating ELN in LKSM
  * Experimental feature to toggle inclusion of ELN menu section and routes in LKSM
  * LKSM menu update to add Notebooks section config
  * URLResolver update for handling notebooks in search result hits
  * Refactor Setting.tsx component from LKB to ui-components

### version 2.174.1
*Released*: 24 May 2022
* Apply MenuItem "submenu-header" class to applicable grid menu headers
* Issue 45222: Editable grid fix for lookup cell margin-right to account for selector

### version 2.174.0
*Released*: 19 May 2022
* Item 10299: Sample Finder Saving Queries
  * Add SampleFinderManageViewsModal, SampleFinderSaveViewModal and SampleFinderSavedViewsMenu components
  * Utils for saveFinderSearch, loadFinderSearches, loadFinderSearch, renameReport and deleteReport
  * Update SampleFinderSection to show saved views and not load from session to default

### version 2.173.0
*Released*: 19 May 2022
* Item 10386: Active user limit app messaging
  * Add API to get user limit settings
  * Display user limit message on User Management page and disable create/reactivate accordingly
  * Handle user creation with and without limit errors in User Management page alerts
  * Display user limit settings on Admin Settings page

### version 2.172.0
*Released*: 17 May 2022
* Internalize `moment-jdateformatparser` logic into a collection of utility methods in `jDateFormatParser.ts`.
* Update versions of `moment` and `moment-timezone`.

### version 2.171.1
*Released*: 13 May 2022
* Issue 45222: Editable grid doesn't automatically expand width of dropdowns to show long values

### version 2.171.0
*Released*: 12 May 2022
* Item 10353: Convert EditableGridPanelForUpdate to QueryModel-based EditableGridPanel
  * remove unused EditableGridLoader
  * update EditableGridPanelForUpdate to initialize the dataModel and editorModel
  * update EditableGridLoaderFromSelection.tsx and related components/models for QueryModel
  * update EditableGridPanel.tsx for tabbed panel with multiple models
  * update SampleEditableGrid actions from EntityParentTypeSelector to work with QueryModel

### version 2.170.0
*Released*: 12 May 2022
* Add support for names containing commas
  * Update QuerySelect initialization to escape values that contain delimiters
  * Update SingleParenEntityPanel to encode parent names containing delimiters
  * Update parsing of values pasted into editable grid and processing of values to be saved from the editable grid

### version 2.169.1
*Released*: 10 May 2022
* Item 10305: Compound Registry Type (SMILES)
  * New SMILES domain property type

### version 2.169.0
*Released*: 10 May 2022
* Initialize application user's `permissionsList` directly from page context via `getServerContext().container.effectivePermissions`.
* Remove `getUserPermissions` and associated redux functionality.
* Remove `requestPermissions` bit from application model.

### version 2.168.0
*Released*: 9 May 2022
* Add SubNavWithContext, SubNavContextProvider, useSubNavContext
* Add useNotAuthorized, useNotFound hooks
* Add notAuthorized prop to Page
* Refactor Notifications
  * Notification renamed to Notifications
  * Notifications no longer require any props
    * notificationHeader was not used anywhere
    * user is not needed, we now use useServerContext to get the user
* isLoginAutoRedirectEnabled
  * Add moduleContext argument so tests no longer need to manually override the LABKEY object
  * No longer export from ui-components
* Refactor UserManagementPage to use moduleContext from useServerContext
* Refactor PipelineStatusDetailPage to use components instead of render methods

### version 2.167.1
*Released*: 9 May 2022
* Updates to EntityInsertPanel to accommodate Registry Data Class editing
  * Add props to allow wrapping component to control parents
  * Add prop to hide parent controls
  * Update 'Parents' suffix in grid and bulk fields to only apply to data types of same type

### version 2.167.0
*Released*: 5 May 2022
* SamplesAssayButton update to handle case where no assay designs are defined
* Issue 45328: Add the 'More' grid menu (Assays, Picklists, Jobs, Storage) to the sample aliquots grid

### version 2.166.0
*Released*: 5 May 2022
* Issue 45140: Better support for date formats (especially dd/MM/yyy) in the apps
  * Use QueryColumn date format for filter modal input date picker (via DatePickerInput)
  * Use QueryColumn date format for GridPanel filter status display
  * Fix for QueryInfoForm, QueryFormInputs and EditableGridPanelForUpdate use case to use QueryColumn date format in parseDate()
  * Fix for EditorModel getRawDataFromGridData() to use QueryColumn date format for parseDate()

### version 2.165.0
*Released*: 4 May 2022
* Adds ExportModal to enable exporting all tabs of a TabbedGrids

### version 2.164.1
*Released*: 2 May 2022
* Replace usages of `parsePathName` with `ActionURL.getPathFromLocation()` from `@labkey/api`.

### version 2.164.0
*Released*: 2 May 2022
* Issue 45374: LKSM issues when site "default display format for numbers" is set
  * fix for getPkData() function when value is an array or List of objects/Maps

### version 2.163.0
*Released*: 29 April 2022
* Remove `SharedSampleTypeAdminConfirmModal`
* Update `EntityDataType` model with additional properties
* Update `SampleSetDeletModal`, `deleteDataClass`, `deleteSampleSet`, and `deleteEntityType` to take optional `containerPath`
* Issue 45290: Adjust height of search box on Safari
* Issue 45269: If the state columns are present, don't look at a column named 'Label' for the sample status
* Update `SamplesEditableGrid` to account for custom parent types

### version 2.162.1
*Released*: 29 April 2022
* Issue 45366: Export of Sample Finder results produces empty files
  * Escape quote characters in export form

### version 2.162.0
*Released*: 29 April 2022
* Issue 45304: Add inherit permissions control to permissions page
  * Add inherit checkbox and wire up action to delete policy or save policy as expected.
  * Rename `PermissionsPageContextProvider` to `withPermissionsPage` to align with our expected pattern.
  * Remove the Permissions context.
  * Add `fetchPolicy` to `SecurityAPIWrapper` and utilize this API from context in permission components.

### version 2.161.0
*Released*: 28 April 2022
* Item 10275: Grid panel updates to make button/menu bar display responsive to screen width
  * Grid panel button bar update to show 2nd row of items in md/sm layout
  * Move page size menu into page number menu
  * Display ResponsiveMenuButtonGroup submenus inline with header and divider
  * Add ResponsiveMenuButton as a simple wrapper for app buttons to use

### version 2.160.0
*Released*: 27 April 2022
* Item 10276: Add, remove or modify grid actions for various grids
  * Update `PicklistCreateMenuItem` to require a selection (no longer create an empty picklist)
  * Add forwarding `registerFilterType` function

### version 2.159.0
*Released*: 27 April 2022
* Use shared package build
* Move exported test helpers to /internal
* Move un-exported test helpers to /test

### version 2.158.1
*Released*: 27 April 2022
* Merge release22.3-SNAPSHOT to develop again
    * Includes changes from version 2.138.8

### version 2.158.0
*Released*: 26 April 2022
* Item 10230: App grid action updates to buttons/menus in header bar
  * Add new button components: ResponsiveMenuButtonGroup, SamplesAddButton, SamplesAssayButton
  * Rename SamplesManageButton to SamplesEditButton
  * SubMenu and SubMenuItem changes to support new button submenu cases

### version 2.157.0
*Released*: 21 April 2022
* Factor out `componentId` prop on `QuerySelect`.

### version 2.156.1
*Released*: 20 April 2022
* Merge release22.4-SNAPSHOT to develop
    * Includes changes from version 2.149.7

### version 2.156.0
*Released*: 20 April 2022
* Item 10203: Support sample type and data class renaming

### version 2.155.1
*Released*: 19 April 2022
* Updates to EntityInsertPanel to support Biologics data class import.

### version 2.155.0
*Released*: 18 April 2022
* Remove "users" from `global` state cache and all associated methods.
* Change `getUsersWithPermissions` to return an `User[]` instead of `List<User>`.
* Change `UserSelectInput` default to `clearCacheOnChange=false` and implement `generateKey` to handle path/perm changes.
* Refactor how `AuditDetails` fetches user permissions.
* Remove `invalidateUsers` and its usages.

### version 2.154.2
*Released*: 15 April 2022
* Issue 45223: Wrap multiline text fields on line breaks
* Issue 45060: Update Sample Finder to disable buttons and cards if there are no sources / sample types defined

### version 2.154.1
*Released*: 13 April 2022
* Issue 45021: Sample Finder: Filtering on a field whose name contains special characters does not work

### version 2.154.0
*Released*: 13 April 2022
* Item 10253: Remove experimental feature to officially switch to new Grid Filtering UX changes
  * remove OmniBox.tsx and related tests, helpers, scss, etc. (moving the items still in use to GridPanel dir)
  * remove react-input-autosize dependency

### version 2.153.1
*Released*: 12 April 2022
* Add a configuration option in the issue definition properties panel to select the default related issues folder.

### version 2.153.0
*Released*: 12 April 2022
* Add AncestorRenderer for display of ancestor lookup columns
* Update SampleFinder to use Ancestor columns in results grids
* Update logic in `QueryModel::getColumn` for finding matching lookup columns so it handles additional layers of lookups

### version 2.152.1
*Released*: 11 April 2022
* Issue 45139: grid header menu is clipped by the bounding container instead of overflowing it
* Issue 45135: grid filter modal Choose Values should include model/context filters (baseFilters or queryInfo filters)

### version 2.152.0
*Released*: 8 April 2022
* Item 10213: New grid filtering UX - Support other filter types
  * Add LabKey sql util for other filter types
  * Show OntologyBrowserFilterPanel in FilterExpressionView

### version 2.151.0
*Released*: 8 April 2022
* Improve SelectRows endpoint wrapper
    * Options/arguments are now fully typed.
    * Continues to retrieve the associated `QueryInfo` from `query-getQueryDetails.api`. Rejection/errors are now handled solely by `getQueryDetails()`.
    * Continues to resolve application URLs via `URLResolver.resolveSelectRows()`.
    * No longer wraps `Query.executeSql`.
    * Requires a `schemaQuery: SchemaQuery` argument instead of separate `schemaName` and `queryName` arguments.
    * Remove `caller` argument as paradigm is not necessary to support.
    * The `containerFilter` argument defaults to value returned from `getContainerFilter()` (unchanged from `selectRowsDeprecated`).
    * The `method` argument defaults to `POST` (unchanged from `selectRowsDeprecated`).
    * The `columns` argument defaults to `'*'` (unchanged from `selectRowsDeprecated`).

### version 2.150.0
*Released*: 7 April 2022
* Item 10223: GridPanel updates for search input and filter display in grid header
    * add SearchBox component and display in GridPanel header bar
    * add Filters button to GridPanel header to open the GridFilterModal
    * display the view, filter, and search grid action values in the grid info section (previously displayed in the OmniBox input)
    * add "Remove all" option to the end of the filter pill display if > 1 present
    * hide omnibox when experimental feature is enabled

### version 2.149.7
*Released*: 14 April 2022
* Issue 45254: QueryColumn support for "previewOptions" in QuerySelect
* Issue 45256: QuerySelect: Support "formattedValue" for display

### version 2.149.6
*Released*: 4 April 2022
* Remove QueryGridPanel and related components and action/util functions

### version 2.149.5
*Released*: 31 March 2022
* 45148: Handle data indices for single/multi-part fieldKeys
* Add defensive check for presence of product

### version 2.149.4
*Released*: 31 March 2022
* Fix issue with Between filter type second input

### version 2.149.3
*Released*: 31 March 2022
* Display custom (and standard) protocol application properties in the lineage graph

### version 2.149.2
*Released*: 30 March 2022
* Fix issue where we could not add assay samples to picklist from the run details page.

### version 2.149.1
*Released*: 30 March 2022
* Issue 44865: Default naming pattern is not saved during source type creation

### version 2.149.0
*Released*: 30 March 2022
* Item 10191: Add grid column header filter and sort behavior
  * show grid column header icon indicator if a sort and/or filter is applied to that column
  * add "Clear sort" option to colum header actions
  * add "Remove filter(s)" option to colum header actions
  * factor out QueryFilterPanel.tsx from EntityFieldFilterModal.tsx
  * add "Filter..." option to column header to show GridFilterModal and apply filters
  * account for model.viewName in QueryFilterPanel

### version 2.148.1
*Released*: 30 March 2022
* Issue 44709: Update Unique ID confirmation modal so it remains open until update is complete
* Add per-product metric for search usage

### version 2.148.0
*Released*: 29 March 2022
* Item 9999: Shared freezers across containers - Storage View UI
  * Support locked Cell state

### version 2.147.1
*Released*: 29 March 2022
* Issue 45126: Job start and due dates are not saved after being updated

### version 2.147.0
*Released*: 28 March 2022
* Item 10192: Support two filter clauses per field in the `FilterExpressionView` and `FilterCards`

### version 2.146.0
*Released*: 27 March 2022
* Package updates for `devDependencies`.
* Refactor builds to use `sass` instead of `node-sass`.
* Utilize scss exports from dependent packages when possible.
* Add `resolve-url-loader` for handling URLs in scss sources. Required for inclusion of certain packages (e.g. font-awesome).
* Suppress logging of warnings when publishing in `@labkey/components`. Makes use of the [webpack "stats" property](https://webpack.js.org/configuration/stats/).
* Move declaration of theme/index.scss include.

### version 2.145.2
*Released*: 24 March 2022
* Support `containerPath` on `LookupSelectInput` and `withAssayModels`.
* Add test utility `createMockWithRouteLeave`

### version 2.145.1
*Released*: 24 March 2022
* Fix issue where models with bindURl set to true could not have default sorts/filters/etc.

### version 2.145.0
*Released*: 22 March 2022
* Fix Issue 44859
  * HeaderWrapper no longer scrolls to the top of the page during update
  * Page component now scrolls to top of the page on mount
* Remove circular dependency between Page and NotFound
* Refactor NavigationBar to render HeaderWrapper and sticky class
  * This eliminates duplicated code between our apps

### version 2.144.2
*Released*: 21 March 2022
* add `exportConfig` parameter to `getSampleTypeTemplateUrl` for better behavior for media templates

### version 2.144.1
*Released*: 21 March 2022
* Item 10071: Add experimental feature flag for Sample/Aliquot Selector grid button

### version 2.144.0
*Released*: 18 March 2022
* Item 10165: Provide link to download the import template for types in more places
  * Extract `TemplateDownloadButton` from `FileAttachmentForm`.
  * refactor method for getting sampleTypeTemplateUrl for use in LKSM and LKB
  * Add `SampleTypeTemplateDownloadRenderer` and `AssayResultTemplateDownloadRenderer` for showing download button in types grid

### version 2.143.0
*Released*: 16 March 2022
* Add iconDir to SearchResultCardData
  * This allows apps to render icons in search results that are in non-default directories
* Make URLResolver.resolveSearchUsingIndex synchronous
  * It was a promise, but it did nothing async
* Convert SearchResultCard to FC
* Refactor SearchResultCard tests
  * no longer using snapshots
  * add additional test cases

### version 2.142.0
*Released*: 15 March 2022
* Support In-App Admin across LKB and LKSM, adding admin & user settings page distinctions, as well as profile settings.

### version 2.141.2
*Released*: 14 March 2022
* Export `PICKLIST_SAMPLES_FILTER`
* Include listId in picklist gridId to disambiguate

### version 2.141.1
*Released*: 11 March 2022
* Merge release22.3-SNAPSHOT to develop again
  * Includes changes from version 2.138.6

### version 2.141.0
*Released*: 10 March 2022
* Support In-App Admin across LKB and LKSM.

### version 2.140.0
*Released*: 10 March 2022
* Item 9748: Shared freezers across containers
    * Hide 'Create a freezer' link for sub folders
    * Modify useContainerUser to return containerUsers in child folders

### version 2.139.2
*Released*: 9 March 2022
* URLResolver update to only handle URLs for the current container or containers in the current folder tree

### version 2.139.1
*Released*: 7 March 2022
* Merge release22.3-SNAPSHOT to develop
    * Includes changes from versions 2.138.1 through 2.138.5

### version 2.139.0
*Released*: 7 March 2022
* Support EditableGridPanel conversion for LKFM add and move samples use cases
  * AppURL switch back to hardcoded app.view
  * remove unused EditableGridModal
  * loadEditorModelData update to support raw value not being an object

### version 2.138.8
*Released*: 26 April 2022
* Issue 45265: Handle "name" and "listId" for list ActionMappers

### version 2.138.7
*Released*: 24 March 2022
* Issue 45093: Fix production navigation menu URl action for going from LKS to app
    * Revert change from PR747 to createProductURL() so that we go back to always using app action

### version 2.138.6
*Released*: 10 March 2022
* Sample Finder Optimizations
    * Don't use expensive `QueryableInputs` now that we have the query for descendants
    * Don't load the grid until we have sample type names

### version 2.138.5
*Released*: 4 March 2022
* Sample Finder Polish
  * Don't clear filter values when switching between filter types
  * Exclude lookup columns and the storage "Units" column for Sample types
  * Add client side metric for tracking clicks on dashboard "Go to Sample Finder" button
  * Start on the Choose Values tab if available
  * Remove "Has Any Value" (no-op) filter type
  * Change `isSampleFinderEnabled` to look for Biologics experimental flag

### version 2.138.4
*Released*: 3 March 2022
* Item 9817: Sample Finder v1 polish fixes/updates
  * Add padding to loading spinner
  * Choose Values panel fix for long text options and empty state
  * Filter modal styling fixes for list group: remove rounded corner, reduce padding, bold when active
  * Update cursor behavior and hover behavior on filter cards and edit/remove icons
  * Filter modal updates to better support display on narrow screen
  * Add "Go to Sample Finder" button to the dashboard insights panel

### version 2.138.3
*Released*: 2 March 2022
* Sample Finder Polishing
  * Add `containerFilter` property to `EntityDataType` model
  * Assure grid is updated after sample actions are taken
  * Update grid columns to always show parent id columns and add parent type name to column name

### version 2.138.2
*Released*: 2 March 2022
* Container: add isFolder, isProject, isRoot, and isSharedProject

### version 2.138.1
*Released*: 1 March 2022
* Item 44544: Sample type dataset definitions should be locked similar to assays
    * Generalize IDatasetModel.isFromAssay to isFromLinkedSource to handle both assay and sample type datasets

### version 2.138.0
*Released*: 28 February 2022
* Item 10056: Sample Finder v1 - Wire up new lineage filters
  * Added getLabKeySqlWhere util
  * Added InExpAncestorsOfFilterType and InExpDescendantsOfFilterType
  * Enable non-text fields for EntityFieldFilterModal (Sample Finder)

### version 2.137.3
*Released*: 24 February 2022
* Item 9968: Show FM Freezer List on LKB and LKSM dashboards
  * Update createProductUrl() to use ActionURL.getAction() to stay in appDev mode
  * Remove NEW_FREEZER_DESIGN_HREF and MANAGE_STORAGE_UNITS_HREF
  * Remove RecentAssayPanel.tsx and related code

### version 2.137.2
*Released*: 23 February 2022
* Item 9945: add calls to incrementClientSideMetricCount() for sample finder related actions
  * add metricFeatureArea props to SampleActionButton, SampleDeleteMenuItem, and SamplesManageButton

### version 2.137.1
*Released*: 23 February 2022
* Update `EditInlineField` for input type text so input box resizes to fix input value.

### version 2.137.0
*Released*: 23 February 2022
* Assay
    * `deleteAssayRuns()` endpoint wrapper for `experiment-deleteRuns.api` updated accept optional `containerPath`.
    * Assay designs now always saved to container specified on `AssayProtocolModel`.
    * Address Issue 44845 by consolidating logic and usages for determining if a lookup column is to a Sample Type. This is done in `QueryColumn.isSampleLookup()`.
* `SampleActionsButton`
    * Refactor to use `children` instead of `moreMenuItems` for component hierarchy.
    * Update to allow `children` items to be displayed regardless of picklist permissions. Previously, these would not render if the user was not allowed to access picklist actions.
    * Add `PermissionsType.ManagePicklists` to permissions check.
* Components
    * Update `RequiresPermission` to optionally accept a `user` prop which will be used if provided instead of default from `useServerContext`.
    * Refactor `DisableableMenuItem` to use `children` instead of `menuItemContent`.
    * Remove `DisabledMenuItem` as it is supplanted by `DisableableMenuItem`.
    * Move `fetchQueries()` and `fetchSchemas()` methods to their local component implementation usages. Done to simplify imports of `schemas/constants.ts`.
* Picklists
    * Update `PicklistSamplesFilter` to filter lists by name instead of by listId.
    * Incorporate container filtering into picklist requests.
    * Update `PicklistSubNav` to handle errors.
    * Picklist custom view save has been moved to server-side.

### version 2.136.0
*Released*: 21 February 2022
* Item 9992: Add ontology type ahead search to forms
  * Split out `OntologySearchInput` from the existing `OntologyTreeSearchContainer`

### version 2.135.0
*Released*: 21 February 2022
* Item 10004: Sample Finder V1 - Support Choose Values
   * Added FilterFacetedSelector and utils to support faceted fitler selection

### version 2.134.0
*Released*: 21 February 2022
* Core components page update to use QueryModel based EditableGridPanel
  * factor loadEditorModelData() out of AssayWizardModel.ts to editable/utils.ts
  * export EditableGridPanel, loadEditorModelData, and EditorModelProps from index.ts
  * AssayImportPanels.tsx fix for undefined location prop in core-components case

### version 2.133.0
*Released*: 21 February 2022
* Item 9956: Freezer manager dashboard updates to the freezer listing panel
  * ExpandableContainer update to call onClick when defined regardless of isExpandable prop
  * HorizontalBarSection updates for selenium test locators

### version 2.132.4
*Released*: 19 February 2022
* Migrate subfolder data experimental flag to platform.

### version 2.132.3
*Released*: 17 February 2022
* Update to package to eliminate alpha version reference from node_modules
* Change return type for `useEnterEscape`

### version 2.132.2
*Skipped*

### version 2.132.1
*Released*: 16 February 2022
* Issue 44742: Hide NameExpressionGenIdBanner when genId is not used in the current naming patterns
* Issue 44771: Misspelling on naming pattern warning dialog
* Issue 44852: Warning message when resetting the genId to a "conflicting value" is off by 1.

### version 2.132.0
*Released*: 16 February 2022
* Item 9998: Add permissions for restricting read for assays and data classes
  * Add utility methods for checking various read permissions
  * update `assayPage` to check assay read permission
* Update `SelectionMenuItem` to accept either an `onClick` or `href` property.
* Don't show the option to discard samples when changing status if user doesn't have proper permissions

### version 2.131.0
*Released*: 8 February 2022
* Issue 44711: Field editor update to show confirm modal on change of data type for saved field
  * when the field is changing from any non-string -> string OR int/long -> double/float/decimal
  * don't allow for Attachment or FileLink data type fields to be converted to Text/String

### version 2.130.0
*Released*: 8 February 2022
* Issue 44740: Add client side metrics to track if samples/sources are being created via the grid or from file import
* Update incrementClientSideMetricCount() so it does not return a Promise but is only used asynchronously

### version 2.129.0
*Released*: 3 February 2022
* **AliasInput**
    * Refactor `AliasInput` "value" processing to match what is expected. This fixes several bugs with how this component displays and persists state.
    * Add unit tests.
* **Data Classes**
    * Support cross-folder domain editing for Data Classes.
* **Details**
    * Support `containerFilter` and `containerPath` for `Detail`, `DetailPanel`, `DetailEditRenderer`, and `EditableDetailPanel`.
* **Lineage**
    * Export `withLineage` and `InjectedLineage` for external use.
    * Refactor how `sampleStats` are processed.
* **Query APIs**
    * Improve typings for `insertRows`, `deleteRows`, and `selectRows` to reduce duplication with `@labkey/api` and provide passthrough of all configuration options.
    * Update `getContainerFilter` to process the `containerPath` provided to query configurations if provided.
    * Introduce `getContainerFilterForInsert`. Supplies the container filter to be used when fetching data intended for insert.
* **QuerySelect**
    * Ensure all queries made by `QuerySelect` specify the same set of columns.
    * Simplify and centralize `QuerySelectModel` initialization.
    * Support specifying `containerFilter` on `QuerySelect`.
* **SelectInput**
    * Introduce `resolveFormValue` for component users to override how the input processes the selected options into a form value.

### version 2.128.0
*Released*: 3 February 2022
* Item 9815: Sample Finder v1 - Filter dialog field expression filters
    * Updates to EntityFieldFilterModal, FilterCards and SampleFinderSection to wire up filtering
    * Added FilterValueDisplay, FilterExpressionView and FilterFacetedSelector to support filtering

### version 2.127.0
*Released*: 3 February 2022
* Remove `FieldEditorOverlay` component
* Add simple action for doing update rows on a single field (callback helper for `EditInlineField`).

### version 2.126.0
*Released*: 1 February 2022
* Item 9888: Sample status help tip display of configured statuses and descriptions
  * SampleStatusLegend component to query for configured statues and render as table
  * helpTipRenderer - allow column metadata to specify a help tip renderer to be used in grid column header and details panel label
  * EntityInsertPanel update to add SampleStatusLegend as column header metadata tooltip for SampleState / Status column

### version 2.125.0
*Released*: 1 February 2022
* Item 9932: Sample Type Insights panel
  * Refactor HorizontalBarSection from inventory module (previously StorageAllocationSection)
  * Bar chart data helper for createPercentageBarData() and createHorizontalBarLegendData(), moved from inventory module
  * Refactor ItemsLegend from inventory module
  * Add SampleTypeInsightsPanel.tsx to be used in LKSM and LKB
  * Issue 44633: Horizontal bar fix for borders causing line wrapping

### version 2.124.0
*Released*: 31 January 2022
* Item 9923: Adding roles for storage management
  * Moved `updateSampleStatus` method into inventory since it's used only when discarding samples and that now requires a specific inventory action
  * Change user display role to account for storage editor and designer roles
  * Update `CreateUsersModal` and `UsersGridPanel` to handle multiple roles
  * Add utility method `userCanEditStorageData`
  * Update `SamplesTabbedGridPanel` to account for some users not being able to update storage data
  * Update `SamplesEditableGrid`, `SamplesTabbedGridPanel`, and `SamplesSelectionContextProvider` to allow for not being able to edit the sample data

### version 2.123.0
*Released*: 31 January 2022
* Item #9767: Improve sample actions from assay results grid
  * Add new `SampleActionsButton` to Assay Results page
  * Adjust picklist creation and update actions & components
  * Adjust job creation and update actions & components
  * Added `getFieldLookupFromSelection` which pulls the lookups rowId value based on supplied query & field

### version 2.122.0
*Released*: 31 January 2022
* Share asynchronous upload UI indicators across LKB and LKSM by pulling relevant code into ui-components

### version 2.121.4
*Released*: 28 January 2022
* Item 9970: QueryFormInput change showQuerySelectPreviewOptions default prop value to false
  * Update SampleStatusInput component QuerySelect previewOptions prop to false as well

### version 2.121.3
*Released*: 27 January 2022
* Merge release21.11-SNAPSHOT to develop (part 2)
    * Includes changes from versions 2.90.4

### version 2.121.2
*Released*: 25 January 2022
* Issue 44721: make sorting methods defensive against non-string values

### version 2.121.1
*Released*: 24 January 2022
* Item 9875: Add AssayDefinitionModel requireCommentOnQCStateChange prop

### version 2.121.0
*Released*: 21 January 2022
* Update `SampleTypeTabbedGridPanel` to show row count on tabs
* Added utility `isSamplesSchema` to check for `exp.materials` and `samples.X`
* Updates to `SampleFinderSection` for showing filtered tabbed grids
* Fix for Issue #44339 to allow create operations on selections from the "All Samples" grid in the tabbed grid.
* Consolidate logic for `ViewSelector` and `ViewsMenu` for finding views to include in menu
* Move `getSampleTypes` method here from inventory module and add `getSelectedSampleTypes` utility action

### version 2.120.1
*Released*: 20 January 2022
* Increase z-index of react-datepicker popover

### version 2.120.0
*Released*: 19 January 2022
* Declare and export the `UPDATE_USER` redux action and wire up updates via reducer.

### version 2.119.0
*Released*: 14 January 2022
* Issue 44511: Ability to change a field's data type to known safe alternatives

### version 2.118.1
*Released*: 14 January 2022
* Share asynchronous upload functionality across LKB and LKSM by pulling relevant code into ui-components

### version 2.117.1
*Released*: 13 January 2022
* Item #9810: Consumed Status/Discarding Sample
  * Added DiscardConsumedSamples, DiscardConsumedSamplesModal and SampleStatusInput components
  * Modified SamplesEditableGrid, SamplesBulkUpdateForm and SampleDetailEditing to allow discarding consumed samples

### version 2.116.0
*Released*: 10 January 2022
* Refactor EditableGrid to be QueryGridModel agnostic
* Add EditableGridPanel component, which is compatible with QueryModel
* Refactor AssayImportPanels/RunDataPanel to use EditableGridPanel and no longer use QueryGridModel
* Delete AssayUploadGridLoader
  * EditableGridPanel removes the need for overloading GridLoaders to instantiate models

### version 2.115.2
*Released*: 7 January 2022
* Fix unhandled promises
  * most are addressed by adding test mock initialization
  * address <AssignmentOptions/> in Issues by refactoring how erroneous requests are handled

### version 2.115.1
*Released*: 5 January 2022
* Escape typings of some built-in React HTML types

### version 2.115.0
*Released*: 5 January 2022
* Item 9846: Text Choice value type ahead search

### version 2.114.0
*Released*: 4 January 2022
* Added getGenId and setGenId utils
* Added NameExpressionGenIdBanner

### version 2.113.0
*Released*: 4 January 2022
* Foundational work for Sample Finder feature development.
  * Add experimental feature flag
  * Update FindAndSearch menu
  * Move SearchBox and related components into the search directory

### version 2.112.0
*Released*: 30 December 2021
* Item #9782: Text Choice data type support for field editor updates to in-use values
  * update to query to get in-use text choice values so that it includes "locked" and row count
  * provide SQL fragment from sample type domain for how to determine "locked" text choice values
  * update text choice listing icons and selected value display for info on updates and hover text
  * send text choice value updates for in-use values to the server as part of POST to update domain
  * prevent text choice updates and add values modal apply for duplicates and empty strings

### version 2.111.1
*Released*: 29 December 2021
* Issue #44567: Hide scannable option for floating point fields due to improper matching.

### version 2.111.0
*Released*: 24 December 2021
* Edit Sample Type and Data Class's Naming Pattern Prefix Expression alteration warning message

### version 2.110.0
*Released*: 23 December 2021
* Item #9633: Add scannable option to SampleType numeric fields for LabKey apps
    * Refactored scannable option from `TextFieldOptions` into new `ScannableOption` component
    * Added ScannableOption to `NumericFieldOptions`

### version 2.109.0
*Released*: 23 December 2021
* SampleTypeDesigner and DataClassDesigner
   * Validate name expressions prior to save
   * Show name preview on hover
* Added DesignerDetailPanel to show name preview for designer details panel
* EntityInsertPanel: show name preview on tooltip, hide double tooltip

### version 2.108.0
*Released*: 22 December 2021
* Item 9758: Field editor "Text Choice" data type and UI to create, update, delete field options/values
    * RegEx validator modal fix for “Fail validation when pattern matches field value” checked state on initialization
    * factor out ChoicesListItem to re-use in list group cases (TextChoiceOptions, ChoosePicklistModal, ManageSasmpleStatusesPanel)
    * field editor row addition of "Text Choice" data type and "Text Choice Options" section in expanded row
    * field editor row updates for selected "Text Choice" data type: reset some field options set for other types, hide regex validator UI, hide text options UI
    * factor out DomainRowWarning to re-use between name special character type warnings and empty text choice values details display
    * TextChoiceAddValuesModal for add case and check for max allowed values
    * domain design model parsing for loading existing field property validators for text choice fields
    * show TextChoiceInput in EditableGrid cell for column with validValues

### version 2.107.1
*Released*: 22 December 2021
* Remove experimental feature flag for enabling SM product navigation in Biologics folders

### version 2.107.0
*Released*: 21 December 2021
* FolderMenu: menu provided in NavigationBar to allow users to navigate between folders

### version 2.106.0
*Released*: 20 December 2021
* Update `LookupCell` to use `QuerySelect` for display
* Remove `LookupStore`

### version 2.105.0
*Released*: 16 December 2021
* Item #9633: Add scannable option to SampleType text fields for LabKey apps
  * Added scannable field and value property to `TextFieldOptions`
  * Passed through appPropertiesOnly to `DomainRowExpandedOptions` and `TextFieldOptions`
  * Added optional showScannableOption property to `DomainFormDisplayOptions`
  * Added showScannableOption property to `SampleTypeDesigner`
  * Added `scannable` property to `DomainField`

### version 2.104.0
*Released*: 15 December 2021
* Add container select support to assay picker XAR import

### version 2.103.1
*Released*: 14 December 2021
* Merge release21.12-SNAPSHOT to develop
  * Includes changes from versions 2.101.1

### version 2.103.0
*Released*: 10 December 2021
* Item 9627: TextChoiceInput and usage for rendering select input for DetailEditRenderer and QueryFormInputs

### version 2.102.0
*Released*: 1 December 2021
* Rename EditableGridPanel to EditableGridPanelDeprecated
  * There will be a new version in a future release, and the deprecated version will eventually be removed

### version 2.101.1
*Released*: 7 December 2021
* Issue 44397: Add new date util function, getJsonDateTimeFormatString(), to be used by DatePickerInput and EditableGrid insert/update case

### version 2.101.0
*Released*: 30 November 2021
* Add `getContainerFilter()` for resolving default container filter based on folder context.
* Add `SecurityAPIWrapper` to support fetching containers. This is provided to components via `AppContext`.
* Specify React hooks exported by `@labkey/components` on a `Hooks` object for easier mocking.
* Update `ParentEntityEditPanel` to fetch and persist parent metadata. This allows the component to operate independent of the configuration of the model as supplied by the caller.
* Update `EditableDetailPanel` to accept `containerPath`.
* QueryModel
    * Add `loadErrors` and `hasLoadErrors()` utilities to `QueryModel` to reduce the number of checks callers need to do to ensure errors are handled.
    * Add `getRowValue()` utility method to `QueryModel` which allows for fetching the specific value of a row by column name (case-insensitive).
* Domain Editing
    * Add `domainContainerPath` prop to `QueryInfo` as now specified by `query-getQueryDetails.api` endpoint.
    * Support requesting PHI level cross-folder.
    * Make domain save requests against domain's folder.

### version 2.100.0
*Released*: 29 November 2021
* Item 9703: Add support for LabKey Vis API stacked bar plot
  * supported groupPath for bar chart config
  * add legendData for group bar chart case
  * add sortFn and conditional margin values for the grouped plot legend text length
  * other misc changes:
    * add vertical separator for manage sample statuses
    * update assay import sample status message to use warning instead of info alert display
    * SamplesBulkUpdateForm update to only show aliquot-editable fields when any selected samples are aliquots

### version 2.99.1
*Released*: 26 November 2021
* OntologyConceptPicker fix to wait for subtreePath model to load before showing find link

### version 2.99.0
*Released*: 26 November 2021
* Add `SampleStatusRenderer` for use in details display and grid display
  *  Update call to cell renderers to pass through all properties

### version 2.98.0
*Released*: 24 November 2021
* Add ExtendableAppContext
  * This allows downstream apps to extend AppContext and add their own attributes
* Add NavigationSettings to AppContext
* Add AppContexts component
* Refactor SubNav
  * Renders the current container if configured in NavigationSettings
  * Re-written to be an FC
  * No longer depends on jQuery

### version 2.97.0
*Released*: 23 November 2021
* Support auto-populating sample grid rows when importing run for a Job's Task's Assay

### version 2.96.0
*Released*: 23 November 2021
* Issue 44226: add more packages to the list of externals in webpack.config.js for @labkey/components

### version 2.95.0
*Released*: 22 November 2021
* Remove isFreezerManagerEnabledInBiologics experimental flag

### version 2.94.0
*Released*: 17 November 2021
* Item 9500: Improve Sample display when spanning types
    * fix SamplesSelectionContextProvider typings so that we can wrap SamplesBulkUpdateForm and SamplesEditableGrid here in ui-components and export the
    * remove SamplesSelectionContextProvider, SamplesBulkUpdateFormBase, and SamplesEditableGridBase from index.ts
    * remove SamplesSelectionContextProvider determineAliquot, determineStorage, and determineLineage props as those are now the same for LKB and LKSM
    * replace canEditStorage prop with call to isFreezerManagementEnabled()
    * move SamplesTabbedGridPanel from LKSM to ui-components
    * move CHECKED_OUT_BY_FIELD and INVENTORY_COLS constants to ui-components
    * Picklist implementation using SamplesTabbedGridPanel
    * split out RemoveFromPicklistMenuItem so that it can be used on the app side like AddToPicklistMenuItem
    * remove GridPanel internal usage of GridAliquotViewSelector, usages can still pass this in via ButtonsComponentRight

### version 2.93.0
*Released*: 16 November 2021
* Support initializing Ontology Browser to a concept via a URL parameter

### version 2.92.0
*Released*: 16 November 2021
* Introduce `AppContext`. A React context for serving global application context.
* Provide test utilities for working with components that utilize `AppContext`.

### version 2.91.2
*Released*: 15 November 2021
* Merge release21.11-SNAPSHOT to develop
* Includes changes from versions 2.90.2 and 2.90.3

### version 2.91.1
*Released*: 10 November 2021
* Bump @labkey/api dependency

### version 2.91.0
*Released*: 2 November 2021
* getUsersWithPermissions: support alternate container paths
  * expose via UserSelectInput and useUsersWithPermissions
* Export invalidateQueryDetailsCache
  * Provides containerPath-sensitive cache clearing
* Announcements: support supplying containerPath

### version 2.90.4
*Released*: 21 January 2022
* Item 9818: Lineage graph details panel updates to show object input/outputs and run step provenance map
    * update Lineage related models for provenanceMap, objectInputs, and objectOutputs
    * display Object Inputs and Object Outputs as collapsible details list (next to Material and Data Inputs/Outputs)
    * use run step protocol name instead of step name for title
    * update Run Step display to use tabs for Step Details and Provenance Map
    * render Run Step provenance map as <Grid> with from/to info

### version 2.90.3
*Released*: 10 November 2021
* Issue 44250: Invalidate QueryInfo caches after change to NameIdSettings.allowUserSpecifiedNames

### version 2.90.2
*Released*: 3 November 2021
* Ensure LK instances without LKSM do not call prefix-related actions

### version 2.90.1
*Released*: 1 November 2021
* Previous release was built against an incorrect version of api-js which broke workflow task support included in 2.87.0

### version 2.90.0
*Released*: 29 October 2021
* Support 'Status' setting on Assay Designs
* Hide 'Archived' Assay designs from megaMenu
* Show 'Active' Assay designs tab by default on Assay Overview Page

### version 2.89.2
*Released*: 29 October 2021
* Update aliquot rollup column field

### version 2.89.1
*Released*: 29 October 2021
* Issue 43793: Use field descriptions as title attribute on grid column headers

### version 2.89.0
*Released*: 28 October 2021
* Item 9537: Sample Status, Remove experimental feature flag
    * Update isSampleStatusEnabled() check to be based on existence of SM module
    * Add sample status column to allowed aliquot fields (for create, bulk insert/update dialogs)
    * Sample URL resolver fix for LKB mixture batches

### version 2.88.1
*Released*: 28 October 2021
* Issue 43687: UsersGridPanel update to not default to root container path for site/app admin users
  * always use the given containerPath
  * rename SiteUsersGridPanel to UsersGridPanel

### version 2.88.0
*Released*: 28 October 2021
* Updates for restricting operations for selections of samples based on status
  * `getMaterialDeleteConfirmationData.api` renamed to `getMaterialOperationConfirmationData.api` and return structure generalized
  * Update `SamplesBulkUpdateForm` to provide alert when samples don't allow data updates.
  * Update `AssayImportPanels` with alert about selected samples not allowing additional assay data to be associated with them
  * Update `EditableGridLoaderFromSelection` to accept a set of ids that are not to be updated when loading data from the bulk edit form.
  * Update various action modals with status alerts and to show only text and a dismiss button when nothing can be done from the selected samples
  * Fix bug in `SampleStatusTag` for icon-only display of Available statuses.
  * Add info headers in `SamplesEditableGrid` indicating why rows are not editable.

### version 2.87.0
*Released*: 27 October 2021
* Bump @labkey/api dependency
* Add AssayTaskInput
* Update RunPropertiesPanel to render AssayTaskInput
* Update resolveRenderer to use AssayTaskInput

### version 2.86.1
*Released*: 26 October 2021
* Auto-close confirm modal in case of error saving for 'ID/Name Settings' panel

### version 2.86.0
*Released*: 22 October 2021
* Item 9584: ManageSampleStatusesPanel for sample statuses CRUD operations
  * Update APIWrapper to take mockFn as a param instead of adding jest dependency directly
  * getSampleStatuses action to call API and return SampleState array
  * NameIdSettings component update to support optional titleCls prop

### version 2.85.0
*Released*: 18 October 2021
* Add settings panel 'ID/Name Settings' for use in LKB and LKSM
* Within naming pattern, add warning UI if prefix altered

### version 2.84.0
*Released*: 14 October 2021
* Item 9440: Enable picklists for LKB
  * Move PicklistOverview, PicklistSubNav and PicklistListing here from LKSM

### version 2.83.0
*Released*: 12 October 2021
* Updates for restricting single sample operations based on status
    * Add `DisableableMenuItem` that encapsulates the `OverlayTrigger` and `Popover` displayed when operation is not permitted
    * Add constants and utility methods for checking if operations are permitted
    * Add `SampleStatusTag` component for displaying the status on a details page
    * Update `SingleParentEntityPanel` to filter out samples that can't be used as parents

### version 2.82.0
*Released*: 12 October 2021
* Item 9533: SampleAssayDetail support for module defined sample assay results view configs

### version 2.81.0
*Released*: 5 October 2021
* Issue 43981: Add JavaDoc links to help text in field editor
* Issue 43907: Lookup field type with target table not in select options renders as disabled
* Issue 43934: Add lookup, flag, and ontology lookup data type in field editor for LKSM premium users
* Issue 44011: DatePickerInput fix to account for the shortcut formats (i.e. "Date", "DateTime", and "Time")
* Fix for getUpdatedDataFromGrid() helper to account for empty array values

### version 2.80.1
*Released*: 4 October 2021
* Expose additional `Modal` props via `ConfirmModal`.
* Export `parseDate`.

### version 2.80.0
*Released*: 4 October 2021
* Add announcements components (Discussions, Thread, ThreadBlock, and more)
* Add UserAvatars and UserAvatar
* Add handleFileInputChange helper

### version 2.79.1
*Released*: 1 October 2021
* Support filterable prop for QueryColumn

### version 2.79.0
*Released*: 30 September 2021
* Move SampleAliquotsGridPanel here from LKSM

### version 2.78.0
*Released*: 28 September 2021
* Update `EntityDeleteConfirmModalDisplay` to add message about sample status preventing deletion
* add `isSampleStatusEnabled` helper method in App object
* Reset error caused by editing after exiting edit mode in `ParentEntityEditPanel`
* update `resolveErrorMessage` to detect foreign key constraint messages
* fix problem in `extractChanges` (used by `EditableDetailPanel`) that was using `undefined` for a value that was cleared, which doesn't get sent to the server.

# version 2.77.6
*Released*: 28 September 2021
* Generate correct classNames for ConfirmModal cancel and confirm buttons
* Add margin-left to .required-symbol, users no longer need to add a trailing space to form labels

### version 2.77.5
*Released*: 27 September 2021
* Process the user `input` in `UserSelectInput` and compare it against user displayNames to support type-ahead filtering.
* Prevent processing of "selectedOptions" for asynchronous `SelectInput` configurations during `componentDidUpdate`.
* Update some internal typings for `SelectInput`.
* Add unit tests for `initOptions`.

### version 2.77.4
*Released*: 23 September 2021
* Initial API wrapper for actions to allow for jest test overrides, currently only a single action in the "samples" area
* Jest test for EntityLineageEditModal which use the test API wrapper and overrides

### version 2.77.3
*Released*: 22 September 2021
* Issue 43923: LKSM: Unable to go back to page 1 for Source/Samples grid
  * Allow GridAliquotViewSelector to update queryModel's aliquot filter

### version 2.77.2
*Released*: 21 September 2021
* Address intermittent Jest test failures

### version 2.77.1
*Released*: 21 September 2021
* EntityLineageEditMenuItem and related updates to support selenium tests for Source Samples grid

### version 2.77.0
*Released*: 17 September 2021
* Move Sample Aliquots panel UI and utils here from LKSM
* Issue 43833: update aliquot detail panel

### version 2.76.0
*Released*: 16 September 2021
* EntityLineageEditMenuItem update to add an optional onSuccess callback prop

### version 2.75.1
*Released*: 16 September 2021
* Rehydrate yarn.lock to fix issue with npm run start-link in LKSM module

### version 2.75.0
*Released*: 9 September 2021
* Add "Aliquot Naming Pattern" to sample designer

### version 2.74.0
*Released*: 9 September 2021
* Add new AppProperties interface and define properties for our three apps in the App object
  * Stop exporting product id constants that are encapsulated into the app properties constants
  * Expose new helper methods from App object (`isPremiumProductEnabled`, `sampleManagerIsPrimaryApp`, `getPrimayAppProperties`)
* Update getMenuSections config to merge in logic for Biologics as well
* Move FREEZER_ITEM_SAMPLE_MAPPER here from SampleManagement so it can be used for Biologics as well
* Change menuInit so it will get the given app's productIds only
* Issue 43826: Default to Aliquot in modal when creating samples of the same type

### version 2.73.0
*Released*: 9 September 2021
* Package updates

### version 2.72.0
*Released*: 9 September 2021
* Item 9269: Support for adding FM freezer locations
  * ExpandableContainer update to allow for custom container class
  * getTimelineEntityUrl() fix to use rd/freezerLocation for inventoryLocation urlType

### version 2.71.0
*Released*: 8 September 2021
* Create Sample Type Designer 'Linked Dataset Category' field as part of Link to Study dataset category assignment

### version 2.70.0
*Released*: 6 September 2021
* Remove QueryGridModel based <Detail> and <DetailEditing> components
* Remove unused QueryGridModel prop from AssayImportSubMenuItem and SamplesBulkUpdateForm
* Remove unused getImportItemsForAssayDefinitions() and getRunDetailsQueryColumns()

### version 2.69.1
*Released*: 31 August 2021
* Issue 43771: Show Folder title on Application home pages.
* Issue 43474: Prevent text wrapping for date columns.
* Introduce `useUserProperties` for retrieving user properties based on current user.

### version 2.69.0
*Released*: 31 August 2021
* Parameterize verb in DetailPanelHeader.
* Move getEntityNoun method to utils
* Add EntityLineageEditMenuItem and EntityLineageEditModal for enabling bulk update of entity lineage
* Update ParentEntityEditPanel with more optional parameters
  * hideButtons - to hide the buttons below the panel
  * editOnly - to indicate that we start in edit mode and cannot cancel out of it;
  * onChangeParent - callback used when any change in the parent types or values is made
  * includePanelHeader - allows header on panel to be removed
* Add ExperimentException handling to `resolveErrorMessage`

### version 2.68.1
*Released*: 30 August 2021
* Issue 43760: Update checks for editable columns to incorporate the readOnly setting as well

### version 2.68.0
*Released*: 26 August 2021
* Item 9228: Sample Type lineage updates via “Edit Sample in Grid”
  * query to get first parents (sources or samples) for selected samples in sample type grid
  * parse sample parent data into format that can be used to get initial columns and values for sample lineage EditableGrid
  * add new "Lineage Details" tab to the sample edit via grid display
  * allow for additional source and parents sample types to be added to EditableGrid
  * persist updated sample parents on finish/save from EditableGrid
  * refactor EntityParentTypeSelectors out of EntityInsertPanel.tsx for reuse

### version 2.67.1
*Release*: 26 August 2021
* Issue 42628: Hide Biologics details view override in view menu

### version 2.67.0
*Release*: 25 August 2021
* Issue 43029: Support File/Attachment Fields
    * See https://github.com/LabKey/labkey-ui-components/pull/610 for more details.

### version 2.66.1
*Release*: 25 August 2021
* Issue 43782: Omnibox - Filtering on a field pulled into a lookup shows lookup field instead of the pulled in field

### version 2.66.0
*Release*: 23 August 2021
* Issue 43693: Indicate the depth of the lineage graphs and grids
* Issue 43692: expose LineageGroupingOptions for ease of overriding defaults; update default depth to 5
* Issue 43701: Don't remove sample id from a sample assay results grid since the grid may now include aliquots as well
* Issue 43722: Update label in lineage grid from Name to ID

### version 2.65.2
*Released*: 20 August 2021
* Expose range validator modal and related components

### version 2.65.1
*Released*: 18 August 2021
* Issue 43734: SM: Aliquot overview details panel shows some aliquot values under the 'originating sample data' section
  * Hide extra exp.material fields from aliquot detail view

### version 2.65.0
*Released*: 18 August 2021
* Create Assay Designer 'Linked Dataset Category' field as part of Link to Study dataset category assignment

### version 2.64.0
*Released*: 18 August 2021
* Issue 43728: bulk insert for samples is broken when a file field is present
* Issue 43725: account for both forward and back slash in FileColumnRenderer.getAttachmentTitleFromName
* Issue 43703: show warning on sample creation editable grid if required fields are included

### version 2.63.2
*Released*: 13 August 2021
* Fix capitalization in FindByIdsModal button
* Issue 43715: Fix pixel offset for Find menu in nav bar for Firefox

### version 2.63.1
*Released*: 13 August 2021
* Item 8561: Add some sample type designer element class names for testing

### version 2.63.0
*Released*: 11 August 2021
* Issue 43672: Add "referrer" param to the help link URLs
  * Deprecate helpLinkNode() in favor of HelpLink FC

### version 2.62.3
*Released*: 11 August 2021
* Update scss for form has-error display of updated react-select component to match other form inputs

### version 2.62.2
*Released*: 10 August 2021
* getDateFormat / getDateTimeFormat: support container parameter

### version 2.62.1
*Released*: 9 August 2021
* Issue 43647: SM: creating aliquots for a sample type with a required field gives an error
    * Add required sample properties to insertRows data for aliquot creation

### version 2.62.0
*Released*: 5 August 2021
* Add `help` guidance for user when a `nameExpression` is present on the `QueryColumn`.
* Mark field as required in when updating if a `nameExpression` is present.
* GridPanel: allow multiple filters on same column in OmniBox.

### version 2.61.2
*Released*: 4 August 2021
* AssayImportPanels.tsx conversion to QueryModel for batch and run properties

### version 2.61.1
*Released*: 3 August 2021
* Add after-creation callback property to PicklistCreationMenuItem

### version 2.61.0
*Released*: 30 July 2021
* export createQueryConfigFilteredBySample
* SampleAssayDetails to support aliquot view selector and source assay
* add getEmptyText for GridPanel

### version 2.60.3
*Released*: 28 July 2021
* PermissionAssignments.tsx fix to only request root container security policy if user is root admin

### version 2.60.2
*Released*: 27 July 2021
* NavigationBar: fix "sm" screen size layout

### version 2.60.1
*Released*: 26 July 2021
* AuditQueriesListingPage component conversion to QueryModel
* Remove some unused exports from index.ts: getQueryGridModelsForGridId, getRunPropertiesModel, getRunPropertiesRow, getBatchPropertiesModel, getBatchPropertiesRow

### version 2.60.0
*Released*: 25 July 2021
* SelectInput:
    * Now the defacto implementation we use to wrap `ReactSelect`.
    * Implement my best attempt at stylizing the component to match our theme/look.
    * Retain support for primitives as the `value`. When `autoValue={true}` (the default) then `SelectInput` attempts to resolve the chosen option from the value.
    * Add support for resolving the chosen option from a primitive value for asynchronous received values.
    * When `autoValue={false}` the component will no longer track the `selectedOptions` internally and only utilize them if necessary for Formsy processing.
    * The `formsy` property now defaults to `false`. All usages updated.
    * The `showLabel` property now defaults to `undefined` and requires explicit `false` to prevent display of the label. Otherwise, display of the label depends on if the `label` property is provided.
    * `value` is no longer explicitly tracked for changes (see removal of `SelectInput/equalValues()`).
    * Reimplement `saveOnBlur` in support of [Issue 33774](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=33774).
    * Retain support for `valueKey` and `labelKey` when working with user-defined options/models.
* QuerySelect:
    * Improve typings to denote all properties available and remove redundant declarations.
    * Update support for `loadOnFocus` to work with latest version of ReactSelect.
* Introduce `SelectInputTestUtils.ts` which provides utilities and selectors for interacting with `SelectInput` in Jest tests.

### version 2.59.1
*Released*: 21 July 2021
* Fix issue with onChange callback in FileAttachmentArea
* Update eslint-config-react dependency

### version 2.59.0
*Released*: 22 July 2021
* Added SampleAliquotViewSelector component, ALIQUOT_FILTER_MODE enum

### version 2.58.1
*Released*: 21 July 2021
* Use `<a>` instead of `<div>` so right clicks work in product menu.
* [Issue 43502](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=43502) change `isDataInput` and `isMaterialInput` to assure the field is a lookup as well as having the expected prefix
* [Issue 43531](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=43531) Don't trim off leading 0s from input values in file import preview grid
* [Issue 43594](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=43594) Show only names of parent samples and sources in dropdown
* [Issue 43418](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=43418) Add some styling in DetailDisplay to make text not overflow the box

### version 2.58.0
*Released* 20 July 2021
* Rename DateInput to QueryDateInput
* Add DateInput component
    * This component is just a DateInput, it has no special knowledge of QueryColumns
* Add EditInlineField
    * This is a component that renders a field with a name and value, and optionally lets a user edit the field in place
* Add useEnterEscape hook
    * A custom hook that makes it easier to intercept the enter and escape keys, useful for fields that save/cancel
      on enter/escape
* Add useUsersWithPermissions hook
    * A custom hook that uses the getUsersWithPermissions action to load users
* Add Key enum
    * An enum useful for intercepting keys in event handlers
* Add FileAttachmentArea
    * This component looks like our FileAttachmentContainer, but only takes a single prop, `onAttach`. This component
      stores no state, and does not render files.

### version 2.57.0
*Released*: 20 July 2021
* Item 9204: Sample type parent import alias inclusion in download template and display in details panel
    * Add SampleTypeImportAliasRenderer and SourceTypeImportAliasRenderer to be used for sample type details panel rendering
    * EntityInsertPanel update to get importAliases for target sample type to add to getTemplateUrl() params

### vesrion 2.56.2
*Released*: 20 July 2021
* Save findIds to HTTP session instead of browser session for less exposure
* don't request to `incrementClientSideMetricCount` if user is a guest

### version 2.56.1
*Released*: 19 July 2021
* Added getLineageFilterValue to support linage queries to a given depth.

### version 2.56.0
*Released*: 14 July 2021
* Add option to SearchBox to show a dropdown for searching by Ids
* Add FindByIdsDropdown and FindByIdsModal components
* Add PicklistButton
* Slight update of styling in navbar
* Add optional parameter to picklist components for recording metric counts for actions taken

### version 2.55.1
*Released*: 14 July 2021
* Issue 43530: Filter dialog for ontology lookup field does not open to intended Vocabulary scope

### version 2.55.0
*Released*: 7 July 2021
* add SharedSampleTypeAdminConfirmModal
* add getUserSharedContainerPermissions, getEditSharedSampleTypeUrl and getDeleteSharedSampleTypeUrl util
* use currentPlusProjectAndShared for sample type container filters

### version 2.54.0
*Released*: 6 July 2021
* Move misc DomainForm properties into domainFormDisplayOptions
    * hideConditionalFormatting, showInferFromFile, allowImportExport, showFilePropertyType, showStudyPropertyTypes
    * Fix for domain form dirty state on row selection change
    * Sort domain field type select input options by display text

### version 2.53.0
*Released*: 5 July 2021
* Remove msg prop from ConfirmModal, uses children prop instead

### version 2.52.0
*Released*: 1 July 2021
* Introduce mountWithServerContextOptions test utility method.
* Stop exporting mountWithServerContext, waitForLifecycle as these do not work external to the package.

### version 2.51.1
*Released*: 1 July 2021
* getMenuSectionConfigs() update for WF. Do not limit menu options. Update "see all" URL.

### version 2.51.0
*Released*: 30 June 2021
* Update typings to allow formatting numeric dates
* Revise choice list styling
* Introduce `handleRequestFailure` utility method for handling Ajax failures

### version 2.50.3
*Released*: 29 June 2021
* [Issue 43299](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=43299) Ignore required property on checkbox inputs

### version 2.50.2
*Released*: 29 June 2021
* Parameterize support for showing study field types
* [Issue 43459](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=43459) Don't show file upload area if no target type is chosen.

### version 2.50.1
*Released*: 28 June 2021
* [Issue 43435](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=43435): When in either LKSM or FM show the storage menu

### version 2.50.0
*Released*: 25 June 2021
* Item 8998: Field designer ontology lookup field support for conceptSubtree prop
    * DomainField props update to remove principalConceptDisplay and add conceptSubtree
    * DomainField.getPrincipalConceptDIsplay() to use code value to lookup concept model for label display
    * ConceptOverviewPanel pass through path prop for selectedPath display
    * Factor getParentsConceptCodePath() out of OntologyBrowserFilterPanel for reuse
    * OntologyBrowserModal update to support initializing selected concept from initConcept or newly added initPath prop
    * Factor concept cache out of OntologyBrowserPanel to be used globally for calls to fetchConceptForCode()
    * Factor OntologyConceptSelectButton out of OntologyConceptAnnotation for reuse with conceptSubtree UI
    * OntologyConceptPicker update to support loading from a conceptSubtree value or a fieldValue
    * OntologyLookupOptions update to add UI for selecting conceptSubtree value for source ontology

### version 2.49.1
*Released*: 25 June 2021
* Issue 42637: Fix for fileMatchesAcceptedFormat() to check for file extensions that might have multiple parts

### version 2.49.0
*Released*: 22 June 2021
* Introduce SelectViewInput component
    * Supports localStorage persistence of selected view
    * Replaces OptionsSelectToggle

### version 2.48.0
*Released*: 22 June 2021
* Issue 43283: update GridAliquotViewSelector to use dropdown instead of checkboxes
* Issue 43310: SM: Sample names that are numbers only and greater than 7 characters get truncated in file import preview.
* Issue #43347: don't show q.details.xx as QueryDetailPage title

### version 2.47.1
*Released*: 21 June 2021
* [Issue 43367](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=43367) Use proper container path for lookups
* [Issue 43324](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=43324) Trim spaces from text fields before submitting

### version 2.47.0
*Released*: 18 June 2021
* Add `<ContentGroup/>` and `<ContentGroupLabel/>` components.
* Update `<SelectInput/>` to respect `valueKey` when processing multiple values.
* Add reusable styles for `content-form`, `form-step-tabs`, and `clickable-text`.

### version 2.46.1
*Released*: 18 June 2021
* Addresses [Issue 43372](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=43372) by:
    * Switch `hideEmptyChartSelector` and `hideEmptyViewSelector` to true by default for `QueryGridModel`.
    * Switch `hideEmptyChartMenu` and `hideEmptyViewMenu` to true by default for `GridPanel`.

### version 2.46.0
*Released*: 14 June 2021
* Update product navigation menu behavior
  * Remove ability to navigate to other projects
  * Make LKS links entries not clickable if already in the current container
  * Add ability to disable display of menu for non-admins (based on Look & Feel setting from server)
  * Add usage statistics about navigation to and from LKS
  * Add use of experimental feature flag to conditionally enable navigation to LKSM from LKB

### version 2.45.2
*Released*: 14 June 2021
* Switch ontology search to use hit id instead of parsing code

### version 2.45.1
*Released*: 14 June 2021
* Fix CreateSamplesSubMenuBase disabled option for non sample grids

### version 2.45.0
*Released*: 11 June 2021
* Added SampleDeleteMenuItem
* Moved CreateSamplesSubMenuBase, getMenuItemsForSection from SampleManager
* Allow EntityInsertPanel to initialize sample parents from inventory items selection
* Add getSnapshotSelections action util

### version 2.44.0
*Released*: 10 June 2021
* Item 8958: LKSM Permissions updates for premium vs hosted only servers
    * Move SITE_SECURITY_ROLES from SM to shared components and update APPLICATION_SECURITY_ROLES to include Project and Folder Admin roles
    * AuditDetails component fix to use getUsersWithPermissions to resolve userId display names
    * DomainForm refactor to replace extra Security.getModules call with use of new hasModule helper for ontology
    * BasePermissionsCheckPage addition of subTitle and description optional properties
    * SecurityRole.filter fix to always take into account the relevantRoles from policy
    * SiteUsersGridPanel conversion to QueryModel and GridPanel
    * SiteUsersGridPanel updates for Project/Folder admin users to only show applicable menu items (i.e. delete/deactivate)
    * getUserRoleDisplay updates for additional admin roles in SM app
    * GridPanel addition of option highlightLastSelectedRow prop to match QueryGridPanel

### version 2.43.0
*Release*: 9 June 2021
* Add support for concept picker usage in Insert/Update scenarios
* Fixed OntologyLookupOptions NO-OP updates marking fields as dirty
* Add an initial concept for OntologyBrowserModal

### version 2.42.1
*Released*: 8 June 2021
* GridPanel.omniBoxChange fix for JS error on removing action text

### version 2.42.0
*Released*: 7 June 2021
* Introduce hasPermissions, hasAnyPermissions utility methods
* Update `<RequiresPermission/>` component to be configurable for all options

### version 2.41.2
*Released*: 4 June 2021
* [Issue 43264](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=43264) Trim field values
  entered in grid
* Fix for change of parentTypeOptions type value from an array to a single value (from https://github.com/LabKey/platform/pull/2310)

### version 2.41.1
*Released*: 3 June 2021
* Fix FileSizeLimitProps export

### version 2.41.0
*Released*: 2 June 2021
* Issue 43131: Files added to Sample Types show a path to "sampleset"
* Issue 43254: Trailing spaces in field editor field names are not getting trimmed
* Issue 37850: Include display format string in form field label help tip and editable grid cell header
* Check to make sure model has selection before showing choose picklist modal

### version 2.40.0
*Released*: 1 June 2021
* Package updates
* Updated to build using Webpack 5.
* Switched to using [Webpack Asset Modules](https://webpack.js.org/guides/asset-modules/). Deprecates need for `file-loader` and `url-loader`.
* Update `immer` to `v9.x` which necessitated some typings updates for our usages of `produces`.
* Update to use Jest `v27.x`. See [this post](https://jestjs.io/blog/2021/05/25/jest-27) for further details.
* Storybook updated to `v6.3.x-beta` to support building with Webpack 5.

### version 2.39.0
*Released*: 31 May 2021
* Don't show multi-value columns as filtering options for Omnibox.
* Issue 43199: Update SampleCreationTypeModal to expand click area
* Issue 42972: Fix validity check after removing parent aliases
* Issue 43255: Protect against undefined rangeURI

### version 2.38.0
*Released*: 31 May 2021
* Add support for freezer location in TimelineView

### version 2.37.0
*Released*: 28 May 2021
* Define new Content Panel variant `panel-content` in `panel.scss`.
* Update `<Section/>` component to make use of standard `panel-content` layout.
* Define new Content Tabs styling `content-tabs` in `tabs.scss`.

### version 2.36.0
*Released*: 28 May 2021
* Item 8897: Remove default session event listeners from initWebSocketListeners (and rename it to registerWebSocketListeners)

### version 2.35.0
*Released*: 27 May 2021
* Specialty assays moved to premium module. Assay picker now has option to show upsell message.
* Better handling when no specialty assays available in assay picker, including warning.
* Upsell message in the assay picker is a candidate to be it's own component should we need further upsell messages.

### version 2.34.0
*Released*: 26 May 2021
* Add autoFocus prop to SelectInput

### version 2.33.1
*Released*: 25 May 2021
* Update SingleParentEntityPanel to handle multiple data source types
* Update ParentEntityEditPanel to handle multiple data sources and not require a full model

### version 2.33.0
*Released*: 25 May 2021
* Add support for modifying the items in a picklist
    * Add AddToPicklistMenuItem that incorporates a new ChoosePicklistModal and actions
    * Add styling (lifted from ELN notebooks stylings) for choice panels in modal.
* Update `getSelection` so you can pass in a `queryName` and `schemaName` and not have to parse the selection key
* Add utility method `getCofirmDeleteMessage`
* Issue 42843: Sample Creation modal allows more than the max number of rows to be created

### version 2.32.0
*Released*: 19 May 2021
* Introduce `loadOnMount` flag to `<GridPanel/>` for controlling model loading behavior. Defaults to `true`.
* Add `showRowCountOnTabs` flag to `<TabbedGridPanel/>` to display model row counts in tab name. Defaults to `false`.
* Add `createQueryConfigFilteredBySample` method for generating assay/sample `QueryConfig` based on assay model configurations.
* `SampleAssayDetail` has been converted to support `QueryModel` and ported out of Biologics. This can be reused in the future by other apps.
* `SampleDetailEditing` updated to support `QueryModel` configurations as well as `QueryGridModel`.

### version 2.31.0
*Released*: 13 May 2021
* Remove isSampleAliquotEnabled experimental flag
* Allow QueryGridModel export to include extra columns
* Allow QueryModel to export LABEL
* Issue 43070: SM: Aliquot names do not autogenerate when the sample type doesn't have a name expression
* Move/refactor components/utils from SampleManager to enable aliquot features in Biologics
    * SamplesSelectionContextProvider
    * SamplesBulkUpdateForm
    * SamplesEditableGrid
    * SampleDetailEditing
    * SampleAliquotDetailHeader
    * SampleLineageGraph
    * getGroupedSampleDomainFields, getAliquotSampleIds, getGroupedSampleDisplayColumns utils

### version 2.30.0
*Released*: 13 May 2021
* Add picklist-related components, models, and actions including:
    * PicklistCreationMenuItem
    * PicklistEditModal
    * PicklistDeleteConfirm
* Updated domain designer Lookup/Fields to allow for certain tables (e.g., picklists) being excluded from the choice for lookups
* Add new `getListIdFromDomainId` method

### version 2.29.1
*Released*: 12 May 2021
* QuerySelect: Pass `selectedItems` to `onQSChange()` event handlers.

### version 2.29.0
*Released*: 11 May 2021
* Replace usages of LABKEY variable with getServerContext()
* Add `Container.hasActiveModule()` utility method.

### version 2.28.0
*Released*: 6 May 2021
* Add FormSchema, Field, Option interfaces
  * These interfaces are used in conjunction with LabKey server classes of the same name to auto-generate forms with
    AutoForm (see below)
* Add AutoForm - A component that generates a form for a given FormSchema
* Add HelpIcon - A component useful for rendering help text

### version 2.27.0
*Released*: 01 May 2021
* Changes to allow data region filtration based on ontology concepts
  * Added OntologyBrowserFilterPanel to handle FilterDialog injection
  * Updated OntologyBrowser to optionally hide conceptinfo
  * Updated OntologyTreePanel to show filter selections
* Updated FileTree to take header parameter
* Split FileTree.Header into its own file

### version 2.26.3
*Released*: 30 April 2021
* Issue 43028: QuerySelect - fallback to "valueColumn" as option label
* Issue 43051: LookupCell menu appears detached from table cell

### version 2.26.2
*Released*: 29 April 2021
* Issue 42527: Handle edge case in List Designer Summary View. Summary View mode now hides Field Editor HeaderRenderer content

### version 2.26.1
*Released*: 29 April 2021
* Issue 42844: Sample Type designer update to include metricUnit check in "isValid" check

### version 2.26.0
*Released*: 28 April 2021
* Item 8789: Add util function for incrementClientSideMetricCount()

### version 2.25.0
*Released*: 23 April 2021
* EditableGrid:
    * EditableGridPanel and EditableGridPanelForUpdate support multiple models in a tabbed view
    * Allow setting cell to read only with columnMetadata
    * Allow getUpdateColumns override
    * Set caption with columnMetadata
* Support aliquot creation mode for EntityInsertPanel
* Add header props to BulkUpdateForm

### version 2.24.4
*Released*: 23 April 2021
* Issue 42872: Handle field names with special characters in grids and forms better.
* Update export aliases to use SampleID instead of SampleId

### version 2.24.3
*Released*: 22 April 2021
* immer version bump to 8.0.4 and other yarn.lock updates

### version 2.24.2
*Released*: 21 April 2021
* Update audit log events parsing to handle non-ImmutableJS events

### version 2.24.1
*Released*: 20 April 2021
* Issue 42756: Disable bulk update for Submitters+Readers

### version 2.24.0
*Released*: 19 April 2021
* Item 8735: Misc updates to support DetailEditing shared component in LKB
    * DetailEditing.tsx - add optional detailRenderer to be used in view/read mode
    * Export DetailPanelHeader.tsx to use in LKB
    * Formsy addValidationRule isNumericWithError in resolveRenderer for DetailEditing.tsx usages
    * form/details/extractChanges check for date validation of with/without timestamp

### version 2.23.2
*Released*: 16 April 2021
* Issue 42932: FieldEditorOverlay fix to recognize change to props by looking at row's RowId

### version 2.23.1
*Released*: 15 April 2021
* Issue 42527: Support 'Is Primary Key' column for Summary View

### version 2.23.0
*Released*: 15 April 2021
* Item 8735: Enable files and attachment data types for sample type designer and data class designer
    * Refactor AttachmentCard component and related SCSS from LKB ELN
    * Enable FileColumnRenderer for DetailsPanel
    * Move image showModal from FileColumnRenderer.tsx to AttachmentCard.tsx
    * Handle file field insert/update/delete for DetailEditing.tsx component and equivalent EditableDetailsPanel.tsx component
    * Don't show file inputType columns in editable grid or add/update bulk forms
    * Better handling for error messages from virus file detection response

### version 2.22.6
*Released*: 12 April 2021
* QueryColumn: expose dimension, measure properties

### version 2.22.5
*Released*: 12 April 2021
* Issue 42475: Add file image to data class details page

### version 2.22.4
*Released*: 10 April 2021
* Remove /src/internal/app/index.ts and instead define App in /src/index.ts

### version 2.22.3
*Released*: 9 April 2021
* Pass already supplied `containerPath` to `getQueryDetails()` for fetching underlying metadata for `<QuerySelect />`.

### version 2.22.2
*Released*: 9 April 2021
* Add showImportDataButton, showInsertNewButton and isFiltered to QueryModel

### version 2.22.1
*Released*: 6 April 2021
* Fix for FM enabled check related to LKB experimental feature flag
    * Change to isFreezerManagementEnabled() helper to check that both the inventory module is enabled in the folder
    and that if biologics is enabled then the experimental feature flag must be enabled as well

### version 2.22.0
*Released*: 5 April 2021
* Add GridAliquotViewSelector
* Add showSampleAliquotSelector to QueryGridBar and GridPanel
* Add URL.replaceFilter uti
* Update EntityDeleteModal to work with QueryModel
* Group lineage nodes based on materialLineageType

### version 2.21.1
*Released*: 5 April 2021
* Issue 42598: FileTree component styling fixes for font family, text color, and node display for wide text
* Ontology search input - cancel form submit on enter key to prevent page reload

### version 2.21.0
*Released*: 2 April 2021
* Add support for uniqueId (barcode) fields
    * Add Concept URI for unique Id fields.
    * In EntityInsertPanel, add placeholder text for generated Ids and make them read-only
    * Add condition on column filter used for bulk insert to remove the unique id fields
    * Add UniqueIdBanner containing call to action in SampleTypeDesigner properties panel and fields panel for adding uniqueIds
    * Add `getUniqueIdFields` method to QueryInfo class
* add `isCommunityDistribution` method
* add `alert-button` css class for buttons that appear in alert banners
* Update EntityInsertPanel and FilePreviewGrid to show warnings about fields detected that will be ignored during import,
either because they are not known or because they are uniqueId fields.

### version 2.20.1
*Released*: 31 March 2021
* Handle domain field data type check for created/modified timestamp conceptURI

### version 2.20.0
*Released*: 31 March 2021
* Item 8703: Move handleFileImport code into shared components and use in EntityInsertPanel for file importData call
    * Replace EntityInsertPanel handleFileImport prop with fileImportParameters
    * Add handleEntityFileImport implementation based on usages in LK modules
    * Change EntityInsertPanel submitFileHandler to use shared handleEntityFileImport with passed in fileImportParameters
    * Add EntityDataType importFileAction prop to be used for handleEntityFileImport

### version 2.19.0
*Released*: 30 March 2021
* Add maxAllowedPhi attribute to User
* Add phiProtected attribute to QueryColumn
* Add styling to Grids for PHI protected columns
* Convert GridMessages to FC

### version 2.18.0
*Released*: 30 March 2021
* Issue 42741: EntityInsertPanel fix to use selected sample type name instead of value (which is lowercase) for navigation
* Add EntityDataType.editTypeAppUrlPrefix to use for linking to the edit design app URL on the create/import page
* EntityInsertPanel fix to handle case where parent param is a schema/query but without specific values to add to grid
* Add createEntityParentKey helper util function
* SubMenuItem fix for expanded menu with filter issue with item disabled state change

### version 2.17.0
*Released*: 23 March 2021
* Add queryModel prop to AssayImportSubMenuItem

### version 2.16.1
*Released*: 22 March 2021
* add lookupStoreInvalidate util

### version 2.16.0
*Released*: 22 March 2021
* Add 'Auto-Link Data to Study' field in Sample Type properties

### version 2.15.3
*Released*: 21 March 2021
* Fix for `selectedState` in `QueryModel` when total rows is less than page size

### version 2.15.2
*Released*: 18 March 2021
* Merge release21.3-SNAPSHOT to master.
* Includes changes from versions 2.6.3 and 2.6.4.

### version 2.15.1
*Released*: 18 March 2021
* Fix problem with undefined references in `getDisambiguatedSelectInputOptions`

### version 2.15.0
*Released*: 16 March 2021
* Add `<DisabledMenuItem/>`.
* Update assays model getDefinitionsByTypes to list included/excluded types
* Add isBiologicsEnables and isFreezerManagerEnabledInBiologics checks

### version 2.14.1
*Released*: 15 March 2021
* Update `<EntityInsertPanel/>` component for reuse for media materials.

### version 2.14.0
*Released*: 11 March 2021
* Update DomainForm and FileAttachmentForm to ignore reserved fields when inferring fields

### version 2.13.2
*Released*: 11 March 2021
* Convert `<SingleParentEntityPanel/>` to use `QueryModel`.
* Update `<ParentEntityEditPanel/>` to no longer invalidate `QueryGridModel`s for underlying single parent panels.

### version 2.13.1
*Released*: 11 March 2021
* Fixes Issue 42438: better handling of lineage metadata loading errors.
* Lineage: propagate `fetchNodeMetadata` loading errors.
* display error alert in `<LineageGraph/>`.

### version 2.13.0
*Released*: 10 March 2021
* Changes to support webpack aliases from /src and theme/SCSS assets
    * index.ts and app/index.ts updates to export types separately
    * add "declare" to various immutable Record properties
    * remove global.d.ts in favor of GlobalAppState defined and used for ReactN components types directly
    * remove "const" from usages of const enum
    * Remove direct reference to `jest` from test utility methods

### version 2.12.0
*Released*: 9 March 2021
* Add `editColumns` property to `<Detail/>`, `<DetailEditing/>` for `QueryGridModel` support.
* Add `editColumns` property to `<DetailPanel/>`, `<EditableDetailPanel/>` for `QueryModel` support.

### version 2.11.1
*Released*: 8 March 2021
* Hide 'Derivation Data Scope' column within Designer Summary View. Will be updated when aliquot functionality is no longer an experimental feature

### version 2.11.0
*Released*: 6 March 2021
* Package Updates

### version 2.10.2
*Released*: 5 March 2021
* Merge release21.3-SNAPSHOT to master.
* Includes changes from versions 2.6.1 and 2.6.2.

### version 2.10.1
*Released*: 5 March 2021
* Don't use const enums, they are not compatible with our new typescript babel build

### version 2.10.0
*Released*: 4 March 2021
* Support tagging participant and time point columns in sample types
* Add two PropDescTypes to include within field Data Type dropdown. The new options render when domain property allowTimepointProperties is true, which is currently the case for only Sample Types
* Ensure two new Data Type options mentioned above do not render in SampleManagement Sample Types

### version 2.9.0
*Released*: 4 March 2021
* Replace `<LookupSelectInput/>` with `<QuerySelect/>` in detail editing.
* Configures a `QuerySelect` component for detail editing.
* Support defaults for `detailRenderer` and `titleRenderer` on `DetailDisplay`.
* No longer publicly export `resolveDetailEditRenderer` or `titleRenderer`.
* Improve types for our rendering methods.

### version 2.8.0
*Released*: 3 March 2021
* Add isSampleAliquotEnabled experimental flag
* Add "Aliquot Options" to domain row
* Allow DetailEditing to use custom set of update columns via getUpdateDisplayColumns
* Hide aliquot fields for insert editable grid and bulk insert form

### version 2.7.0
*Released*: 1 March 2021
* Add TabbedGridPanel component
  * To be used as a replacement for QueryGridPanel's tabbed mode
* Add "title" field to QueryModel

### version 2.6.4
*Released*: 16 March 2021
* Item 8546: Ontology concept picker panel search
    - FileTree component updates show props to `showLoading` and `showAnimations`
    - Concept path display update for hover to get full path info for "current path"
    - Ontology tree panel update for adding search input field and results menu behavior
    - Ontology tree panel update to allow for loading data into tree and navigating to an alternate path via search or alternate path click in path information tab
    - Ontology panel header update to show ontology description and concept count in tooltip
    - search/actions.ts update to allow for a custom category filter array

### version 2.6.3
*Released*: 10 March 2021
* Item 8360: Expand the ontology and concept browsers with additional information
    - Added synonym and path information to the concept information panels
    - Added selected path and alternate path displays to path information tab & panel

### version 2.6.2
*Released*: 4 March 2021
* 42608: Bulk Insert erroneously transposes columns

### version 2.6.1
*Released*: 2 March 2021
* Issue 42589: Product Menu attempts to load before application initialized
* Add and respect `showNotifications` and `showProductNav` props to `<NavigationBar />`

### version 2.6.0
*Released*: 27 February 2021
* Item 8583: Ontology concept picker usages in Field Editor for field concept annotation
    - Add principalConceptCode to DomainField model
    - Add field editor expanded row input for OntologyConceptAnnotation with button to open the Ontology Concept Browser in modal dialog
    - Move components related to ontology from /domainproperties to /ontology
    - Expose OntologyConceptOverviewPanel for use in ontology module
    - Add OntologyBrowserModal to wrap the browser in a modal with cancel and apply buttons
    - Factor out OntologyTextDomainFieldSelect from OntologyLookupOptions component

### version 2.5.2
*Released*: 26 February 2021
* Issue 42515: Layout issue for NavBar with medium-sized screens
* ProductMenu: prevent closing menu on non-link click
* ProductMenu: expand link clickable area
* ProductNavigationHeader: clickable text to go back

### version 2.5.1
*Released*: 25 February 2021
* @labkey/components package bundle optimizations
    - webpack.config.js: add back in new IgnorePlugin(/^\.\/locale$/, /moment$/)
    - split initUnitTestMocks() into a separate testHelperMocks.tsx file so it isn't referenced via ./src/index.ts
    - add localDev.md doc info on using webpack-bundle-analyzer

### version 2.5.0
*Released*: 24 February 2021
* Item 8359: Add initial OntologyBrowserPanel and associated files

### version 2.4.0
*Released*: 24 February 2021
* Migrates `AssayDesignEmptyAlert`, `BarChartViewer`, and `RecentAssayPanel` to `@labkey/components`.
* Migration includes chart configurations for assays and samples.
* No longer need to export `UserMenu` as last external usage was removed.
* Remove jQuery from `BaseBarChart` as it is no longer necessary.

### version 2.3.1
*Released*: 24 February 2021
* Make 'auto-scroll to field' functionality in Summary View also expand given field
* Display rangeURI values in Summary View for new fields

### version 2.3.0
*Released*: 23 February 2021
* Field Editor Summary View

### version 2.2.0
*Released*: 19 February 2021
* Item 8335: Add LabKey product navigation icon and menu to NavigationBar.tsx
    - make the ProductNavigationMenu.tsx component available for use in LKS header.jsp
    - app/utils.ts addition of hasPremiumModule() helper function
    - remove UserMenu "Switch to LabKey" option
    - consolidate styles for Product Navigation menu and Notifications menu (ex. update header text display to match)
    - add optional containerPath param to createProductUrl() function

### version 2.1.0
*Released*: 18 February 2021
* Add SampleCreationTypeModal for choosing aliquots, derivatives, or pooled samples
* Add RadioGroupInput component for use in (and out of) Formsy forms
* Separate QueryInfoQuantity component from QueryInfoForm for display of quantity header

### version 2.0.0
*Released*: 15 February 2021
* Fix issue in URLResolver causing next to be called twice
* Add useRouteLeave hook
* withRouteLeave now uses the useRouteLeave hook
* BACKWARDS INCOMPATIBLE - RouteLeaveProps renamed RouteLeaveInjectedProps
* Add WrappedRouteLeaveProps - you can now customize the message shown when users attempt to navigate away from a dirty page
* Improved typing for withRouteLeave
* BACKWARDS INCOMPATIBLE - remove confirmLeaveWhenDirty

### version 1.21.1
Public API update
*Released*:
* Move FileAttachmentForm, WebDav, InferDomainResponse components to public
* Move FileSizeLimitProps and FileGridPreviewProps to public

### version 1.20.0
*Released*: 8 February 2021
* Refactor navigation components to functional components.
* Add support for `sectionKey` in menu items.
* Make resolving URLs implementation non-async. Promises were not needed. This affected `makeTestData` in the same way.
* Rename `handle132Response` to `handleSelectRowsResponse` as a part of moving to non-async.

### version 1.19.0
*Released*: 3 February 2021
* Update storybook to v6
* Package updates for test dependencies

### version 1.18.0
*Released*: 1 February 2021
* Addition of AssayDesignDeleteModal, AssaysHeatmap and AssayTypeSummary
* Updates for app version of AssayPicker

### version 1.17.2
*Released*: 29 January 2021
* Fix default grid cell rendered so it displays values that are 0.

### version 1.17.1
*Released*: 27 January 2021
* Issue 42342: Formatting issues with notifications drawer
    - align chevron properly with the bell icon without unread msgs
    - For a "Folder import" notification, there's a space missing

### version 1.17.0
*Released*: 26 January 2021
* wire up query grid reset on appModel
    - add needsInvalidateQueryGrid field to AppModel
    - add methods for invalidate grids in AppReducers
    - register resetQueryGridListeners in initWebSocketListeners
* remove isAsynchronousImportEnabled
* add maxEditableGridRowMsg to RunDataPanel and invalidCountMsg to Controls props
* move spinner to be before menu labels for ProductMenuSection
* show ActionLinkUrl for success and error notifications
* use bootstrap badge for notification count display

### version 1.16.2
*Released*: 26 January 2021
* Issue 42216: Fix for logout event notification issue with different user sessions (i.e. different browsers)
    * add check for evt.wasClean in server event listener callbacks before dispatching (to match platform dom/WebSocket.js)
    * move CloseEventCode enum type from Biologics to use in App.initWebSocketListeners

### version 1.16.1
*Released*: 22 January 2021
* fix server notification content html encoding
* allow setSelected to validate ids against dataregion

### version 1.16.0
*Released*: 18 January 2021
* add menu item active job icon
* add PipelineJobsPage
* add PipelineStatusDetailPage
* modify assay url resolver to work with Data.Run/RowId~eq=rowId
* add pipeline jobId to EntityInsertPanel and AssayUploadResultModel

### version 1.15.0
*Released*: 14 January 2021
* Item 8012: Row Selection Actions on Field Editor

### version 1.14.1
*Released*: 11 January 2021
* Enable async import for assay runs

### version 1.14.0
*Released*: 11 January 2021
* Add new Assay Picker. Used for selection of assay design types.

### version 1.13.0
*Released*: 8 January 2021
* Item 8141: AssayImportPanels updates to support file based assay scenario
    - add props to allow setting initial assay upload tab and hiding other tabs
    - add props to allow batch/run property QuerySelects to not show full preview options
    - fix so that date picker input field label shows asterisk when required
    - add beforeFinish prop to allow usages of AssayImportPanels to manipulate data before import/save

### version 1.12.2
*Released*: 7 January 2021
* Use consistent casing for 'returnUrl' parameter

### version 1.12.0
*Released*: 4 January 2021
* Wire up websocket and redux for server notifications

### version 1.11.3
*Released*: 30 December 2020
* Misc fixes for LKSM 21.01
  - Issue 41747: Add bottom margin to EditableGrid to prevent horizontal scroll bar from covering last row
  - Issue 42123: Assay import panels fix for dirty state being set on batch/run form init setValue calls
  - Fix for PageDetailHeader component left padding without icon

### version 1.11.2
*Released*: 24 December 2020
* Issue 42088: Don't send formatted date values when saving data

### version 1.11.1
*Released*: 22 December 2020
* Dependabot package updates

### version 1.11.0
*Released*: 22 December 2020
* Item 8267: Misc bug fixes related to LKSM workflow
    - FileAttachmentForm fix to use anchor tag with target blank for template file download
    - AssayImportSubMenuItem and getImportItemsForAssayDefinitions option to filter assays by provider type

### version 1.10.0
*Released*: 21 December 2020
* Remove `body` prop and update `iconComponent` prop to be of type `ReactNode`.
* Simplify `Overlay` target to use a React reference element in LabelHelpTip. Simplifies tracking and significantly reduces component footprint in test snapshots.
* `AssayPropertiesInput`, `DomainFieldLabel, and `SectionHeading` updated to reflect same change with `helpTipBody` now being of type `ReactNode`.
* Correctly pass props in `AddEntityButton`.

### version 1.9.0
*Released*: 16 December 2020
* Item 8226: Package updates to support packaging of LKSM workflow pages/components
    - Add AssayStateModel.getDefinitionsByType helper function
    - Add GENERAL_ASSAY_PROVIDER_NAME constant
    - Move ExpandFilterToggle and OptionsSelectToggle (renamed from ViewAsToggle) components from LKSM to shared components
    - Move withTimeout and getImmediateChildLineageFilterValue functions from LKSM to shared components

### version 1.8.0
*Released*: 15 December 2020
* Add optional Notifications icon and overlay in NavigationBar

### version 1.7.3
*Released*: 15 December 2020
* add allowAsync for EntityInsertPanel

### version 1.7.2
*Released*: 14 December 2020
* Issue #41419: Update RouteLeave to better manage form transition confirmations

### version 1.7.1
*Released*: 10 December 2020
* Update @labkey/api dependency

### version 1.7.0
*Released*: 7 December 2020
* Item 8203: Domain designer row styling updates
    - Remove grey background of drag handle area on the far left of the row
    - Move the expand/collapse icon to the left (next to the dnd handle) but keep the remove/delete icon on the far right
    - Remove margin/padding between rows (i.e. no spacing below each row), so that they look more like a table of rows
    - Remove box-shadow from rows and remove border radius (corners should be square now)
    - For rows that can be reordered, styling updates for the row being dragged so that it has blue border and box drop shadow that makes it “sit” above the other rows
    - Column titles/headings above the rows align with left side of the related inputs and those that are required have an * after the title

### version 1.6.0
*Released*: 6 December 2020
* Issue 41737: Storage actions do not respect filters on the grid
    - Add setSnapshotSelections utility function

### version 1.5.2
*Released*: 4 December 2020
* Remove check for experimental flag from isFreezerManagerEnabled

### version 1.5.1
*Released*: 30 November 2020
* Disable "Submit" button on DetailEditing when in the process of submitting
* Add some styling to hide text that overflows a field
* Fix bug in QueryInfo that did not add columns designated as addToDisplayView in all cases

### version 1.5.0
*Released*: 27 November 2020
* Item 8116: Make insertRows, updateRows, and deleteRows API success response consistent
    - make sure to include "rows" and "transactionAuditId" for each
    - minor display / layout fix for PageDetailHeader body content to flow better below image

### version 1.4.1
*Released*: 25 November 2020
* yarn run lint-fix on src/internal/components/domainproperties

### version 1.4.0
*Released*: 24 November 2020
* Item 8137: Misc package changes to support LKFM freezer hierarchy polish
    - export existing DomainFieldLabel for use in app
    - add new LockIcon components to package
    - add renderFieldLabel property to QueryFormInputs component and related input components

### version 1.3.0
*Released*: 23 November 2020
* Add SampleSetSummary and related components (SampleSetHeatMap, SampleSetCards, SampleSetDeleteModal and SampleEmptyAlert)
* Update HeatMap to use withQueryModels

### version 1.2.0
*Released*: 19 November 2020
* Merge forward changes from release20.11-SNAPSHOT branch
    - includes hotfix changes from version 0.104.1, 0.104.2, 0.104.3

### version 1.1.2
*Released*: 19 November 2020
* Sccs variable maintenance

### version 1.1.1
*Released*: 11 November 2020
* More error message resolution improvements, particularly for importing with EntityInsertPanel

### version 1.1.0
*Released*: 9 November 2020
* Item 7979: ToggleButton updates for use in LKFM storage unit CRUD

### version 1.0.0
*Released*: 3 November 2020
* First official stable release of the `@labkey/components` package. See [Public API Docs](../docs/public.md) for details.

### version 0.105.0
*Released*: 2 November 2020
* ImmutableJS-free `CreatedModified`.
* `resolveDetailFieldValue` updated to handle `Record` type. Typings improved.
* `FilesListingForm` and `WebDavFile` updates.

### version 0.104.3
*Released*: 17 Nov 2020
* [Issue 41854](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=41854): Wording updates for domain designer error dialog
* Server-side error messages fixes to be completed separately.

### version 0.104.2
*Released*: 17 Nov 2020
* Item 8058: Domain form support for new Ontology Lookup data type and expanded row input options

### version 0.104.1
*Released*: 10 Nov 2020
* [Issue 41460](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=41460): Support error handling for inaccurately inferred field types within List and Dataset designers.

### version 0.104.0
*Released*: 1 Nov 2020
* Item 7984: DomainForm component support for export/import field definitions from .json file

### version 0.103.2
*Released*: 30 October 2020
* Don't show status codes and possibly cryptic server-side errors to users.  Just don't.

### version 0.103.1
*Released*: 26 Oct 2020
* Issue 41621: Grid column fieldKey with special character wasn't being decoded when getting data for table cell

### version 0.103.0
*Released*: 23 Oct 2020
* Add `RequiresPermission` (formerly known in apps as `RequiresPermissionHOC`).
* Add `ServerContext` to allow retrieving up-to-date server context via React.Context.
* Remove `<PermissionAllowed/>` and `<PermissionNotAllowed/>` as they are no longer utilized.
* Unit tests for `RequiresPermission`.
* Add `mountWithServerContext` and `waitForLifecycle` test utility methods.

### version 0.102.1
*Released*: 23 Oct 2020
* Switch `IUserProps` to fully extend `UserWithPermissions`

### version 0.102.0
*Released*: 23 October 2020
* Add new application URL in App for managing storage units
* Add isDirty method to RouteLeaveInjectedProps
* Moved isIntegerInRange, isNonNegativeFloat, isNonNegativeInteger utility methods over from inventory

### version 0.101.4
*Released*: 22 Oct 2020
* Issue 41493: Allow appendToCurrentNode to work around page scroll issue

### version 0.101.3
*Released*: 22 Oct 2020
* Add showNotifications prop to Page.tsx
* Expose PageHeaderProps interface

### version 0.101.2
*Released*: 22 Oct 2020
* Issue 41068: GridPanel does not respect the hideEmptyChartSelector and hideEmptyViewSelector properties set in a
global query metadata override
* Renamed global settings 'hideEmptyViewSelector', 'hideEmptyChartSelector' to 'hideEmptyViewMenu', 'hideEmptyChartMenu'

### version 0.101.1
*Released*: 21 Oct 2020
* Make visual updates to FileTree.

### version 0.101.0
*Released*: 21 Oct 2020
* SampleTypeDesigner updates
    * add "Metric Unit" property to Sample Manager
    * add validateProperties prop to allow caller to validate sample domain properties before save
* Allow custom caption and placeholder text for fields in FieldEditorOverlay

### version 0.100.1
*Released*: 21 Oct 2020
* Issue 41574: Dataset designer file import column mapping fix for demographics dataset creation case

### version 0.100.0
*Released*: 20 Oct 2020
* DetailPanel/DetailPanelWithModel now take QueryConfig as a prop instead of QueryConfig & DetailDisplaySharedProps
* Add docs for DetailPanel and DetailPanelWithModel
* Add docs for naturalSort and naturalSortByProperty

### version 0.99.1
*Released*: 17 October 2020
* Update QueryModel.hasSelections to check selection count as well if array exists.

### version 0.99.0
*Released*: 14 October 2020
* Introduce new mechanisms for loading assay resources; `withAssayModels`, `withAssayModelsFromLocation` and `asayPage`.
* `withAssayModels` replaces implementation of `AssayProvider`.
* Added unit test coverage for `withAssayModels` and `withAssayModelsFromLocation`.
* Converted `AssayStateModel` and `AssayUploadResultModel` to Immer from ImmutableJS Records.
* Streamlined `AssayStateModel` to be more straightforward for getting and setting `AssayDefinitionModel`s.
* `<AssayImportSubMenuItem/>` switched to use `withAssayModels`.
* Add `isLoading` as a utility method for working with `LoadingState`.

### version 0.98.0
*Released*: 13 October 2020
* add optional transactionAuditId in InsertRowsResponse and as argument after file import
* add new replaceSelected method (for new action in QueryController)
* Fix styling of links in notifications

### version 0.97.0
*Released*: 29 September 2020
* FieldEditorOverlay updates
  * Allow user to choose the field of focus
  * Change input placeholder text to avoid some awkward grammar problems
* Freezer icon updates
  * Update menu icon
  * Update timeline storage update icon

### version 0.96.5
*Released*: 28 September 2020
* Fix for Bootstrap SCSS variable overrides.

### version 0.96.4
*Released*: 28 September 2020
* Update timeline icons for inventory events
* Update freezer menu icon

### version 0.96.3
*Released*: 28 September 2020
* Remove bootstrap scss variables copied straight over from bootstrap. Just have overrides.
* Don't look for audit queries in global variable as this relies on server context which isn't always present
* Don't try to resolve URLs if no URL mappers defined. Can use URLs directly from server
* Update labkey/api version

### version 0.96.2
*Released*: 27 September 2020
* Issue 41431: Misc test fixes on domain designer conditional format dialog and buttons

### version 0.96.1
*Released*: 24 September 2020
* Move components, query, renderers, utils, url, etc. to /src/internal
* Move QueryModel to /src/public
* Remove a few unused exports from the package index.ts file
* Update typedoc build configs regarding new /src dir structure

### version 0.96.0
*Released*: 23 September 2020
* Add AssayRunDeleteModal and AssayResultDeleteModal components
* Factor AssayRunDeleteConfirmModal and AssayResultDeleteConfirmModal into the above components

### version 0.95.0
*Released*: 22 September 2020
* Allow for custom root label for FileTree

### version 0.94.0
*Released*: 16 September 2020
* Add getDisambiguatedSelectInputOptions util

### version 0.93.0
*Released*: 16 September 2020
* Item 7840: Misc grid and detail form value styling fixes for 20.10
    * Issue 36941: Query Grid and details component multiline field does not render text as multi-line
    * Issue 40839: Copy theme/scss files to dist instead of compiling down to a single css file
    * Issue 39458: Add handleFileChange prop to FilesListingForm to track dirty state
    * RouteLeave HOC to be used in various app pages so they don't have to implement it themselves anymore

### version 0.92.2
*Released*: 14 September 2020
* Add optional verb property to EntityDeleteConfirmModal
* Add styling to DetailDisplay to preserve line breaks

### version 0.92.1
*Released*: 12 September 2020
* Allow filtered list of editable grid cell lookup values

### version 0.92.0
*Released*: 10 September 2020
* Update FieldEditTrigger
    * rename to FieldEditorOverlay
    * remove dependency on QueryGridModel and remove immutable List from interface
    * respect number input types

### version 0.91.6
*Released*: 9 September 2020
* Use QueryModel in query pages

### version 0.91.5
*Released*: 4 September 2020
* Updates to EditableGrid data processing functions to fix issues with boolean values

### version 0.91.4
*Released*: 3 September 2020
* Update TimelineView styling so comments retain white space
* In `withQueryModels`, set the loading selection state appropriately when clearing or setting selections

### version 0.91.3
*Released*: 3 September 2020
* Allow custom display value for Omnibox filter options

### version 0.91.2
*Released*: 2 September 2020
* Export FieldEditTrigger for use in applications

### version 0.91.1
*Released*: 1 September 2020
* Add class names to PageMenu, PageSizeMenu, PaginationButton, and Pagination components

### version 0.91.0
*Released*: 30 August 2020
* EditableGrid updates:
    * Support disabling rows using readonlyRows
    * Allow hiding row count column using hideCountCol
    * Allow row count column to use custom rowNumColumn instead of the static column
    * Add onCellModify prop
    * export updateEditorModel

### version 0.90.0
*Released*: 27 August 2020
* Add ability to show comments from metadata on timeline events.

### version 0.89.2
*Released*: 26 August 2020
* Merge 20.7-SNAPSHOT branch

### version 0.89.1
*Released*: 20 August 2020
* Bind URL parameters when adding QueryModels

### version 0.89.0
*Released*: 20 August 2020
* Adds support for a directory-only view of FileTree
* IFile interface now includes permissions data
* Allows for clearing out attached files from FileAttachmentContainer from parent component
* Adds button styling for a compact FileAttachmentContainer

### version 0.88.1
*Released*: 19 August 2020
* react-beautiful-dnd package update

### version 0.88.0
*Released*: 17 August 2020
* Add docs for QueryModel API to docs folder
* Change GridPanelWithModel props interface to take a single `QueryConfig` object instead of a `QueryConfigMap`.

### version 0.87.0
*Released*: 13 August 2020
* Add Label as optional export format and add optional onExport callback to export menu
* Refactor exportRows and export method for creating the export parameters
* Export test utility methods makeTestActions and makeTestQueryModel
* Export flattenValuesFromRow utility method

### version 0.86.0
*Released*: 12 August 2020
* Move Timeline related component and model from Sample Manager

### version 0.85.0
*Released*: 11 August 2020
* Refactor several components/classes to not depend on QueryGridModel
    * This allows them to more easily be used by QueryModel and QueryGridModel based components while we transition
    away from QueryGridModel
    * Affected Components: SelectionMenuItem, BulkUpdateModel
    * Affected Classes: EditableGridLoaderFromSelection
* Add EditableDetailPanel, the QueryModel version of DetailEditing
* DetailPanel: change queryColumns prop from List<QueryColumn> to QueryColumn[]
    * We are moving away from Immutable and want to limit how much of it is exposed in our API
* GridPanel: add new props buttonsComponentProps, and hideEmptyChartMenu
    * Use buttonsComponentProps to pass any additional props to your ButtonsComponent (model and actions still get
    passed to the ButtonsComponent)
    * Use hideEmptyChartMenu to hide the chart menu when no charts are available
* Move queryMetadata an columnRenderers out of ReactN global storage

### version 0.84.0
*Released*: 7 August 2020
* Updates most package dependencies to the latest version.
* Notable updates are:
    - `react 16.8.6 -> 16.13.1`. This brings us up-to-date with the latest version of React. For more details
    see https://reactjs.org/versions/.
    - `react-bootstrap 0.32.4 -> 0.33.1`. There have been several updates to the Bootstrap v3 supported variant of
    this library that are worth having. Namely, fixed support for `UNSAFE_componentWillMount`, etc.
* Switch to using `UNSAFE_` prefixed React lifecycle methods to silence warnings until we have time to convert these
usages to their counterpart methods.
* Switches our tests from using wrapped `setTimeout` with `done()` to async/await pattern. This is better supported by
more recent versions of Jest.
* Fix and add tests for `formatDate` and `formatDateTime` after SM exposed a bug in how the `moment-timezone` package
is imported.
* Switch all imports of `import React from 'reactn'` to `import ReactN from 'reactn'` to make it more obvious when the
library is used (for a component). Switch a couple of usages from `ReactN` to `React` where `reactn` wasn't needed.
* Removed superfluous usages of `enzyme-to-json` from many test cases.
* Removed superfluous `Immutable.Record` constructors.

### version 0.83.2
*Released*: 6 August 2020
* BulkUpdateForm to pass through readonly columns to EditableGrid

### version 0.83.1
*Released*: 6 August 2020
* BaseBarChart and processChartData updates to support per-bar fill color designations

### version 0.83.0
*Released*: 5 August 2020
* Fix bug in QueryModel.getColumnString when omittedColumns is present.
* Section component is now a PureComponent with css classes and more customizable styles
* Add UserProvider for getting a user and user properties onto a page
* Surface emptyText and showHeader properties of Grid through GridPanel
* Update to StorageStatusRenderer for different text representing "not in storage"
* Move BaseBarChart and utility method from sampleManagement

### version 0.82.2
*Released*: 4 August 2020
* Add headerCls prop to GridColumn
* Add useSmall prop to ColorIcon to show small sized icon
* Add setSelections and replaceSelections to QueryModel Actions
* Export cancelEvent method

### version 0.82.1
*Released*: 29 July 2020
* Fix sorts issue with QueryModel.urlQueryParams

### version 0.82.0
*Released*: 30 July 2020
* Add method for applications to register their URL Mappers so different applications can choose to route Server URLs differently.
* Add a productId property to ActionMapper so it can be used to construct a URL to a separate application.

### version 0.81.2
*Released*: 29 July 2020
* Add PaginationInfo component

### version 0.81.1
*Released*: 29 July 2020
* Merge forward changes from release20.7-SNAPSHOT branch
    - includes hotfix changes from version 0.71.3

### version 0.81.0
*Released*: 28 July 2020
* Add runDetailsColumnsForQueryModel - convenience method for calculating the columns needed for an assay run details
page, adapted from getRunDetailsQueryColumns.

### version 0.80.1
*Released*: 27 July 2020
* Audit and schema browser component linting and misc cleanup after move from Sample Manager app

### version 0.80.0
*Released*: 24 July 2020
* Add support for parameterized queries when getting and setting selections on a grid
* Export getSelectedData method

### version 0.79.0
*Released*: 23 July 2020
* Implement URL Binding for QueryModel/withQueryModels
    * For this feature to work your usage of withQueryModels must be a child of a configured React Router (see
    packages/components/src/stories/QueryModel.tsx for an example)
* QueryModel: charts has been changed from IDataViewInfo to DataViewInfo
    * QueryModelLoader has been updated to support this
* Fixed an issue in DefaultQueryModelLoader where loadCharts was returning unsupported charts.
* QueryModel: Added fields
    * bindURL
    * selectedReportId
* QueryModel: Added urlQueryParams, attributesForURLQueryParams, and hasRows getters
* QueryModel: Default to Details View if keyValue is set
* Removed unused getter methods from DataViewInfo
* Added toString() to SchemaQuery class
* Added (and exported) DetailPanel component
    - Same as DetailPanelWithModel except it is not wrapped in withQueryModels
* DetailPanelWithModel: changed props signature. Props are now `QueryConfig & DetailDisplaySharedProps`

### version 0.78.3
*Released*: 22 July 2020
* AppModel: initialUserId set from `User` model instead of directly from `getServerContext()`.

### version 0.78.2
*Released*: 20 July 2020
* EntityInsertPanel: Ability to filter Sample Type Options without filtering Parent Options
* EntityInsertPanel: Option to combine all parent entity types into one button and one select input

### version 0.78.1
*Released*: 20 July 2020
* Support custom gridColumnRenderer for AuditDetails

### version 0.78.0
*Released*: 16 July 2020
* Item 7563: SampleTypeDesigner update to add "Label Color" property to Sample Manager
    - ColorPickerInput updates to support showing color chip within dropdown button when label text not provided
    - ColorPickerInput update to handle value=#ffffff (display as white background with black border)
    - SampleTypePropertiesPanel addition of ColorPickerInput, conditional based on appPropertiesOnly prop
    - SampleTypeModel addition of labelColor prop
    - Add ColorIcon display component and LabelColorRenderer to use in Sample Manager and Freezer Manager

### version 0.77.0
*Released*: 15 July 2020
* Update URLResolvers to handle URLs that may go to a separate application
* Add StorageStatusRenderer for showing the storage status of a sample

### version 0.76.0
*Released*: 14 July 2020
* Updates FileTree to support new Module Editor functionality.

### version 0.75.0
*Released*: 9 July 2020
* [Issue 36916](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=36916): Remove `toLowerCase()` when constructing `AppURL`s base parts.
* No longer export `<NavItem/>` as it is always utilized by `<SubNav/>`.
* Update `react-router` and `@types/react-router` to latest v3.x versions.

### version 0.74.0
*Released*: 8 July 2020
* Item 7458: Move shared application models, actions, etc. for Sample Manager and Freezer Manager
    - export all of the new application related items as a single "App" item
    - includes moving of AppModel, some reducers (product and routing), and related functions and constants
    - move AuditLog related components, models, actions, and utils from Sample Manager
    - move SchemaListingPage, QueriesListingPage, QueryListingPage, and QueryDetailPage from Sample Manager
    - move app scss assets from Sample Manager, and have them copied into dist/assets/scss for module app usage
    - ExpandableContainer component prop to only allow expand/collapse via icon instead of header click

### version 0.73.1
*Released*: 2 July 2020
* Adjust LookupSelectInput to protect against loading the options more than once

### version 0.73.0
*Released*: 1 July 2020
* Item 7458: Update Sample Manager and Freezer Manager app product menus to respect isSampleManagerEnabled
    - ProductMenuModel update to add property for userMenuProductId
    - MenuItemModel.create update to use menu section productId in user menu URLs
    - rename createApplicationUrl -> createProductUrlFromParts, and add new implementation for createProductUrl

### version 0.72.0
*Released*: 1 July 2020
* Add ColorPickerInput

### version 0.71.4
*Released*: 26 August 2020
* Issue 38711: Biologics: when uploading assay data from an assay request, assay request ID isn't maintained

### version 0.71.3
*Released*: 8 July 2020
* Issue 40795: Query metadata editor should allow editing type of field in built in table

### version 0.71.2
*Released*: 30 June 2020
* Update EntityInsertPanel to only show import tab
* Simplify showImportDataButton and showInsertNewButton

### version 0.71.1
*Released*: 29 June 2020
* Issue 40729: Renaming, Sample Set to Sample Type: SampleSet in parent aliases
* Issue 40734: Renaming, Sample Set to Sample Type: SampleSet in DataClass
* Add URLResolver mapping for experiment-showSampleType.view
* Migrate deleteMaterialSource.api → deleteSampleTypes.api
* Migrate getSampleSetApi.api → getSampleTypeApi.api

### version 0.71.0
*Released*: 29 June 2020
* Refactor Pagination to be generic (no longer coupled to QueryModel)
* Export Pagination component and PaginationData interface

### version 0.70.6
*Released*: 29 June 2020
* Add `initModelOnMount` prop to `QueryGridModel`. Defaults to `true` so the behavior is unchanged for all current usages.

### version 0.70.5
*Released*: 26 June 2020
* Issue 40591: Query metadata editor should allow editing type of field in user defined query
* Add disableNameInput in IDomainFormDisplayOptions

### version 0.70.4
*Released*: 25 June 2020
* Issue 39263 - PermissionAssignments.tsx update to include display of root assignments in Effective Roles listing

### version 0.70.3
*Released*: 24 June 2020
* Issue 40555: QC state conditional formats work but are not viewable/editable in Query Metadata editor
* Filters - decode correct part of Filter string

### version 0.70.2
*Released*: 23 June 2020
* Expose createApplicationUrl utility method

### version 0.70.1
*Released*: 23 June 2020
* correct QueryModelLoader queryParameters to parameters
* add onClick prop for ExpandableContainer

## version 0.70.0
*Released*: 19 June 2020
* Item 7417: BasePropertiesPanel - add to index.ts for use in Freezer Manager app
* QueryInfo - add getColumnFieldKeys helper method to get fieldKeys for select columns
* QueryModel - add parameter to getRow method to allow for a flattened key/value pair response object

### version 0.69.5
*Released*: 15 June 2020
* Issue 39947 - Omnibox doesn't show sorts or views when URLPrefix is used

### version 0.69.4
*Released*: 15 June 2020
* Item 7417: QueryModel - add getRow() helper for getting first row of QueryModel.rows object

### version 0.69.3
*Released*: 11 June 2020
* Expose QueryConfig type

### version 0.69.2
*Released*: 10 June 2020
* Issue 39206: OmniBox should not restrict results with filters against target column

### version 0.69.1
*Released*: 10 June 2020
* Issue 39468: QueryGridPanel button bar / paging component layout fixes for narrow windows
* Issue 39935: List designer fields icon help text should mention the need for a Key Field Name selection
* Issue 39934: DomainForm field type text update from "Decimal" to "Decimal (floating point)"
* Issue 40262: List designer titleColumn (default display field) update when the name or row index of selected field is updated in domain fields panel

## version 0.69.0
*Released*: 9 June 2020
* Improve search experience
- Move search results filtering and cardData processing from SearchResultsPanel to searchUsingIndex action.
- Added emptyResultDisplay, hideHeader and hidePanelFrame props to SearchResultsPanel
- Add useEmail to UserSelectInput

### version 0.68.0
*Released*: 9 June 2020
* Remove `IUser` interface in favor of direct use of `@labkey/api` `User` and `UserWithPermissions` interfaces.
* `PermissionsType` enum migrated to `@labkey/api`.

### version 0.67.2
*Released*: 8 June 2020
* Add `naturalSortByProperty<T>(property: string)`
* `naturalSort` is now typed to accept any, which was always the case, so this is backwards compatible

### version 0.67.1
*Released*: 8 June 2020
* Issue 40541: Dataset Designer/Field Editor tooltip and help link fixes

## version 0.67.0
*Released*: 8 June 2020
* Support handling of multiple applications in product menu
  - Update type parameter for getting product menu to List of productIds instead of productId
  - Update MenuItemModel to account for linking to a different application (based on productId)
  - Add utility method for getting application URL based on productIds
  - Modify menu models to carry through productIds

### version 0.66.0
*Released*: 5 June 2020
* Item 7373: Move InsufficientPermissionsPage and BasePermissionsCheckPage from Sample Manager
* Update `@labkey/api` dependency to `v0.3.1`.

### version 0.65.2
*Released*: 4 June 2020
* Support for multi-value columns in bulk and grid updates.

### version 0.65.1
*Released*: 4 June 2020
* Update `@labkey/api` dependency to `v0.3.0`.

### version 0.65.0
*Released*: 2 June 2020
* FileTree component
    - add prop to remove checkbox selection option from node display
    - support font awesome icon display for file based on WebDav iconFontCls data
    - call the onFileSelect callback function on node select for non-checkbox case
    - make the arrow toggle smaller
* WebDav model updates for module editor browser scenario
    - add contentType and options properties to model
    - add param to getWebDavFiles for the non-@files case

## version 0.64.3
*Released*: 2 June 2020
* Item 7373: Move base user permission check helpers from Sample Manager to User model
* Fix for NavigationBar.tsx to not show the search icon in the narrow window case when showSearchBox is false

## version 0.64.2
*Released*: 1 June 2020
* `<PageDetailHeader/>` no longer requires `user` prop. Remove unused `content` prop.

## version 0.64.1
*Released*: 1 June 2020
* Issue 40026: Change doc link from Advanced List Settings popup - Update text and topic for Advance Settings help link

## version 0.64.0
*Released*: 29 May 2020
* Merge AssayReimportRunButton from Biologics and SampleManager and move here for common use
* Add isGPAT utility method to AssayProtocol model
* Move getRunDetailsQueryColumns from SampleManager
* Check for null or undefined value in initSelect for QuerySelect

### version 0.63.3
*Released*: 27 May 2020
* Issue 40008: Allow override of heading shown on LineageSummary panel for the Parents and Children of a node
(e.g., to show "Source" instead of "Parent")

### version 0.63.2
*Released*: 27 May 2020
* Issue39819: Make stylistic changes in a text field's Text Options

### version 0.63.1
*Released*: 26 May 2020
* Misc domain designer fixes for 20.7
    - Issue 40286: Domain designer panel header does not scroll to top of page
    - Issue 40447: Fix error message when selecting 3rd setting of Data Row Uniqueness in dataset designer
    - Issue 40149: Sample Type Designer - Not properly validating error state on parent alias
    - Issue 38399: Domain Designer doesn't show error message when field of type lookup is missing required properties
    - Issue 38929: Domain designer lookups fail validation immediately instead of waiting for user input

### version 0.63.0
*Released*: 22 May 2020
* Issue 40347: Domain designer wrappers not supporting domain kind specific properties in the create case
    - Update to @labkey/api version with Domain.getDomainDetails support for domainKind param
    - Allow for calls to Domain.getDomainDetails to pass in a domainKind param to get domain kind specific properties
    - Remove getListProperties and getDatasetProperties from index.ts as those are internal only now

## version 0.62.0
*Released*: 21 May 2020
* Move AssayProvider from SampleManager to ui-components
* Remove redundant importGeneralAssayRun method (in favor of importAssayRun)

## version 0.61.0
*Released*: 20 May 2020
* Add Chart Menu to GridPanel
* Add View Menu to GridPanel
* Add Export Menu to GridPanel
* Implement Selections in GridPanel
    * Mock.tsx now implements a mock version of our selection API, which uses browser localStorage to store selections.
* Add Omnibox to GridPanel
* Refactor OmniBox to support GridPanel and QueryGridPanel
    * OmniBox and Actions are no longer aware of QueryGridModel, this way they can be used by QueryGridPanel and
    GridPanel.
    * OmniBox now has a `mergeValues` flag, when false it emits more granular change events, and does not merge
    ActionValues (needed by GridPanel). Defaults to true, which was previous behavior.
    * OmniBox no longer emits a change event when the user cancels an action change, or enters an invalid action.
    * Actions now add a `valueObject` during `completeAction` so consumers don't need to parse string values, used by
    GridPanel.
* Add `showButtonBar` and `title` props to GridPanel
* Enabled Maps, Sets, and Patches in Immer
* Refactored the GridPanel tests to not use snapshotting
* Add another view to sample mixtures data.
* Remove IQueryModel interface, it was not necessary
* Remove getOrDefault, not necessary with nullish coalescing

### version 0.60.0
*Released*: 20 May 2020
* Item 6646: IssuesListDefDesignerPanels fix for shared domain scenario
    - Add helpers to DomainDesign model to getDomainContainer() and isSharedDomain()
    - Allow for a shared def to be used in another container where only the top level properties can be saved via saveIssueListDefOptions
    - Show alert if the current container is using a shared domain with link to get to source container
    - Disable field re-order and add field for a shared domain (read only display)

### version 0.59.3
*Released*: 18 May 2020
* Item 7207: DatasetColumnMappingPanel fix to allow for numeric and text fields to be used for timepoint/visit column mapping
    - Fix for StudyScheduleTest use case which uses the text visit values instead of Sequence Num during import

### version 0.59.2
*Released*: 16 May 2020
* Lineage: improve caching, allow non-default distance

### version 0.59.1
*Released*: 15 May 2020
* Merge forward changes from release20.5-SNAPSHOT branch
    - includes hotfix changes from version 0.55.1

## version 0.59.0
*Released*: 14 May 2020
* Epic 6800:  Issue Definition designer (Story 3)- Issues module implementation
- Usage of new issues api actions to getProjectGroups and to getUsersForGroup and refactoring around this change.
- Removal of selectQuery methods that were getting Groups and Users.
- Re-purpose permission's Principal model, and remove UserGroup model.

## version 0.58.0
*Released*: 13 May 2020
* Item 7205: Includes support for column mappings for fields during import data in new Dataset Designer

### version 0.57.0
*Released*: 8 May 2020
* Item 7178: Factored EntityDeleteModal (and associated functions) out of Sample Manager into labkey-ui-components for use in Biologics.

## version 0.56.3
*Released*: 7 May 2020
* Changes for DomainFormDisplayOptions from show to hide for default cases
* Issue 40032: PHI Levels not disabled in new query metadata editor

### version 0.56.2
*Released*: 6 May 2020
* Epic 6800: Issue Definition designer (Story 1)-  IssuesPropertyPanel and IssuesListDesignerPanels
    -  Addition of Issues List Definition Designer Panel and Properties Panel components.
    -  Setting up the initial stage to transform old GWT Issues designer to React-based designer.

## version 0.56.1
*Released*: 1 May 2020
* DataClassModel convert from Record to immerable
* Update usages of DataClassModel in DataClassDesigner to use produce() for model updates
* Update DataClassDesigner setState to use produce()
* Revert change to default value for DomainDesign allowFileLinkProperties and allowAttachmentProperties

## version 0.56.0
*Released*: 1 May 2020
* Item 7180: Lineage: improved node details, withLineage
    - `LineageGraph` supports additional details from `experiment-lineage.api`.
    - `withLineage` HOC for managing lineage state.
    - See https://github.com/LabKey/labkey-ui-components/pull/237 for more details.

### version 0.55.1
*Released*: 6 May 2020
* `@labkey/api` dependency update.
* allow using separate singleFilterValue for createQueryGridModelFilteredBySample

## version 0.55.0
*Released*: 30 April 2020
* Issue 39633: Choosing to cancel navigating away from a page when using react-router's setRouteLeaveHook will leave
you on the page but the URL will have been updated to the page where you had originally intended to go, which means
using that link again from the starting page will not work.
* Issue 38002: Set isSubmitting to false after updateRows in EditableGridPanelForUpdate in case you stay on the page after updating
* Update resolveErrorMessage to strip off java.lang.IllegalArgumentException prefixes and detect "Bad SQL grammar" exceptions.
* Partial fix for Issue 40008: Add optional property to LineageSummary to allow customization of the lineage group headings in the summary panel
* in SingleParentEntityPanel, use paged query model for better performance

### version 0.54.1
*Released*: 29 April 2020
* Issue 38052: When all fields in a QueryInfoForm are disabled, the submit button should also be disabled

### version 0.54.0
*Released*: 29 April 2020
* Item 7138: DatasetDesignerPanels and related components, models, actions
    - new dataset related components DatasetDesignerPanels.tsx and DatasetPropertiesPanel.tsx
    - DomainForm changes to support Column mapping option
* Issue 40285: Domain designer screen width expands as the file preview grid table width gets very large

### version 0.53.0
*Released*: 28 April 2020
* [Issue 34627: Lookup column is sorting by raw value and not display column](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=34627)
    * This fix changes the behavior of the sort action on the OmniBox, columns are now sorted by displayValue
* [Issue 36486: omnibox only shows options on drop-down for current page](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=36486)
    * This fix changes the behavior of the Filter dropdown on the Omnibox, we now show distinct values for a column.
* [Issue 40195: Omnibox filter value invalid if user enters multiple words](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=40195)
* [Issue 39543: Omnibox dropdown does not allow other open menus to close](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=39543)

### version 0.52.2
*Released*: 24 April 2020
* Misc 20.5 issue fixes for Sample Manager
    - Issue 40139: DetailEditing panel editing - updating time but not date does not recognize change
    - Issue 39328: Assay run should use renamed file name as its Assay Id when the same data file is being imported (for both re-import case and new import case)
    - Issue 40233: EntityInsertPanel columns for Sources should not include "Parents" in column name caption
    - DetailEditing panel (i.e. QueryForm usage) boolean field checked state doesn't initialize correctly when formattedValue exists

### version 0.52.1
*Released*: 20 April 2020
* `@labkey/api` dependency update.

## version 0.52.0
*Released*: 18 April 2020
* Item 7178: Prettier/ESLint bulk update
    - Initial Prettier/ESLint bulk update across packages/components/src directory.
    - yarn run lint-fix ./src/\*\*/\*

## version 0.51.0
*Released*: 17 April 2020
* Item 6961: DataClassDesigner updates for LKS
    - update fetchDataClass function to work for either a data class name or rowId
    - add support for PermissionTypes.DesignDataClass
    - DataClassPropertiesPanel and SampleTypePropertiesPanel default nameExpressionInfoUrl and nameExpressionPlaceholder properties
    - SampleTypeDesigner change to default to "Infer from File" in empty fields state
    - Issue 40232: Boolean fields show empty "Validation Options" section in expanded field design view

## version 0.50.0
*Released#: 16 April 2020
* Add optional property for specifying auditBehavior with some API actions

### version 0.49.1
*Released*: 16 April 2020
* Merge forward changes from release20.4-SNAPSHOT branch
    - includes hotfix changes from version 0.41.6

## version 0.49.0
*Released*: 15 April 2020
* `@labkey/api` dependency update.
* Incorporate changes needed due to stricter typings.

## version 0.48.3
*Released*: 14 April 2020
* Bug fixes for ParentEntityEditPanel to better support editing of parent samples
* Issue 40148: Don't reinitialize EntityInsertPanel if location or entityModelType are not changing

### version 0.48.2
*Released*: 13 April 2020
* Item 7124: Add helpTopic property with default value to DataClassDesigner

### version 0.48.1
*Released*: 12 April 2020
* Issue 40106: Correcting booleans for properties' states in Advanced Settings dialog of Domain designer

### version 0.48.0
*Released*: 8 April 2020
* Export DateInput, FileInput, TextInput and TextAreaInput
* Export QueryFormInputs and associated helper functions
* Export detail renderer helper functions
* Export FieldEditInput form and props

### version 0.47.0
*Released*: 7 April 2020
* `@labkey/api` dependency update.

### version 0.46.0
*Released*: 7 April 2020
* Add QueryModel model to replace QueryGridModel
    - Also added IQueryModel interface
* Add QueryModelLoader interface and DefaultQueryModelLoader
* Add withQueryModels HOC for managing model state
* Add GridPanel to replace QueryGridPanel
    - GridPanel takes a QueryModel as a prop
    - Also provided GridPanelWithModel which takes a QueryConfig and manages a model like QueryGridPanel does
* Move QueryInfo to its own file
* Remove Column class, replaced with GridColumn
    - GridColumn originally just extended Column but added no functionality
    - Has no affect on exports since we only ever exported GridColumn
* Added a delay to mocks when running in Storybook
* Emulate LabKey Server error messages for invalid schema/query names in getQueryDetails

### version 0.45.0
*Released*: 6 April 2020
* Item 6642: Initial dataset designer properties panel
    - Top level dataset properties without the domain

### version 0.44.0
*Released*: 3 April 2020
* Item 6937: Lineage components updates
    - See https://github.com/LabKey/labkey-ui-components/pull/205

### version 0.43.0
*Released*: 3 April 2020
* Modify SearchPages for display of data classes and to allow more customization of how search result cards are displayed

## version 0.42.1
*Released*: 31 March 2020
* Item 7031: Source aliasing
    - Allow Source (Data Class) Alias to be defined separate from a SampleSet type Parent Alias
    - Allow filtering of parent options (for example, only 'sources' type data classes will be included)

### version 0.41.6
*Released*: 8 April 2020
* Issue 39803: signOut action support for a redirectUrl in the response, for the CAS identity provider logout case

### version 0.41.5
*Released*: 1 April 2020
* SiteUsersGridPanel and UserDetails panel prop to hide/show 'Reset Password' button (i.e. allowResetPassword)
* NavigationBar optional property for an alternate url to go to after sign out

### version 0.41.3
*Released*: 30 March 2020
* Issue 40084: Add property to exclude unique field key from bulk update modal
* Update QueryInfoForm so the submit button is disabled while submitting
* Issue 40088: DataClassDesigner - add optional validation check for a reserved name field (i.e. "SourceId" in SM app)

### version 0.41.2
*Released*: 30 March 2020
* Update canSubmit check for ParentEntityEditPanel to check for actual differences and allow submission when all parents have been removed

### version 0.41.1
*Released*: 29 March 2020
* Item 6862: Switch LineageNode to bind "id" instead of "rowId"

## version 0.41.0
*Released*: 27 March 2020
* Item 7002: Refactor domain designer components to share more with base components
    - BasePropertiesPanel, SectionHeading, withDomainPropertiesPanelCollapse (instead of DomainPropertiesPanelContext)
    - BaseDomainDesigner component and withBaseDomainDesigner HOC
    - DomainFieldLabel component for domain designer field input consistency
    - Domain designers updates for consistent handling of isValid state and error display
    - Issue 39938: Domain field fix to revert back to max Integer length if user input is larger then 4000

## version 0.40.0
*Released*: 27 March 2020
* Remove SampleSetResolver for app URLs
    - URL mappers updated use /samples/<sampleSetName> or /rd/samples/<rowId>

## version 0.39.4
*Released*: 24 March 2020
* Issue 39968: Cannot update assay result field to "All Samples"

### version 0.39.3
*Released*: 24 March 2020
* Issue 39911: EditableGrid issue with pasting values into a cell that has a lookup that is not public

### version 0.39.2
*Released*: 23 March 2020
* Dependency version updates

### version 0.39.1
*Released*: 23 March 2020
* Run Builder related fixes
    - Bug fix in file tree to make loading and empty placeholders not selectable when cascading a selection.
    - File tree style update for checkboxes.
    - Opt out of export button on QueryGridBar.

### version 0.39.0
*Released*: 20 March 2020
* Item 6835: Data Class designer updates for use in Sample Manager
    - add fetchDataClass function for call to Domain.getDomainDetails and resolve as DataClassModel
    - use saveDomain function in DataClassDesigner for create and update
    - add Category select input for DataClassPropertiesPanel (for appPropertiesOnly)
    - refactor SampleSetDeleteConfirmModal as EntityTypeDeleteConfirm model for use with sample type and source type
    - refactor deleteSampleSet as deleteEntityType for use with sample type and source type
    - add BeforeUnload.tsx HOC

### version 0.38.1
*Released*: 20 March 2020
* Issue 39913: Switch from dismissCoreWarnings.api to dismissWarnings.api

## version 0.38.0
*Released*: 19 March 2020
* Add ParentEntityEditPanel for CRUD operations on parents. Initially not supporting delete
(because there is no back end support for completely removing lineage).
* Fix problem with QuerySelect and SelectInput not playing nicely together when you want to
select a schema for the QuerySelect to use.
* Refine and simplify styling for buttons on DetailEditing to work with sibling panels that sit below it
* When invalidating the grid, don't call clearSelected if model does not allow selections
* Issue 39307: Call onChange and loadOptions after model has been updated so changed selection is taken into account.
* Issue 39863: Use POST instead of GET when getting delete confirmation data

### version 0.37.0
*Released*: 19 March 2020
* Item 6848: Merge Sample Type creation/update UI into single designer component.

### version 0.36.0
*Released*: 19 March 2020
* 39867: ErrorBoundary HoC, ErrorPage to display uncaught React exceptions

### version 0.35.3
*Released*: 18 March 2020
* add highlightLastSelectedRow to QueryGridPanel

### version 0.35.2
*Released*: 17 March 2020
* QueriesListing fix for display error message when schema does not exist

### version 0.35.1
*Released*: 16 March 2020
* Enhance createQueryGridModelFilteredBySample
    - Allow using lsid instead of rowid for createQueryGridModelFilteredBySample
    - Allow omit sample columns in generated model
    - Get all sample columns instead of one sample column per domain type

### version 0.35.0
*Released*: 16 March 2020
* Item 6803: Added support for Query Metadata Editor and added DomainFormProp - domainFormDisplayOptions to show/hide DomainForm components

### version 0.34.1
*Released*: 16 March 2020
* Merge forward changes from release20.3-SNAPSHOT branch
    - includes hotfix changes from version 0.31.4

### version 0.34.0
*Released*: 11 March 2020
* Use Query.ContainerFilter enum as provided by @labkey/api

### version 0.33.3
*Released*: 10 March 2020
* Issue 39817: Don't show RegEx validator options for non-string fields

### version 0.33.2
*Released*: 10 March 2020
* Issue 39818: List designer PK fields should be shown as Required upon load

### version 0.33.1
*Released*: 10 March 2020
* Issue 39819: List designer
    - Changed spacing between
    - Phrasing update, "Create Range Validator" => "Create Range Expression Validator"
    - Updated caret and checkbox expand + collapse behavior for Advanced Settings' Search Indexing Options
    - Phrasing update, "Field used for display title" => "Default display field"
    - Phrasing update, "Discussion links" => "Discussion Threads"
    - Change color for string field options' "Unlimited" and "No longer than X characters" options so that they don't look disabled.
    - Use title-case for Advanced List Settings' titles instead of sentence-case
* Issue 39877: List designer: max text length options should not be visible for text key field of list

### version 0.33.0
*Released*: 5 March 2020
* Issue 38221: Sample Manager: encoding issues at various places
* Issue 38907: ui-components applications cannot handle assay names with periods
* Issue 39461: Editing a date field in a sample does not show a date picker

### version 0.32.0
*Released*: 3 March 2020
* Fix issue 39085
    - factored out "fetchSamples" from "loadSelectedSamples" to allow for fetching and and transformation independent of getting selection

### version 0.31.4
*Released*: 6 March 2020
* Fixes for List Designer issues targeting LabKey release 20.3
    - Issue 39846: List designer - "Name" doesn't validate immediately
    - Issue 39879: Domain designer - lookup queries which only have container PK are filtered out of the select input

### version 0.31.3
*Released*: 28 February 2020
* Fix for Sample Manager QueryGridModel use case that passes in undefined as baseFilters
    - make sure baseFilters is defined before doing a concat with the rest of the filters

### version 0.31.2
*Released* 28 February 2020
* Fix issue 38668
    * We now pass the display column value of lookups to QuerySelect in QueryFormInputs

### version 0.31.1
*Released*: 27 February 2020
* Issue 39813: Metadata settings in new Designer don't align with old Designer
    - Resolved bug in List Designer's indexing settings.

### version 0.31.0
*Released*: 27 February 2020
* Item 6798: ListDesignerPanels and related components, models, actions
    - new list related components ListDesignerPanels.tsx and ListPropertiesPanel.tsx
    - DomainForm changes to support an "Import Data" option when using a file to infer fields for the domain (see ImportDataFilePreview.tsx)
    - DomainRow changs to support locking the "primary key" field data type and required inputs
    - move assay related actions to domainproperties/assay/actions.ts file

### version 0.30.0
*Released*: 27 February 2020
* Bump @labkey/api to 0.0.35

### version 0.29.0
*Released*: 26 February 2020
* Issue 37776: updateUrl in custom assay does not get used in Biologics UI
* Added two new attributes to QueryGridModel
    * includeDetailsColumn
    * includeUpdateColumn
    * simplify getStateQueryGridModel
    * remove IStateModelProps interface used by getStateQueryGridModel

### version 0.28.3
*Released*: 26 February 2020
* Bump @labkey/api dependency to 0.0.34

### version 0.28.2
*Released*: 25 February 2020
* Issue 39788: Responses that have exceptions but not errors not showing messages in the UI

### version 0.28.1
*Released*: 25 February 2020
* Use dataclass category field for choosing the icon to display for search results
* Remove iconURL workaround and rely on server side QueryIconURLProvider instead

### version 0.28.0
*Released*: 24 February 2020
* Add support to the assay designer for integrating plate metadata.

### version 0.27.0
*Released*: 24 February 2020
* Re-parameterize and rename SampleInsertPanel to EntityInsertPanel for use with Data classes as well
* Add disabled and title optional properties for AddEntityButton
* Issue 39765: for viewing replaced assay runs, we need to use the baseFilter on the "Replaced" column

### version 0.26.0
*Released*: 21 February 2020
* Add lint configurations
* Add File tree component and webdav helpers that can be used to view and select files on the server

### version 0.25.2
*Released*: 19 February 2020
* Add addToDisplayView to QueryColumn to allow defining additional display columns

### version 0.25.1
*Released*: 19 February 2020
* Fix Issue 39719
    * No longer apply any base filters if a QueryGridModel has a keyValue and the view name is \~\~DETAILS\~\~

### version 0.25.0
*Released*: 18 February 2020
* Item 6835: Changes to support Data Class Designer in Sample Manager and LKS
    - Factor out EntityDetailsForm.tsx from SampleSetDetailsPanel.tsx
    - Factor out DomainPropertiesPanelContext.tsx and CollapsiblePanelHeader.tsx for reuse and put back into AssayPropertiesPanel.tsx and DomainForm.tsx
    - DataClassDesigner.tsx and DataClassPropertiesPanel.tsx
    - Move AssayProtocolModel to domainproperties/assay/models.tsx

### version 0.24.0
*Released*: 13 February 2020
* Issue 39529: Make reset view in lineage graph operational
* Use URLResolver for resolving links returned from lineage query
* Rename and re-parameterize SampleDeleteConfirmModal to EntityDeleteConfirmModal (and move to entities instead of samples) for reuse with data class objects
* Issue 39252: Show initial seed node details on lineage panel while lineage is loading.

### version 0.23.3
*Released*: 11 February 2020
* Issue 39524: User management: Creating new user grid filter from notification is incorrect if user already exists and is disabled
* Issue 39501: Permissions management: Handle case where the security policy for a container is inheriting from the parent container
* Issue 39616: Update domain field warning message regarding special characters

### version 0.23.2
*Released*: 8 February 2020
* Use DatePickerInput for DetailEdit
* Add advancedExportOption to QueryGridPanel

### version 0.23.1
*Released*: 6 February 2020
* Issue 39341: Fix for specimen designer usage of data types that aren't supported for new domain field creation

### version 0.23.0
*Released*: 3 February 2020
* Issue 39193: Fix for conditional format dialog to respect filter types allowed for date field type
* Issue 21401: Fix for conditional formatting filter string URL encoding issue
* Issue 39528: Change Assay designer results text should for option to define fields manually
* Move “remove field” to field top display (so it will show in collapsed and expanded view)
* Only show "Confirm Remove Field" dialog for previously saved fields
* Field row icons, drag handle and expand icon, only highlight on hover of icon instead of row hover
* Fix for Domain Designer duplicate field input ids for assay designer case (results in warnings in browser for LKS pages)
* Issue 39603: Domain warning message with a field name containing invalid characters goes out of the "normal" range

### version 0.22.1
*Released*: 3 February 2020
* Issue 38012: For the Batch Update Dialog a field should be cleared if it is changed to disabled

### version 0.22.0
*Released*: 30 January 2020
* Issue 39558: Adjust styling of import tabs to better indicate they are actionable.
* Issue 39551: Use tooltip on sampleId column to provide text about the use of generated ids or not
* Issue 39559: Reorder add row controls for better left-to-right flow and remove tool tip
* Better error messaging when only 1 additional row is allowed for bulk insert
* Issue 39554: Parameterized name expression placeholder text

### version 0.21.2
*Released*: 29 January 2020
* Add backspaceRemoves and deleteRemoves props to SelectInput

### version 0.21.1
*Released*: 29 January 2020
* Added support for smaller version of FileAttachmentForm

### version 0.21.0
*Released*: 24 January 2020
* Item 6654: Changes to include server side warnings while saving domain

### version 0.20.0
*Released*: 23 January 2020
* Add utility method resolveErrorMessage that can be used to extract a string error message from API responses and convert some
messages that are not very friendly for users into better text.

### version 0.19.0
*Released*: 22 January 2020
* Assay import editable grid button changes to match sample create (for bulk insert, update, remove, add)
* Issue 39182: Disabled "Assay Data" create menu item tool-top doesn't go away
* Fix for Domain designer field focus jumps after moving a field row

### version 0.18.2
*Released*: 22 January 2020
* Make EditableGrid.validateData case insensitive and trim key values prior to comparison

### version 0.18.1
*Released*: 22 January 2020
* Hide the ViewAction on the omnibox when there are no non-default views
* Hide the ViewAction on the omnibox when QueryModel.showViewSelector is false

### version 0.18.0
*Released*: 22 January 2020
* Add optional callback for SampleInsertPanel when data changes to help in detecting dirty state.
* Add optional callback for AssayImportPanels when data changes to help in detecting dirty state.

### version 0.17.0
*Released*: 21 January 2020
* EditableGrid cell render optimization
    - prevent unnecessary re-render of all cells when one is edited/selected/etc.
    - move reactn global state connection to EditableGrid and make Cell components PureComponents
    - update to reactn version 2.2.4

### version 0.16.2
*Released*: 21 January 2020
* Item 6759: Use Query.getServerDate() for CreatedModified.tsx component (fixes timezone issue)
    * Includes update of @labkey/api to version 0.0.31

### version 0.16.1
*Released*: 21 January 2020
* Misc button text updates for Sample Manager (prefer 'Save' and 'Import' over 'Finish')

### version 0.16.0
*Released*: 20 January 2020
* Add property to QueryGridModel to pass through parameters for parameterized queries

### version 0.15.0
*Released*: 17 January 2020
* Move add, bulk, edit, and delete controls to be together for SampleInsertPanel
* Add DatePickerInput
* Update QueryInfoForms to use date picker for date fields
* Add BulkAddUpdateForm
* Add support for bulk update selected grid rows for SampleInsertPanel and AssayImportPanels
* Update SampleInsertPanel to support tabbed grid and file based insert

### version 0.14.0
*Released*: 17 January 2020
* QueryGrid paging improvements / fixes
    * Issue 38823: Allow users to select the number of rows they want to display in a grid on a single page
    * Issue 38824: Allow users to go to the first and last page in a grid and see current page number and total page count
    * Issue 39367: Disabled button tool tip on grid doesn't hide for disabled button
    * Issue 39405: Paging too far can result in no data
    * Issue 39420: Setting url pageSize to negative number results in all data being shown

### version 0.13.0
*Released*: 14 January 2020
* Item 6571: User Details panel updates to allow single user delete / deactivate / reactivate / reset password
    - add resetPassword() action and UserResetPasswordConfirmModal
    - also include optional message input for CreateUsersModal
    - Issue 39374: Better handling of selection state for SiteUsersGridPanel on page reload and navigation

### version 0.12.0
*Released*: 13 January 2020
* Update FileAttachmentForm and relatives
  - Add sizeLimits property for checking against maximum size
  - Change styling of error block to Alert instead of simple div
  - If multiple files are allowed, attach the files that pass validation even if some do not
* Update Controls and EditableGrid to add optional property for total number of rows allowed
and add a tooltip for the AddControls with info on the data size limits.
* Update placeholder text for cut-and-paste area for assay data
* Add optional parameters for AssayImportPanels and RunDataPanel and SampleInsertPanel
* Add clear button on cut-and-paste tab for assay import
* Issue 38567: use POST instead of GET to help deal with long filters (particularly IN filters) when dealing with selections
* Issue 39381: fix column layout for select inputs in QueryInfoForm

### version 0.11.0
*Released*: 13 January 2020
* Item 6633: Omit some property types from the field designer for SM
  * Changed basePropertiesOnly option to appPropertiesOnly
  * Expanded application of appPropertiesOnly to additional controls
  * DomainForm hide field types and DomainRow options based on appPropertiesOnly

### version 0.10.0
*Released*: 9 January 2020
* Item 6506: User management components and related model / action updates
    - QueryGridModel support for containerPath (in getQueryDetails, selection state, getQuery, getReportInfos)
    - QueryGridModel support for containerFilter in getQuery call
    - QueryGridPanel support for onSelectionChange callback function prop
    - SecurityPolicy.addUserIdAssignment helper function
    - SiteUsersGridPanel with row selection to show UserDetailsPanel and manage buttons to allow selected user deactivate/reactive/delete
    - CreateUsersModal for creating new site users from SiteUsersGridPanel button
    - Add invalidateUsers to index.ts for use in Sample Manager app
    - Update to @labkey/api release version 0.0.29
    - Issue 39359: fix to prevent API call to study-reports-getReportInfos if we know study module isn't available

### version 0.9.0
*Released*: 8 January 2020
* Add selectionKey getter to QueryGridModel
* Add `showSampleComparisonReports`, `onReportClicked`, and `onCreateReportClicked` props to QueryGridPanel.
* Add isSampleLookup to QueryColumn

### version 0.8.3
*Released*: 3 January 2020
* Fixed bug that occurred with multiple FileAttachmentForms on one page

### version 0.8.2
*Released*: 2 January 2020
* added samplemanager-downloadAttachments.api to URLResolver

### version 0.8.1
*Released*: 2 January 2020
* Update styling for some navbar components

### version 0.8.0
*Released*: 30 December 2019
* Add helper methods and constants for documentation links

### version 0.7.0
*Released*: 27 December 2019
* Factor out FileAttachmentEntry from FileAttachmentContainer
* Rename FileListing to FileListingForm and factor out the file listing component from that into a separate FileListing component
* Allow FileListingForm to optionally include a read-only set of files (available for download only)
* Change check for reinitializing FileAttachmentContainer to look only for a change in the initial file set
* Update HeatMap to allow for choosing a displayName field and provide the full row for getCellUrl
* export replaceParameter and replaceParameters methods from URL
* add optional parameter to QueryGridPanel so some tabs can be pull right
* Add description property to QuerySelect to pass it through to SelectInput
* Increase label field size on SelectInput

### version 0.6.4
*Released*: 26 December 2019
* Item 6392: ConfirmModal fix to not show close icon in upper right if onCancel prop is undefined
* Item 6392: Misc fixes for error messaging on user logged out / session timeout

### version 0.6.3
*Released*: 23 December 2019
* Misc domain designer fixes for Sample Manager
  - Issue 39256: Fix margin between panel and buttons on sample type field designer
  - Issue 39225: Fix so profile form trims display name before submit
  - Issue 39093: Help link in core domain designer points to future Sample Manager docs
  - Issue 39079: Fix assay design properties, error messages, and buttons for page layout size changes
  - Issue 38853: Change floating subnav to use display:none instead of visibility: hidden

### version 0.6.2
*Released*: 20 December 2019
* Item 6261: Update Sample Set --> Sample Type where applicable for Sample ui components
* Fix Issue 38700: Parent alias field in sample type design is in error state too early

### version 0.6.1
*Released*: 20 December 2019
* QueryGrid fix to remove extra call to reloadQueryGridModel when it is being unmounted

### version 0.6.0
*Released*: 18 December 2019
* Item 5511: UserMenu support for Sign In and Sign Out menu items
* Item 5511: Add InsufficientPermissionsAlert component

### version 0.5.0
*Released*: 16 December 2019
* add handleUpdateRows to FieldEditTrigger
* add initialFiles to FileAttachmentForm
* add SplitButtonGroup
* add samplemanagerJob search result mapping in URLResolver

### version 0.4.0
*Released*: 12 December 2019
* Remove @labkey/dependencies and move all dependencies to components/package.json
* Remove our local version of react-bootsrap.d.ts

### version 0.3.1
*Released*: 12 December 2019
* Search job attachments

### version 0.3.0
*Released*: 6 December 2019
* Item 6508: Permissions management components, models, and actions
* port ExpandableContainer component from biologics RelatedData component

### version 0.2.0
*Released*: 5 December 2019
* Upgrade TypeScript to 3.7.3
* Upgrade Storybook to 5.2.8
* Add "@types/react-test-renderer" to devDependencies

### version 0.1.3
*Released*: 4 December 2019
* render workflow jobs in search results

### version 0.1.2
*Released*: 2 December 2019
* Optimized imports
* Changed react imports from `import * as React` to `import React`
* Re-add `lib` section to tsconfig.base.json

### version 0.1.1
*Released*: 2 December 2019
* Misc fixes and cleanup post package consolidation
    * add missing "Map" imports from immutable
    * fix a few usages of this.state() that weren't using callback version
    * remove source-map setting from webpack.config.js
    * remove unneeded package.json dependencies and devDependencies
    * replace hardcoded documentation links with LABKEY.helpLinkPrefix

### version 0.1.0
*Released*: 27 November 2019
* Consolidate all `@glass` packages into this single `@labkey/components` package. The release notes for the previous
packages ([@glass/base](./archived/base.md),
[@glass/domainproperties](./archived/domainproperties.md),  [@glass/navigation](./archived/navigation.md),
[@glass/omnibox](./archived/omnibox.md), [@glass/querygrid](./archived/querygrid.md),
and [@glass/report-list](./archived/report-list.md))
can be found in the [archived](./archived) directory.
* Convert build/bundle from rollupjs to webpack, output UMD format for module/app usages.
* Move files from shared-config repository into this repository.

