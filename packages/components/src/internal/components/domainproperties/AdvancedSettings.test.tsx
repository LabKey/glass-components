import React, { act } from 'react';
import { List } from 'immutable';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { createFormInputId } from './utils';
import {
    CALCULATED_CONCEPT_URI,
    DOMAIN_EDITABLE_DEFAULT,
    DOMAIN_FIELD_DEFAULT_VALUE_TYPE,
    DOMAIN_FIELD_DIMENSION,
    DOMAIN_FIELD_HIDDEN,
    DOMAIN_FIELD_MEASURE,
    DOMAIN_FIELD_MVENABLED,
    DOMAIN_FIELD_PHI,
    DOMAIN_FIELD_RECOMMENDEDVARIABLE,
    DOMAIN_FIELD_SHOWNINDETAILSVIEW,
    DOMAIN_FIELD_SHOWNININSERTVIEW,
    DOMAIN_FIELD_SHOWNINUPDATESVIEW,
    DOMAIN_FIELD_UNIQUECONSTRAINT,
    DOMAIN_LAST_ENTERED_DEFAULT,
    DOMAIN_NON_EDITABLE_DEFAULT,
    INT_RANGE_URI,
    PHILEVEL_FULL_PHI,
    PHILEVEL_LIMITED_PHI,
} from './constants';
import { AdvancedSettings } from './AdvancedSettings';
import { DomainField } from './models';

