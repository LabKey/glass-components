/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ReactElement } from 'react';
import { List, Map } from 'immutable';

import { ASSAYS_KEY, ProductFeature, SAMPLES_KEY, USER_KEY, WORKFLOW_KEY } from '../../app/constants';

import { getAuditQueries, getEventDataValueDisplay, getTimelineEntityUrl } from './utils';
import { ASSAY_AUDIT_QUERY, SOURCE_AUDIT_QUERY, WORKFLOW_AUDIT_QUERY } from '../samples/constants';

describe ('getAuditQueries', () => {

    test('LKS starter', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'inventory', 'assay', 'premium'],
            },
            samplemanagement: {},
            inventory: {},
            core: {
                productFeatures: [ProductFeature.Assay]
            }
        };
        let auditQueries = getAuditQueries();
        expect(auditQueries.length).toBe(12);
        expect(auditQueries.findIndex(entry => entry == ASSAY_AUDIT_QUERY)).toBeGreaterThanOrEqual(0);
        expect(auditQueries.findIndex(entry => entry.value === 'inventoryauditevent')).toBe(5);
        expect(auditQueries.findIndex(entry => entry == WORKFLOW_AUDIT_QUERY)).toBe(-1);
        expect(auditQueries.findIndex(entry => entry == SOURCE_AUDIT_QUERY)).toBeGreaterThanOrEqual(0);
    });

    test('LKSM starter', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'inventory'],
            },
            samplemanagement: {},
            inventory: {},
            core: {
                productFeatures: []
            }
        };
        let auditQueries = getAuditQueries();
        expect(auditQueries.length).toBe(11);
        expect(auditQueries.findIndex(entry => entry.value === 'inventoryauditevent')).toBe(4);
        expect(auditQueries.findIndex(entry => entry == ASSAY_AUDIT_QUERY)).toBe(-1);
        expect(auditQueries.findIndex(entry => entry == WORKFLOW_AUDIT_QUERY)).toBe(-1);
        expect(auditQueries.findIndex(entry => entry == SOURCE_AUDIT_QUERY)).toBeGreaterThanOrEqual(0);
    });

    test("LKSM professional", () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'inventory', 'assay', 'labbook'],
            },
            samplemanagement: {},
            inventory: {},
            core: {
                productFeatures: [ProductFeature.Workflow, ProductFeature.ELN, ProductFeature.Assay]
            }
        };
        let auditQueries = getAuditQueries();
        expect(auditQueries.length).toBe(13);
        expect(auditQueries.findIndex(entry => entry.value === 'inventoryauditevent')).toBe(5);
        expect(auditQueries.findIndex(entry => entry == ASSAY_AUDIT_QUERY)).toBeGreaterThanOrEqual(0);
        expect(auditQueries.findIndex(entry => entry == WORKFLOW_AUDIT_QUERY)).toBeGreaterThanOrEqual(0);
        expect(auditQueries.findIndex(entry => entry == SOURCE_AUDIT_QUERY)).toBeGreaterThanOrEqual(0);
    })

    test("LKB", () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['biologics', 'samplemanagement', 'inventory', 'assay', 'labbook'],
            },
            samplemanagement: {},
            inventory: {},
            biologics: {},
            core: {
                productFeatures: [ProductFeature.Workflow, ProductFeature.ELN, ProductFeature.Assay]
            }
        };
        let auditQueries = getAuditQueries();
        expect(auditQueries.length).toBe(12);
        expect(auditQueries.findIndex(entry => entry.value === 'inventoryauditevent')).toBe(5);
        expect(auditQueries.findIndex(entry => entry == ASSAY_AUDIT_QUERY)).toBeGreaterThanOrEqual(0);
        expect(auditQueries.findIndex(entry => entry == WORKFLOW_AUDIT_QUERY)).toBeGreaterThanOrEqual(0);
        expect(auditQueries.findIndex(entry => entry == SOURCE_AUDIT_QUERY)).toBe(-1);

    });
});

