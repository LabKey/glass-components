import React from 'react';
import { List, Map } from 'immutable';
import { Query } from '@labkey/api';

import {
    Alert,
    EditableGridLoaderFromSelection,
    EditableGridPanel,
    EditorModel,
    EditorModelProps,
    LoadingSpinner,
    QueryModel,
    SchemaQuery,
    WizardNavButtons,
} from '../../..';
import { capitalizeFirstChar } from '../../util/utils';

import { getUniqueIdColumnMetadata } from '../entities/utils';

import { applyEditableGridChangesToModels, getUpdatedDataFromEditableGrid, initEditableGridModels } from './utils';

interface Props {
    containerFilter?: Query.ContainerFilter;
    idField: string;
    loader: EditableGridLoaderFromSelection;
    onCancel: () => any;
    onComplete: () => any;
    getIsDirty?: () => boolean;
    setIsDirty?: (isDirty: boolean) => void;
    pluralNoun?: string;
    queryModel: QueryModel;
    selectionData: Map<string, any>;
    singularNoun?: string;
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise<any>;
}

interface State {
    dataModels: QueryModel[];
    editorModels: EditorModel[];
    isSubmitting: boolean;
    error: string;
}

export class EditableGridPanelForUpdate extends React.Component<Props, State> {
    static defaultProps = {
        singularNoun: 'row',
        pluralNoun: 'rows',
    };

    constructor(props: Props) {
        super(props);

        const id = props.loader.id;
        const dataModels = [new QueryModel({ id, schemaQuery: props.queryModel.schemaQuery })];
        const editorModels = [new EditorModel({ id })];

        this.state = {
            isSubmitting: false,
            dataModels,
            editorModels,
            error: undefined,
        };
    }

    componentDidMount(): void {
        this.initEditorModel();
    }

    initEditorModel = async (): Promise<void> => {
        const { queryModel, loader } = this.props;
        const { dataModels, editorModels } = await initEditableGridModels(
            this.state.dataModels,
            this.state.editorModels,
            queryModel,
            [loader]
        );
        this.setState({ dataModels, editorModels });
    };

    onGridChange = (
        editorModelChanges: Partial<EditorModelProps>,
        dataKeys?: List<any>,
        data?: Map<string, Map<string, any>>,
        index = 0
    ): void => {
        this.setState(state => {
            const { dataModels, editorModels } = state;
            return applyEditableGridChangesToModels(
                dataModels,
                editorModels,
                editorModelChanges,
                undefined,
                dataKeys,
                data,
                index
            );
        });
        this.props.setIsDirty?.(true);
    };

    onSubmit = (): void => {
        const { onComplete, updateRows, idField, selectionData, singularNoun } = this.props;
        const { dataModels, editorModels } = this.state;

        const gridDataAllTabs = [];
        dataModels.forEach((model, ind) => {
            const gridData = getUpdatedDataFromEditableGrid(
                dataModels,
                editorModels,
                idField,
                undefined,
                selectionData,
                ind
            );
            if (gridData) {
                gridDataAllTabs.push(gridData);
            }
        });

        if (gridDataAllTabs.length > 0) {
            this.setState(() => ({ isSubmitting: true }));
            const updatePromises = [];
            gridDataAllTabs.forEach(data => updatePromises.push(updateRows(data.schemaQuery, data.updatedRows)));
            Promise.all(updatePromises).then(() => {
                this.setState(() => ({ isSubmitting: false }), onComplete());
            }).catch(error => {
                this.setState(() => ({
                    error: error?.exception ?? 'There was a problem updating the ' + singularNoun + ' data.',
                    isSubmitting: false
                }));
            });
        } else {
            this.setState(() => ({ isSubmitting: false }), onComplete());
        }
    };

    render() {
        const { containerFilter, onCancel, singularNoun, pluralNoun, ...editableGridProps } = this.props;
        const { isSubmitting, dataModels, editorModels, error } = this.state;
        const firstModel = dataModels[0];
        const columnMetadata = getUniqueIdColumnMetadata(firstModel.queryInfo);

        if (firstModel.isLoading) {
            return <LoadingSpinner />;
        }

        return (
            <>
                <EditableGridPanel
                    {...editableGridProps}
                    allowAdd={false}
                    allowRemove={false}
                    bordered
                    bsStyle="info"
                    columnMetadata={columnMetadata}
                    containerFilter={containerFilter}
                    editorModel={editorModels}
                    forUpdate
                    model={dataModels}
                    onChange={this.onGridChange}
                    striped
                    title={`Edit selected ${pluralNoun}`}
                />
                <Alert>{error}</Alert>
                <WizardNavButtons
                    cancel={onCancel}
                    nextStep={this.onSubmit}
                    finish={true}
                    isFinishing={isSubmitting}
                    isFinishingText="Updating..."
                    isFinishedText="Finished Updating"
                    finishText={
                        'Finish Updating ' +
                        firstModel.orderedRows.length +
                        ' ' +
                        (firstModel.orderedRows.length === 1
                            ? capitalizeFirstChar(singularNoun)
                            : capitalizeFirstChar(pluralNoun))
                    }
                />
            </>
        );
    }
}
