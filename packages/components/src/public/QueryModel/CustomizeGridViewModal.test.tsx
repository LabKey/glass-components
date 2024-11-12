import React from 'react';

import { userEvent } from '@testing-library/user-event';

import { render } from '@testing-library/react';

import { ExtendedMap } from '../ExtendedMap';

import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';
import { ViewInfo } from '../../internal/ViewInfo';
import { QueryColumn } from '../QueryColumn';

import { makeTestQueryModel } from './testUtils';

import { CustomizeGridViewModal, includedColumnsForCustomizationFilter } from './CustomizeGridViewModal';

describe('CustomizeGridViewModal', () => {
    const FIELD_1_COL = new QueryColumn({
        name: 'field/1',
        fieldKey: 'field$S1',
        fieldKeyArray: ['field/1'],
        fieldKeyPath: 'field$S1',
        selectable: true,
    });
    const FIELD_2_COL = new QueryColumn({
        name: 'field+2',
        fieldKey: 'field+2',
        fieldKeyArray: ['field+2'],
        fieldKeyPath: 'field+2',
        selectable: true,
    });
    const FIELD_3_COL = new QueryColumn({
        name: 'field3',
        fieldKey: 'field3',
        fieldKeyArray: ['field3'],
        fieldKeyPath: 'field3',
        selectable: true,
    });
    const SYSTEM_COL = new QueryColumn({
        name: 'systemCol',
        fieldKey: 'systemCol',
        fieldKeyArray: ['systemCol'],
        fieldKeyPath: 'systemCol',
        selectable: true,
        hidden: true,
    });
    const HIDDEN_COL = new QueryColumn({
        name: 'hiddenCol',
        fieldKey: 'hiddenCol',
        fieldKeyArray: ['hiddenCol'],
        fieldKeyPath: 'hiddenCol',
        selectable: true,
        hidden: true,
    });
    const columns = new ExtendedMap<string, QueryColumn>({
        field$s1: FIELD_1_COL,
        'field+2': FIELD_2_COL,
        field3: FIELD_3_COL,
        systemCol: SYSTEM_COL,
        hiddenCol: HIDDEN_COL,
    });

    const QUERY_NAME = 'queryTest';

    test('With title, no view', () => {
        const view = ViewInfo.fromJson({ name: 'default' });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        let model = makeTestQueryModel(new SchemaQuery('test', QUERY_NAME), queryInfo);
        model = model.mutate({ title: 'Title' });
        render(<CustomizeGridViewModal model={model} onCancel={jest.fn()} onUpdate={jest.fn()} />);
        expect(document.querySelector('.modal-title').textContent).toBe('Customize Title Grid');
    });

    test('Without title, with view name', () => {
        const viewName = 'viewForTesting';
        const view = ViewInfo.fromJson({ name: viewName });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap({ [viewName.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(new SchemaQuery('test', QUERY_NAME, viewName), queryInfo);
        render(<CustomizeGridViewModal model={model} onCancel={jest.fn()} onUpdate={jest.fn()} />);
        expect(document.querySelector('.modal-title').textContent).toBe(
            'Customize ' + QUERY_NAME + ' Grid - ' + viewName
        );
    });

    test('Columns in View and All Fields,', async () => {
        const view = ViewInfo.fromJson({
            name: ViewInfo.DEFAULT_NAME,
            columns: [FIELD_1_COL, FIELD_2_COL],
        });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(new SchemaQuery('test', QUERY_NAME), queryInfo);
        render(<CustomizeGridViewModal model={model} onCancel={jest.fn()} onUpdate={jest.fn()} />);

        let availableColumn = document.querySelectorAll('.list-group')[0];
        let columnChoices = availableColumn.querySelectorAll('.list-group-item');
        expect(columnChoices).toHaveLength(3);
        expect(columnChoices[0].textContent).toBe(FIELD_1_COL.name);
        expect(columnChoices[0].querySelector('.view-field__action').getAttribute('title')).toBe(
            'This field is included in the view.'
        );
        expect(columnChoices[1].textContent).toBe(FIELD_2_COL.name);
        expect(columnChoices[1].querySelector('.view-field__action').getAttribute('title')).toBe(
            'This field is included in the view.'
        );
        expect(columnChoices[2].textContent).toBe(FIELD_3_COL.name);
        expect(columnChoices[2].querySelector('.view-field__action').getAttribute('title')).toBe(
            'Add this field to the view.'
        );

        let inGridColumn = document.querySelectorAll('.list-group')[1];
        const columnsInView = inGridColumn.querySelectorAll('.list-group-item');
        expect(columnsInView).toHaveLength(2);
        expect(columnsInView[0].textContent).toBe(FIELD_1_COL.name);
        expect(columnsInView[1].textContent).toBe(FIELD_2_COL.name);

        const toggleAll = document.querySelector('input[type = checkbox]');
        await userEvent.click(toggleAll);
        availableColumn = document.querySelectorAll('.list-group')[0];
        columnChoices = availableColumn.querySelectorAll('.list-group-item');
        expect(columnChoices).toHaveLength(5);
        expect(columnChoices[0].textContent).toBe(FIELD_1_COL.name);
        expect(columnChoices[1].textContent).toBe(FIELD_2_COL.name);
        expect(columnChoices[2].textContent).toBe(FIELD_3_COL.name);
        expect(columnChoices[3].textContent).toBe(SYSTEM_COL.name);
        expect(columnChoices[3].querySelector('.view-field__action').getAttribute('title')).toBe(
            'Add this field to the view.'
        );
        expect(columnChoices[4].textContent).toBe(HIDDEN_COL.name);
        expect(columnChoices[4].querySelector('.view-field__action').getAttribute('title')).toBe(
            'Add this field to the view.'
        );

        // no changes made yet, so update button is disabled
        let updateButton = document.querySelector('.btn-success');
        expect(updateButton.hasAttribute('disabled')).toBe(true);

        // remove a field, expect button to become enabled
        await userEvent.click(document.querySelectorAll('.fa-times')[0]);
        updateButton = document.querySelector('.btn-success');
        expect(updateButton.hasAttribute('disabled')).toBeFalsy();
        expect(columnChoices[0].querySelector('.view-field__action').getAttribute('title')).toBe(
            'Add this field to the view.'
        );
        inGridColumn = document.querySelectorAll('.list-group')[1];
        expect(inGridColumn.querySelectorAll('.list-group-item')).toHaveLength(1);

        // remove the other field in the view and expect button to become disabled again
        await userEvent.click(document.querySelectorAll('.fa-times')[0]);
        updateButton = document.querySelector('.btn-success');
        expect(updateButton.hasAttribute('disabled')).toBe(true);
        inGridColumn = document.querySelectorAll('.list-group')[1];
        expect(inGridColumn.querySelectorAll('.list-group-item')).toHaveLength(0);

        // add back one of the hidden columns
        availableColumn = document.querySelectorAll('.list-group')[0];
        await userEvent.click(availableColumn.querySelectorAll('.list-group-item')[4].querySelector('.fa-plus'));
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBeFalsy();
    });

    test('with selectedColumn', async () => {
        const view = ViewInfo.fromJson({
            name: ViewInfo.DEFAULT_NAME,
            columns: [FIELD_1_COL, FIELD_2_COL],
        });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(new SchemaQuery('test', QUERY_NAME), queryInfo);
        render(
            <CustomizeGridViewModal
                model={model}
                onCancel={jest.fn()}
                onUpdate={jest.fn()}
                selectedColumn={FIELD_2_COL}
            />
        );
        let colsInView = document.querySelectorAll('.list-group')[1].querySelectorAll('.list-group-item');
        // selected column passed in should be highlighted
        expect(colsInView[0].getAttribute('class')).not.toContain('active');
        expect(colsInView[1].getAttribute('class')).toContain('active');

        // clicking a new column should change the selected index
        await userEvent.click(colsInView[0].querySelector('.field-name span'));
        colsInView = document.querySelectorAll('.list-group')[1].querySelectorAll('.list-group-item');
        expect(colsInView[0].getAttribute('class')).toContain('active');
        expect(colsInView[1].getAttribute('class')).not.toContain('active');

        // clicking on the same column should unselect
        await userEvent.click(colsInView[0].querySelector('.field-name span'));
        colsInView = document.querySelectorAll('.list-group')[1].querySelectorAll('.list-group-item');
        expect(colsInView[0].getAttribute('class')).not.toContain('active');
        expect(colsInView[1].getAttribute('class')).not.toContain('active');
    });
});

describe('includedColumnsForCustomizationFilter', () => {
    test('hidden', () => {
        let col = new QueryColumn({ name: 'testColumn', hidden: false });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();
        expect(includedColumnsForCustomizationFilter(col, true)).toBeTruthy();

        col = new QueryColumn({ name: 'testColumn', hidden: true });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();
        expect(includedColumnsForCustomizationFilter(col, true)).toBeTruthy();
    });

    test('removeFromViews', () => {
        let col = new QueryColumn({ name: 'testColumn', removeFromViews: false });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();

        col = new QueryColumn({ name: 'testColumn', removeFromViews: true });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();
    });

    test('removeFromViewCustomization', () => {
        let col = new QueryColumn({ name: 'testColumn', removeFromViewCustomization: false });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();
        expect(includedColumnsForCustomizationFilter(col, true)).toBeTruthy();

        col = new QueryColumn({ name: 'testColumn', removeFromViewCustomization: true });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();
        expect(includedColumnsForCustomizationFilter(col, true)).toBeFalsy();

        LABKEY.moduleContext = { api: { moduleNames: ['api', 'core', 'premium'] } };
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();
        expect(includedColumnsForCustomizationFilter(col, true)).toBeTruthy();
    });

    test('ancestor nodes', () => {
        let col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Run/SampleID/Ancestors' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Run/SampleID/Ancestors/Samples/Type/Ancestors' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'SampleID/Ancestors/Samples/Type1' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Ancestors/Samples/Type1' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Ancestors/Samples/Type1/Ancestors' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Ancestors/Sources/Type1/Ancestors/Samples/Type2' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Ancestors' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();
    });
});
