import React from 'react';
import renderer from 'react-test-renderer'
import { LineageGrid } from './LineageGrid';
import { initUnitTestMocks } from '../../testHelpers';

beforeAll(() => {
    initUnitTestMocks();
});

describe("<LineageGrid/>", () => {
    test("loading", () => {
        const component = renderer.create(
            <LineageGrid lsid={'urn:lsid:labkey.com:Sample.9273.ExpressionSystemSamples:ES-1.2'}/>
        );

        expect(component.toJSON()).toMatchSnapshot();
    });

    test("with data", done => {
        const component = renderer.create(
            <LineageGrid lsid={'urn:lsid:labkey.com:Sample.9273.ExpressionSystemSamples:ES-1.2'}/>
        );

        setTimeout(() => {
            expect(component.toJSON()).toMatchSnapshot();
            done();
        });
    });
});
