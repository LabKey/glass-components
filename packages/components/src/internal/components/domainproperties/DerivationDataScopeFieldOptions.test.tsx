import React from 'react';

import { render } from '@testing-library/react';

import { DERIVATION_DATA_SCOPES, DOMAIN_FIELD_NOT_LOCKED } from './constants';
import { DerivationDataScopeFieldOptions } from './DerivationDataScopeFieldOptions';
import { PropDescType, TEXT_TYPE, UNIQUE_ID_TYPE } from './PropDescType';

describe('DerivationDataScopeFieldOptions', () => {
    test('Default config, new field', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: false,
        };

        render(<DerivationDataScopeFieldOptions {...props} />);

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel[0].textContent).toEqual('Derivation Data Scope');

        const radios = document.querySelectorAll('.radio');
        expect(radios).toHaveLength(3);
        expect(radios[0].querySelector('input').hasAttribute('checked')).toBeTruthy();
        expect(radios[0].querySelector('input').hasAttribute('disabled')).toBeFalsy();
        expect(radios[0].textContent).toBe('Editable for parent data only (default)');
        expect(radios[1].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[1].querySelector('input').hasAttribute('disabled')).toBeFalsy();
        expect(radios[1].textContent).toBe('Editable for child data only');
        expect(radios[2].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[2].querySelector('input').hasAttribute('disabled')).toBeFalsy();
        expect(radios[2].textContent).toBe('Editable for parent and child data independently');
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
    });

    test('Existing field, value = ParentOnly', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.PARENT_ONLY,
        };

        render(<DerivationDataScopeFieldOptions {...props} />);

        const radios = document.querySelectorAll('.radio');
        expect(radios).toHaveLength(3);
        expect(radios[0].querySelector('input').hasAttribute('checked')).toBeTruthy();
        expect(radios[0].querySelector('input').hasAttribute('disabled')).toBeFalsy();
        expect(radios[1].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[1].querySelector('input').hasAttribute('disabled')).toBeTruthy();
        expect(radios[2].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[2].querySelector('input').hasAttribute('disabled')).toBeFalsy();
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
    });

    test('Existing field, value is empty', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: '',
        };

        render(<DerivationDataScopeFieldOptions {...props} />);

        const radios = document.querySelectorAll('.radio');
        expect(radios).toHaveLength(3);
        expect(radios[0].querySelector('input').hasAttribute('checked')).toBeTruthy();
        expect(radios[0].querySelector('input').hasAttribute('disabled')).toBeFalsy();
        expect(radios[1].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[1].querySelector('input').hasAttribute('disabled')).toBeTruthy();
        expect(radios[2].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[2].querySelector('input').hasAttribute('disabled')).toBeFalsy();
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
    });

    test('Existing field, value = ChildOnly', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.CHILD_ONLY,
        };

        render(<DerivationDataScopeFieldOptions {...props} />);

        const radios = document.querySelectorAll('.radio');
        expect(radios).toHaveLength(3);
        expect(radios[0].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[0].querySelector('input').hasAttribute('disabled')).toBeTruthy();
        expect(radios[0].textContent).toBe('Editable for parent data only (default)');
        expect(radios[1].querySelector('input').hasAttribute('checked')).toBeTruthy();
        expect(radios[1].querySelector('input').hasAttribute('disabled')).toBeFalsy();
        expect(radios[1].textContent).toBe('Editable for child data only');
        expect(radios[2].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[2].querySelector('input').hasAttribute('disabled')).toBeFalsy();
        expect(radios[2].textContent).toBe('Editable for parent and child data independently');
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
    });

    test('Existing field, value = All', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.ALL,
        };

        render(<DerivationDataScopeFieldOptions {...props} />);

        const radios = document.querySelectorAll('.radio');
        expect(radios).toHaveLength(3);
        expect(radios[0].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[0].querySelector('input').hasAttribute('disabled')).toBeTruthy();
        expect(radios[1].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[1].querySelector('input').hasAttribute('disabled')).toBeTruthy();
        expect(radios[2].querySelector('input').hasAttribute('checked')).toBeTruthy();
        expect(radios[2].querySelector('input').hasAttribute('disabled')).toBeFalsy();
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
    });

    test('With config, show = true', () => {
        const label = 'Sample/Aliquot Options';
        const warning =
            "Updating a 'Samples Only' field to be 'Samples and Aliquots' will blank out the field values for all aliquots. This action cannot be undone.";
        const props = {
            index: 1,
            domainIndex: 1,
            label,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            config: {
                show: true,
                sectionTitle: 'Sample/Aliquot Options',
                labelAll: 'Separately editable for samples and aliquots',
                labelChild: 'Editable for aliquots only',
                labelParent: 'Editable for samples only (default)',
                helpLinkNode: <>help</>,
                scopeChangeWarning: warning,
            },
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.PARENT_ONLY,
        };

        render(<DerivationDataScopeFieldOptions {...props} />);

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel[0].textContent).toEqual(label);

        const radios = document.querySelectorAll('.radio');
        expect(radios).toHaveLength(3);
        expect(radios[0].querySelector('input').hasAttribute('checked')).toBeTruthy();
        expect(radios[0].textContent).toBe('Editable for samples only (default)');
        expect(radios[1].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[1].textContent).toBe('Editable for aliquots only');
        expect(radios[2].querySelector('input').hasAttribute('checked')).toBeFalsy();
        expect(radios[2].textContent).toBe('Separately editable for samples and aliquots');
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
    });

    test('With config, show = false', () => {
        const label = 'Sample/Aliquot Options';
        const props = {
            index: 1,
            domainIndex: 1,
            label,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            config: {
                show: false,
            },
        };

        render(<DerivationDataScopeFieldOptions {...props} />);
        expect(document.body.textContent).toEqual('');
    });

    test('With config, isExistingField is not applicable', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.ALL,
            config: {
                show: true,
                dataTypeFilter: (dataType: PropDescType) => !dataType.isUniqueId(),
            },
            fieldDataType: UNIQUE_ID_TYPE,
        };

        render(<DerivationDataScopeFieldOptions {...props} />);
        expect(document.body.textContent).toEqual('');
    });

    test('With config, isExistingField is applicable', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.ALL,
            config: {
                show: true,
                dataTypeFilter: (dataType: PropDescType) => !dataType.isUniqueId(),
            },
            fieldDataType: TEXT_TYPE,
        };

        render(<DerivationDataScopeFieldOptions {...props} />);

        const radios = document.querySelectorAll('.radio');
        expect(radios).toHaveLength(3);
    });
});
