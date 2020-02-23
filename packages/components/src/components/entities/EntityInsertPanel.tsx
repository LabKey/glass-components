/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'reactn';
import { Button } from 'react-bootstrap';
import { List, Map, OrderedMap } from 'immutable';
import { Utils } from '@labkey/api';

import { IMPORT_DATA_FORM_TYPES, MAX_EDITABLE_GRID_ROWS } from '../../constants';

import { addColumns, changeColumn, gridInit, gridShowError, queryGridInvalidate, removeColumn } from '../../actions';
import { getEditorModel, getQueryGridModel, removeQueryGridModel } from '../../global';

import { getStateQueryGridModel } from '../../models';

import { EditableColumnMetadata } from '../editable/EditableGrid';
import { EditableGridPanel } from '../editable/EditableGridPanel';
import { getQueryDetails, InsertRowsResponse } from '../../query/api';
import { Location } from '../../util/URL';
import { SelectInput } from '../forms/input/SelectInput';

import {
    EntityDataType,
    EntityIdCreationModel,
    EntityInsertPanelTabs,
    EntityTypeOption,
    IEntityTypeOption,
    IParentOption,
} from './models';
import { Progress } from '../base/Progress';
import { AppURL } from '../../url/AppURL';
import {
    IGridLoader,
    IGridResponse,
    insertColumnFilter,
    QueryColumn,
    QueryGridModel,
    QueryInfo,
    SchemaQuery,
} from '../base/models/model';
import { capitalizeFirstChar, } from '../../util/utils';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { RemoveEntityButton } from '../buttons/RemoveEntityButton';
import { Alert } from '../base/Alert';
import { PlacementType } from "../editable/Controls";
import {
    DATA_IMPORT_TOPIC,
    FileAttachmentForm,
    getActionErrorMessage,
    helpLinkNode,
    LabelHelpTip,
    withFormSteps,
    WithFormStepsProps,
    WizardNavButtons
} from "../../index";
import { FormStep, FormTabs } from '../forms/FormStep';
import { FileSizeLimitProps } from "../files/models";
import { Link } from "react-router";
import { resolveErrorMessage } from '../../util/messaging';
import { getEntityTypeData } from './actions';

class EntityGridLoader implements IGridLoader {

    model: EntityIdCreationModel;

    constructor(model: EntityIdCreationModel) {
        this.model = model;
    }

    fetch(gridModel: QueryGridModel): Promise<IGridResponse> {
        const data = this.model.getGridValues(gridModel.queryInfo);

        return Promise.resolve({
            data,
            dataIds: data.keySeq().toList()
        });
    }
}

interface OwnProps {
    disableMerge?: boolean
    afterEntityCreation?: (entityTypetName, filter, entityCount, actionStr) => void
    getFileTemplateUrl?: (queryInfo: QueryInfo) => string
    location?: Location
    onCancel?: () => void
    maxEntities?: number
    fileSizeLimits?: Map<string, FileSizeLimitProps>
    handleFileImport?: (queryInfo: QueryInfo, file: File, isMerge: boolean) => Promise<any>
    canEditEntityTypeDetails?: boolean
    onDataChange?: (dirty: boolean, changeType?: IMPORT_DATA_FORM_TYPES) => any
    nounSingular: string
    nounPlural: string
    entityDataType: EntityDataType,
    parentDataTypes?: List<EntityDataType>,
    importHelpLinkNode: React.ReactNode
}

type Props = OwnProps & WithFormStepsProps;

interface StateProps {
    insertModel: EntityIdCreationModel
    originalQueryInfo: QueryInfo
    isSubmitting: boolean
    error: React.ReactNode
    isMerge: boolean
    file: File
}

export class EntityInsertPanelImpl extends React.Component<Props, StateProps> {

    private readonly capNounSingular;
    private readonly capNounPlural;
    private readonly capIdsText;
    private readonly capTypeTextSingular;
    private readonly typeTextSingular;
    private readonly typeTextPlural;

