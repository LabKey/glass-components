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
import React, { act } from 'react';
import { List } from 'immutable';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { DomainField, DomainFieldError } from './models';
import {
    ATTACHMENT_TYPE,
    CALCULATED_TYPE,
    DATETIME_TYPE,
    DOUBLE_TYPE,
    PARTICIPANT_TYPE,
    PROP_DESC_TYPES,
    SAMPLE_TYPE,
    TEXT_TYPE,
} from './PropDescType';

import { DomainRow, DomainRowProps } from './DomainRow';
import {
    ATTACHMENT_RANGE_URI,
    DOMAIN_EDITABLE_DEFAULT,
    DOMAIN_FIELD_ADV,
    DOMAIN_FIELD_DELETE,
    DOMAIN_FIELD_DETAILS,
    DOMAIN_FIELD_EXPAND,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    DOMAIN_LAST_ENTERED_DEFAULT,
    DOMAIN_NON_EDITABLE_DEFAULT,
    FIELD_NAME_CHAR_WARNING_INFO,
    FIELD_NAME_CHAR_WARNING_MSG,
    INT_RANGE_URI,
    PHILEVEL_RESTRICTED_PHI,
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
} from './constants';

import { createFormInputId } from './utils';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchQueries: jest.fn().mockResolvedValue([]),
}));

