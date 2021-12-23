import React, { FC, memo, useCallback, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { EntityDataType } from '../entities/models';
import { capitalizeFirstChar } from '../../util/utils';
import { QuerySelect } from '../forms/QuerySelect';
import { Filter } from '@labkey/api';
import { SchemaQuery } from '../../../public/SchemaQuery';

interface Props {
    entityDataType: EntityDataType;
    onCancel: () => void;
    onFind: (schemaQuery: SchemaQuery, filterArray: Filter.IFilter[]) => void;
}

export const EntityFieldFilterModal: FC<Props> = memo((props) => {
    const { entityDataType, onCancel, onFind } = props;
    const capParentNoun = capitalizeFirstChar(entityDataType.nounAsParentSingular);
    const [ selectedParentType, setSelectedParentType ] = useState<string>(undefined);

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const _onFind = useCallback(() => {
        // TODO Filter array will be populated from choices here
        onFind(SchemaQuery.create(entityDataType.instanceSchemaName, selectedParentType), []);
    }, [onFind, selectedParentType]);

    const onFilterChange = (id: string, value: any): void => {
        setSelectedParentType(value);
    };

    return (
        <Modal show onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Select Sample {capParentNoun} Properties</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <QuerySelect
                    componentId={entityDataType.nounSingular}
                    name={entityDataType.nounSingular}
                    schemaQuery={entityDataType.typeListingSchemaQuery}
                    onQSChange={onFilterChange}
                    value={selectedParentType}
                    label={entityDataType.nounAsParentSingular}
                />
            </Modal.Body>
            <Modal.Footer>
                <div className="pull-left">
                    <button type="button" className="btn btn-default" onClick={closeModal}>
                        Cancel
                    </button>
                </div>

                <div className="pull-right">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={_onFind}
                        disabled={!selectedParentType}
                    >
                        Find Samples
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    )
})
