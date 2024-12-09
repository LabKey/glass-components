import { applyLineageOptions, generateNodesAndEdges, LineageIO, LineageNode, LineageResult } from './models';
import { DEFAULT_LINEAGE_OPTIONS } from './constants';
import { LineageFilter } from './types';

describe('lineage model', () => {
    describe('applyLineageOptions', () => {
        it('use default options', () => {
            expect(applyLineageOptions()).toStrictEqual(DEFAULT_LINEAGE_OPTIONS);
        });

        it('apply lineage options', () => {
            const filters = [new LineageFilter('someField', ['testValue'])];
            const filteredOptions = applyLineageOptions({ filters });
            expect(filteredOptions).toHaveProperty('filters', filters);

            // Check deep copy
            filters[0].field = 'Jazz';
            expect(filteredOptions.filters[0].field).toBe('someField');
        });

        it('apply grouping options', () => {
            expect(applyLineageOptions({ grouping: { childDepth: 99 } })).toHaveProperty(
                ['grouping', 'childDepth'],
                99
            );
        });
    });

    describe('LineageIO.applyConfig', () => {
        const lineageObj = {
            container: 'container',
            created: '2022-01-20',
            createdBy: 'me',
            modified: '2022-01-21',
            modifiedBy: 'me',
            expType: 'type',
            id: 1,
            lsid: 'abc:123',
            name: 'name',
            pkFilters: [],
            queryName: 'query',
            schemaName: 'schema',
        };

        it('dataInputs', () => {
            expect(LineageIO.applyConfig({}).dataInputs.length).toBe(0);
            expect(LineageIO.applyConfig({ dataInputs: undefined }).dataInputs.length).toBe(0);
            expect(LineageIO.applyConfig({ dataInputs: [] }).dataInputs.length).toBe(0);
            expect(LineageIO.applyConfig({ dataInputs: [{ ...lineageObj }] }).dataInputs.length).toBe(1);
        });

        it('dataOutputs', () => {
            expect(LineageIO.applyConfig({}).dataOutputs.length).toBe(0);
            expect(LineageIO.applyConfig({ dataOutputs: undefined }).dataOutputs.length).toBe(0);
            expect(LineageIO.applyConfig({ dataOutputs: [] }).dataOutputs.length).toBe(0);
            expect(LineageIO.applyConfig({ dataOutputs: [{ ...lineageObj }] }).dataOutputs.length).toBe(1);
        });

        it('materialInputs', () => {
            expect(LineageIO.applyConfig({}).materialInputs.length).toBe(0);
            expect(LineageIO.applyConfig({ materialInputs: undefined }).materialInputs.length).toBe(0);
            expect(LineageIO.applyConfig({ materialInputs: [] }).materialInputs.length).toBe(0);
            expect(LineageIO.applyConfig({ materialInputs: [{ ...lineageObj }] }).materialInputs.length).toBe(1);
        });

        it('materialOutputs', () => {
            expect(LineageIO.applyConfig({}).materialOutputs.length).toBe(0);
            expect(LineageIO.applyConfig({ materialOutputs: undefined }).materialOutputs.length).toBe(0);
            expect(LineageIO.applyConfig({ materialOutputs: [] }).materialOutputs.length).toBe(0);
            expect(LineageIO.applyConfig({ materialOutputs: [{ ...lineageObj }] }).materialOutputs.length).toBe(1);
        });

        it('objectInputs', () => {
            expect(LineageIO.applyConfig({}).objectInputs.length).toBe(0);
            expect(LineageIO.applyConfig({ provenanceMap: undefined }).objectInputs.length).toBe(0);
            expect(LineageIO.applyConfig({ provenanceMap: [] }).objectInputs.length).toBe(0);
            expect(
                LineageIO.applyConfig({
                    provenanceMap: [
                        {
                            from: undefined,
                            to: { ...lineageObj },
                        },
                    ],
                }).objectInputs.length
            ).toBe(0);
            expect(
                LineageIO.applyConfig({
                    provenanceMap: [
                        {
                            from: undefined,
                            to: undefined,
                        },
                    ],
                }).objectInputs.length
            ).toBe(0);
            expect(
                LineageIO.applyConfig({
                    provenanceMap: [
                        {
                            from: { ...lineageObj },
                            to: undefined,
                        },
                    ],
                }).objectInputs.length
            ).toBe(1);
            expect(
                LineageIO.applyConfig({
                    provenanceMap: [
                        {
                            from: { ...lineageObj },
                            to: { ...lineageObj },
                        },
                    ],
                }).objectInputs.length
            ).toBe(1);
        });

        it('objectOutputs', () => {
            expect(LineageIO.applyConfig({}).objectOutputs.length).toBe(0);
            expect(LineageIO.applyConfig({ provenanceMap: undefined }).objectOutputs.length).toBe(0);
            expect(LineageIO.applyConfig({ provenanceMap: [] }).objectOutputs.length).toBe(0);
            expect(
                LineageIO.applyConfig({
                    provenanceMap: [
                        {
                            from: undefined,
                            to: { ...lineageObj },
                        },
                    ],
                }).objectOutputs.length
            ).toBe(1);
            expect(
                LineageIO.applyConfig({
                    provenanceMap: [
                        {
                            from: undefined,
                            to: undefined,
                        },
                    ],
                }).objectOutputs.length
            ).toBe(0);
            expect(
                LineageIO.applyConfig({
                    provenanceMap: [
                        {
                            from: { ...lineageObj },
                            to: undefined,
                        },
                    ],
                }).objectOutputs.length
            ).toBe(0);
            expect(
                LineageIO.applyConfig({
                    provenanceMap: [
                        {
                            from: { ...lineageObj },
                            to: { ...lineageObj },
                        },
                    ],
                }).objectOutputs.length
            ).toBe(1);
        });
    });

    describe('generateNodesAndEdges', () => {
        // Regression coverage for Issue 51425
        it('reprocesses level', () => {
            // Arrange
            const childOneLsid = 'child-one-lsid';
            const childTwoLsid = 'child-two-lsid';
            const childThreeLsid = 'child-three-lsid';
            const childFourLsid = 'child-four-lsid';
            const parentLsid = 'parent-lsid';

            const childOneNode = LineageNode.create(childOneLsid, {
                children: [{ lsid: childFourLsid }],
                parents: [{ lsid: parentLsid }],
            });

            const childTwoNode = LineageNode.create(childTwoLsid, {
                children: [{ lsid: childFourLsid }],
                parents: [{ lsid: parentLsid }],
            });

            const childThreeNode = LineageNode.create(childThreeLsid, {
                children: [{ lsid: childFourLsid }],
                parents: [{ lsid: parentLsid }],
            });

            const childFourNode = LineageNode.create(childFourLsid, {
                parents: [
                    { lsid: parentLsid },
                    { lsid: childOneLsid },
                    { lsid: childTwoLsid },
                    { lsid: childThreeLsid },
                ],
            });

            const parentNode = LineageNode.create(parentLsid, {
                children: [{ lsid: childOneLsid }, { lsid: childTwoLsid }, { lsid: childThreeLsid }],
            });

            const result = LineageResult.create({
                nodes: {
                    [parentNode.lsid]: parentNode,
                    [childOneNode.lsid]: childOneNode,
                    [childTwoNode.lsid]: childTwoNode,
                    [childThreeNode.lsid]: childThreeNode,
                    [childFourNode.lsid]: childFourNode,
                },
                seed: childFourNode.lsid,
            });

            // Act
            const { edges, nodes } = generateNodesAndEdges(result);

            // Assert
            expect(Object.keys(edges).length).toEqual(7);
            expect(Object.keys(nodes).length).toEqual(5);

            expect(nodes[parentNode.lsid].level).toEqual(-2);
            expect(nodes[childOneNode.lsid].level).toEqual(-1);
            expect(nodes[childTwoNode.lsid].level).toEqual(-1);
            expect(nodes[childThreeNode.lsid].level).toEqual(-1);
            expect(nodes[childFourNode.lsid].level).toEqual(0);
        });

        it('Issue 51432: special character in sample names result in: SyntaxError: unterminated character class', () => {
            const childLsid = 'child-lsid';
            const parentLsid = 'parent-lsid';

            const childNode = LineageNode.create(childLsid, {
                parents: [{ lsid: parentLsid, name: '&4[0' }],
                name: '&4[0_1001'
            });

            const parentNode = LineageNode.create(parentLsid, {
                children: [{ lsid: childLsid, name: '&4[0_1001' }],
                name: '&4[0'
            });

            const result = LineageResult.create({
                nodes: {
                    [parentNode.lsid]: parentNode,
                    [childNode.lsid]: childNode,
                },
                seed: childNode.lsid,
            });

            const { edges, nodes } = generateNodesAndEdges(result);

            expect(Object.keys(edges).length).toEqual(1);
            expect(Object.keys(nodes).length).toEqual(2);

            expect(nodes[parentNode.lsid].level).toEqual(-1);
            expect(nodes[parentNode.lsid].label).toEqual('＆4[0');
            expect(nodes[childNode.lsid].level).toEqual(0);
            expect(nodes[childNode.lsid].label).toEqual('＆4[0_1001');
        });
    });
});
