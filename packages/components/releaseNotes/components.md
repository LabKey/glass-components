# @labkey/components
Components, models, actions, and utility functions for LabKey applications and pages

### version TBD
*Released*: TBD
- Issue 51816: pasted values from spreadsheet retain new lines and look invalid

### version 6.8.0
*Released*: 19 December 2024
- Add FilterCriteriaRenderer
- Add FilterCriteriaModal
- Add useLoadableState
    - Helper hook that takes a loader method and returns loadingState, value, and error
- DomainField: Add filterCriteria
- Render Filter Criteria components in AssayDesignerPanels
- Add `request` method
  - `request` is an async wrapper for `Ajax.request` which takes the same config as `Ajax.request` except `success` and
  `failure` callbacks. Instead of using `success` and `failure` you `await request(config)` and `catch` errors.

### version 6.7.0
*Released*: 18 December 2024
- Parent type selector updates for adding and removing from EditableGrid
  - AddEntityButton asButton property to allow for icon only version
  - QueryColumn isParentInput() helper to check for either MaterialInput or DataInput
  - EditableColumnMetadata onRemoveColumn optional prop to allow for callback for EditableGrid column removal menu item
  - EditableGrid additionalButtons optional prop to allow custom items to be added to grid button bar
  - DropdownAnchor
    - renamed to DropdownMenu
    - add asAnchor property to allow for version without `<a>` tag and href

### version 6.6.1
- merge forward v6.1.1 changes

### version 6.6.0
*Released*: 17 December 2024
- Delete FileListing
- Delete FileListingForm
- FileAttachmentEntry: convert to FC, simplify props
- Update file related styles
  - Change class names to match BEM style
- Remove duplicate CSS imports
- Remove snapshot tests

### version 6.5.4
*Released*: 17 December 2024
- Update `DateInput` to determine the default date/time from container configuration
- Lineage: be defensive against seed not being set when focusing graph
- Refactor `ColorPickerInput` to a functional component

### version 6.5.3
*Released*: 16 December 2024
- Add restrictions on names of domains
    - Update resolveErrorMessage util to handle more scenarios

### version 6.5.2
*Released*: 12 December 2024
- Update `EntityIdCreationModel` with `selectionContainerId`
- Fix `resolveSampleParentTypes` when `orderedRowIds` is undefined
- Fix some error message verbiage

### version 6.5.1
*Released*: 11 December 2024
- RadioGroupInput fix for formsy input usage
  - need to call setValue on each change of radio selection

### version 6.5.0
*Released*: 10 December 2024
- Chart builder support for axis layout options
  - OverlayTrigger to only close on "click outside" for triggerType="click"
  - RadioGroupInput to support click on input label to setValue
  - Factor out ChartFieldOption.tsx from ChartBuilderModal.tsx
  - ChartFieldOption.tsx support for axis layout options (scale and range) to be set in OverlayTrigger on click
  - ChartBuilderModal to support axis layout options from saved config and to update when saving config
  - TrendlineOption.tsx update to asymptote min/max inputs to match axis layout options (via OverlayTrigger)

### version 6.4.1
*Released*: 9 December 2024
- Issue 51432: LKSM: special character not working well on various pages
  - Warn user about missing quotes when pasting data into editable grid that contains a comma
  - Replace `&` with a similar unicode character for lineage graph labels display as vis-network doesn't work well with `&`

### version 6.4.0
*Released*: 4 December 2024
- Remove assays.scss
  - Styles moved to utils.scss or ui-premium
- Add utils.scss
  - Move util styles from various scss files to utils.scss
- Rename getSelectedData to getSelectedDataDeprecated
- Add getSelectedRows
  - This uses the components version of selectRows to fetch the selected data for a QueryModel
- "-spacing" classes renamed
  - renamed to "-margin" or "-padding"

### version 6.3.1
*Released*: 4 December 2024
- Reinstate prior removed fn

### version 6.3.0
*Released*: 4 December 2024
- Chart builder support for Trendline option in line chart
  - add Trendline option to ChartBuilderModal and support trendlineType in chartConfig
  - trendline asymptote min and max inputs for specific curve fit types
  - available trendline options (i.e. linear vs non-linear) based on schema prefix

### version 6.2.1
*Released*: 3 December 2024
- Issue 51105: Workflow job links to navigate user to app project home or subfolder accordingly
  - export createProductUrlFromPartsWithContainer for use in WORKFLOW_MAPPER

### version 6.2.0
*Released*: 3 December 2024
- Issue 51707: Change "Registry Source Type" to "Source Type" and "Registry" to "Registry Sources"
- Issue 51775: Don't produce link for non-standard assay import if not supported

### version 6.1.1
*Released*: 17 December 2024
- Issue 51864: Unexpected error when trying to add samples to an assay

### version 6.1.0
*Released*: 29 November 2024
- Issue 49016: App admin Groups and Users pages to show in subfolders when applicable

### version 6.0.2
*Released*: 29 November 2024
- Issue 51680: Use proper container path for importing assay data for jobs

### version 6.0.1
*Released*: 27 November 2024
- Incorporate Recent Storage Dashboard Widget
  - Modify `HorizontalBarSection` to support `showSummaryTooltip`
  - Add `createHorizontalBarCountLegendData` util
  - Modify `ItemLegend` to render data with `DefaultRenderer`

### version 6.0.0
*Released*: 26 November 2024
- Move `BarChartViewer` and relatives to `ui-premium` package
- Update `ResponsiveMenuButton` to have `children` property instead of `items`
- Add constants and properties to allow use of a single `SampleGridButtons` component in `ui-premium`
- `SampleCreationType` -> `EntityCreationType`
- Export `parseScientificInt` utility

### version 5.24.1
*Released*: 26 November 2024
- Support Plate Set ELN References

### version 5.24.0
*Released*: 19 November 2024
- Issue 51645: Escape advanced search characters
- Migrate `sanitizeSearchQuery()` implementation to this package and rename to `escapeSearchQuery()`.
- Add `escapeQuery = false` and `escapeQuotes = false` as optional properties on the search API wrapper.

### version 5.23.0
*Released*: 18 November 2024
- Include identifying fields in editable entity grids - sample create/derive/aliquot
  - Modify editable grid addRows, addRowsPerPivotValue and addBulkRowsToEditorModel to take custom insertColumns
  - Support removeColumns for editable grid
  - Add previousEditorModel to EditableGridChange param
  - Add readOnlyGridFields to bulkAddProps

### version 5.22.10
*Released*: 15 November 2024
- withAssayModels: filter by "assayName" prop when provided

### version 5.22.9
*Released*: 14 November 2024
- Editable Grid: apply lookupValueFilters when pasting

### version 5.22.8
*Released*: 13 November 2024
- Merge from release24.11-SNAPSHOT to develop
  - includes changes from 5.20.3 #1635
  - includes changes from 5.20.4 #1637

### version 5.22.7
*Released*: 12 November 2024
- DataClassDataType: Update noun to match apps

### version 5.22.6
*Released*: 11 November 2024
- Revert recent change to genCellKey and move the sample field key prefix to the usage in updateCellValuesForSampleIds()

### version 5.22.5
*Released*: 7 November 2024
- Issue 51574: Limit selection for View Assay Results
- Issue 51482: Add metric to track Help link clicks
- Issue 51575: Limit number of samples to print labels for to 1000

### version 5.22.4
*Released*: 6 November 2024
- QueryInfo.hasIdentifyingFieldsView() to check for identifying fields view existence and if it has more than just the default "Name" column

### version 5.22.3
*Released*: 6 November 2024
- Issue 51495: LKSM: Grid Showing Incorrect Number Selected
  - Fixed buildQueryParams util to allow >1 filter values per filter parameter

### version 5.22.2
*Released*: 6 November 2024
- Merge from release24.11-SNAPSHOT to develop
    - includes changes from 5.20.2 #1629

### version 5.22.1
*Released*: 5 November 2024
- Remove combineParentTypes

### version 5.22.0
*Released*: 5 November 2024
- Package updates

### version 5.21.0
*Released*: 4 November 2024
- Add identifying fields to grids when editing via grid for Samples and Sources
    - include identifying fields in getSelectionLineageData()
    - EditorModel.getUpdatedData() to skip non-userEditable fields when comparing values
    - getIdentifyingFieldsEditableGridColumns() to take param for hasProductFolders to determine if Folder should be excluded

### version 5.20.2
*Released*: 4 November 2024
- Issue 51563: LKSM: Add additional date and date/time formats

### version 5.20.4
*Released*: 9 November 2024
- Use userId instead of email for password related APIs

### version 5.20.3
*Released*: 7 November 2024
- Replace some curly quotes with normal quotes

### version 5.20.2
*Released*: 4 November 2024
- Issue 51563: LKSM: Add additional date and date/time formats

### version 5.20.1
*Released*: 31 October 2024
- Issue 51491: DateTime field should tolerate Date and DateTime pseudo format patterns

### version 5.20.0
*Released*: 31 October 2024
- Bump build
- Convert LoadingSpinner to FC

### version 5.19.1
*Released*: 31 October 2024
- Issue 51557: fix counts for folder deletion summary
- Support optional `containerPath` on `api.security.getDeletionSummaries()` endpoint wrapper

### version 5.19.0
*Released*: 31 October 2024
- Add identifying fields to grids when insert assay data via EditableGrid
  - migrate some sample identifying fields utils from `@labkey/premium`
  - factor out updateCellKeySampleIdMap() as utility function
  - add QueryColumn.isSingleSampleTypeLookup()
  - EditorModel.getValuesForColumn() to get cellValues for a single column
  - update sample identifying fields utils/actions to take in optional sampleFieldKey prefix
  - EditorModel.getUpdatedData() to skip readOnly fields when comparing values

### version 5.18.0
*Released*: 29 October 2024
- Folders: Archive V1 (Hide from view/show hidden)
  - Add isArchived to Container class
  - Add App.getArchivedFolders util
  - Add folder.archiveFolder.api to support archive and restore a folder
  - Added FolderColumnRenderer to show archived tag for Folder fields
  - Modified ProductMenu to add archived indicator
  - Modified FolderMenu to section active vs archived folders
  - Modified SearchResultCard and FilterFacetedSelector to show archived tag for folders
  - Modified DataTypeFolderPanel to section active vs archived folders and uncheck archived folders by default
  - Modified move and create data UIs to exclude archived folder from target options

### version 5.17.9
*Released*: 29 October 2024
- Export isCtrlOrMetaKey

### version 5.17.8
*Released*: 29 October 2024
- Bump `@labkey/build` package dependency

### version 5.17.7
*Released*: 28 October 2024
- Bump `@labkey/api` package dependency

### version 5.17.6
*Released*: 28 October 2024
- Update to `vis-network@9.1.9`
- Add necessary peer dependency `vis-data@7.1.9` to our dependencies
- Simplify typings and adjust API usages to match latest version

### version 5.17.5
*Released*: 26 October 2024
- Remove reference to the experimental flag for plates.

### version 5.17.4
*Released*: 25 October 2024
- Add `SchemaQuery` properties on `AssayDefinitionModel`.
- Refactor `AssayDefinitionModel` to use `ExtendedMap`.

### version 5.17.3
*Released*: 23 October 2024
- Issue 39332: Make sure export started messages shows before export starts in TabbedGridPanel exportTabs case

### version 5.17.2
*Released*: 23 October 2024
- Fix Issue 51359
  - Paste starting from first cell in selection

### version 5.17.1
*Released*: 22 October 2024
- Date/Time formatting simplifications - Settings UI Changes
  - Add utils for handling standard date/time formats
  - Move getFolderDateTimeHelpBody from ContainerLookAndFeelForm to shared util
  - Check blank initial value for SelectInput
  - Modified DateTimeFieldOptions to use standard formats and new UI

### version 5.17.0
*Released*: 21 October 2024
- Migrate out all components related to `AssayImportPanels` (i.e. assay run import page) and corresponding functionality.
- Add `checkForDuplicateAssayFiles()` to assay API wrapper.
- Add `getSelection()` to query API wrapper.

### version 5.16.0
*Released*: 21 October 2024
- EditableGridPanel: Remove support for tabs
- SampleTypeAppContext: change parentDataTypes to an array
- SamplesTabbedGridPanelComponentProps: remove withTitle, title props
- Remove getUpdatedDataFromEditableGrid
- Remove applyEditorModelChanges
- EditorModel:
  - add getUpdatedData
  - add applyChanges
- Remove initEditorModels
- Remove queryModel arg from initEditorModel
- Remove queryModel arg from EditableGridLoader.fetch
- Export EditableGrid
- Remove EditableGridPanel
- Remove EditableGridPanelForUpdate
- Don't export updateSampleStorageData

### version 5.15.1
*Released*: 21 October 2024
- Issue 51422: When not using filters, `clearSelections` can be more efficient

### version 5.15.0
*Released*: 17 October 2024
- Remove properties from `EditableGrid` that support bulk updates when adding to storage

### version 5.14.1
*Released*: 17 October 2024
- Fix verb usage in `resolveErrorMessage`, deriving the present participle of the verb when not provided

### version 5.14.0
*Released*: 16 October 2024
- Calculated fields error handling
  - calculated field expression input width change, show examples inline next to textarea, add "click to validate"
  - parseCalculatedColumn to first try making an executeSQL call with fake data to catch SQL errors
  - parseCalculatedColumn to include PHI check in validation (Issue 51235)
  - withQueryModel to retry failed query without calculated fields, set viewError on QueryModel for grid display
  - remove experimental feature flag for calculated fields

### version 5.13.2
*Released*: 14 October 2024
- Issue 51056 Samples with single double quotes in the name will not resolve if added as parent samples.
- Issue 51433 Unhandled client side exception when using a parent field in editable grid after clearing the field.

### version 5.13.1
*Released*: 14 October 2024
- Issue 51425: reprocess lineage node "level" on subsequent traversals
- Lineage styling:
    - Set `scaleFactor=0.6` (default is 1) for arrows so they render a bit smaller.
    - Set `levelSeparation=125` (default is 150) to reduce the space between levels in the graph.
    - Set `edgeMinimization=false` (default is true) so that all edges are represented in the graph.

### version 5.13.0
*Released*: 7 October 2024
- Issue 47087: Find Derivatives in Sample Finder to include a selection in filters

### version 5.12.1
*Released*: 7 October 2024
- withAssayModels fix to allow passthrough of ComponentsAPIWrapper

### version 5.12.0
*Released*: 7 October 2024
- Issue 50569: Add description for API keys

### version 5.11.1
*Released*: 7 October 2024
- Issue 51291: Assure product menu closes after click on "empty" link

### version 5.11.0
*Released*: 4 October 2024
- Chart builder in app (part 3)
  - updates to chart margins and sizes for chart builder and dashboard
  - only show 'x' grid lines for bar and box plots
  - Issue 48860: Show "inheritable" checkbox in chart builder for users with proper perm (and if in app home)
  - use getContainerFilterForFolder() for chart getQuery request (related to issue 48860)
  - remove Chart Builder experimental feature flag

### version 5.10.0
*Released*: 1 October 2024
- Editable Grid: improve validation messages

### version 5.9.0
*Released*: 1 October 2024
- Issue 51254: Limit number of values for multi-valued filter types

### version 5.8.2
*Released*: 30 September 2024
- Issue 51173: LKSM/LKB: Improve naming pattern warning when it contains a field name

### version 5.8.1
*Released*: 30 September 2024
- Issue 51253: Require saving before testing of BarTender connection

### version 5.8.0
*Released*: 30 September 2024
- Lineage Relationships: Optionally Require during Sample Registration
  - add 'required' prop to various alias and parent input related models
  - add api.domain.getRequiredParentTypes and api.entity.getDataTypesWithRequiredLineage
  - updated DomainParentAliases and ParentAliasRow to use new UI and allow setting required parent
  - updated ImportAliasRenderer to incorporate required info
  - updated SampleTypeDesigner and DataClassDesigner to show new Lineage section for alias
  - remove folder level data exclusion for alias data type selection since designers are edited at Home folder