    constructor(props: any) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        this.capNounPlural = capitalizeFirstChar(props.nounPlural);
        this.capNounSingular = capitalizeFirstChar(props.nounSingular);
        this.capIdsText = this.capNounSingular + " IDs";
        this.capTypeTextSingular =  this.capNounSingular + " Type";
        this.typeTextSingular =  props.nounSingular + " type";
        this.typeTextPlural =  props.nounSingular + " types";

        this.state = {
            insertModel: undefined,
            originalQueryInfo: undefined,
            isSubmitting: false,
            error: undefined,
            isMerge: false,
            file: undefined,
        };
    }

    componentWillMount() {
        this.init(this.props, true)
    }

    componentWillReceiveProps(nextProps: OwnProps) {
        this.init(nextProps)
    }

    componentWillUnmount() {
        this.removeQueryGridModel();
    }

    removeQueryGridModel() {
        const gridModel = this.getQueryGridModel();

        if (gridModel) {
            removeQueryGridModel(gridModel);
        }
    }

    allowParents() {
        return this.props.parentDataTypes && !this.props.parentDataTypes.isEmpty();
    }

    getTabs() : Array<string> {
        return ['Create ' + this.capNounPlural + ' from Grid', 'Import ' + this.capNounPlural + ' from File'];
    }

    static getQueryParameters(query: any) {
        const { parent, selectionKey, target } = query;
        let parents;
        if (parent) {
            parents = parent.split(';');
        }

        return {
            parents,
            selectionKey,
            target
        }
    }

    init(props: OwnProps, selectTab: boolean = false) {
        const queryParams = props.location ? EntityInsertPanelImpl.getQueryParameters(props.location.query) : {
            parents: undefined,
            selectionKey: undefined,
            target: undefined
        };
        const allowParents = this.allowParents();

        const tab = props.location && props.location.query && props.location.query.tab ? props.location.query.tab : EntityInsertPanelTabs.Grid;
        if (selectTab && tab != EntityInsertPanelTabs.Grid)
            this.props.selectStep(parseInt(tab));

        let { insertModel } = this.state;

        if (insertModel
            && insertModel.getTargetEntityTypeName() === queryParams.target
            && insertModel.selectionKey === queryParams.selectionKey
            && (insertModel.originalParents === queryParams.parents || !allowParents)
        )
            return;

        insertModel = new EntityIdCreationModel({
            originalParents: allowParents ? queryParams.parents : undefined,
            initialEntityType: queryParams.target,
            selectionKey: queryParams.selectionKey,
            entityCount: 0,
            entityDataType: props.entityDataType,
        });

        let schemaQueries = Map<string, SchemaQuery>();
        schemaQueries = schemaQueries.set(props.entityDataType.instanceSchemaName, props.entityDataType.typeListingSchemaQuery);
        if (this.props.parentDataTypes) {
            this.props.parentDataTypes.forEach((dataType) => {
                schemaQueries = schemaQueries.set(dataType.instanceSchemaName, dataType.typeListingSchemaQuery);
            });
        }
        getEntityTypeData(insertModel, schemaQueries, props.entityDataType.typeListingSchemaQuery.queryName, allowParents)
            .then((partialModel) => {
                const updatedModel = insertModel.merge(partialModel) as EntityIdCreationModel;
                this.gridInit(updatedModel);
            })
            .catch((reason) => {
                this.setState(() => ({error: getActionErrorMessage('There was a problem initializing the data for import.', this.typeTextPlural)}));
            });
    }

    gridInit(insertModel: EntityIdCreationModel) {
        const schemaQuery = insertModel.getSchemaQuery();
        if (schemaQuery) {
            getQueryDetails(schemaQuery.toJS()).then(originalQueryInfo => {
                this.setState(() => {
                    return {
                        insertModel: insertModel,
                        originalQueryInfo,
                    }
                }, () => {
                    gridInit(this.getQueryGridModel(), true, this);
                });

            }).catch((reason) => {
                this.setState(() => {
                    return {
                        insertModel: insertModel.merge({
                            isError: true,
                            errors: "Problem retrieving data for " + this.typeTextSingular + " '" + insertModel.getTargetEntityTypeName() + "'."
                        }) as EntityIdCreationModel
                    }
                })
            });
        }
        else {
            this.setState(() => {
                return {
                    insertModel
                }
            }, () => {
                gridInit(this.getQueryGridModel(), true, this);
            });

        }
    }

    getQueryGridModel(): QueryGridModel {
        const { insertModel } = this.state;

        if (insertModel) {
            const entityTypeName = insertModel ? insertModel.getTargetEntityTypeName() : undefined;
            if (entityTypeName) {
                const queryInfoWithParents = this.getGridQueryInfo();
                const model = getStateQueryGridModel('insert-entities', SchemaQuery.create(this.props.entityDataType.instanceSchemaName, entityTypeName),
                    {
                        editable: true,
                        loader: new EntityGridLoader(insertModel),
                        queryInfo: queryInfoWithParents
                    });

                return getQueryGridModel(model.getId()) || model;
            }

            return undefined;
        }
    }

    getGridQueryInfo(): QueryInfo {
        const { insertModel, originalQueryInfo } = this.state;
        const { entityDataType } = this.props;

        if (originalQueryInfo) {
            const nameIndex = Math.max(0, originalQueryInfo.columns.toList().findIndex((column) => (column.fieldKey === entityDataType.uniqueFieldKey)));
            const newColumnIndex = nameIndex + insertModel.getParentCount();
            const columns = originalQueryInfo.insertColumns(newColumnIndex, insertModel.getParentColumns(entityDataType.uniqueFieldKey));
            return originalQueryInfo.merge({columns}) as QueryInfo;
        }
        return undefined;
    }

    changeTargetEntityType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption): void => {
        const { insertModel } = this.state;

        let updatedModel = insertModel.merge({
            targetEntityType: new EntityTypeOption(selectedOption),
            isError: false,
            errors: undefined
        }) as EntityIdCreationModel;
        if (!selectedOption) {
            updatedModel = updatedModel.merge({
                entityParents: insertModel.getClearedEntityParents()
            }) as EntityIdCreationModel;
        }

        this.setState(() => {
            return {
                originalQueryInfo: undefined,
                insertModel: updatedModel
            }
        }, () => {
            if (!selectedOption) {
                queryGridInvalidate(insertModel.getSchemaQuery(), true);
            }
            this.gridInit(updatedModel);
        });
    };

    addParent(queryName: string) {
        this.setState((state) => {
            return {
                insertModel: state.insertModel.addParent(queryName)
            }
        });
    }

    changeParent(index: number, queryName: string, fieldName: string, formValue: any, parent: IParentOption): void {
        const queryGridModel = this.getQueryGridModel();
        if (queryGridModel) {
            const { insertModel } = this.state;
            const { entityDataType } = this.props;
            const [ updatedModel, column, existingParent, parentColumnName ] = insertModel.changeParent(index, queryName, entityDataType.uniqueFieldKey, parent);
            if (!updatedModel) // no updated model if nothing has changed, so we can just stop
                return;

            this.setState(() => {
                return {
                    insertModel: updatedModel,
                }
            }, () => {
                if (column && existingParent) {
                    if (existingParent.query !== undefined) {
                        changeColumn(queryGridModel, existingParent.createColumnName(), column);
                    }
                    else {
                        let columnMap = OrderedMap<string, QueryColumn>();
                        let fieldKey;
                        if (existingParent.index === 1)
                            fieldKey = entityDataType.uniqueFieldKey;
                        else {
                            const definedParents = updatedModel.entityParents.get(queryName).filter((parent) => parent.query !== undefined);
                            if (definedParents.size === 0)
                                fieldKey = entityDataType.uniqueFieldKey;
                            else {
                                // want the first defined parent before the new parent's index
                                const prevParent = definedParents.findLast((parent) => parent.index < existingParent.index);
                                fieldKey = prevParent ? prevParent.createColumnName() : entityDataType.uniqueFieldKey;
                            }
                        }
                        addColumns(queryGridModel, columnMap.set(column.fieldKey.toLowerCase(), column), fieldKey);
                    }
                }
                else {
                    removeColumn(queryGridModel,  parentColumnName);
                }
            })
        }
    }

    removeParent(index: number, queryName: string) {
        const { insertModel } = this.state;
        const [ updatedModel, parentColumnName ] = insertModel.removeParent(index, queryName);
        this.setState((state) => {
            return {
                insertModel: updatedModel,
            }
        }, () => {
            removeColumn(this.getQueryGridModel(),  parentColumnName);
        });
    }

    renderParentTypes(entityDataType: EntityDataType) {
        const { insertModel } = this.state;
        const queryName = entityDataType.typeListingSchemaQuery.queryName;
        const entityParents = insertModel.entityParents.get(queryName);
        return (
            entityParents.map((parent) => {
                const { index, key, query } = parent;
                const capNounSingular = capitalizeFirstChar(entityDataType.nounSingular);
                return (
                    <div className="form-group row" key={key}>
                        <SelectInput
                            formsy={false}
                            containerClass=''
                            inputClass="col-sm-5"
                            label={capNounSingular + " " + index + " Type"}
                            labelClass="col-sm-3 entity-insert--parent-label"
                            name={"parent-re-select-" + index}
                            onChange={this.changeParent.bind(this, index, queryName)}
                            options={insertModel.getParentOptions(query, queryName)}
                            value={query}
                        />

                        <RemoveEntityButton
                            labelClass={'entity-insert--remove-parent'}
                            entity={capNounSingular}
                            index={index}
                            onClick={this.removeParent.bind(this, index, queryName)}
                        />
                    </div>
                )
            }).toArray()
        )
    }

    renderAddEntityButton(entityDataType: EntityDataType) {
        const { insertModel } = this.state;
        const queryName = entityDataType.typeListingSchemaQuery.queryName;
        const parentOptions = insertModel.parentOptions.get(queryName);
        const entityParents = insertModel.entityParents.get(queryName);
        if (parentOptions.size === 0)
            return null;
        else {
            const disabled = parentOptions.size <= entityParents.size;
            const title = disabled ? 'Only ' + parentOptions.size + ' ' + (parentOptions.size === 1 ? entityDataType.descriptionSingular : entityDataType.descriptionPlural) + ' available.' : undefined;
            return (
                <AddEntityButton
                    containerClass={'entity-insert--entity-add-button'}
                    key={'add-entity-' + queryName}
                    entity={capitalizeFirstChar(entityDataType.nounSingular)}
                    title={title}
                    disabled={disabled}
                    onClick={this.addParent.bind(this, queryName)}
                />
            )
        }
    }

    renderParentTypesAndButtons() {
        const { insertModel } = this.state;
        const { parentDataTypes } = this.props;

        if (insertModel) {
            const { isInit, targetEntityType } = insertModel;

            if (isInit && targetEntityType && parentDataTypes) {
                return (
                    <>
                        {parentDataTypes
                            .map((dataType) => {
                                return this.renderParentTypes(dataType);
                            })
                        }
                        <div className={'entity-insert--header'}>
                            {parentDataTypes
                                .map((dataType) => {
                                    return this.renderAddEntityButton(dataType);
                                })}
                        </div>
                    </>
                )
            }
        }
    }

    renderHeader(isGrid: boolean) {
        const { insertModel } = this.state;

        if (!insertModel)
            return null;

        const name = insertModel.getTargetEntityTypeName();

        return (
            <>
                {isGrid && <div className="entity-insert--header">
                    <p>
                        Generate unique {this.props.nounPlural} individually or in bulk using the bulk insert option.
                    </p>
                </div>}
                {insertModel.isInit && (
                    <SelectInput
                        formsy={false}
                        inputClass="col-sm-5"
                        label={this.capTypeTextSingular}
                        labelClass="col-sm-3 col-xs-12 entity-insert--parent-label"
                        name="targetEntityType"
                        placeholder={'Select a ' + this.capTypeTextSingular + '...'}
                        onChange={this.changeTargetEntityType}
                        options={insertModel.entityTypeOptions.toArray()}
                        required
                        value={insertModel && insertModel.hasTargetEntityType() ? insertModel.targetEntityType.label.toLowerCase() : undefined}
                    />
                )}
                {insertModel.isError ? this.renderError() : (isGrid && insertModel.hasTargetEntityType() ? this.renderParentTypesAndButtons() : '')}
            </>
        )
    }

    onRowCountChange = (rowCount: number) => {
        const { insertModel } = this.state;
        const queryModel = this.getQueryGridModel();
        const editorModel = getEditorModel(queryModel.getId());
        if (editorModel) {
            this.setState(() => {
                return {
                    insertModel: insertModel.set('entityCount', editorModel.rowCount) as EntityIdCreationModel
                }
            });
            if (this.props.onDataChange) {
                this.props.onDataChange(editorModel.rowCount > 0, IMPORT_DATA_FORM_TYPES.GRID);
            }
        }
    };

    onCancel = () => {
        if (this.props.onDataChange) {
            this.props.onDataChange(false); // if cancelling, presumably they know that they want to discard changes.
        }
        if (this.props.onCancel) {
            this.removeQueryGridModel();
            this.props.onCancel();
        } else {
            const { insertModel } = this.state;
            const updatedModel = insertModel.merge({
                isError: false,
                errors: undefined,
            }) as EntityIdCreationModel;
            this.setState(() => {
                return {
                    insertModel: updatedModel
                }
            });
            queryGridInvalidate(updatedModel.getSchemaQuery());
            this.gridInit(updatedModel);
        }
    };

    setSubmitting(isSubmitting: boolean) {
        this.setState(() => ({isSubmitting}));
    }

    insertRowsFromGrid = () => {
        const { insertModel } = this.state;
        const { entityDataType } = this.props;
        const queryGridModel = this.getQueryGridModel();
        const editorModel = getEditorModel(queryGridModel.getId());
        const errors =  editorModel.getValidationErrors(queryGridModel, entityDataType.uniqueFieldKey);
        if (errors.length > 0) {
            this.setSubmitting(false);
            gridShowError(queryGridModel, {
                message: errors.join("  ")
            });
            return;
        }

        this.setSubmitting(true);
        insertModel.postEntityGrid(this.getQueryGridModel()).then((response: InsertRowsResponse) => {
            if (response && response.rows) {

                this.setSubmitting(false);
                if (this.props.onDataChange) {
                    this.props.onDataChange(false);
                }
                if (this.props.afterEntityCreation) {
                    this.props.afterEntityCreation(insertModel.getTargetEntityTypeName(), response.getFilter(), response.rows.length, 'created');
                }
            }
            else {
                this.setSubmitting(false);
                gridShowError(queryGridModel, {
                    message: 'Insert response has unexpected format. No "rows" available.'
                });
            }
        }).catch((response: InsertRowsResponse) => {
            this.setSubmitting(false);
            const message = resolveErrorMessage(response.error, this.props.nounPlural);
            gridShowError(queryGridModel, {
                message
            });
        });
    };

    isNameRequired() {
        const queryGridModel = this.getQueryGridModel();
        if (queryGridModel) {
            return queryGridModel.isRequiredColumn(this.props.entityDataType.uniqueFieldKey);
        }
        return false;
    }

    renderGridButtons() {
        const { insertModel, isSubmitting } = this.state;
        const queryModel = this.getQueryGridModel();
        const editorModel = queryModel ? getEditorModel(queryModel.getId()) : undefined;
        if (insertModel && insertModel.isInit) {
            const noun = insertModel.entityCount == 1 ? this.capNounSingular : this.capNounPlural;

            return (
                <div className="form-group no-margin-bottom">

                    <div className="pull-left">
                        <Button className={"test-loc-cancel-button"} onClick={this.onCancel}>Cancel</Button>
                    </div>
                    <div className="btn-group pull-right">
                        <Button
                            className={"test-loc-submit-button"}
                            bsStyle="success"
                            disabled={isSubmitting || insertModel.entityCount === 0 || !editorModel }
                            onClick={this.insertRowsFromGrid}
                            >
                            {isSubmitting ? "Creating..." : "Finish Creating " + insertModel.entityCount + " " + noun}
                        </Button>
                    </div>
                </div>
            );
        }
        return null;
    }

    renderError() {
        const { insertModel } = this.state;
        if (insertModel.isError) {
            return <Alert>{insertModel.errors ? insertModel.errors : 'Something went wrong loading the data for this page.  Please try again.'}</Alert>
        }
    }

    getBulkAddFormValues() {
        const { insertModel } = this.state;
        const queryGridModel = this.getQueryGridModel();

        if (!queryGridModel || !queryGridModel.queryInfo)
            return null;

        // format/process parent column and values, for now, only parents are populated
        const allRows = insertModel.getGridValues(queryGridModel.queryInfo);

        if (allRows.size > 0 ) {
            let valueMap = Map<string, any>();
            let values = '';
            let sep = '';
            const row = allRows.get(0); // for insert, use the first (and only) row data
            row.keySeq().forEach(col => {
                row
                    .get(col)
                    .forEach((val) => {
                        values = values + sep + val.value;
                        sep = ',';
                    });
                // for some reason selectinput errors out if values are supplied as array
                valueMap = valueMap.set(col, values);
            });
            return valueMap.toObject();
        }

        return null;
    };

    onTabChange = () => {
        this.setState(() => ({error: undefined}));
    };

    renderCreateFromGrid() {
        const { insertModel } = this.state;
        const { entityDataType } = this.props;

        const columnFilter = (colInfo) => {
            return insertColumnFilter(colInfo) && colInfo["fieldKey"] !== entityDataType.uniqueFieldKey
        };

        const bulkAddProps = {
            title: "Bulk Creation of " + this.capNounPlural,
            header: "Add a batch of " + this.props.nounPlural + " that will share the properties set below.",
            columnFilter: columnFilter,
            fieldValues: this.getBulkAddFormValues()
        };
        const bulkUpdateProps = {
            columnFilter: columnFilter
        };
        let addControlProps = {
            nounSingular: this.capNounSingular,
            nounPlural: this.capNounPlural,
            placement: 'top' as PlacementType,
            wrapperClass: 'pull-left',
            maxCount: MAX_EDITABLE_GRID_ROWS
        };
        let columnMetadata = Map<string, EditableColumnMetadata>();
        if (!this.isNameRequired()) {
            columnMetadata = columnMetadata.set(entityDataType.uniqueFieldKey, {
                readOnly: false,
                placeholder: "[generated id]",
                toolTip: "A generated " + this.props.nounSingular + " ID will be provided for " + this.props.nounPlural + " that don't have a user-provided ID in the grid."
            })
        } else {
            columnMetadata = columnMetadata.set(entityDataType.uniqueFieldKey, {
                toolTip: "A " + this.props.nounSingular + " ID is required for each " + this.props.nounSingular + " since this " + this.typeTextSingular + " has no naming pattern. You can provide a naming pattern by editing the " + this.typeTextSingular + " details."
            })
        }

        const queryGridModel = this.getQueryGridModel();

        return (<>
            {this.renderHeader(true)}
            <hr className={'bottom-spacing'}/>
            <div className={'top-spacing'}>
            {queryGridModel && queryGridModel.isLoaded ?
                <EditableGridPanel
                    addControlProps={addControlProps}
                    allowBulkRemove={true}
                    allowBulkAdd={true}
                    allowBulkUpdate={true}
                    bordered={true}
                    condensed={false}
                    striped={true}
                    bulkAddText={"Bulk Insert"}
                    bulkAddProps={bulkAddProps}
                    bulkUpdateProps={bulkUpdateProps}
                    bulkRemoveText={"Remove " + this.capNounPlural}
                    columnMetadata={columnMetadata}
                    onRowCountChange={this.onRowCountChange}
                    model={queryGridModel}
                    initialEmptyRowCount={0}
                    emptyGridMsg={'Start by adding the quantity of ' + this.props.nounPlural + ' you want to create.'}
                    maxTotalRows={this.props.maxEntities}
                />
                :
                !insertModel.isError && insertModel.targetEntityType && insertModel.targetEntityType.value ? <LoadingSpinner wrapperClassName="loading-data-message"/> : null
            }
            </div>
        </>);
    }

    toggleInsertOptionChange = () => {
        this.setState((state) => ({isMerge: !state.isMerge}));
    };

    importOptionHelpText = () => {
        return (
            <>
                <p>
                    By default, import will insert new {this.props.nounPlural} based on the file provided. The operation will fail if
                    there are existing {this.capIdsText} that match those being imported.
                </p>
                <p>
                    When update is selected, data will be updated for matching {this.capIdsText}, and new {this.props.nounPlural} will
                    be created for any new {this.capIdsText} provided. Data will not be changed for any columns not in the
                    imported file.
                </p>
                <p>
                    For more information on import options for {this.props.nounPlural}, see
                    the {this.props.importHelpLinkNode} documentation page.
                </p>
            </>
        );
    };

    renderImportOptions() {
        return (
            <div className={'margin-bottom'}>
                <input
                    type="checkbox"
                    checked={this.state.isMerge}
                    onChange={this.toggleInsertOptionChange}
                />
                <span
                    className={'sm-mergeoption-checkbox'}
                    onClick={this.toggleInsertOptionChange}
                >
                    Update data for existing {this.props.nounPlural} during this file import
                </span>
                &nbsp;
                <LabelHelpTip title={'Import Options'} body={this.importOptionHelpText}/>
            </div>
        )
    }

    handleFileChange = (files: Map<string, File>) => {
        if (this.props.onDataChange) {
            this.props.onDataChange(files.size > 0, IMPORT_DATA_FORM_TYPES.FILE);
        }
        this.setState(() => ({
            error: undefined,
            file: files.first()
        }));
    };

    handleFileRemoval = (attachmentName: string) => {
        if (this.props.onDataChange) {
            this.props.onDataChange(false, IMPORT_DATA_FORM_TYPES.FILE);
        }
        this.setState(() => ({
            error: undefined,
            file: undefined
        }));
    };

    submitFileHandler = () => {
        const { handleFileImport } = this.props;
        const { insertModel, file, isMerge, originalQueryInfo } = this.state;

        if (!handleFileImport)
            return;

        this.setSubmitting(true);

        handleFileImport(originalQueryInfo, file, isMerge).then((response) => {
            this.setSubmitting(false);
            if (this.props.onDataChange) {
                this.props.onDataChange(false);
            }
            if (this.props.afterEntityCreation) {
                this.props.afterEntityCreation(insertModel.getTargetEntityTypeName(), null, response.rowCount, 'imported');
            }

        }).catch((error) => {
            this.setState(() => ({
                error: resolveErrorMessage(error, this.props.nounPlural),
                isSubmitting: false
            }));
        });

    };

    renderFileButtons() {
        const { isSubmitting, file, originalQueryInfo } = this.state;

        return (
            <WizardNavButtons
                cancel={this.onCancel}
                containerClassName=""
                canFinish={file !== undefined && originalQueryInfo !== undefined}
                finish={true}
                nextStep={this.submitFileHandler} // nextStep is the function that will get called when finish button clicked
                isFinishing={isSubmitting}
                finishText={"Import"}
                isFinishingText={"Importing..."}
            />
        )
    }

    getTemplateUrl(): any {
        const { getFileTemplateUrl } = this.props;
        const { originalQueryInfo } = this.state;
        if (getFileTemplateUrl && originalQueryInfo)
            return getFileTemplateUrl(originalQueryInfo);

        return originalQueryInfo && Utils.isArray(originalQueryInfo.importTemplates)  && originalQueryInfo.importTemplates[0]
            ? originalQueryInfo.importTemplates[0].url : undefined;
    }

    renderImportEntitiesFromFile() {
        const { fileSizeLimits, disableMerge } = this.props;

        return (<>
            {this.renderHeader(false)}
            {!disableMerge && this.renderImportOptions()}
            <FileAttachmentForm
                showLabel={false}
                acceptedFormats={".csv, .tsv, .txt, .xls, .xlsx"}
                allowMultiple={false}
                allowDirectories={false}
                previewGridProps={{previewCount: 3}}
                onFileChange={this.handleFileChange}
                onFileRemoval={this.handleFileRemoval}
                templateUrl={this.getTemplateUrl()}
                sizeLimits={fileSizeLimits}
                sizeLimitsHelpText={<>We recommend dividing your data into smaller files that meet this limit. See our {helpLinkNode(DATA_IMPORT_TOPIC, "help article")} for best practices on data import.</>}
            />
        </>);
    }

    renderButtons() {
        const { currentStep } = this.props;
        return currentStep === EntityInsertPanelTabs.Grid ? this.renderGridButtons() : this.renderFileButtons();
    }

    renderProgress() {
        const { currentStep } = this.props;
        const { insertModel, isSubmitting, file } = this.state;

        return currentStep === EntityInsertPanelTabs.Grid  ?
            <Progress
                estimate={insertModel.entityCount * 20}
                modal={true}
                title={"Generating " + this.props.nounPlural}
                toggle={isSubmitting}
            /> :
            <Progress
                estimate={file ? file.size * .1 : undefined}
                modal={true}
                title={"Importing " +  this.props.nounPlural + " from file"}
                toggle={isSubmitting}
            />
    }

    render() {
        const { canEditEntityTypeDetails } = this.props;
        const { insertModel, error } = this.state;

        if (!insertModel) {
            if (!error)
                return <LoadingSpinner wrapperClassName="loading-data-message"/>;
            else
                return <Alert>{error}</Alert>;
        }


        const entityTypeName = insertModel.getTargetEntityTypeName();
        const editEntityTypeDetailsLink = entityTypeName ? AppURL.create(this.props.nounPlural, entityTypeName, 'update') : undefined;

        return (
            <>
                <div className={"panel panel-default"}>
                    <div className="panel-body">
                        <div className="row">
                            <div className={'import-panel col-sm-7'}>
                                <FormTabs tabs={this.getTabs()} onTabChange={this.onTabChange}/>
                            </div>
                            {editEntityTypeDetailsLink && canEditEntityTypeDetails ?
                                <div className={'col-sm-5'}><Link className={'pull-right entity-insert--link'} to={editEntityTypeDetailsLink.toString()}>Edit {this.capTypeTextSingular} Details</Link></div>
                                : undefined}
                        </div>
                        <div className="row">
                            <div className="col-sm-12">
                                <FormStep stepIndex={EntityInsertPanelTabs.Grid}>
                                    {this.renderCreateFromGrid()}
                                </FormStep>
                                <FormStep stepIndex={EntityInsertPanelTabs.File}>
                                    {this.renderImportEntitiesFromFile()}
                                </FormStep>
                            </div>
                        </div>
                        {error != null && <Alert>{error}</Alert>}
                    </div>
                </div>
                {this.renderButtons()}
                {this.renderProgress()}
            </>
        )
    }
}

export const EntityInsertPanel = withFormSteps(EntityInsertPanelImpl, {
    currentStep: EntityInsertPanelTabs.Grid,
    furthestStep: EntityInsertPanelTabs.File,
    hasDependentSteps: false
});