describe('AdvancedSettings', () => {
    const _fieldName = 'Marty';
    const _title = 'Advanced Settings and Properties';
    const _index = 0;
    const _domainIndex = 1;

    const fieldProps = {
        name: 'key',
        rangeURI: INT_RANGE_URI,
        propertyId: 1,
        propertyURI: 'test',
        hidden: false,
        shownInDetailsView: true,
        shownInInsertView: false,
        shownInUpdateView: true,
        dimension: false,
        measure: true,
        mvEnabled: false,
        recommendedVariable: true,
        uniqueConstraint: true,
        PHI: PHILEVEL_LIMITED_PHI,
    };
    const field1 = DomainField.create(fieldProps);

    const props = {
        label: _fieldName,
        index: _index,
        domainIndex: _domainIndex,
        show: true,
        maxPhiLevel: PHILEVEL_FULL_PHI,
        field: field1,
        onHide: jest.fn(),
        onApply: jest.fn(),
        phiLevelEnabled: true,
        phiLevelDisabledReason: null,
        showDefaultValueSettings: true,
        allowUniqueConstraintProperties: true,
        defaultDefaultValueType: DOMAIN_EDITABLE_DEFAULT,
        defaultValueOptions: List<string>([
            DOMAIN_EDITABLE_DEFAULT,
            DOMAIN_LAST_ENTERED_DEFAULT,
            DOMAIN_NON_EDITABLE_DEFAULT,
        ]),
        helpNoun: 'domain',
    };

    test('Advanced Settings Modal', async () => {
        await act(async () => {
            renderWithAppContext(<AdvancedSettings {...props} />);
        });

        // Verify label
        const sectionLabel = document.getElementsByClassName('modal-title');
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel[0].textContent).toEqual(_title + ' for ' + _fieldName);

        // Verify hidden
        let id = createFormInputId(DOMAIN_FIELD_HIDDEN, _domainIndex, _index);
        const hidden = document.querySelector('#' + id);
        expect(hidden.getAttribute('checked')).toEqual('');

        // Verify show in update
        id = createFormInputId(DOMAIN_FIELD_SHOWNINUPDATESVIEW, _domainIndex, _index);
        const showUpdate = document.querySelector('#' + id);
        expect(showUpdate.getAttribute('checked')).toEqual('');

        // Verify show in insert
        id = createFormInputId(DOMAIN_FIELD_SHOWNININSERTVIEW, _domainIndex, _index);
        const showInsert = document.querySelector('#' + id);
        expect(showInsert.getAttribute('checked')).toBeNull();

        // Verify show in details
        id = createFormInputId(DOMAIN_FIELD_SHOWNINDETAILSVIEW, _domainIndex, _index);
        const showDetails = document.querySelector('#' + id);
        expect(showDetails.getAttribute('checked')).toEqual('');

        // Verify measure
        id = createFormInputId(DOMAIN_FIELD_MEASURE, _domainIndex, _index);
        const measure = document.querySelector('#' + id);
        expect(measure.getAttribute('checked')).toEqual('');

        // Verify dimension
        id = createFormInputId(DOMAIN_FIELD_DIMENSION, _domainIndex, _index);
        const dimension = document.querySelector('#' + id);
        expect(dimension.getAttribute('checked')).toBeNull();

        // Verify mvEnabled
        id = createFormInputId(DOMAIN_FIELD_MVENABLED, _domainIndex, _index);
        const mvEnabled = document.querySelector('#' + id);
        expect(mvEnabled.getAttribute('checked')).toBeNull();

        // Verify recommendedVariable
        id = createFormInputId(DOMAIN_FIELD_RECOMMENDEDVARIABLE, _domainIndex, _index);
        const recommendedVariable = document.querySelector('#' + id);
        expect(recommendedVariable.getAttribute('checked')).toEqual('');

        // Verify uniqueConstraint
        id = createFormInputId(DOMAIN_FIELD_UNIQUECONSTRAINT, _domainIndex, _index);
        const uniqueConstraint = document.querySelector('#' + id);
        expect(uniqueConstraint.getAttribute('checked')).toEqual('');

        // Verify default type
        id = createFormInputId(DOMAIN_FIELD_DEFAULT_VALUE_TYPE, _domainIndex, _index);
        const defaultType = document.querySelector('#' + id);
        expect(defaultType.textContent).toEqual('Editable defaultLast enteredFixed value');

        // Verify buttons
        const btns = document.getElementsByClassName('btn');
        expect(btns).toHaveLength(2);
        const primaryBtns = document.getElementsByClassName('btn-primary');
        expect(primaryBtns).toHaveLength(1);
        expect(primaryBtns[0].getAttribute('disabled')).toBeNull();

        // PHI
        id = createFormInputId(DOMAIN_FIELD_PHI, _domainIndex, _index);
        const phi = document.querySelector('#' + id);
        expect(phi.getAttribute('disabled')).toBeNull();

        const options = phi.querySelectorAll('option');
        expect(options).toHaveLength(3);
        expect(options[0].textContent).toBe('Not PHI');
        expect(options[1].textContent).toBe('Limited PHI');
        expect(options[2].textContent).toBe('Full PHI');
    });

    test('PHI - disablePhiLevel', async () => {
        await act(async () => {
            renderWithAppContext(
                <AdvancedSettings {...props} field={DomainField.create({ ...fieldProps, disablePhiLevel: true })} />
            );
        });
        const id = createFormInputId(DOMAIN_FIELD_PHI, _domainIndex, _index);
        const phi = document.querySelector('#' + id);

        expect(phi.getAttribute('disabled')).toBe('');
    });

    test('PHI - init value undefined', async () => {
        await act(async () => {
            renderWithAppContext(
                <AdvancedSettings {...props} field={DomainField.create({ ...fieldProps, PHI: undefined })} />
            );
        });
        const id = createFormInputId(DOMAIN_FIELD_PHI, _domainIndex, _index);
        const phi = document.querySelector('#' + id);

        expect(phi.getAttribute('disabled')).toBeNull();

        const options = phi.querySelectorAll('option');
        expect(options).toHaveLength(4);
        expect(options[0].textContent).toBe('');
    });

    test('PHI - init value not available', async () => {
        await act(async () => {
            renderWithAppContext(
                <AdvancedSettings {...props} field={DomainField.create({ ...fieldProps, PHI: 'BOGUS' })} />
            );
        });
        const id = createFormInputId(DOMAIN_FIELD_PHI, _domainIndex, _index);
        const phi = document.querySelector('#' + id);

        expect(phi.getAttribute('disabled')).toBe('');

        const options = phi.querySelectorAll('option');
        expect(options).toHaveLength(4);
        expect(options[0].textContent).toBe('BOGUS');
    });

    test('Calculated Field hidden properties', async () => {
        await act(async () => {
            renderWithAppContext(
                <AdvancedSettings
                    {...props}
                    field={DomainField.create({ ...fieldProps, conceptURI: CALCULATED_CONCEPT_URI })}
                />
            );
        });

        let id = createFormInputId(DOMAIN_FIELD_DEFAULT_VALUE_TYPE, _domainIndex, _index);
        expect(document.querySelectorAll('#' + id)).toHaveLength(0);
        id = createFormInputId(DOMAIN_FIELD_HIDDEN, _domainIndex, _index);
        expect(document.querySelectorAll('#' + id)).toHaveLength(1);
        id = createFormInputId(DOMAIN_FIELD_SHOWNININSERTVIEW, _domainIndex, _index);
        expect(document.querySelectorAll('#' + id)).toHaveLength(0);
        id = createFormInputId(DOMAIN_FIELD_SHOWNINUPDATESVIEW, _domainIndex, _index);
        expect(document.querySelectorAll('#' + id)).toHaveLength(0);
        id = createFormInputId(DOMAIN_FIELD_SHOWNINDETAILSVIEW, _domainIndex, _index);
        expect(document.querySelectorAll('#' + id)).toHaveLength(1);
    });
});
