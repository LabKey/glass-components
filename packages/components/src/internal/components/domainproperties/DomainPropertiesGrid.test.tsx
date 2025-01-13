import React from 'react';

import { render } from '@testing-library/react';

import { DomainPropertiesGrid } from './DomainPropertiesGrid';

import { DomainDesign } from './models';

import { INTEGER_TYPE, DATETIME_TYPE } from './PropDescType';

const DOMAIN = DomainDesign.create({
    fields: [
        { name: 'a', rangeURI: INTEGER_TYPE.rangeURI },
        { name: 'b', rangeURI: DATETIME_TYPE.rangeURI },
        { name: 'c' },
    ],
});
const ACTIONS = {
    toggleSelectAll: jest.fn(),
    scrollFunction: jest.fn(),
    onFieldsChange: jest.fn(),
};

describe('DomainPropertiesGrid', () => {
    test('default view', () => {
        render(
            <DomainPropertiesGrid
                domain={DOMAIN}
                search="searchStr"
                actions={ACTIONS}
                selectAll={false}
                appPropertiesOnly={false}
                hasOntologyModule={false}
            />
        );
        const text = document.body.textContent;

        expect(text).toContain('URL');
        expect(text).toContain('Range URI');
        expect(text).toContain('Lock Type');
        expect(text).toContain('Lookup Container');
        expect(text).toContain('Description');
        expect(text).toContain('Conditional Formats');
        expect(text).toContain('Property Validators');

        expect(text).toContain('http://www.w3.org/2001/XMLSchema#int'); // rangeURI of field 'a'
        expect(text).toContain('http://www.w3.org/2001/XMLSchema#dateTime'); // rangeURI of field 'b'
        expect(text).toContain('http://www.w3.org/2001/XMLSchema#string'); // rangeURI of field 'c' -- string is default

        // Removed column, as this information does not surface in UI
        expect(text).not.toContain('Property URI');
        // Ontology-only
        expect(text).not.toContain('Source Ontology');
    });

    test('with appPropertiesOnly', () => {
        render(
            <DomainPropertiesGrid
                domain={DOMAIN}
                search="searchStr"
                actions={ACTIONS}
                selectAll={false}
                appPropertiesOnly={true}
                hasOntologyModule={false}
            />
        );
        const text = document.body.textContent;

        expect(text).toContain('URL');
        expect(text).toContain('Range URI');
        expect(text).toContain('Lock Type');
        expect(text).not.toContain('Lookup Container');
        expect(text).toContain('Description');
        expect(text).not.toContain('Conditional Formats');
        expect(text).toContain('Property Validators');

        expect(text).not.toContain('Property URI');
        expect(text).not.toContain('Source Ontology');
    });

    test('with ontology module', () => {
        render(
            <DomainPropertiesGrid
                domain={DOMAIN}
                search="searchStr"
                actions={ACTIONS}
                selectAll={false}
                appPropertiesOnly={false}
                hasOntologyModule={true}
            />
        );
        const text = document.body.textContent;

        expect(text).toContain('Source Ontology');
        expect(text).toContain('Concept Import Column');
        expect(text).toContain('Concept Label Column');
        expect(text).toContain('Principal Concept Code');

        expect(text).not.toContain('Property URI');
    });
});