describe('utils', () => {
    test('getEventDataValueDisplay', () => {
        expect(getEventDataValueDisplay(undefined)).toEqual(null);
        expect(getEventDataValueDisplay('asAString')).toEqual('asAString');
        expect(getEventDataValueDisplay(15)).toEqual(15);
        expect(getEventDataValueDisplay(true)).toEqual('true');

        const data: any = { value: 'RawValue' };

        // Respects "value"
        expect(getEventDataValueDisplay(Map(data), false)).toEqual(data.value);
        expect(getEventDataValueDisplay(data, false)).toEqual(data.value);

        data.displayValue = 'DefaultValue';

        // Respects "displayValue"
        expect(getEventDataValueDisplay(Map(data), false)).toEqual(data.displayValue);
        expect(getEventDataValueDisplay(data, false)).toEqual(data.displayValue);

        data.formattedValue = 'NiceFormatValue';

        // Respects "formattedValue"
        expect(getEventDataValueDisplay(Map(data), false)).toEqual(data.formattedValue);
        expect(getEventDataValueDisplay(data, false)).toEqual(data.formattedValue);

        // showLink -- without a URL
        expect(getEventDataValueDisplay(Map(data), true)).toEqual(data.formattedValue);
        expect(getEventDataValueDisplay(data, true)).toEqual(data.formattedValue);

        data.urlType = SAMPLES_KEY;

        // showLink -- without a URL
        let node = getEventDataValueDisplay(data, true) as ReactElement;
        expect(node.type).toEqual('a');
        expect(node.props).toEqual({
            children: data.formattedValue,
            href: getTimelineEntityUrl(data).toHref(),
        });

        data.url = '#/some/location';

        // showLink -- with a URL
        node = getEventDataValueDisplay(Map(data), true) as ReactElement;
        expect(node.type).toEqual('a');
        expect(node.props).toEqual({ children: data.formattedValue, href: data.url });

        data.hideLink = true;

        // hide url
        expect(getEventDataValueDisplay(Map(data), true)).toEqual(data.formattedValue);
        expect(getEventDataValueDisplay(data, true)).toEqual(data.formattedValue);
    });
    test('getTimelineEntityUrl', () => {
        expect(getTimelineEntityUrl(undefined)).toEqual(undefined);
        expect(getTimelineEntityUrl({})).toEqual(undefined);
        expect(getTimelineEntityUrl({ urlType: SAMPLES_KEY, value: 42 }).toHref()).toEqual(`#/rd/${SAMPLES_KEY}/42`);
        expect(getTimelineEntityUrl({ urlType: WORKFLOW_KEY, value: 77 }).toHref()).toEqual(`#/${WORKFLOW_KEY}/77`);
        expect(getTimelineEntityUrl({ urlType: 'workflowTemplate', value: 101 }).toHref()).toEqual(
            `#/${WORKFLOW_KEY}/template/101`
        );
        expect(getTimelineEntityUrl({ urlType: USER_KEY, value: 24 }).toHref()).toEqual('#/q/core/siteusers/24');
        expect(getTimelineEntityUrl({ urlType: 'assayRun', value: ['myassay', 13] }).toHref()).toEqual(
            `#/${ASSAYS_KEY}/general/myassay/runs/13`
        );

        expect(getTimelineEntityUrl(Map().toJS())).toEqual(undefined);
        expect(
            getTimelineEntityUrl(Map({ urlType: 'assayRun', value: List(['myassay', 44]) }).toJS()).toHref()
        ).toEqual(`#/${ASSAYS_KEY}/general/myassay/runs/44`);

        expect(getTimelineEntityUrl({ urlType: 'inventoryLocation', value: ['freezer1', 101] }).toHref()).toEqual(
            '#/rd/freezerLocation/101'
        );
        expect(getTimelineEntityUrl({ urlType: 'inventoryBox', value: 101 }).toHref()).toEqual('#/boxes/101');
    });
});
