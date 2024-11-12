import React from 'react';

import { render } from '@testing-library/react';

import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';
import { getTestAPIWrapper } from '../../internal/APIWrapper';

import { makeTestQueryModel } from './testUtils';
import { GridFilterModal } from './GridFilterModal';

describe('GridFilterModal', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {}),
        initFilters: [],
        model: makeTestQueryModel(
            new SchemaQuery('schema', 'query', 'view'),
            QueryInfo.fromJsonForTests({ name: 'Query', schema: 'schema', title: 'Query Title' })
        ),
        onApply: jest.fn,
        onCancel: jest.fn,
    };

    test('default props', () => {
        render(<GridFilterModal {...DEFAULT_PROPS} />);
        expect(document.querySelector('.modal-title').textContent).toBe('Filter Query Title');
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.filter-modal__col_fields')).toHaveLength(1);
        expect(document.querySelectorAll('button')).toHaveLength(3); // 2 in footer + close icon
        expect(document.querySelectorAll('button')[1].hasAttribute('disabled')).toBe(false); // cancel
        expect(document.querySelectorAll('button')[1].hasAttribute('disabled')).toBe(false); // apply
    });
});