const wrapDraggable = element => {
    return (
        <DragDropContext onDragEnd={jest.fn()}>
            <Droppable droppableId="domain-form-droppable">
                {provided => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        {element}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};

const DEFAULT_OPTIONS = List<string>([
    DOMAIN_EDITABLE_DEFAULT,
    DOMAIN_LAST_ENTERED_DEFAULT,
    DOMAIN_NON_EDITABLE_DEFAULT,
]);

describe('DomainRow', () => {
    function getDefaultProps(): DomainRowProps {
        return {
            allowUniqueConstraintProperties: false,
            availableTypes: PROP_DESC_TYPES,
            defaultDefaultValueType: DOMAIN_EDITABLE_DEFAULT,
            defaultValueOptions: DEFAULT_OPTIONS,
            domainIndex: 1,
            dragging: false,
            expanded: false,
            field: DomainField.create({}),
            getDomainFields: jest.fn().mockReturnValue({}),
            helpNoun: 'domain',
            index: 1,
            maxPhiLevel: PHILEVEL_RESTRICTED_PHI,
            onChange: jest.fn(),
            onDelete: jest.fn(),
            onExpand: jest.fn(),
            phiLevelEnabled: true,
            phiLevelDisabledReason: null,
            showDefaultValueSettings: true,
        };
    }

    test('string field test', async () => {
        const _index = 1;
        const _domainIndex = 1;
        const _name = 'stringField';

        const field = DomainField.create({
            name: _name,
            rangeURI: TEXT_TYPE.rangeURI,
            propertyId: 1,
            propertyURI: 'test',
        });

        await act(async () => {
            renderWithAppContext(
                wrapDraggable(
                    <DomainRow {...getDefaultProps()} index={_index} domainIndex={_domainIndex} field={field} />
                )
            );
        });

        const type = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_TYPE, _domainIndex, _index));
        expect(type.length).toEqual(1);

        const name = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_NAME, _domainIndex, _index));
        expect(name.length).toEqual(1);
        expect(name[0].getAttribute('value')).toEqual(_name);

        const req = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_REQUIRED, _domainIndex, _index));
        expect(req.length).toEqual(1);
    });

    test('decimal field', async () => {
        const _index = 2;
        const _domainIndex = 1;
        const _name = 'decimalField';

        const field = DomainField.create({
            name: _name,
            rangeURI: DOUBLE_TYPE.rangeURI,
            propertyId: 1,
            propertyURI: 'test',
            required: true,
        });

        await act(async () => {
            renderWithAppContext(
                wrapDraggable(
                    <DomainRow {...getDefaultProps()} index={_index} domainIndex={_domainIndex} field={field} />
                )
            );
        });

        const type = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_TYPE, _domainIndex, _index));
        expect(type.length).toEqual(1);

        const name = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_NAME, _domainIndex, _index));
        expect(name.length).toEqual(1);
        expect(name[0].getAttribute('value')).toEqual(_name);

        const req = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_REQUIRED, _domainIndex, _index));
        expect(req.length).toEqual(1);
    });

    test('date time field', async () => {
        const _index = 0;
        const _domainIndex = 1;
        const _name = 'dateTimeField';

        const field = DomainField.create({
            name: _name,
            rangeURI: DATETIME_TYPE.rangeURI,
            propertyId: 1,
            propertyURI: 'test',
            required: false,
        });

        await act(async () => {
            renderWithAppContext(
                wrapDraggable(
                    <DomainRow {...getDefaultProps()} index={_index} domainIndex={_domainIndex} field={field} />
                )
            );
        });

        const type = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_TYPE, _domainIndex, _index));
        expect(type.length).toEqual(1);

        const name = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_NAME, _domainIndex, _index));
        expect(name.length).toEqual(1);
        expect(name[0].getAttribute('value')).toEqual(_name);

        const req = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_REQUIRED, _domainIndex, _index));
        expect(req.length).toEqual(1);
    });

    test('participant id field', async () => {
        const _index = 0;
        const _domainIndex = 1;
        const _name = 'participantField';

        const field = DomainField.create({
            name: _name,
            rangeURI: PARTICIPANT_TYPE.rangeURI,
            conceptURI: PARTICIPANT_TYPE.conceptURI,
            propertyId: 1,
            propertyURI: 'test',
        });

        await act(async () => {
            renderWithAppContext(
                wrapDraggable(
                    <DomainRow {...getDefaultProps()} index={_index} domainIndex={_domainIndex} field={field} />
                )
            );
        });

        const type = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_TYPE, _domainIndex, _index));
        expect(type.length).toEqual(1);

        const name = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_NAME, _domainIndex, _index));
        expect(name.length).toEqual(1);
        expect(name[0].getAttribute('value')).toEqual(_name);

        const req = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_REQUIRED, _domainIndex, _index));
        expect(req.length).toEqual(1);

        // Verify not expanded
        const expandButton = document.querySelectorAll(
            '#' + createFormInputId(DOMAIN_FIELD_EXPAND, _domainIndex, _index)
        );
        expect(expandButton.length).toEqual(1);

        const deleteButton = document.querySelectorAll(
            '#' + createFormInputId(DOMAIN_FIELD_DELETE, _domainIndex, _index)
        );
        expect(deleteButton.length).toEqual(1);

        const advButton = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_ADV, _domainIndex, _index));
        expect(advButton.length).toEqual(0);

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(2);
    });

    test('attachment field', async () => {
        const _index = 0;
        const _domainIndex = 0;
        const _name = 'attachmentField';

        const field = DomainField.create({
            name: _name,
            rangeURI: ATTACHMENT_TYPE.rangeURI,
            propertyId: 1,
            propertyURI: 'test',
        });

        await act(async () => {
            renderWithAppContext(
                wrapDraggable(
                    <DomainRow
                        {...getDefaultProps()}
                        index={_index}
                        domainIndex={_domainIndex}
                        field={field}
                        expanded
                    />
                )
            );
        });

        const type = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_TYPE, _domainIndex, _index));
        expect(type.length).toEqual(1);

        const name = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_NAME, _domainIndex, _index));
        expect(name.length).toEqual(1);
        expect(name[0].getAttribute('value')).toEqual(_name);

        const req = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_REQUIRED, _domainIndex, _index));
        expect(req.length).toEqual(1);

        // Verify expanded
        const expandButton = document.querySelectorAll(
            '#' + createFormInputId(DOMAIN_FIELD_EXPAND, _domainIndex, _index)
        );
        expect(expandButton.length).toEqual(1);

        const deleteButton = document.querySelectorAll(
            '#' + createFormInputId(DOMAIN_FIELD_DELETE, _domainIndex, _index)
        );
        expect(deleteButton.length).toEqual(1);

        const advButton = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_ADV, _domainIndex, _index));
        expect(advButton.length).toEqual(1);

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(3);
    });

    test('Sample Field', async () => {
        const _index = 0;
        const _domainIndex = 1;
        const _name = 'sampleField';

        const field = DomainField.create({
            name: _name,
            rangeURI: SAMPLE_TYPE.rangeURI,
            conceptURI: SAMPLE_TYPE.conceptURI,
            propertyId: 1,
            propertyURI: 'test',
            required: false,
        });

        await act(async () => {
            renderWithAppContext(
                wrapDraggable(
                    <DomainRow {...getDefaultProps()} index={_index} domainIndex={_domainIndex} field={field} />
                )
            );
        });

        const type = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_TYPE, _domainIndex, _index));
        expect(type.length).toEqual(1);

        const name = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_NAME, _domainIndex, _index));
        expect(name.length).toEqual(1);
        expect(name[0].getAttribute('value')).toEqual(_name);

        const req = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_REQUIRED, _domainIndex, _index));
        expect(req.length).toEqual(1);
    });

    test('client side warning on field', async () => {
        const fieldName = '#ColumnAwesome';
        const severity = SEVERITY_LEVEL_WARN;
        const domainFieldError = new DomainFieldError({
            message: FIELD_NAME_CHAR_WARNING_MSG,
            extraInfo: FIELD_NAME_CHAR_WARNING_INFO,
            fieldName,
            propertyId: undefined,
            severity,
            index: 0,
        });

        const field = DomainField.create({
            name: fieldName,
            rangeURI: ATTACHMENT_RANGE_URI,
            propertyId: undefined, // new field
            propertyURI: 'test',
        });

        await act(async () => {
            renderWithAppContext(
                wrapDraggable(<DomainRow {...getDefaultProps()} field={field} fieldError={domainFieldError} />)
            );
        });

        // test row highlighting for a warning
        const warningRowClass = document.querySelectorAll('.domain-row-border-warning');
        expect(warningRowClass.length).toEqual(1);

        // test warning message
        const rowDetails = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_DETAILS, 1, 1));
        expect(rowDetails.length).toEqual(1);
        const expected = severity + ': ' + FIELD_NAME_CHAR_WARNING_MSG;
        expect(rowDetails[0].textContent).toContain(expected);
    });

    test('server side error on reserved field', async () => {
        const message = "'modified' is a reserved field name in 'CancerCuringStudy'";
        const fieldName = 'modified';
        const severity = SEVERITY_LEVEL_ERROR;
        const domainFieldError = new DomainFieldError({
            message,
            fieldName,
            propertyId: undefined,
            severity,
            index: 0,
        });

        const field = DomainField.create({
            name: fieldName,
            rangeURI: ATTACHMENT_RANGE_URI,
            propertyId: undefined, // new field
            propertyURI: 'test',
        });

        await act(async () => {
            renderWithAppContext(
                wrapDraggable(<DomainRow {...getDefaultProps()} field={field} fieldError={domainFieldError} />)
            );
        });

        // test row highlighting for error
        const warningRowClass = document.querySelectorAll('.domain-row-border-error');
        expect(warningRowClass.length).toEqual(1);

        // test error message
        const rowDetails = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_DETAILS, 1, 1));
        expect(rowDetails.length).toEqual(1);
        const expected = 'New Field. ' + severity + ': ' + message;
        expect(rowDetails[0].textContent).toContain(expected);
    });
});