### version 5.7.0
*Released*: 27 September 2024
- Change "Project" to "Folder" throughout the application
- Remove warning banner about shared domains except for domains coming from /Shared

### version 5.6.1
*Released*: 27 September 2024
- Issue 51227: Add metric for number of rows used in editable grid

### version 5.6.0
*Released*: 25 September 2024
- Wire up onBlur for LookupCell
- Export Help component
- Export CellMessages type

### version 5.5.11
*Released*: 25 September 2024
- Issue 51337: LKSM: Can't edit samples where source ID has a comma
  - Check quoted parent value with comma before calling JSON.parse, which would remove the quotes

### version 5.5.10
*Released*: 24 September 2024
- Update `fileMatchesAcceptedFormat` utility to check file extension casing in a case-insensitive manner. Refactor away from using `Immutable`.
  - Fixes Issue 51331
- Update `FileAttachmentContainer` to use native `Set` rather than `Immutable.Set`.

### version 5.5.9
*Released*: 24 September 2024
- EditableGrid: Fix issue with pasteEvent not working if user pasted more rows than the grid has
  - Fixes issue 51327

### version 5.5.8
*Released*: 24 September 2024
- Fix Issue 51265
    - We now more consistently trim values and use getValidatedEditableGridValue
- Stop using overflow: scroll

### version 5.5.7
*Released*: 20 September 2024
- Issue 50389: Casing of aliased (parent) sample or source type name can be changed in the editable grid

### version 5.5.6
*Released*: 18 September 2024
- Issue 50998: Add container filter when getting samples from a particular transaction id

### version 5.5.5
*Released*: 17 September 2024
- Issue 50818: add RESOLVE_LSID_MAPPERS to resolve data/material by lsid

### version 5.5.4
*Released*: 17 September 2024
- Add `SchemaQuery` constant for `plate.ReformatTargetPlateSets` query.

### version 5.5.3
*Released*: 17 September 2024
- Add back calculated fields experimental feature flag

### version 5.5.2
*Released*: 16 September 2024
- Calculated fields issue fixes for 24.10
  - DomainForm to handle batching updates for state related to calculated field validation
  - Update error messaging for bad SQL related exceptions (Issues 51232 and 51204)
  - Study dataset designer to include systemFields based on timepoint type (Issue 51249)

### version 5.5.1
*Released*: 12 September 2024
- Issue 50628: Bump @labkey/api. See https://github.com/LabKey/labkey-api-js/pull/182

### version 5.5.0
*Released*: 12 September 2024
- Follow-up release fix for v5.4.0.

### version 5.4.0
*Released*: 12 September 2024
- Issue 50331: Cross-folder import of assay data from subfolder plate set should import data into subfolder

### version 5.3.1
*Released*: 11 September 2024
- Merge from release24.9-SNAPSHOT to develop
    - includes changes from 4.15.1 #1571

### version 5.3.0
*Released*: 10 September 2024
- Update `react-datepicker` dependency to align with our `date-fns@3.x` dependency.
- Remove `@types/react-datepicker` dependency as `react-datepicker` now supplies its own typings.

### version 5.2.0
*Released*: 9 September 2024
- Add `@hello-pangea/dnd` as a dependency
- Remove `react-beautiful-dnd` as a dependency

### version 5.1.1
*Released*: 9 September 2024
- Issue 51085: Grid button spacing issue for hover border

### version 5.1.0
*Released*: 6 September 2024
- Issue 51158: Update the text for discarding samples from storage to use "removed" instead

### version 5.0.0
*Released*: 5 September 2024
- withQueryModels: Add reloadModel flag to setOffset
- ***BREAKING CHANGE***: React dependency upgraded to React 18
- Use PropsWithChildren for all components using children
- Fix issues with document click handlers for menus
- Don't use defaultProps with function components

### version 4.16.0
*Released*: 3 September 2024
- Calculated fields remove experimental feature flag
  - DomainRow for calculated fields to set isDragDisabled true
  - Add tooltip for DragDropHandle for calculated fields

### version 4.15.1
*Released*: 9 September 2024
- Issue 50700: EditableGrid to account for hidden/readonly rows during cell actions

### version 4.15.0
*Released*: 2 September 2024
- Issue 39332: Provide status when exporting data from a grid in the app
  - QueryModel action for addMessage with optional duration (for removing message after N ms)
  - Add message to grid after clicking export menu option

### version 4.14.1
*Released*: 30 August 2024
- Consolidate handling of date/time changes in `DatePickerInput`.
- Coerce local timezone for ISO_DATE_FORMAT matching strings in `parseDate`.

### version 4.14.0
*Released*: 30 August 2024
- Update `QuerySelect` to support parameterized queries

### version 4.13.1
*Released*: 30 August 2024
- ELN and storage view tooltip update
  - Support isFlexPlacement Popover placement based on available screen space
  - check isBiologicsEnabled for isMediaEnabled
  - support noLink prop for DefaultRenderer

### version 4.13.0
*Released*: 30 August 2024
- Misc 24.9 issue fixes
  - Issue 51123: Assay run import sample lookup fails when coming from a workflow job task
  - Issue 51025: Don't allow saving of data in editable grid if there are known errors

### version 4.12.0
*Released*: 29 August 2024
- Add `date-fns` and `date-fns-tz` dependencies
- Remove `moment` and `moment-timezone` dependencies
- Refactor usages of time differences and time math to use date-fns
- Export new `fromDate` and `fromNow` date utility methods
- Remove internal implementation of `jDateFormatParser`

### version 4.11.0
*Released*: 27 August 2024
- Use new `~~identifyingfield~~` view when available for `QuerySelect`'s `PreviewOption`

### version 4.10.3
*Released*: 27 August 2024
- Consolidate EditableGrid read-only cell methods
  - remove EditorColumnMetadata.readOnly prop and replace with isReadOnlyCell prop
  - remove unused readOnlyColumns prop from BulkUpdateForm
  - update QueryInfo getInsertColumns() and getUpdateColumns() to rename param as requiredColumns
- Remove unused useWindowFocusCheckExpiredSession

### version 4.10.2
*Released*: 22 August 2024
- fix `QueryModel.selectedState` so it works on a partially filled last page

### version 4.10.1
*Released*: 22 August 2024
- Issue 50822: Query to get study properties instead of relying on study moduleContext

### version 4.10.0
*Released*: 20 August 2024
- Calculated fields validation of value expression
  - update tooltip text and examples for Expression textarea label
  - validate expression on component mount and on text area blur
  - display validation message or error in textarea footer and set domain row warning state
  - SampleTypeDesigner uniqueId field addition warning modal button change

### version 4.9.0
*Released*: 20 August 2024
- Add view customizer for identifying fields for samples and sources
  - Update `ColumnSelectionModal` with optional `disabledMsg` property to be shown in popover
  - Export `includedColumnsForCustomizationFilter` for use in ui-premium component
  - Add new reserved view name

### version 4.8.0
*Released*: 19 August 2024
- Do not export loadEditorModelData
- Remove initEditableGridModel, initEditableGridModels, applyEditableGridChangesToModels, EditableGridModels
  - Use initEditorModel, initEditorModels, applyEditorModelChanges instead
- EditableGrid: remove unused and unnecessary props
  - allowFieldDisable
  - allowRemove
  - bordered
  - condensed
  - lockedRows
  - notDeletable
  - onSelectionChange
  - removeColumnTitle
  - showBulkTabOnLoad
  - striped
  - tabAdditionalBtn
  - tabBtnProps
- EditableGrid: remove dependence on QueryModel
  - Including utils and action methods used by EditableGrid and those for manipulating EditorModel
- ExportMenu: Remove extraExportMenuOptions
  - This feature is no longer used

### version 4.7.3
*Released*: 16 August 2024
- Fix DomainField.fromJS accessing undefined object issue

### version 4.7.2
*Released*: 14 August 2024
- Issue 50924: Sample timeline event details throws error if the parent sample name starts with double quote

### version 4.7.1
*Released*: 13 August 2024
- Issue 50657: Use default view when printing labels from a sample's details page

### version 4.7.0
*Released*: 12 August 2024
- Issue 49966: Add new `StorageUnitLabel` column as a known column to allow attaching a label to a box created during import

### version 4.6.0
*Released*: 8 August 2024
- Issue 50833: Renaming a project doesn't get fully reloaded until page refresh
  - ProjectSettings to use getIsDirty and setIsDirty from parent component and to pass renamedProject to onSuccess
  - Move several admin setting project related components to @labkey/premium

### version 4.5.1
*Released*: 7 August 2024
- Merge from release24.8-SNAPSHOT to develop
    - includes changes from 4.4.3 #1545

### version 4.5.0
*Released*: 6 August 2024
- Remove `formsy-react` dependency.
- Inline `formsy-react` implementation. This is a port of v2.3.2.

### version 4.4.3
*Released*: 6 August 2024
- Mark new `Visit Label` field as a study field

### version 4.4.2
*Released*: 31 July 2024
- Fix `isTransformScriptsEnabled` check

### version 4.4.1
*Released*: 30 July 2024
- BarTender: supply file export needed for BarTender integration
  - Update label and icon for bartender label printing option
  - Support new "Download template" option for bartender with FieldKey instead of column title

### version 4.4.0
*Released*: 30 July 2024
- Add LIMS product and product feature checks for transform scripts and charts
  - Add utility methods for checking other features (nonstandard assays, study linking, registry, general LKS support)
  - Refactors for sharing renderer definitions
  - add utility method for registering pipeline listeners

### version 4.3.1
*Released*: 30 July 2024
- Issue 50224: link-to-study does not accept visit labels instead of sequencenums

### version 4.3.0
*Released*: 25 July 2024
- Issue 50449: App grid filter to expand icon click area to remove filter value
- Issue 50537: LineageDetail to only show the "Properties" column in the detail view for the exp schema
- Issue 49754: App charts to expand width and scroll horizontally to match LKS
- Issue 49753: App charts to use formattedValue in response row objects for bar/box plot tick labels

### version 4.2.0
*Released*: 24 July 2024
- Package updates

### version 4.1.0
*Released*: 24 July 2024
- Calculated Columns support in the Field Editor
  - add valueExpression to DomainField model
  - add calculatedFields to the DomainDesign
  - add CalculatedFieldOptions to DomainRow and Calculation to PropDescType
  - hide some AdvancedSettings for calculated fields
  - use rangeURI for calculated fields to determine type specific expanded row options to show
  - add ProductFeature.CalculatedFields and isCalculatedFieldsEnabled() helper
  - add experimental feature flag for calculated fields in the Field Editor

### version 4.0.7
*Released*: 23 July 2024
- Add `footerContent` prop on `Modal` which is passed through as the `children` of `ModalButtons`.
Useful for rendering content to the left of the modal confirmation buttons.

### version 4.0.6
*Released*: 20 July 2024
- Issue 50742: Reset/Update genId result in error if samples exists only in child folders
- Issue 50709: LKSM: Pasting in editable grid when an aliquot field is between two sample fields doesn't work
- Issue 50650: LKSM: SampleFinder doesn't show ancestor column data if default view also contains the same ancestors
- Issue 42183: SM: Need better indication that comment in a workflow task has not been saved.
- Issue 50607: Updated field labels are not shown in the grid

### version 4.0.5
*Released*: 17 July 2024
- EditableGrid: bulk data resolve public lookups

### version 4.0.4
*Released*: 12 July 2024
- Issue 50661: Update `FilterFacetedSelector` to cancel requests as needed while typing
  - move `useRequestHandler` hook from ui-premium to here
- Issue 50447-adjacent: Impose limit on number of items to add to picklist for different button/menu item rendering

### version 4.0.3
*Released*: 12 July 2024
- getSelectedData: use async implementation, accept columns as `string[]`
- EditableGrid: action `getLookupDisplayValue()` should support resolving string values
- BulkUpdateForm: remove `requiredDisplayColumns` prop

### version 4.0.2
*Released*: 12 July 2024
- Editable Grid Improvements: Validation of fields
  - Update invalid cell style
  - Add util to validate cell values based on column type and properties
  - Wire up cell validation on cell modify/blur/paste/fill
  - Handle missing required cell value check on Submit

### version 4.0.1
*Released*: 12 July 2024
- SelectRows: support optionally requesting metadata

### version 4.0.0
*Released*: 10 July 2024
- Remove usages of react-bootstrap
- Remove FieldEditForm
- Popover/Tooltip: support fixed positioning
- Remove react-boostrap and @types/react-boostrap dependencies

### version 3.57.1
*Released*: 8 July 2024
- Issue 50640: Update `MenuSectionModel` URL construction to link to `runs` page for assay names
- Issue 50753: Fix link resolution for sample type names that are numbers

### version 3.57.0
*Released*: 3 July 2024
- Add styling for button.clickable-text

### version 3.56.2
*Released*: 28 June 2024
- Update MenuSectionItem to accept ReactNode for label attribute

### version 3.56.1
*Released*: 28 June 2024
- Remove reference to `MaterialLookupColumnRenderer`

### version 3.56.0
*Released*: 27 June 2024
- Use `LabelOverlay` in headers for grids
    - Update display of Description in `LabelOverlay` to preserve white space
    - Update `EditableGrid.renderColumnHeader` to use `LabelOverlay` if custom tool top is not configured
    - Add `DomainFieldMetadata` component to be used as new `HelpTipRenderer` when appropriate

### version 3.55.2
*Released*: 26 June 2024
- Add support in BulkUpdateForm for staging changes to EditorModel without transacting changes

### version 3.55.1
*Released*: 26 June 2024
- Issue 49025: Assay run import fails if time format is kk:mm
- Issue 50715: Barcode field set as required prevents sample creation because of validateData() check
- Issue 50605: Field editor drag-n-drop to reorder prevents dragging of a field after it is moved the first time

### version 3.55.0
*Released*: 25 June 2024
- Grid: improve styling for sticky headers
  - No longer compute height via JS
  - Use max-height, set via CSS

### version 3.54.0
*Released*: 24 June 2024
- Issue 48439: EditableGrid drops invalid date values when calling insertRows/saveRows
  - add getValidatedEditableGridValue() to centralize handling of grid data parsing for insert and update case
  - return original date string value when unable to parseDate()
- Remove some deprecated code after issue 50589 changes (remove export editable grid option)

### version 3.53.6
*Released*: 20 June 2024
- Issue 50483: Creating a required sample-only field after an aliquot field errors on add
- Issue 50023: Import button on Assay Run page is not enable after creating a new aliquot and adding them to a run result.
- Issue 50608: View Assay Results from Storage Grid View errors
- Issue 50684: LKSM: Update descriptions for Source & Sample Type designer

### version 3.53.5
*Released*: 18 June 2024
- Separate storage styling from editable grid

### version 3.53.4
*Released*: 18 June 2024
- Issue 50533: Support passing through a `timezone` prop on `EditInlineField`

### version 3.53.3
*Released*: 18 June 2024
- Add support for Ancestor nodes on All Samples grids
  - Update `CustomizeGridViewModal` to not allow multiple levels of ancestors to be added

### version 3.53.2
*Released*: 14 June 2024
- Feature Request 50121: Support multi-line cells in editable grid

### version 3.53.1
*Released*: 13 June 2024
- Convert usages of OverlayTrigger off of react-bootstrap

### version 3.53.0
*Released*: 12 June 2024
- Issue 50589: Remove option to export editable grid data

### version 3.52.0
*Released*: 10 June 2024
- Sample Type & Source Type Designer Roles
  - Add entityApi.isDataTypeEmpty to check if a design has data
  - Allow hiding of Projects section in designer

###  version 3.51.0
*Released*: 10 June 2024
- Assay import support for results domain file fields
  - FileAttachmentForm to send back updatedFiles map onFileRemoval
  - FileAttachmentContainer to support includeDirectoryFiles to recursively include files in a dropped directory
  - FileAttachmentContainer to support error check for total file size
  - RunDataPanel update to show FileAttachmentForm for results domain file fields
  - AssayWizardModel.prepareFormData to include resultsFiles for import run API post and update progress bar estimate and message
  - uploadAssayRunFiles fix for maxFileSize to not include batchFiles or runFiles as they are unrelated
  - only shown in assay import UI for LKB at this time

###  version 3.50.0
*Released*: 10 June 2024
- Issue 49882: App editable grid support for locking column header and left columns on scroll

###  version 3.49.0
*Released*: 6 June 2024
- getSelectionLineageData: make selection `Set<string>` instead of `List<any>`
  - It's always sourced from QueryModel.selections
- SamplesEditableGridProps: remove displayQueryModel

### version 3.48.1
*Released*: 4 June 2024
- Issue 41718: Domain Designer Field Imports should observe auto-increment fields
    - Fix displayed Data Type of auto int field on existing List

### version 3.48.0
*Released*: 4 June 2024
- Fix Issue 48377: LKSM/LKB: Editable grid allows pasting into cells that are marked as read-only
- Fix Issue 48242: LKSM/LKB: Editable Grid - Right clicking a multi-cell selection doesn't work as expected
- EditableGrid: Fix issue where cut (cmd/ctrl + x) would delete read only cell values
- EditableGrid: Add hideReadonlyRows prop
- QueryFormInputs: Remove unused prop componentKey

### version 3.47.0
*Released*: 30 May 2024
- Expose `registerInputRenderer` as a way for external package usages of `@labkey/components` to register custom form/grid input renderers.
- Introduce `QuerySelect.groupByColumn` which allows for results within query select to be grouped by another column. This in turn is backed by `SelectInput.formatGroupLabel` when rendering options.
- Add a new `includeEmptyParams` parameter to `AppURL.addParams()`. By default `addParams()` will now not include parameters where the parameter value is `undefined` or `null`.
- Issue 49953: fix shift-select on edge cells

### version 3.46.5
*Released*: 29 May 2024
- Issues 50507 and 50453: Fields named 'Color' should not interfere with status colors
- Issue 50498: Use proper container for status deletion

### version 3.46.4
*Released*: 28 May 2024
- Issue 50354: LKSM: Include indicator of unavailable file in apps

### version 3.46.3
*Released*: 21 May 2024
- Fix Issue 50455

### version 3.46.2
*Released*: 21 May 2024
- Issue 50347 LKSM: Data Field Name in Naming Pattern Causing Error

### version 3.46.1
*Released*: 21 May 2024
- Merge from release24.3-SNAPSHOT to develop
    - includes changes from 3.24.12 #1496

### version 3.46.0
*Released*: 16 May 2024
- Add `CheckboxLK`
  - This is a replacement for react-boostrap's Checkbox
  - It will be renamed to `Checkbox` when we stop using the react-bootstrap version
- Reduce usages of various react-bootstrap components (e.g. FormGroup, FormControl)
- OverlayTrigger: Don't require an `id`
- Add `withServerContext`

### version 3.45.1
*Released*: 16 May 2024
- Introduce `EditorModel.convertQueryModelDataToGridResponse()` to streamline initializing data from a `QueryModel` for an `EditorModel`.

### version 3.45.0
*Released*: 16 May 2024
- Issue 50363: Cross Folder lookup editable grid copy/paste and fill down don't account for containerPath / containerFilter
  - findLookupValues() to use getContainerFilterForLookups() and accept containerPath optional param
  - fillColumnCells() and insertPastedData() to use containerPath for the given row when validating cell lookup values forUpdate true case
  - fillColumnCells() and insertPastedData() to use targetContainerPath forUpdate false case
  - EditableGrid "Bulk Insert" and "Bulk Update" to use target containerPath prop for lookup field options and validation

### version 3.44.1
*Released*: 10 May 2024
- Issue 50360: Cross folder bulk edit doesn't work for grid custom view

### version 3.44.0
*Released*: 10 May 2024
- Chart builder in app (part 2)
  - Allow exports of charts within the apps to PDF/PNG via export dropdown menu
  - Allow bar-chart y-axis aggregation method (sum, min, max, mean, median) selection
  - Change chart builder modal preview limit from 100k rows to 10k rows

### version 3.43.0
*Released*: 9 May 2024
- ELN: Customize signing checkbox and export to PDF
  - Add LabelsAPIWrapper for getting and updating custom labels

### version 3.42.3
*Released*: 8 May 2024
- Add back class for `DisableableMenuItem` and do some RTL test conversion

### version 3.42.2
*Released*: 8 May 2024
- Merge from release24.5-SNAPSHOT to develop
    - includes changes from 3.41.1 #1484 #1485

### version 3.42.1
*Released*: 6 May 2024
- Issue 50319: Sample status tag display issues on lineage sample detail panel

### version 3.42.0
*Released*: 6 May 2024
- Issue 50084: Add onError handler for FileAttachmentForm to allow appropriate behavior by wrapping components when errors are detected

### version 3.41.1
*Released*: 3 May 2024
- Issue 48675: Improve UI text for 'ID/Name Settings'

### version 3.41.0
*Released*: 30 April 2024
- Support prop `ExtraExportMenuOptions` on ExportMenu component

### version 3.40.3
*Released*: 30 April 2024
- Remove "Cross project file import" experimental feature flag

### version 3.40.2
*Released*: 29 April 2024
- Issue 50236: Sample Manager: customize grid to add "Inputs/All" fields results in error page

### version 3.40.1
*Released*: 29 April 2024
- No longer include `tif` files in the `isImage` check
  - Most browsers cannot render `tif` files
  - Fixes Issue 49852

### version 3.40.0
*Released*: 29 April 2024
- Support cross-folder "Edit in Bulk"
  - Update getOperationNotPermittedMessage to work for both Edit in Grid and Edit in Bulk scenarios
  - BulkUpdateForm getUpdatedData() to include Folder in updated rows, if it exists in originalData
  - Add getSelectedIds(filterIds) to QueryModel
  - saveRowsByContainer prop for containerField to be optional since it has a default
  - AppendUnitsInput fixes for grid cell rendering and enable/disable in bulk form
  - Edit in Grid and Bulk lookup fields to use containerPath based on selected row(s) (for BulkUpdateForm, disable lookup fields and file files toggle when more than one containerPath in selection)
  - Add getOperationConfirmationData and getParentTypeDataForLineage to ApiWrapper

### version 3.39.6
*Released*: 25 April 2024
- Add support for exporting a storage map from terminal storage grids

### version 3.39.5
*Released*: 23 April 2024
- Include sample property fields for Sample Finder properties card

### version 3.39.4
*Released*: 19 April 2024
- Fix `ProductMenu` layout for static menu sections

### version 3.39.3
*Released*: 19 April 2024
- Issue 49792: Details tooltip sometimes cut off
- Issue 50054: Stacked bar chart hover on total count displays incorrect info
- DomainForm fix to use the propertyId in the DomainRow key for saved fields (helps with issues 49481 and 50076)
- BaseModal to set document.body no-scroll on show

### version 3.39.2
*Released*: 19 April 2024
- Add clearSelected and replaceSelected to query API wrapper
- Add allowSelection and onSelectionChange props to <EditableGrid/>

### version 3.39.1
*Released*: 18 April 2024
- Update CSS for notebook review status pills

### version 3.39.0
*Released*: 17 April 2024
- Support cross-folder "Edit in Grid"
  - rename getOperationNotPermittedMessage() to getOperationNotAllowedMessage()
  - EditableGridLoaderFromSelection to account for idsNotPermitted when using selections for getSelectedData()
  - Show Project column in EditableGrid for "Edit in Grid"
  - Add saveRowsByContainer util to QueryAPIWrapper
  - EditableGrid column actions for add,remove,update should use editorModel.columns to determine column indices
  - EditableGridPanelForUpdate props for readOnlyColumns and updateColumns, include originalRows as param to updateRows, show warning about notPermitted rows
  - add getOperationConfirmationDataForModel helper
  - fix in getUpdatedDataFromGrid for multi-value columns
  - EditableGrid replace react-bootstrap OverlayTrigger/Popover with LabelHelpTip
  - Issue 50140: App data class designer cursor jumps in parent alias field

### version 3.38.3
*Released*: 17 April 2024
- Issue 50031: Update permission check and container path for saving updates to storage labels

### version 3.38.2
*Released*: 12 April 2024
- Issue 50069: Editing amounts of sample results in weird value
- Issue 50010 Time picker enters the wrong time if a time field has a format set or if there is an additional parsing.
- Issue 50102: When bulk updating a time-only field and entering a value with PM results in the AM time being selected.
- Issue 48328: Starting to make Biologics use the same Sample Manager help links.

### version 3.38.1
*Released*: 11 April 2024
- Update product menu DOM structure to better support flex layout container/item paradigm.
- Use flex layout both horizontally (row-wise) across the product and vertically (column-wise) within each section column.
- Scroll within dynamic menu sections leaving the section headers position constant.
- Apply a "no-scroll" CSS class to the document body when product navigation is open. This prevents page scrolling.

### version 3.38.0
*Released*: 10 April 2024
- Add ability for users to choose colors associated with sample statuses
  - Update `ColorPickerInput` to accept optional list of default colors
  - Update `ColorPickerInput` to not close automatically when a color is chosen
  - Update `ManageSampleStatusesPanel` to include a `ColorPickerInput`
  - Update `SampleState` model with color field

### version 3.37.7
*Released*: 9 April 2024
- Add setSelected() to QueryAPIWrapper

### version 3.37.6
*Released*: 9 April 2024
- Improve-cross project actions - Derivations, Aliquots, and Pooling
  - modify getAppHomeFolderPath to not require container, export getAppHomeFolderId
  - modify getSelectedParents to respect container insert permission
  - distinguish SampleCreationType.Independent from SampleCreationType.FromSources

### version 3.37.5
*Released*: 4 April 2024
- ChartBuilder fix for tests (createNotification not defined) and JS error (onHide to handle evt parameter

### version 3.37.4
*Released*: 3 April 2024
- Merge from release24.4-SNAPSHOT to develop
    - includes changes from 3.36.1 #1463

### version 3.37.3
*Released*: 2 April 2024
- Introduce `autoInit` prop on `QuerySelect` that allows for users to skip initialization.
- Default `autoInit` to `process.env.NODE_ENV !== 'test'`.

### version 3.37.2
*Released*: 1 April 2024
- Issue 49956: Update styling of `PreviewOption` to not truncate text

### version 3.37.1
*Released*: 1 April 2024
- Issue 49394: Fix storage permission check for folders further down the hierarchy
- Issue 49908: use project folder for checking storage designer permissions

### version 3.37.0
*Released*: 1 April 2024
- Reload EntityInsertPanel LookupCell on targetContainer change

### version 3.36.1
*Released*: 2 April 2024
- Cache assay protocol requests on the client. Uncache when assay definitions are uncached.
- Hack usage of `menuShouldScrollIntoView` in `SelectInput` to recalculate menu positioning after initial load.

### version 3.36.0
*Released*: 30 March 2024
- Introduce `pivotColumn` query metadata section for applying metadata to pivot-generated query columns
- Add hit selection summary queries to schema constants

### version 3.35.0
*Released*: 29 March 2024
- Chart builder in app: App initial create chart modal
  - add experimental flag and update Chart menu for when to show Create Chart item
  - ChartBuilderMenuItem with modal for defining a new chart, selecting type, measures, and chart preview
  - save chart from chart builder modal and reload model charts after save

### version 3.34.1
*Released*: 27 March 2024
- Sample Finder: Show all fields in Properties modals
  - add QueryAPIWrapper.getDefaultVisibleColumns util
  - fix multi value indicator for inexpdescendantsof operators

### version 3.34.0
*Released*: 26 March 2024
- Package updates

### version 3.33.1
*Released*: 26 March 2024
- AssayImportPanels: Pass Plate Set ID to onComplete

### version 3.33.0
*Released*: 26 March 2024
- Add EditorModel.getColumns() function

### version 3.32.1
*Released*: 22 March 2024
- EditableGrid updates for add/move to multiple targets updates
  - support full editable grid bulk update without checkbox selection
  - add saveBtnClickedCount prop to allow buttons defined outside the grid notify grid of appropriate actions
  - add gridTabHeaderComponent and bulkTabHeaderComponent to allow additional header items, such as BoxFillOptions

### version 3.32.0
*Released*: 21 March 2024
- Update `OperationConfirmationData` model and `getOperationConfirmationData` to account for permission checks as well

### version 3.31.0
*Released*: 21 March 2024
- Issue 49870: Add password strength gauge to Change Password modal

### version 3.30.0
*Released*: 19 March 2024
- Don't use Row, Col, or Panel from react-bootstrap
  - There are two minor exceptions for Panel usages in the domain editor, these will be resolved in a later PR

### version 3.29.0
*Released*: 19 March 2024
- Updates to allow moving from multiple folders into one

### version 3.28.0
*Released*: 13 March 2024
- Consolidate logic for generating filters for editable grid cell lookups into `getLookupFilters()` utility
- Refactor `LookupCell` to a functional component
- Export `QueryLookupFilterGroup` and `QueryLookupFilterGroupFilter` types

### version 3.27.2
*Released*: 12 March 2024
- Issue 48535: Filter columns shown when expanding lookup columns for customization
- Issue 49868: Impose limit of 1000 on number of ids to find with Find Samples feature

### version 3.27.1
*Released*: 12 March 2024
- Merge from release24.3-SNAPSHOT to develop
    - includes changes from 3.24.7 #1435
    - includes changes from 3.15.8 #1437
    - includes changes from 3.15.9 #1439
    - includes changes from 3.24.10 #1443
    - includes changes from 3.24.11 #1444

### version 3.27.0
*Released*: 11 March 2024
- Add support for comments during edit actions
  - Remove title from timeline comment tooltip
  - Update `CommentTextArea` with additional props and callback interface
  - Update `EditableDetailPanel` and `DiscardConsumedSamplesPanel` to move commenting into the sticky button footer
  - Update `Modal` and `ModalButtons` components to support including the `CommentTextArea`

### version 3.26.1
*Released*: 7 March 2024
- Support column sizing for editable grid

### version 3.26.0
*Released*: 6 March 2024
- Add Tabs and Tab components
- Replace usages of react-bootstrap Tabs/Tab

### version 3.25.2
*Released*: 5 March 2024
- Merge release24.3-SNAPSHOT to develop:
    - includes changes from 3.24.7

### version 3.25.1
*Released*: 5 March 2024
- Issue 49801: Lineage: Display hierarchy of nodes by "level"

### version 3.25.0
*Released*: 4 March 2024
- Issue 45315: Allow inferDomainFromFile to take file path string in addition to File prop
- Issue 49795: App grid column header title to show for all columns instead of just lookups

### version 3.24.7
*Released*: 1 March 2024
- Lineage Settings: fix input change handling

### version 3.24.12
*Released*: 16 May 2024
- Issue 49956: Backport of styling update for PreviewOption for QuerySelect

### version 3.24.11
*Released*: 8 March 2024
- Issue 49858: LKSM: Saving grid filter on Storage Status takes 5+ minutes to load grid
  - Don't include view filters for getRows call

### version 3.24.10
*Released*: 7 March 2024
- Issue 49835: App Workflow task value not saving when starting from assay "Import Data" page

### version 3.24.9
*Released*: 5 March 2024
- EditableGrid: Support barcode scanners "streaming" input keys

### version 3.24.8
*Released*: 5 March 2024
- Issue 49274: App to use chevron arrows instead of plus/minus for expand/collapse (part 2)

### version 3.24.7
*Released*: 1 March 2024
- Lineage Settings: fix input change handling

### version 3.24.6
*Released*: 29 February 2024
- Mark project settings as dirty after title change

### version 3.24.5
*Released*: 29 February 2024
- Issue 49804: Fix grid style

### version 3.24.4
*Released*: 29 February 2024
- Fix form input layout
- Remove `col-md-` and align on `col-sm-9 col-xs-12`
- Consolidate default input classNames into constants

### version 3.24.3
*Released*: 29 February 2024
- Issue 49763: App to suppress "Plate Metadata" setting on assay designs when not applicable
- Issue 49274: App to use chevron arrows instead of plus/minus for expand/collapse

### version 3.24.2
*Released*: 28 February 2024
- Update EditableGrid to use alternative row background style
- Fix start-link

### version 3.24.1
*Released*: 27 February 2024
- Issue 49639: Update more info link in admin page
- Remove extraneous horizontal line in User menu when not logged in
- Issue 49428: Add dirty page warning for createProject page
- Issue 49679: change AppURL.create to not throw an exception in production mode when there are empty parts

### version 3.24.0
*Released*: 26 February 2024
- Add Modal
- Delete LoadingModal
- Delete ConfirmModal

### version 3.23.0
*Released*: 23 February 2024
- Google Analytics Improvements
    - Move files from ui-components to ui-premium
    - Use <Page/> component that passes new analytics titles

### version 3.22.2
*Released*: 19 February 2024
- Issue 49352: Breadcrumb fix to remove CSS content and replace with new `<li>` separator
- Issue 48834: Lineage detail panel to use table-layout auto instead of fixed

### version 3.22.1
*Released*: 15 February 2024
- Support date/time fields for all domain kinds
  - Enable date and time field type for all domain kinds
  - Update DatePickerInput to support inline edit mode
  - Update EditInlineField to use DatePickerInput for date/time type query column

### version 3.22.0
*Released*: 15 February 2024
- Issue 49418: When exporting, include any query parameters from model
- Issue 49602: Update wording in audit settings help tip
- Issues 49634 and 49629: Update behavior for saved views that include query filters
- Issue 49402: Implement new default Sample Status when discarding samples from storage
- Issue 49639: Remove reference to the product name in API Keys panel.

### version 3.21.0
*Released*: 14 February 2024
- Refactor ProductMenu, ServerNotifications, ProductNavigation, FilterExpressionView to no longer use DropdownButton
- Update styling for ServerNotifications, ProductNavigation

### version 3.20.3
*Released*: 14 February 2024
- Merge release24.2-SNAPSHOT to develop:
    - includes changes from 3.15.3

### version 3.20.2
*Released*: 13 February 2024
- Date and Time fields polish
  - Fix app editable grid with 'aa' time format
  - Fix date picker time picker with 'MMMM dd yyyy HH:mm:ss'
  - Fix editable grid date/datetime field level format

### version 3.20.1
*Released*: 13 February 2024
- Issue 49612: Handle ending drag action "mouse up" outside the editable grid

### version 3.20.0
*Released*: 13 February 2024
- Plate Set assay import
  - AssayImportPanels to use plateSet id in URL and to show Plate Set select instead of Plate select in input form
  - App editable grid assay import to filter plate by selected plate set
  - Hide PlateTemplate field from assay designer Run Domain fields in app

### version 3.19.0
*Released*: 12 February 2024
- DisableableMenuItem: change operationPermitted prop to disabled
  - not just a rename, this inverts the expected value
- Add DropdownSection
  - Replaces SubMenuItem, but outputs DOM structure expected by Bootstrap
- Add DropdownWithSections
  - Replaces SubMenu, but outputs DOM structure expected by Bootstrap
- ResponsiveMenuButton:
  - use DropdownSection
  - remove id prop
  - add className prop
- Remove SubMenu
- Remove SubMenuItem
- Remove getMenuItemsForSection (unused)
- Remove getMenuItemForSectionKey (unused)

### version 3.18.1
*Released*: 9 February 2024
- Issue 48776: Suppress import parent aliasing for media Mixture Batches
- Resolve sample type `category` in `SampleTypePropertiesPanel` and display add parent alias button accordingly.
- Use API wrappers in `SampleTypePropertiesPanelImpl`.
- Add `getValidPublishTargets` to `DomainPropertiesAPIWrapper`. Update to return a `Container[]` instead of `List<Container>`.

### version 3.17.2
*Released*: 8 February 2024
- Issue 49560: User permissionsList to default to undefined instead of empty array

### version 3.17.1
*Released*: 6 February 2024
- Merge release24.2-SNAPSHOT to develop:
  - includes changes from 3.15.1 and 3.15.2

### version 3.17.0
*Released*: 6 February 2024
- Issue 45256: Support "formattedValue" for display
- Switch arguments to `resolveDetailFieldValue` to optionally resolve `formattedValue` and `displayValue`.
- Introduce `resolveDetailFieldLabel` to make it more clear what is being resolved when reading a usage.

### version 3.16.0
*Released*: 2 February 2024
- Issue 49440: User may not be in the core.Users table (if permission was removed), so check the core.SiteUsers table as well

### version 3.15.3
*Released*: 12 February 2024
- Issue 49569: Remove direct use of `LabelOverlay` for `TextChoiceInput` `SelectInput` usage

### version 3.15.2
*Released*: 6 February 2024
- Merge release23.11-SNAPSHOT to release24.2-SNAPSHOT:
  - includes changes from 2.390.6

### version 3.15.1
*Released*: 2 February 2024
- Issue 49502: StoredAmount and Units for samples editable grid to use display values instead of raw values

### version 3.15.0
*Released*: 31 January 2024
- Support Date-only or Time-only fields
  - add container.format.timeFormat
  - add date and time fields as allowed domain field types
  - update ConfirmDataTypeChangeModal to allow date/time type convert
  - modify DatePickerInput/DateInputCell to support time-only fields
  - wire up time-only fields for QueryFormInputs, DetailDisplay, FilterExpressionView and editable grid
  - add util for parsing/formatting time only fields

### version 3.14.0
*Released*: 31 January 2024
- RReport: Render errors encountered when running the R Report

### version 3.13.0
*Released*: 31 January 2024
- Issue 49481: Domain designer issue if the field index changes (reordering fields), we need to update the validValues state
- Issue 49439: filter out inactive users from insert and update form query selects
- Issue 49502: If the Editable Grid lookup cell is a measurement unit, then we need to use the unit's display value
- Issue 49383: App error when a folder admin access profile page from a child folder
- Issue 49417: App user details modal to show above the app header details popover

### version 3.12.0
*Released*: 30 January 2024
- Issue 49507: add `convertUnitsForInput` to avoid commas in editable grid

### version 3.11.1
*Released*: 29 January 2024
- Issue 49378: use the default view if a view doesn't exist

### version 3.11.0
*Released*: 29 January 2024
- Remove MultiMenuButton
  - it was unused
- Add DropdownButton
- Add DropdownAnchor
- Add SplitButton
- Add MenuItem
- Add MenuHeader
- Add MenuDivider
- Update usages of react-bootstrap DropdownButton, SplitButton, MenuItem to internal versions
- ManageDropdownMenu: remove all props

### version 3.10.0
*Released*: 26 January 2024
- Add `AuditSettings` panel for configuring whether user comments are required for data changes
- Add `CommentTextArea` as a general component for entering reasons for data changes
- Add `useDataChangeCommentsRequired` hook to retrieve the setting for whether comments/reasons are required

### version 3.9.1
*Released*: 26 January 2024
- Add metric for shift-select usage.
- Update the `SampleStatusTag` component to use app/server context.

### version 3.9.0
*Released*: 23 January 2024
- Add `api.security.getUsersWithPermissions` to `SecurityAPIWrapper`
- Display internal component request errors via placeholder in `UserSelectInput`. Disable on error.
- Use `async` pattern for requests from `UserDetailsPanel`

### version 3.8.1
*Released*: 23 January 2024
- Add optional `onBeforeUpdate` to `EditableDetailPanel`
- Add `plate.PlateType` to schema constants

### version 3.8.0
*Released*: 18 January 2024
- Sample Type exclusions from Dashboard Insights charts
  - support for DashboardSampleType as a data type exclusion for projects
  - support for DashboardSampleType as a data type exclusion for sample type designer
  - ProjectDataTypeSelections panelTitle, panelDescription, and showUncheckedWarning
  - DataTypeSelector to load via useFolderDataTypeExclusions hook
  - AdminSettingsPage to show Dashboard data type exclusions panel when no projects configured
  - CreateProjectPage and ProjectSettings to show Dashboard data type exclusions panel
  - Dashboard chart config update to getProjectExclusionFilter to account for an array of exclusion types
  - changes sample chart configs to exclude based on both 'SampleType' and 'DashboardSampleType' exclusions
  - add sampleTypeDataType to AppAdminContext

### version 3.7.2
*Released*: 17 January 2024
- Remove experimental feature flag for R report capabilities

### version 3.7.1
*Released*: 17 January 2024
* Update `EntityIdCreationModel.postEntityGrid` to accept optional `containerPath`
* Issue 49414: Add prop in EntityDataType to indicate if cross-type import is supported

### version 3.7.0
*Released*: 16 January 2024
- RReport: use dataRegionName
  - Fixes Issue 49348
- Add OverlayTrigger and useOverlayTriggerState
  - internal version to be used in place of the react-bootstrap version
- Add Tooltip
  - internal version to be used in place of the react-bootstrap version
- Add Popover
  - internal version to be used in place of the react-bootstrap version
- Update Tip to use internal implementations of OverlayTrigger and Tooltip
- Update LabelOverlay to use internal implementations of OverlayTrigger and Popover
- Change LabelHelpTip to use internal implementations of OverlayTrigger and Popover
- Update DisableableButton to use internal version of Popover and useOverlayTriggerState
- LabelOverlay: remove canMouseOverTooltip prop

### version 3.6.0
*Released*: 15 January 2024
- Publicly export `PlacementType`
- Add `allowExport` prop on `EditableGridPanel`
- Add `plate.PlateSet` to schema constants
- `entity.getDeleteConfirmationData`: support containerPath

### version 3.5.5
*Released*: 15 January 2024
- Multi-Parent Matching in Sample Finder
    - add support for NOT_IN_EXP_DESCENDANTS_OF_FILTER_TYPE and IN_EXP_ANCESTORS_OF_FILTER_TYPE
    - show equals all for parent card id columns

### version 3.5.4
*Released*: 11 January 2024
- Refactor all UNSAFE_ usages

### version 3.5.3
*Released*: 11 January 2024
- Language Consistency: 'My' vs. 'Your' and 'Shared' vs. 'Public'

### version 3.5.2
*Released*: 11 January 2024
* Make menuReload action actually reload the menu
* Use menuReload action in registerWebsocketListeners

### version 3.5.1
*Released*: 10 January 2024
* Merge release24.1-SNAPSHOT to develop:
    * includes changes from 3.2.5

### version 3.5.0
*Released*: 9 January 2024
- Add API Keys panel to profile page
- Update QueryInfoForm to optionally not have the buttons stick to the bottom.
- Update SecurityApi with `createApiKey` and `deleteApiKeys` actions

### version 3.4.0
*Released*: 8 January 2024
- Support cross-folder delete
  - Refactor InsertRowsResponse, UpdateRowsResponse and DeleteRowsResponse into QueryCommandResponse
  - add deleteRowsByContainer util

### version 3.3.0
*Released*: 3 January 2024
- Update `Alert` to accept additional props and match behavior of `react-bootstrap`.
- Introduce `DisableableAnchor` which is an `a` tag that supports `disabled`.
- Replace all other usages of `Button` with `button` or `a` in the case where `href` is supplied.

### version 3.2.5
*Released*: 9 January 2024
- Issue 49357: Fix error in editable grid when checking for values on undefined set

### version 3.2.4
*Released*: 29 December 2023
- remove AliquotedFrom from samples grid export/editable grid export
- Issue 49082: remove QueryModel from localStorage on error

### version 3.2.3
*Released*: 29 December 2023
- Issue 41718: Domain Designer List Field Imports should observe auto-increment fields

### version 3.2.2
*Released*: 27 December 2023
- Bump @labkey/build
- Replace Immer `Draft<Type>` with `produce<Type>` as the former declaration pattern can cause compilation problems.

### version 3.2.1
*Released*: 27 December 2023
- Support cross-folder sample import
  - add util for check isCrossProjectImportEnabled

### version 3.2.0
*Released*: 22 December 2023
- Add support for searching or storage locations

### version 3.1.2
*Released*: 22 December 2023
* update package.json to pin devDependencies versions by dropping tilde
  * this fixes the @types/react version mismatch between the packages and apps with start-link

### version 3.1.1
*Released*: 21 December 2023
* withQueryModels: fix issue when operating outside of a React Router context

### version 3.1.0
*Released*: 21 December 2023
- Change `domain` and `security` API wrappers to use `selectRows`
- Update `api.security.getAuditLogDate` to not need to specify additional columns
- Update `GroupDetailsPanel` to use API wrapper from context
- Improve typings of `SecurityAPIWrapper`

### version 3.0.1
*Released*: 21 December 2023
- Rehydrate the package-lock.json for the components package

### version 3.0.0
*Released*: 20 December 2023
* Breaking Changes:
  * Upgrade react-router dependency to react-router-dom version 6.x
    * If you use react-router you will need to upgrade
    * If you have history pinned in your dependencies you should remove it
  * withQueryModels updated to be compatible with React Router 6.x

* Other Changes:
  * Note: all other changes listed here have to do with our upgrade of React Router, they're not considered breaking because they are all on our internal APIs which you should not be using
  * URL helpers:
    * use ReactRouter SetURLSearchParams instead of InjectedRouter and Location
    * remove resetParameters
    * remove Location type
    * add getQueryParams
  * Update components to use React Router Hooks
  * Don't export UsersGridPanel or PermissionAssignments
  * AppRouteResolver: fetch now returns Promise<AppURL> instead of Promise<AppURL | boolean>
  * SubNav is no longer exported
  * Removed unused constants
    * SECURITY_LOGOUT
    * SECURITY_SERVER_UNAVAILABLE
    * SECURITY_SESSION_TIMEOUT
  * Removed RoutingTableState and RoutingTableReducers
  * Removed withRouteLeave
  * useRouteLeave: remove `router` and `routes` props

### version 2.399.1
*Released*: 19 December 2023
- Update @labkey/api and use moveRows() function
- Include fix for Issue 49164: Datepicker in editable grid needs to account for the sticky footer when at the bottom of the grid

### version 2.399.0
*Released*: 15 December 2023
- Consolidate move entities to MoveRowsAction in query controller
  - update API call controller and actions and update params to match new moveRows API format

### version 2.398.0
*Released*: 14 December 2023
- In-app messaging for product updates
  - Add `ReleaseNote` component
  - Updated Help icon to be a menu

### version 2.397.2
*Released*: 13 December 2023
- Issue 49237: From app settings page, set defaultDateFormat whenever defaultDateTimeFormat is changed

### version 2.397.1
*Released*: 13 December 2023
- Issue 49086: Add onChange callback for AssayTaskInput to fix some initialization timing issues

### version 2.397.0
*Released*: 12 December 2023
* Add `getPermissionRestrictionMessage` utility method.

### version 2.396.3
*Released*: 12 December 2023
- Issue 49199: Field Editor name input fix for jumping cursor to end of input
  - Regression from change to this.setState and this.props.onChange call sequence from https://github.com/LabKey/labkey-ui-components/pull/1273
  - Also include minor fix for row/col display issue on permission assignments app page (issue 48895)

### version 2.396.2
*Released*: 11 December 2023
- Secure Issue 49250: BarTender: CSP parsing of the Service URL fails for relative and partial URIs

### version 2.396.1
*Released*: 7 December 2023
- Issue 49005: Field editor assigning a lookup to exp.Materials then switching to Samples type should retain schema/query for lookup

### version 2.396.0
*Released*: 1 December 2023
- FormsyReactComponents.tsx fix for handling of rowClassName prop

### version 2.395.4
*Released*: 30 November 2023
- Adds support for shift-select across multiple rows in any components that leverage `GridPanel` or `EditableGrid`

### version 2.395.3
*Released*: 30 November 2023
- Issue 49148: use LabelOverlay as label for TextChoiceInput fields
- Issue 49111: resolve URLs for workflow jobs to app URLs

### version 2.395.2
*Released*: 29 November 2023
- Issue 49113: Better handling for ListDesignerPanels case where the only error is a form error for saveDomain()
- Include DomainException class in index.ts
- Further usage of scrollDomainErrorIntoView() in DataClassDesigner

### version 2.395.1
*Released*: 28 November 2023
* Merge release23.11-SNAPSHOT to develop:
    * includes changes from 2.390.5

### version 2.395.0
*Released*: 23 November 2023
- Happy Thanksgiving!
- Provide logically equivalent implementations for some `formsy-react-components` components. Only props that are used or are useful are supported (e.g. `changeDebounceInterval` is not supported).
- Replace all usages of `formsy-react-components` components within the `@labkey/components` package with internal equivalent components.
- Remove `formsy-react-components` dependency

### version 2.394.1
*Released*: 22 November 2023
* Issue 48817: Update some wording in the NameIdSettings panel

### version 2.394.0
*Released*: 22 November 2023
* Assay Transform Script UX update
  * AssayPropertiesInput update for transform script display and allowing add via file drop (places files in @scripts dir)
  * AttachmentCard updates to support description and use getIconFontCls for default iconFontCls based on name
  * WebDav update to add uploadWebDavFileToUrl() and support overwrite param, default true
  * Issue 49087: When the save of an assay run failsin the apps, the error message is hidden behind the sticky buttons at the bottom

### version 2.393.2
*Released*: 15 November 2023
* Merge release23.11-SNAPSHOT to develop:
    * includes changes from 2.390.3 and 2.390.4

### version 2.393.1
*Released*: 10 November 2023
* Improve cross-project actions: Import job notifications
  * Use the Query.ContainerFilter.allInProject container filter in getUserNotifications API call and PipelineJobsPage queryConfig

### version 2.393.0
*Released*: 10 November 2023
- Replace all usages of `RootMaterialLSID` with `RootMaterialRowId`

### version 2.392.2
*Released*: 8 November 2023
* Issue 48999: Unable to "Select them in the grid" when created trigger script runs after samples are added
   * Add reselectRowCounts to InsertRowsResponse

### version 2.392.1
*Released*: 8 November 2023
* Merge release23.11-SNAPSHOT to develop:
    * includes changes from 2.390.1 and 2.390.2

### version 2.392.0
*Released*: 7 November 2023
* Remove utils/global.ts, which removes initBrowserHistoryState and getBrowserHistory
* URL.ts:
  * Add `router` and `location` arg to util methods and update usages
    * Remove getLocation, update usages to use react-router instead
* UsersGridPanel: use withRouter instead of directly listening to URL changes via history

### version 2.391.2
*Released*: 4 November 2023
* Issue 48751: LKSM/LKB: Respect sort order of sources or samples for lineage sample creation
  * Add saveOrderedSnapshotSelection util

### version 2.391.1
*Released*: 2 November 2023
* Issue 48804: Scroll error message at bottom of domain designer into view
* fix `FormButtons` handling of single child case

### version 2.391.0
*Released*: 1 November 2023
* Issue 48828: Don't show sample insights panel while editing in the grid
  -  add `onEditToggle` optional prop for `SampleTabbedGridPanel`

### version 2.390.6
*Released*: 5 February 2023
* Issue 49589: LKSM/LKB: More jumping behavior on Chrome & not Firefox

### version 2.390.5
*Released*: 27 November 2023
* Issue 49155: Get proper raw value for measurement units in grid

### version 2.390.4
*Released*: 10 November 2023
* Fix for reportId url param check in locationHasQueryParamSettings

### version 2.390.3
*Released*: 9 November 2023
* Issue 49074: We support move operations for assays as well as delete, but don't need to check references for move
* Issue 49077: Remove tool tip indicating assay designs cannot be renamed.

### version 2.390.2
*Released*: 6 November 2023
* Issue 49019: Grid session filters/sorts/etc. are not applied as expected when model loads queryInfo from API instead of cache
  * the additional render cycle from the query details API call causes the withQueryModels componentDidUpdate to detect a URL param change and then remove the filters/sorts/etc. that were just applied from the session state

### version 2.390.1
*Released*: 3 November 2023
- Issue 48836: Update `URLResolver.resolveLineageItem` to resolve the name of the data type from the query name

### version 2.390.0
*Released*: 31 October 2023
* Issue 41677: Include single field uniqueness constraint option in field editor
  * Add domain kind property for allowUniqueConstraintProperties
  * Add new checkbox option to the field Advanced Settings dialog
  * DomainField update to serialize and de-serialize the "uniqueConstraint" prop based on the DomainDesign "indices"

### version 2.389.0
*Released*: 31 October 2023
- getUsersWithPermissions: Add optional includeInactive flag

### version 2.388.2
*Released*: 31 October 2023
- Issue 48961: Make sure Name (id) fields are shown, but read-only, in editable grids for update

### version 2.388.1
*Released*: 30 October 2023
* ToggleButton updates
  * ImportDataFilePreview update to remove usage and replace with a checkbox
  * QueryInfoForm fix for ToggleIcon alignment with various form input types

### version 2.388.0
*Released*: 27 October 2023
- Remove dependency on `react-redux`
- Remove configuration of `Provider` and `Router` from `AppContexts`

### version 2.387.0
*Released*: 27 October 2023
- Issue 48969: add loadAllQueryInfos method to withQueryModels actions
- Update ExportModal to show all system views (prefixed by ~~) as 'Default'
- Update ExportModal to pre-select models with counts > 0 when using `tabRowCounts`

### version 2.386.0
*Released*: 26 October 2023
- Add ability to create, edit, and delete sample, source, and assay domains from subfolders
- export new `isSharedDefinition` method in `App` object
- Issue 48921: Use sort order from model for printing labels

### version 2.385.0
*Released*: 25 October 2023
- EditableGrid: Add more specific classNames to button bar buttons
- EditableDetailPanel: Use FormButtons
- DetailPanel/EditableDetailPanel: Remove actions prop
- DetailPanelHeader: convert to FC, simplify props, render panel-heading div

### version 2.384.0
*Released*: 25 October 2023
* remove react-bootstrap-toggle dependency from @labkey/components
* remove ToggleWithInputFields.tsx and replace usages with ToggleButtons or ToggleIcon components
* remove unused CustomToggle.tsx component

### version 2.383.2
*Released*: 23 October 2023
* AssayImportPanels.tsx fix for grid cell updates to use applyEditableGridChangesToModels()

### version 2.383.1
*Released*: 20 October 2023
- Assay Design Rename
  - enable rename on assaydesign update mode for gpat assays
  - Use new assayauditevent for assay audits

### version 2.383.0
*Released*: 19 October 2023
* Issue 48347: Update field editor "User" data type to allow lookup validator option

### version 2.382.2
*Released*: 18 October 2023
- Issue 48901: R Reports not filtering runs in assay

### version 2.382.1
*Released*: 18 October 2023
- Issue 48855: Update @labkey/api for better parsing of Content-Disposition header

### version 2.382.0
Released*: 18 October 2023
- Introduce `AssayAPIWrapper` to better support calls to assay endpoints from within components.
- Rename `fetchAllAssays` and `fetchProtocol` to `getAssayDefinitions and `getProtocol` respectively.
- Update `getAssayDefinitions` (formerly `fetchAllAssays`) to utilize the newly exposed `Assay.getAssays` endpoint wrapper.
- Update `withAssayModels` component to use `api.assay` in place of the `AssayLoader` pattern.
- Add `SchemaQuery.hasSchemaQuery` for more succinct comparison of `SchemaQuery` objects where it only matters if the `schemaName` and `queryName` match.
- Recognize the `plateLsid` URL parameter in `AssayImportPanels` to support selection of a plate.

### version 2.381.3
*Released*: 18 October 2023
- Issue 48854: Trim leading spaces for field values in domain forms

### version 2.381.2
*Released*: 18 October 2023
* Merge release23.10-SNAPSHOT to develop:
    * includes changes from 2.373.5

### version 2.381.1
*Released*: 16 October 2023
- Issue 48312: Update messaging for race condition when adding to storage

### version 2.381.0
*Released*: 16 October 2023
- Add helper for App.freezerManagerIsCurrentApp()
- Add containerFilter to EditableColumnMetadata
- Refactor from getOrderedSelectedMappedKeys to getOrderedSelectedMappedKeysFromQueryModel

### version 2.380.1
*Released*: 13 October 2023
- Add UI for making non-default views sharable

### version 2.379.0
*Released*: 11 October 2023
- Issue 48082: Improve verbs used when updating or merging data
- Don't pre-select False for an undefined Boolean filter field

### version 2.378.0
*Released*: 10 October 2023
- Add ModalButtons
    - Update all Modals using WizardNavButtons to use ModalButtons
- Use FormButtons
    - WizardNavButtons
    - CreateProjectPage
    - GroupAssignments
    - QueryInfoForm
    - PermissionAssignments
    - AssayImportPanels
- Simplify props for WizardNavButtons
    - Many props weren't used, or weren't needed
- Fix scrollbar issues on Projects and Permissions Pages
- Fix scrollbar issues with menu-section

### version 2.377.0
*Released*: 10 October 2023
- Issue 48814: Counts in tabs don't always have commas
- Issue 48818: Update BarTender Label configuration to not use toggle selector

### version 2.376.0
*Released*: 9 October 2023
* Issue 48287: Improve behavior for Picklist buttons
  * Don't check sample status before adding to picklists since there is no restriction for picklists
  * Limit the number of samples that can be added at one time

### version 2.375.3
*Released*: 6 October 2023
- Issue 48240: Assay Result field creation using JSON file results in lookup failure

### version 2.375.2
*Released*: 5 October 2023
- Choose a default filter for field types that don't offer text choices

### version 2.375.1
*Released*: 4 October 2023
* Show SourceID on SourceEvents Audit Table
  * Added DATACLASS_DATA_UPDATE_AUDIT_QUERY for Biologic audit logs

### version 2.375.0
*Released*: 4 October 2023
- Rename `LabelPrintingProviderProps` to `LabelPrintingContext`. Rename `LabelPrintingProvider` to `LabelPrintingContextProvider`.
- Add `createLabelTemplateList` to APIWrapper
- Streamline request creation and error handling in APIWrapper
- Add error handling to `LabelPrintingContextProvider`
- Update `BarTenderSettingsForm` to no longer use `withLabelPrintingContext` as this component does not rely on label context. Improve loading/error rendering.
- Remove `withLabelPrintingContext`

### version 2.374.2
*Released*: 4 October 2023
* Merge release23.10-SNAPSHOT to develop:
    * includes changes from 2.373.4

### version 2.374.1
*Released*: 2 October 2023
* Issue 48709: Choose date on month change instead of just highlighting it

### version 2.374.0
*Released*: 2 October 2023
* Add FormButtons component
* BaseDomainDesigner: use FormButtons
* Domain Designer components: remove useTheme and successBsStyle props
* Add isApp and getSubmitButtonClass util methods

### version 2.373.4
*Released*: 2 October 2023
* Issue 48781: LKSM/LKB: Groups using wrong icon

### version 2.373.5
*Released*: 12 October 2023
* Issue 48377: Account for read only cells when pasting in EditableGrid

### version 2.373.4
*Released*: 2 October 2023
* Issue 48781: LKSM/LKB: Groups using wrong icon

### version 2.373.3
*Released*: 2 October 2023
* add some keys to Fragments to get rid of warnings about missing keys

### version 2.373.2
*Released*: 29 September 2023
* AuditQueriesListingPage: load via withQueryModels

### version 2.373.1
*Released*: 29 September 2023
* Update help text for alias fields in support of defaulting to using the aliases as parents when inserting entities

### version 2.373.0
*Released*: 27 September 2023
- Projects Administration Improvements
   - Changed UserMenu to UserMenuGroup: split user items to into help, admin and user sections.
   - Admin page header and navbar updates
     - updated style, removed notification and search, removed folder menu, updated subnav
   - Added WithDirtyCheckLink and VerticalScrollPanel component to support side by side panels
   - AdminSettingsPage updates
     - Removed project level settings: name/label, data type exclusion, freezer exclusion
     - Add support for viewing/updating Home level application setting from child project
   - ProjectManagementPage updates
     - Added ProjectListing component and related utils to support project selection
     - Allow cross folder project setting view/update
     - Support project settings as well as certain application setting folder override
   - PermissionManagementPage updates
     - Removed BasePermission
     - Updated ProjectManagementPage from grid to side to side project/setting layout and support cross folder view/update
     - Support ApplicationAdminPermission update on the same panel with project level permissions.
   - Moved ProtectedDataSettingsPanel and RequestsSettingsPanel from Biologics to components
- Issue 48623: LKSM: revert to initial sampleCount or rootSampleCount when updating fails

### version 2.372.0
*Released*: 27 September 2023
- Add container filter to `PROJECT_AUDIT_QUERY` configuration and filter by `projectId` to get desired results.
- Support displaying `children` in `AuditDetails` component for displaying error/loading state.
- Display dropdown indicator on date cells in `EditableGrid`.
- Update `DatePickerInput` to expose `onCalendarClose` and use to handle selecting a date cell after the calendar has closed.
- Update `UserLink` to not attempt to fetch details for negative `userId` values (as you might find in the audit log)

### version 2.371.0
*Released*: 25 September 2023
* Render file output in R Reports
* Improve Chart Styling

### version 2.370.0
*Released*: 21 September 2023
- Package updates
- Remove `yarn.lock` and introduce `package-lock.json`
- Update scripts to refer to use `npm`
- Update documentation to refer to `npm` instead of `yarn`. Rewrite portions that describe versioning process steps.
- Update lint process to use `npm`

### version 2.369.2
*Released*: 21 September 2023
- Sample type RootMaterialLSID refactoring

### version 2.369.1
*Released*: 21 September 2023
- Remove “Plate Metadata” field in Assay Import Wizard

### version 2.369.0
*Released*: 21 September 2023
* `QueryModel`: add `useSavedSettings` flag
* `QueryModel`: serialize `maxRows` to URl when using `bindURL`
  * Serialized as `pageSize` to match the page offset param
* `withQueryModels`: honor `useSavedSettings` flag

### version 2.368.2
*Released*: 14 September 2023
- Issue 48458: remove duplicate processing of combined nodes.
- Issue 48459: sort items in `DetailsListLineageItems` by name

### version 2.368.1
*Released*: 14 September 2023
- Add missing toLocaleString() calls

### version 2.368.0
*Released*: 14 September 2023
- Issue 48610: app grid column header <th> element to trigger click on child <div>
- Issue 48283: app megamenu does not close after choosing a project icon (i.e. dashboard or settings)
- Issue 48196: if the domain column has been setup with a "url" prop, use it in the EditInlineField value display

### version 2.367.1
*Released*: 13 September 2023
* Merge release23.9-SNAPSHOT to develop:
    * includes changes from 2.364.1 and 2.364.2

### version 2.367.0
*Released*: 11 September 2023
**Customize View**
- Factor `ColumnSelectionModal` out of `CustomizeGridViewModal` to share implementation of column set selection modal with plate customization.

**EditableGrid**
- Introduce `EditableGridEvent` to allow for easier identification of change event/actions that are occuring
- Update `EditableGridChange` to specify the `EditableGridEvent`
- Add utility methods `isDataChangeEvent` and `isSelectionEvent` to `EditorModel`

**QueryInfo**
- Update `getQueryDetails` to accept either `schemaName/queryName` or `schemaQuery` and have it be enforced by the typings.
- Update `getQueryDetails` to always use `method: 'POST'` as certain arguments are supported as Arrays (e.g. `fields`).
- Update `getQueryDetails` to extend `Query.GetQueryDetailsOptions` to support the `fields` parameter. This parameter allows for explicitly requesting columns to be on the `QueryInfo` that may otherwise not be included in any of the associated views.
- Update `getQueryDetailsCacheKey` and `invalidateQueryDetailsCache` to include specified `fields` in the cache key.
- Change `invalidateQueryDetailsCache` to, by default, invalidate all cache keys associated with the specified `schemaQuery`. Previously, only explicit matches plus container insensitive matches were invalidated. An `exactKeyMatch` argument has been added for removal of only exact matches (defaults to false).

**QueryModel**
- Introduce new `requiredColumnsAsQueryInfoFields` setting that will request `requiredColumns` on the model as `fields` on the associated `queryInfo`. Defaults to false.

**Domain**
- Update `fetchDomainDetails` endpoint wrapper to extend `Domain.GetDomainDetailsOptions`
- Update `saveDomain` endpoint wrapper to take options

### version 2.366.1
*Released*: 11 September 2023
- Issue 48542: Update layout and message when discarding after changing status

### version 2.366.0
*Released*: 11 September 2023
- App listing page - move details panel to hover tooltip in header
  - misc styling updates for LabelHelpTip and DetailDisplay
  - add new DesignerDetailTooltip component

### version 2.365.3
*Released*: 8 September 2023
- Issue 48329: LKSM: Sample Finder query performance issues
  - Only query for a single column during loadTotalCount

### version 2.365.2
*Released*: 7 September 2023
- Issue 48252: LKSM/LKB: Editable Grid - Sparse multi-select doesn't work well with copy/paste
  - We now don't cut or copy sparse selections
-  Issue 48435: LKSM/LKB: Editable Grid - Many keyboard shortcuts delete cell contents
- Issue 48251: LKSM/LKB: Editable Grid - Shift-arrows don't select cells
- EditableGrid: Make modified arrow key shortcuts work with macOS

### version 2.365.1
*Released*: 4 September 2023
- Add SamplesTabbedGridPanelComponent to SampleTypeAppContext

### version 2.365.0
*Released*: 1 September 2023
- Add `saveDomain` to `DomainPropertiesAPIWrapper`
- Add `updateUserDetails` to `SecurityAPIWrapper`
- Export internal `BaseDomainDesigner`
- Update `EditableGrid` to account for optional `addControlProps`
- Removes `UserProvider` in favor of `useUserProperties` hook

### version 2.364.2
*Released*: 11 September 2023
- Issue 48608: Replace `/Z+/gi` characters with `xxx` when translating moment format to date-fns format
- Support partial reverse translation of `xxx` from date-fns to moment

### version 2.364.1
*Released*: 6 September 2023
- Issue 48596: ResponsiveMenuButtonGroup fix for empty button group
- Issue 48594: Show project look and feel form for starter edition too
- Issue 48607: Don't use spread operator for array construction to avoid javascript error

### version 2.364.0
*Released*: 31 August 2023
- Issue 47376: User Detail Modal - add className to be able to distinguish modal from others
- Issue 47197: Add 'Cancel' button on the group management and permissions pages

### version 2.363.0
*Released*: 30 August 2023
- protect against missing displayColumns
- Issue 48362: Add `toLocaleString` calls when rendering numbers to get thousands separators.

### version 2.362.4
*Released*: 30 August 2023
- Update interfaces for `AppContext` to include `containerFilter`

### version 2.362.3
*Released*: 30 August 2023
- Support sampleCounter naming pattern
    - Added "Naming Pattern Elements/Tokens" section to NameIdSettings
    - Updated getGenId/setGenId util to use new API
    - Added hasExistingSamples, getSampleCounter and saveSampleCounter util

### version 2.362.2
*Released*: 30 August 2023
- SVGChart: Inject containerFilter into query config returned from server
- RReport: use containerFilterName query arg

### version 2.362.1
*Released*: 29 August 2023
- Issue 47763: Remove unnecessary DataFileUrl column from requiredColumns in Assay Runs grid

### version 2.362.0
*Released*: 28 August 2023
- Render Charts above grid

### version 2.361.3
*Released*: 28 August 2023
- Issue 48364: Sample assay report SQL syntax error in WHERE clause for sample field with space in name

### version 2.361.2
*Released*: 24 August 2023
- Rename `parseTimeFormat` to `parseDateFNSTimeFormat`
- Return constant time formats for 12-hour and 24-hour time formats.

### version 2.361.1
*Released*: 24 August 2023
- EditableGrid change to allow for tabAdditionalBtn prop instead of cancelBtnProps

### version 2.361.0
*Released*: 23 August 2023
- withRouteLeave: Fix issue with not passing all withRouter props forward
- QueryInfoForm: Remove onCancel (it was unused)
- ProfilePage: Remove need for onBack/setReloadRequired, remove cancel button

### version 2.360.3
*Released*: 23 August 2023
- When loading all models, load selections if there is a way to do so.

### version 2.360.2
*Released*: 22 August 2023
- Added a `parseTimeFormat` method to determine the time format portion of a date format.
- Supply `timeFormat` parsed from the `dateFormat` for usages of `DatePicker`.

### version 2.360.1
*Released*: 21 August 2023
- Remove updateDomainPanelClassList
  - Manually toggle the necessary classname in the component instead of manually manipulationg the DOM
- Update tests to no longer attempt to make network requests

### version 2.360.0
*Released*: 21 August 2023
- Add isRReportEnabled helper
- Add RReport component
- Move SVG rendering to SVGChart component
- Make Chart render RReports and SVGCharts
- Refactor Chart to re-render when filter array changes
- Add APIWrapper for Chart
  - not exposed via context

### version 2.359.4
*Released*: 18 August 2023
- Migrated components are `DeleteConfirmationModal`, `EntityDeleteConfirmModal` and `EntityDeleteConfirmModalDisplay`.
- Add `getSnapshotSelections` and `setSnapshotSelections` to `QueryAPIWrapper`.
- Add `getDeleteConfirmationData` to `EntityAPIWrapper`.

### version 2.359.3
*Released*: 18 August 2023
- ISSUE 48479: DOM update (i.e. removeChild) errors when components update with Google Translate enabled
  - fix is to wrap conditional text elements in `<span>` tags
  - see https://github.com/facebook/react/issues/11538

### version 2.359.2
*Released*: 17 August 2023
- Update getEntityTypeOptions to allow skip project level data exception check
- Fix CF for querying data during project creation

### version 2.359.1
*Released*: 15 August 2023
- EditableGrid prop for tabContainerCls

### version 2.359.0
*Released*: 14 August 2023
- Remove xhr-mock
- Remove all xhr-mock utilities
- Convert various components to use APIWrappers or dependency injection for methods that fetch data
- Convert some tests to use shallow, preventing them from making network requests
- Delete unused test data
- incrementClientSideMetricCount: Don't make API call in test env

### version 2.358.2
*Released*: 8 August 2023
- Update parsing of duplicate key errors to account for single-field keys

### version 2.358.1
*Released*: 8 August 2023
- Issue 48367: Remove no-data styling from Sample Finder tabs

### version 2.358.0
*Released*: 8 August 2023
- GridPanel ButtonBar
  - Slightly change DOM layout to make size calculations easier
  - Do not render buttons until we've first loaded data
- Update ResponsiveMenuButtonGroup to calculate available space and render as many buttons as possible
  - Buttons that cannot fit will be rendered under a more menu
- QueryInfo: appEditableTable is no longer private
  - We need to be able to set this property for tests

### version 2.357.0
*Released*: 1 August 2023
- EditableGrid prop to hideTopControls
- EditableGrid null checks for tabBtnProps and cancelBtnProps

### version 2.356.2
*Released*: 31 July 2023
* Issue 48291: Sample Manager: bulk update form gives (Amount) must be a number error

### version 2.356.1
*Released*: 28 July 2023
- Issue 48333: When creating samples from sources, don't check sample status of parents (that aren't samples)

### version 2.356.0
*Released*: 27 July 2023
- Upon using a multi-value filter that is not BETWEEN, make value input a textarea

### version 2.355.1
*Released*: 27 July 2023
- Updates to allow sources to have parent sources

### version 2.355.0
Released*: 26 July 2023
- Introduce `SearchCategory.Plate`.
- Update various search interfaces to use `SearchCategory`

### version 2.354.1
Released*: 25 July 2023
* Merge release23.7-SNAPSHOT to develop:
    * includes changes from 2.349.6

### version 2.354.0
*Released*: 24 July 2023
* Add Project level date/time to App Settings page
  * Add ProjectLookAndFeelForm

### version 2.353.0
Released*: 21 July 2023
- Add to Storage From Grid - add preview to select location modal
  - ItemsLegend support for borderColor on HorizontalBarLegendData

### version 2.352.0
Released*: 20 July 2023
- Convert `EditorModel.selectionCells` to a `string[]`.
- Precompute new property `EditorModel.isSparseSelection`.
- Add `dragDelay` to reduce redundant render cycles when clicking on cells.
- Split out `BorderMask` properties on the `Cell` interface.
- Add and export interface for `EditableGridChange`.

### version 2.351.1
Released*: 20 July 2023
* Merge release23.7-SNAPSHOT to develop:
    * includes changes from 2.349.5

### version 2.351.0
*Released*: 14 July 2023
- Expose `inputId` prop from `react-select` on `SelectInput`
- Delete `parseDataTextToRunRows` as it is no longer utilized
- Rename `IAssayUploadOptions` to `AssayUploadOptions`
- Add devDependency on `blob-polyfill` to support `Blob` and `File` interactions within tests. Only exposed in RTL tests.

### version 2.350.5
*Released*: 13 July 2023
* Issue 48050 and 48209: Update parsing of duplicate key error messages for Postgres

### version 2.350.4
*Released*: 12 July 2023
* Merge release23.7-SNAPSHOT to develop:
    * includes changes from 2.349.4

### version 2.350.3
*Released*: 12 July 2023
- Issue 48209 and 48050: Add parsing of duplicate-key error message to try to extract the duplicate name
- Issue 48214: Update messaging on Save Grid View modal
- Issue 48224: Add 'noun' prop for empty state message

### version 2.350.2
*Released*: 7 July 2023
* Split out aliquot calculated columns by sample status
  * Show filter action values on grid for lookup columns that's not included in the current view

### version 2.350.1
*Released*: 6 July 2023
- Issue 47501: App specialty assay creation should not remove locked fields from Batch domain
  - add isDeletable() to DomainField

### version 2.350.0
*Released*: 4 July 2023
- Add `onKeyDown` event handling for `TAB` and `ESCAPE` for dropdown cells.
- Expose `onKeyDown` event handling prop on `SelectInput`.
- Introduce `showDropdownIndicator`, `showIndicatorSeparator` and `showDropdownMenu` render bits on `SelectInput`.
- Default dropdown cells to `showIndicatorSeparator=false` to better match editable grid styling.
- Fix round-tripping values within the "Alias" column on an editable grid via an `AliasGridInput` processing component.
- Introduce types of `CellCoordinates` and `GridColumnCellRenderer`.
- Update `SampleStatusInput` handling of `containerFilter` to use prop override pattern instead of `delete`.

### version 2.349.6
*Released*: 21 July 2023
* Fix Issue #48014: BarTender Test connection health check

### version 2.349.5
*Released*: 10 July 2023
* Remove BaseSearchPage and SearchForm
* Export SEARCH_PAGE_DEFAULT_SIZE, SearchPanel

### version 2.349.4
*Released*: 7 July 2023
* Add ability to customize message for useNotAuthorized hook.

### version 2.349.3
*Released*: 1 July 2023
* Issue 48188: Selecting 'All non-PHI' or 'Custom template' under 'Index each item as a separate document' doesn't persist

### version 2.349.2
*Released*: 30 June 2023
* Consolidates `internal/utils` into `editable/utils` and removes `internal/utils`.
* Move some utilities into `editable/actions` to prevent circular dependencies.
* Fix a usage of `useCallback` in `DateInputCell`.

### version 2.349.1
*Released*: 30 June 2023
* Import Samples Across Sample Types UI
  * update handleEntityFileImport() to add null check for queryInfo param

### version 2.349.0
*Released*: 29 June 2023
- Add new route key for cross-type listing pages
- export method for getting sample types and rowIds from a transactionAuditId
- Issue 48178: Fix URL resolution for sample types that start with numbers

### version 2.348.1
*Released*: 28 June 2023
- Issue 48165: LKSM: Cannot read properties of undefined (reading 'selected')
- Fix tableAlias for getFilterLabKeySql

### version 2.348.0
*Released*: 28 June 2023
- Move editable grid actions to internal/components/editable/actions.ts
- Remove the `I` prefix on various interfaces
    - `IGridLoader`, `IEditableGridLoader`, `IGridData`, `IGridResponse`, `IGetSelectedResponse`, `ISelectResponse`

### version 2.347.2
*Released*: 27 June 2023
- Project setting updates for Data in Project and Project Storage needs a manual refresh to take effect

### version 2.347.1
*Released*: 27 June 2023
* Create Storage on Sample Import
  * add StorageUnit column to SAMPLE_STORAGE_COLUMNS const

### version 2.347.0
*Released*: 27 June 2023
- Update entity creation for sample and source creation
  - Use URL to determine whether to show file upload or grid
  - export HREF constants for different creation modes

### version 2.346.1
*Released*: 26 June 2023
* Add scope to ontology search queries
  * add scope that includes Shared folder (where ontologies reside)
  * switch from deprecated searchUsingIndex

### version 2.346.0
*Released*: 26 June 2023
- EditableGrid Improvements
  - Improve drag fill behavior to support multiple columns, prefixed numbers, and dates
  - Improve paste behavior to expand pasted content into selections that are a multiple of the pasted content
  - Improve selection rendering
  - Convert readOnlyRows, lockedRows, insertColumns, updateColumns, readOnlyColumns to non-immutable data types
  - Move EditableGrid actions to editable folder
  - Handle lookups when using drag fill
  - Implement cut & paste
  - Fix issue with paste overriding read only columns

### version 2.345.3
*Released*: 21 June 2023
* Moving entities between projects - Assay Data
  * Modified EntityMoveModal to work with assay runs

### version 2.345.2
*Released*: 21 June 2023
- Export `EntityMoveConfirmationModal` for use with notebooks.

### version 2.345.1
*Released*: 19 June 2023
- Issue 48067: Add metrics for action buttons on editable grid

### version 2.345.0
*Released*: 8 June 2023
- Revise `QueryAPIWrapper` to support a number of additional API endpoints including query view APIs.
- Refactor a number of components to utilize the `APIWrapper` pattern and update associated tests.
- Remove `getDataClassDetails` from top-level export as it has been added to the `DomainPropertiesAPIWrapper`.

### version 2.344.0
*Released*: 6 June 2023
- Introduce React Testing Library
- Add `test-enzyme` and `test-react` scripts. Call both via `yarn test`.
- Declare alternative `jest.setup.react.ts` to support RTL-specific imports.
- Declare `enzymeTestHelpers` and `reactTestLibraryHelpers` to house utilities specific to each library.
- Add initial example tests for using RTL.

### version 2.343.1
*Released*: 2 June 2023
- Field editor fix for community usage to check for SM module during getFolderExcludedDataTypes() call

### version 2.343.0
*Released*: 2 June 2023
- Introduce enums for `SearchCategory` and new `SearchField`
- Add `SearchAPIWrapper` to allow for component usage of the search endpoint
- Search endpoint wrapper for applications now defaults to `experimentalCustomJson=true` and `normalizeUrls=true`.
- Add optional `requestHandler` to allow for cancellation of promised requests
- Refactor and deprecate `searchUsingIndex` method for resolving search results
- SelectInput: expose `openMenuOnClick` prop

### version 2.342.1
*Released*: 1 June 2023
* Migrate SCSS for /entities subpackage components that moved to @labkey/premium

### version 2.342.0
*Released*: 31 May 2023
* Data type domain exclude projects
  * Add DataTypeProjectsPanel to show panel in field editor for selecting excluded projects for a given data type domain
    * implement for Sample Type designer, Data Class designer (sources and non-built in registry), Assay Designer
  * Misc updates to admin panel titles for consistency

### version 2.341.3
*Released*: 31 May 2023
* Project level data type - handle lookups and remove experimental flag
  * remove isProductProjectDataTypeSelectionEnabled experimental flag and enable function
  * filter schema and query names for Look Up fields in designer based on selected target container's data type exclusion config
  * support user supplied lookupValueFilters for LookupCell

### version 2.341.2
*Released*: 30 May 2023
* Issue 47556: Update color for placeholder text in grids
* Issue 47964: Adjust `AncestorRenderer` to display field values that are negative
* Issue 47960: Update messaging about limit on sample creation
* Issue 47546: Update style for tabs so they don't appear disabled; update font for subnav

### version 2.341.1
*Released*: 26 May 2023
* Fix await without try/catch

### version 2.341.0
*Released*: 25 May 2023
* Project level data type - exclude on UI
  * Added App.getProjectDataExclusion utils to get the exclusion for the current folder context
  * Exclude assay designs from withAssayModel
  * Exclude data types from BarChartViewer
  * Added FolderAPIWrapper.getDataTypeExcludedProjects util to get the list of excluded projects for a specific data type
  * Modified EntityMoveConfirmationModal to exclude target data types from dropdowns
  * Modified initParentOptionsSelects util to exclude data types

### version 2.340.0
*Released* : 24 May 2023
* Issue 47548: App menu folder sections to include icon links to dashboard and admin pages directly

### version 2.339.0
*Released* : 23 May 2023
*  move /entities subpackage to @labkey/premium package and remove from this repo
  * add some missing components to index.ts needed by @labkey/premium

### version 2.338.0
*Released* : 17 May 2023
* Project level data type configuration schema and UI
  * Added DataTypeSelector and ProjectDataTypeSelections components
  * Modified CreateProjectPage and AdminSettingsPage to include project data selection panels
  * Added ProjectFreezerSelectionComponent and projectDataTypes to AdminAppContext
  * Added utils to get, update and add project data exclusion settings

### version 2.337.0
*Released*: 15 May 2023
* Issue 47784: When there is ony one sample type in a tabbed grid, default to that type's tab instead of "All Samples"

### version 2.336.2
*Released* : 15 May 2023
* Update shouldShowProductNavigation() to include check for LKB app instead of just hasPremiumModule

### version 2.336.1
*Released* : 12 May 2023
* Issue 47794: App sample type assay button to show assay submenu items in disabled state

### version 2.336.0
*Released* : 12 May 2023
* Issue 47024: WindowFocusCheckExpiredSession to add tab focus window listener to check for expired session in apps

### version 2.335.0
*Released* : 11 May 2023
- Add support for moving sources (data classes)
  - Refactor components for samples
  - Add properties to EntityDataType

### version 2.334.0
*Released*: 8 May 2023
* Add ExtendedMap
* Convert QueryInfo to plain JS  class
    * Convert all Immutable properties to JS based types or ExtendedMap
    * Convert all usages of QueryInfo to expect updated types
    * Remove insertColumns in favor of ExtendedMap.mergeAt
* ViewInfo: Remove logic from constructor
    - All transformation logic moved to fromJsonForTests

### version 2.333.3
*Released*: 7 May 2023
* Bulk edit improvement
  * limit the number of items that can be edited in Bulk to 1000
  * only select key columns and columns that are editable for bulk edit and edit in grid

### Version 2.333.2
#Released*: 3 May 2023
- Issue 46747: Update lookup resolver to go to LKS when lookup is defined outside the app

### version 2.333.1
*Released*: 3 May 2023
* Adjust usages of auditBehavior to always use AuditBehaviorTypes.DETAILED
  * remove auditBehavior optional props since they were always passed in as DETAILED
  * remove getSampleAuditBehavior() since it was always using DETAILED

### version 2.333.0
*Released*: 2 May 2023
* Add expired sample indicator in UI
  * add new ExpirationDateColumnRenderer and wire up to grid cell and DetailDisplay
  * modify SampleAiquotDetailHeader to show expired icon for aliquot parent expiration date field
  * modify ItemsLegends to be able to display expired icon

### version 2.332.4
*Released*: 2 May 2023
* Update @labkey/api package version

### version 2.332.3
*Released*: 1 May 2023
* Move samples between project updates and containerFilter changes
  * Picklist All Samples grid update to filter out unresolved samples
  * SampleMoveMenuItem update to provide an onSuccess callback, to allow the LKFM grid to reload models accordingly

### version 2.332.2
*Released*: 1 May 2023
* Issue 47822: export getSampleStatusContainerFilter

### version 2.332.1
*Released*: 28 April 2023
* Issue 47749: Assay re-import run from tmp file to use TSV loader for file preview
* Issue 47576: AssayImportPanels change so that if there are wrapped columns that are marked as userEditable and shownInInsertView, include them in the form / UI

### version 2.332.0
*Released*: 27 April 2023
- Issue 47756: Use categories to filter search results server-side instead of client-side

### version 2.331.0
*Released*: 26 April 2023
* Performance Evaluation for Data at Scale - Improve Insert/UpdateRows calls
  * add skipReselectRows param to insertRows/updateRows calls when detailed rows in response is not needed

### version 2.330.0
*Released*: 26 April 2023
* Move samples between projects UI updates
  * add new SampleMoveMenuItem and EntityMoveModal to be used by the SamplesEditButton
  * add getMoveConfirmationData and moveSamples API action calls
  * handle selectionKey for useSnapshotSelection case
  * add move menu item to sample overview page and usage of EntityMoveModal

### version 2.329.1
*Released*: 20 April 2023
- Support for restricted issue lists
    - Adds configuration to the issue list admin page to enable/disable restricted issue lists.
    - Optional site and project group selection to allow group members to access restricted issues.
    - This feature is controlled via a module property.

### version 2.329.0
*Released*: 20 April 2023
* Issue 47656: Add metrics for pagination usage and page sizing
* Issue 47657: Remove adding BarTender templates from within subfolder Projects

### version 2.328.1
*Released*: 20 April 2023
* Issue 47743: Sample Finder mis-renders data cards in queries with both "All Sample Types" and Assay cards

### version 2.328.0
*Released*: 19 April 2023
- Issue 47509: Better handling of samples with numeric names on assay import
  - the editable grid will always use key values (i.e. RowIds) for lookups, so set allowLookupByAlternateKey to false
  - on re-import run if the original run was imported via editable grid, the sample Ids will be rowIds so set allowLookupByAlternateKey to false

### version 2.327.0
*Released*: 18 April 2023
* Media consistency improvements

### version 2.326.0
*Released*: 15 April 2023
- Entities subpackage migration
    - Moved `AssayResultsForSamplesButton`, `EntityCrossProjectSelectionConfirmModal`, `EntityDeleteConfirmModal`, `EntityInsertPanel` and `FindDerivativesButton` to subpackage.
    - Moved `getOriginalParentsFromLineage` to `@labkey/components` to align endpoint wrappers for use in `EntityAPIWrapper`.
- `EntityInsertPanel`:
    - Refactor initialization to separate concerns for initializing import aliases, name expression previews, `insertModel` and editable grid models.
    - Defer construction of column metadata until after load. Previously results were just thrown away.
    - Update all direct calls to endpoints to utilize `ComponentAPIWrapper` provided implementations.
    - `getInferredFieldWarnings` and `getNoUpdateFieldWarnings` are no longer static methods as this served no purpose
    - Refactored `getWarningFieldList` into `WarningFieldList` component
    - Remove superfluous render wrapping
- `ComponentAPIWrapper`:
    - Add `getEntityTypeData`, `getOriginalParentsFromLineage` and `handleEntityFileImport` to `EntityAPIWrapper`. Update associated usages where possible to use API wrapper.
    - Add `fetchDomainDetails` to `DomainPropertiesAPIWrapper`
    - Update `getDefaultAPIWrapper()` for `ComponentAPIWrapper` to instantiate wrappers once. Makes `api` easier for reuse in components to prevent redundant render cycles.
- Streamline some sample action implementations to use `async/await` and remove redundant error handling wrapping.

### version 2.325.1
*Released*: 12 April 2023
- Sample Derivation: limit selected data requests

### version 2.325.0
*Released*: 10 April 2023
* Follow up consolidation of search pages to a shared component

### version 2.324.0
*Released*: 10 April 2023
* Issue 47648: Make "Contains" the default filter

### version 2.323.7
*Released*: 10 April 2023
* Issue 47647: App permissions page needs to check for project container perm when loading group memberships

### version 2.323.6
*Released*: 10 April 2023
* Issue 47660: QueryModel with bindURL isn't reloading totalCount on URL filter change

### version 2.323.5
*Released*: 7 April 2023
* Issue 47633: display project data in home folder when "queryProductProjectDataListingScoped" experimental flag is enabled.

### version 2.323.4
*Released*: 5 April 2023
* Add loading state to domain designer initialization.

### version 2.323.3
*Released*: 5 April 2023
* Issue 47571: Make sure project settings panel shows up even when the premium module is not available.
* Issue 47544: Don't show [blank] filter option if all distinct values are returned and none is blank.
* Issue 47532: For the UserProfile form, exclude lastActivity column explicitly
* Issue 47100: Update documentation link for sample ID lookup fields.
* Issue 47464: Update documentation link for ontology integration from LKSM.

### version 2.323.2
*Released*: 4 April 2023
* UserDetailsPanel fix for currentProductId vs targetProductId in URL generation
* SampleAssayDetails fix to check for both hasSampleTypeAssayDesigns and hasAssayResults when displaying empty msg

### version 2.323.1
*Released*: 4 April 2023
* Merge release23.3-SNAPSHOT to develop:
    * includes changes from 2.302.4

### version 2.323.0
*Released*: 1 April 2023
* Enable lineage relationship between custom data classes in apps
  * Extract parent alias handling code from SampleTypeDesigner and SampleTypePropertiesPanel to DomainParentAliases and utils
  * Support parent alias for DataClassDesigner

### version 2.322.0
*Released*: 31 March 2023
* Search behavior improvements
  * Added a SearchPanel component to be shared between Apps
  * Cleaned up some styling and layout items
  * Added paging to search results
  * Removed advanced filtering options

### version 2.321.0
*Released*: 31 March 2023
- Allow for specifying other options on requests made by `useContainerUser`.
- Consolidate usage of `SampleStorageLocationComponentProps` and `SampleStorageMenuComponentProps` types by exporting for external reference.

### version 2.320.1
*Released*: 31 March 2023
- Aliquot panel perf improvements by removing the unnecessary call to get the total row count and extra storage related columns

### version 2.320.0
*Released*: 30 March 2023
* Issue 47570: Remove admin pages for Users and Groups in subfolders

### version 2.319.0
*Released*: 30 March 2023
- Graph Options
    - Add `LineageSettings` component that allows for manipulation of settings for the graph.
    - Expose graph options "gear" icon via `LineageGraph` component.
- Combine Nodes
    - Create a `LineageNode` instance that replaces all combined nodes in processing.
    - Factor out `applyCombineSize` method to encapsulate `combineSize` logic.
    - Factor our `processCombinedNode` method to encapsulate construction of edges from a combined node.

### version 2.318.1
*Released*: 30 March 2023
* Issue 47575: Populating editable grid from bulk update doesn't account for aliquot- or sample-only fields

### version 2.318.0
*Released*: 30 March 2023
* Issue 47346: App Sample details Assay data tab loading slowly
  * AssayDefinitionModel.createSampleFilter change to generate a where clause that uses a "RowId IN (<UNION Query>)" instead of "OR clause"

### version 2.317.0
*Released*: 29 March 2023
* Convert Immutable classes to plain JS classes
    - ViewInfo
    - DataViewInfo
    - LastActionStatus

### version 2.316.0
*Released*: 29 March 2023
* Issue 47520: LKB: Sample Finder shows no samples when Assay does not have sample ID populated
  * modify filtering on AssayNotInFilter to exclude null result
* Sample Finder: Sample Properties & Built in reports
  * new SamplePropertyDataType EntityDataType
  * add built-in report section to SampleFinderSavedViewsMenu
  * support relative date filter value in DatePickerInput
  * add parsing, display and labkey sql util for relative date filter
  * modify QueryFilterPanel to allow provided list of fields
  * update card/json util to no longer persist full entityDataType object

### version 2.315.1
*Released*: 28 March 2023
* Merge release23.3-SNAPSHOT to develop:
    * includes changes from 2.302.3

### version 2.315.0
*Released*: 27 March 2023
* Update sample statuses to inherit from the parent and no longer support creation in subfolders
* Update `ManageSampleStatusesPanel`
  * Display statuses from higher up the hierarchy as locked statuses
  * Don't allow adding new statuses when in sub-folders

### version 2.314.1
*Released*: 24 March 2023
* Sample aliquots panel should not show "Assay Data with Aliquots" when isAssayEnabled false

### version 2.314.0
*Released*: 23 March 2023
* Issue 47408: Filter units in bulk update to match sample type display units
* Issue 47408: Coalesce and check for updates using the display values for amounts and units
* Issue 47517: Update Label for Name field for SM Source typ in Default System Fields

### version 2.313.1
*Released*: 23 March 2023
* Issue 47229: Support all characters within aliases

### version 2.313.0
*Released*: 23 March 2023
* Issue 47503: Sample Manager: Sample Finder not working for sample type with double quotes in name
* Issue 47077: Sample Finder taking a really long time to load results
  * skip autoload for sample finder result grids
  * improve sample finder hidden custom view handling
  * use a single query to get row counts for all sample finder result grids
  * add tabRowCounts as a prop for TabbedGridPanel

### version 2.312.0
*Released*: 21 March 2023
* Sample assay grid and aliquot summary to only query for data from assays that have data for that sample/aliquot ID set
  * previously was just querying for all assay designs with a sample lookup
  * getDistinctAssaysPerSample() to query for the distinct set of assay design names with data for given sample rowIDs

### version 2.311.0
*Released*: 21 March 2023
* Issue 43559: Domain designer throws error on invalid lookup

### version 2.310.0
*Released*: 17 March 2023
* withQueryModels to separate query to get the totalCount from the query to get the model data rows
  * loadRows query to always use includeTotalCount false and then conditionally make a second query with includeTotalCount true
  * update Pagination and SelectionStatus to wait for new totalCountLoadingState
  * PaginationInfo update to include loading check for max/rowCount text display
  * reset totalCountLoadingState when filters change on a QueryModel since we need to reload totalRowCount
  * add option to reloadTotalCount via loadModel() and loadAllModels()
  * QueryModel action to resetTotalCountState for all models

### version 2.309.0
*Released*: 16 March 2023
* Fix sample field partitioning to account for media not in storage

### version 2.308.0
*Released*: 14 March 2023
* Issue #47326: Allow setting a default BarTender label

### version 2.307.2
*Released*: 10 March 2023
* Issue 47422: LKSM: Renaming Sample Type results in Not Found error
* Issue 47407: Sample Manager: Update from file for Storage Editor without Edit Perm shoulnd't be available
* Issue 47406: Sample Manager: "Sample Id" column should be readonly on Edit Samples Grid / Storage Details tab
* Issue 47474: LKSM: Setting a field as required when editable on Samples & Aliquots errors

### version 2.307.1
*Released*: 8 March 2023
* Merge release23.3-SNAPSHOT to develop:
  * includes changes from 2.302.1 and 2.302.2

### version 2.307.0
*Released*: 7 March 2023
* selectRows and selectRowsDeprecated update to default to includeTotalCount false when not provided by usage config
  * switch usages of totalRows to rowCount were applicable
  * SelectionMenuItem shouldn't actually care about rowCount when deciding if it is disabled

### version 2.306.0
*Released*: 7 March 2023
* Issue 47127: Update wording for delete reply menu item and use title casing
* Issue 47333: When editing items individually is not possible, remove that tab
* Remove extraneous columns from inventory columns
* add `smaller-font` utility class

### version 2.305.0
*Released*: 6 March 2023
* Issue 47391: LKFM user menu items should match primary application
* Issue 47352: Product/Mega-menu has extra white space when sections are not displayed for permissions or product configuration reasons
* Issue 47390: Primary application should take into account the current URL controller for LKB and LKSM case

### version 2.304.2
*Released*: 3 March 2023
* Issue 47224: Refactor `SamplesDeriveButton` to reduce redundant calls and not make unnecessary, expensive calls

### version 2.304.1
*Released*: 3 March 2023
* Issue 47084: App Sample type grids issue the query for the grid twice

### version 2.304.0
*Released*: 1 March 2023
* Refactor all reducers declared by this package to no longer utilize `handleActions`.
* Remove `redux-actions` as a dependency.

### version 2.303.0
*Released*: 1 March 2023
* Migrate inventory.item.volume to exp.materials.storedAmount and inventory.item.volumeUnits to exp.materials.Units
  * Update `SamplesEditableGrid` for move of amount and units from inventory.item to exp.materials
  * Move measurement- and sample amount-related methods and models from ui-premium to here
  * Relabel "Stored Amount" to "Amount"
  * Separate editing of Stored Amount and Freeze/Thaw count on
  * Account for storedAmount and Units fields now on samples grids
  * Don't display amount and units in details display

### version 2.302.5
*Released*: 2 June 2023
- Backport Issue designer UI to support restricted issue lists to 23.3
    - see changes for v2.329.1

### version 2.302.4
*Released*: 30 March 2023
- Issue 47502: ProductMenu should use isAppHomeFolder to determine containerPath for fetchContainers call

### version 2.302.3
*Released*: 27 March 2023
- Issue 47569: Remove setting for inheriting permissions for the Site Roles and Assignments

### version 2.302.2
*Released*: 03 March 2023
- Issue 47306: Resolve Permissions page error by skipping no-resolvable users.
- Resolve bug in redirection location upon project deletion

### version 2.302.1
*Released*: 02 March 2023
- Issue 47202: Options to reduce payload of getContainers.api response
  - Field editor only needs the base set of container info for lookups so use new props to reduce response object size (includeWorkbookChildren and includeStandardProperties)

### version 2.302.0
*Released*: 28 February 2023
- SampleStatusTag to query for status type if not provided
- getSampleStatuses() boolean property for whether API should include inUse information or not
- Issue 47411: Include viewName in selectDistinct query for FilterFacetedSelector

### version 2.301.0
*Released*: 28 February 2023
- Add ability to delete projects while in-app

### version 2.300.1
*Released*: 28 February 2023
- Add a `focusSeed` method to the `VisGraph` component which fits the graph to the seed node and then zooms in to an appropriate level.
- Revise `fitGraph` to take determine whether the graph should be focused on the seed.

### version 2.300.0
*Released*: 28 February 2023
- FilterFacetedSelector fix to better handle selection filters when we don't have all distinct values (i.e. > 250 facet filter values)
  - don't compare current selection to allValues if we don't have allValues
  - don't default to selected/checked if we don't have allValues
  - handle case with search/filter input but not max distinct options
  - Issue 47266: For a grid the filter dialog does not enable the 'Apply' button if I type in a value unless I uncheck the [All] option first
  - Issue 47247: LKSM: Filtering values >250 doesn't save selection
- Issue 46870: Don't allow selection/inclusion of multi-valued lookup fields from Ancestors

### version 2.299.0
*Released*: 27 February 2023
- QueryColumn: convert to plain class
- AppURL: convert to plain class
- Container: convert to plain class
- User: convert to plain class
- QuerySort: convert to plain class
- WebDavFile: convert to plain class

### version 2.298.0
*Released*: 25 February 2023
- Support Enable/Disable “System Default Fields”
  - add disabledSystemFields property to DomainDesign and QueryInfo
  - allow updating Enabled property for SystemFields

### version 2.297.1
*Released*: 24 February 2023
- Issue 47392: Parent link to registry data types not resolving

### version 2.297.0
*Released*: 24 February 2023
- Introduce `getContainerFilterForFolder` to specify container filter specific to listing data in the current folder context.
- Use `getContainerFilterForFolder` for listing data on `SampleListingPage` and `QueryListingPage`.
- Explicitly support container filters on grid selection endpoint wrappers (e.g. `getSelected`, `selectAll`, etc).
- Add wrappers for new experimental flags for product projects.
- Update `SampleAliquotsSummary` to consolidate loading logic to present consistent loading behavior.
- Update `SampleTimelinePageBase` to consolidate loading logic to present consistent loading behavior.
- BarChartViewer: respect container filter settings
- Addresses Issue 47371: Harden MultiValueRenderer

### version 2.296.1
*Released*: 23 February 2023
- Add perm check helper hasSampleWorkflowDeletePermission()
- update @labkey/api package version

### version 2.296.0
*Released*: 22 February 2023
- QueryLookup: convert to regular class, add filterGroups attribute, use filterGroups in getQueryFilters
- QueryFormInputs: Add optional "operation" prop
  - Add equivalent prop to QueryInfoForm, AssayImportPanels (and child components), BulkAddUpdateForm, LookupCell
- DetailDisplay: use QueryColumn.getQueryFilters when rendering QuerySelect

### version 2.295.0
*Released*: 22 February 2023
- QueryModel switch to default to includeTotalCount false
  - add QueryModel prop for includeTotalCount, default to false
  - update all grid panel QueryConfig usages to includeTotalCount true

### version 2.294.0
*Released*: 21 February 2023
- Add LK version to app admin settings page header - fix for non-premium app case

### version 2.293.6
*Released*: 20 February 2023
- Add “ExpirationDate” field to exp.material
    - Add Expiration Date to the set of aliquot fields

### version 2.293.5
*Released*: 17 February 2023
- Issue 46465: Grid actions that use a selectionKey doesn't get expected selections when filters applied to grid
  - make sure setSnapshotSelections() is called before selectionKey based call to getSampleOperationConfirmationData()

### version 2.293.4
*Released*: 16 February 2023
- Issue 46767: DatePicker valid dates start at year 1000 (i.e. new Date('1000-01-01'))
  - set the DatePicker as disabled in an invalid date is used, still allows it to be removed

### version 2.293.3
*Released*: 15 February 2023
* Issue 47322: Ensure node requests are grouped by schema/query

### version 2.293.2
*Released*: 15 February 2023
* Fix EntityInsertPanel UI issues
    * fix alignment of parent type inputs on sample creation grid
    * fix extra caret on entity insert panel when alias cells are present

### version 2.293.1
*Released*: 15 February 2023
* Merge release23.2-SNAPSHOT to develop:
    * includes changes from 2.288.2 and 2.288.3

### version 2.293.0
*Released*: 15 February 2023
- Add LK version to app admin settings page header

### version 2.292.1
*Released*: 13 February 2023
- Issue 47190: Don't warn about required fields added to default grid from lookups

### version 2.292.0
*Released*: 10 February 2023
- Add Default System Fields to Domain Designer for Sample Types and Data Classes

### version 2.291.0
*Released*: 8 February 2023
* UserLinkList: Fix issue with keys
* AttachmentCard: Add optional onCopyLink prop

### version 2.290.3
*Released*: 8 February 2023
* Merge release23.2-SNAPSHOT to develop:
  * includes changes from 2.288.1

### version 2.290.2
*Released*: 6 February 2023
* Issue 47035: Sample Aliquot grid should allow for edit
  * Use SamplesTabbedGridPanel for SampleAliquotsGridPanel

### version 2.290.1
*Released*: 3 February 2023
- Move getReportInfos.api to reports controller since it does not rely on study module

### version 2.290.0
*Released*: 2 February 2023
* SchemaQuery: Convert to vanilla class, remove getQuery, getSchema, getView, create
  * Use new SchemaQuery(schemaName, queryName, viewName) instead of SchemaQuery.create
* Remove unused resolveSchemaQuery

### version 2.289.0
*Released*: 2 February 2023
* Update links from users to display user detail data via modal for those who have permission
  * add modal version of UserDetailsPanel, via UserDetailsRenderer and UserLink
  * update list display of GroupsList, EffectiveRolesList, and MembersList
  * shows user permissions on the User Management page
  * use UserDetailsRenderer as default renderer for columns with user lookup
  * use UserLink and UserLinkList in various components that render user displayName
  * update UserDetailsPanel so that permissions and group listing items are links to admin groups/permissions page
  * add dirty state check for user Profile page navigation

### version 2.288.3
*Released*: 14 February 2023
- Issue 47257: Cannot delete samples from a grid that has a filter applied
    - make sure setSnapshotSelections() is called before selectionKey based call to getCrossFolderSelectionResult()

### version 2.288.2
*Released*: 14 February 2023
- Issue 47303: fix bad URL redirection from SamplesCreatedSuccessMessage

### version 2.288.1
*Released*: 6 February 2023
- Issue 46618: Retain result row ordering in `formatSavedResults` and `formatResults` when processing results of `QuerySelect` queries.
- Add the `hasSortKey` property to the `QueryColumn` model. Now supported by `query-getQueryDetails.api`.

### version 2.288.0
*Released*: 1 February 2023
- Create components for `SamplesCreatedSuccessMessage` and `SamplesImportSuccessMessage`. Utilize `withRouter`.
- Add URL utility to `removeParameters()`.
- Default implementation of `sampleWizardURL` is now `getSampleWizardURL()`. Update typings to be more easily exported.

### version 2.287.0
*Released*: 30 January 2023
- Get product menu sections separately from user menu since they are no longer displayed together

### version 2.286.2
*Released*: 28 January 2023
* Issue 46949: Sample timeline detail links to sources instead of registry for LKB

### version 2.286.1
*Released*: 28 January 2023
* Projects: disallow project-specific data type creation
  * Hide create data type urls from ProductMenuSection
  * Show 'Not Found' page for SampleTypeDesignPage
  * Hide 'Create Sample Type' button from SampleTypeListingPage
  * Hide create url link from Sample/Assay EmptyAlert

### version 2.286.0
*Released*: 27 January 2023
* Handle update and clarify merge - use DIB for updateRows
    * use LSID as keys for updateRows and saveRows for samples and dataclasses
* Issue 47152: Having a field that can be edited by both aliquots and samples after an "aliquot only" will not get populated on sample create.
* Issue 47162: Using file import to create aliquots does not behave as expected if the column header is "Aliquoted From" and not "AliquotedFrom"

### version 2.285.1
*Released*: 27 January 2023
- `waitForLifeCycle` now supports `ShallowWrapper` components (and can be used with `shallow()`)
- `EntityFieldFilterModal` update unit tests to match expected behavior and remove test-specific workarounds from component.
- Wrap `CreateSamplesSubMenuBaseImpl` with `withRouterProps` to support in-app navigation.
- Rename `SamplesDeriveButtonBase` to `SamplesDeriveButton`.
- Remove redundant prop declarations for `CreateSamplesSubMenuBaseProps` and `CreateSamplesSubMenuProps` and `SamplesDeriveButtonProps`

### version 2.285.0
*Released*: 27 January 2023
* Add `help` prop to `SelectInput` and render without colliding with error message rendering.
* Add `REGISTRY_AUDIT_QUERY` events to be displayed in only in LKB.
* Update `getAuditQueries()` to require a `ModuleContext` parameter.
* Issue 45729: Inform user that commas are not supported for values in the alias field

### version 2.284.0
*Released*: 25 January 2023
* Enable adding user audit comments when deleting Samples, Sources, and Assays & the associated entity types

### version 2.283.2
*Released*: 23 January 2023
* Fix issue with react keys in Navigation

### version 2.283.1
*Released*: 20 January 2023
* Issue 46344: Display group membership on profile page

### version 2.283.0
*Released*: 17 January 2023
* Issue 47066: Adjust timeline to show created date and created by user in timeline's current status, even if detailed audit logging was not on.
* Issue 47059: Show grid customization on sample-type-specific grids on Find By Ids page.

### version 2.282.0
*Released*: 17 January 2023
* Handle update and clarify merge - enable update action for apps
  * Remove isImportWithUpdateEnabled experimental flag

### version 2.281.0
*Released*: 16 January 2023
* Updates for notebook consistency
  * ProductMenu fix so that column section header `<hr>` don't look clickable
  * Consolidate status-tag with notebook tags, rename as status-pill / pill.scss
  * FileAttachmentArea.tsx compact mode

### version 2.280.1
*Released*: 13 January 2023
* Show "View All Activity" link in `ServerActivityList` when there are any items in the list
* Use `PIPELINE_MAPPER` in `ServerActivityList` to resolve `ActionLinkUrl` when possible
* Make sure `ServerNofifications` button closes after clicking a link in it.

### version 2.280.0
*Released*: 12 January 2023
* QueryColumn: Add shownInLookupView
* QueryInfo: Add getLookupViewColumns
* QuerySelect
  * remove previewOptions, we now render additional columns based on the shownInLookupView attribute of QueryColumn
  * update default option renderer to only render column captions when multiple columns are set to show in lookup views
* AssayImportPanels: remove showQuerySelectPreviewOptions

### version 2.279.1
*Released*: 9 January 2023
* Issue 47020: Use unique grid id so selections are not shared between FindByIds queries
* Issue 47003: don't try to load rows if queryInfo is not yet loaded.
* Issue 46876: Remove links from audit log entries that lead to LKS

### version 2.279.0
*Released*: 8 January 2023
* pull forward v2.275.1 changes

### version 2.278.0
*Released*: 6 January 2023
* Update `react-select` to `5.7.0`.
* Remove `@types/react-select` as types are now provided by `react-select`.
* Update `@labkey/build`.

### version 2.277.2
*Released*: 6 January 2023
* Issue 46733: Editable for aliquots only/Required Field: Adding Samples gives error

### version 2.277.1
*Released*: 6 January 2023
* Issue 46574: Filter Panel boolean labels are not clickable
* Issue 46765: Grid cell sample status input requires multiple clicks to open select options menu
* Issue 46837: Checkbox inputs with label render incorrectly on col-sm size
* Issue 46581: Editable Grid doesn't de-focus cells if you click outside the table

### version 2.277.0
*Released*: 4 January 2023
* Remove UserAvatars
  * It is no longer used by our apps
* Remove AssayButtons.tsx

### version 2.276.1
*Released*: 3 January 2023
* Issue 46767: DatePicker valid dates start at year 1000 (i.e. new Date('1000-01-01'))
  * update `parseDate` to add an optional minDate param for valid dates for DatePicker selected date
* Issue 46839: Allow click on search input icon for grid panel to apply search value

### version 2.276.0
*Released*: 3 January 2023
* App header Projects and Menu misc fixes
  * don't show projects column when user only has perm to a single subfolder
  * add new app icons with lighter background color for use in menu Dashboard link
  * adjust hover styling of menu items and menu widths for various screen sizes
  * show 'Home Project' for title when in /home container
* Issue 46299: Lineage Graph: Make Font Larger
* Issue 46593:App template download button ignores custom XML metadata <importTemplates> override for sample types

### version 2.275.1
*Released*: 6 January 2023
* Fix race condition that causes LabelTemplates table creation to fail
