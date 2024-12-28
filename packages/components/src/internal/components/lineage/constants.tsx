/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';
import React from 'react';

import { AppURL } from '../../url/AppURL';
import { GridColumn } from '../base/models/GridColumn';

import { Tag } from './Tag';
import {
    LineageGroupingOptions,
    LINEAGE_DIRECTIONS,
    LINEAGE_GROUPING_GENERATIONS,
    LineageOptions,
    LineageURLResolvers,
} from './types';

// Default depth to fetch with the lineage API
export const DEFAULT_LINEAGE_DISTANCE = 5;
export const DEFAULT_LINEAGE_DIRECTION = LINEAGE_DIRECTIONS.Children;
export const GROUPING_COMBINED_SIZE_MIN = 2;

export const DEFAULT_GROUPING_OPTIONS: LineageGroupingOptions = {
    childDepth: DEFAULT_LINEAGE_DISTANCE,
    combineSize: 6,
    generations: LINEAGE_GROUPING_GENERATIONS.All,
    parentDepth: DEFAULT_LINEAGE_DISTANCE + 1,
};

export const DEFAULT_LINEAGE_OPTIONS: LineageOptions = {
    filterIn: true,
    filters: [],
    grouping: DEFAULT_GROUPING_OPTIONS,
    urlResolver: LineageURLResolvers.App,
};

export const LINEAGE_GRID_COLUMNS: GridColumn[] = [
    new GridColumn({
        index: 'name',
        title: 'ID',
        width: 270,
        cell: (name: string, node: Map<string, any>) => {
            const indent = node.get('distance') * 10;
            const dupeCount = node.get('duplicateCount');
            const isParents = node.get('membersShown') === LINEAGE_DIRECTIONS.Parent;
            const nodeDistance = node.get('distance');
            const links = node.get('links');

            return (
                <div
                    className="lineage-name"
                    style={{ textIndent: indent + 'px' }}
                    title={dupeCount > 0 ? dupeCount + ' duplicates' : ''}
                >
                    {links.overview ? <a href={links.overview}>{name}</a> : name}
                    {nodeDistance === 0 && <Tag bsStyle="success">Seed</Tag>}
                    {nodeDistance === 1 && <Tag bsStyle="info">1st {isParents ? 'parent' : 'child'}</Tag>}
                    {nodeDistance === 2 && <Tag bsStyle="primary">2nd {isParents ? 'parent' : 'child'}</Tag>}
                    {dupeCount > 0 && (
                        <Tag bsStyle="warning" showOnHover={false}>
                            Duplicate
                        </Tag>
                    )}
                </div>
            );
        },
    }),
    new GridColumn({
        index: 'distance',
        title: 'Distance',
        width: 60,
        cell: (distance: any, node: Map<string, any>) => {
            const gen = distance > 1 ? ' generations' : ' generation';

            return distance === 0 ? (
                distance
            ) : node.get('membersShown') === LINEAGE_DIRECTIONS.Parent ? (
                <span title={distance + gen + ' above seed'}>{distance}</span>
            ) : (
                <span title={distance + gen + ' below seed'}>{distance}</span>
            );
        },
    }),
    new GridColumn({
        index: 'lsid',
        title: 'Change Seed',
        width: 70,
        cell: (lsid: string, node: Map<string, any>) => {
            const lineageDistance = node.get('lineageDistance');
            const baseURL = AppURL.create('lineage').addParams({
                seeds: lsid,
                distance: lineageDistance ? lineageDistance : DEFAULT_LINEAGE_DISTANCE,
            });
            const parentUrl = baseURL.addParam('members', LINEAGE_DIRECTIONS.Parent);
            const childrenUrl = baseURL.addParam('members', LINEAGE_DIRECTIONS.Children);
            const children = node.get('children');
            const parents = node.get('parents');
            const membersShown = node.get('membersShown');
            const nodeDistance = node.get('distance');

            return (
                <div className="text-nowrap">
                    {parents.size > 0 ? (
                        membersShown === LINEAGE_DIRECTIONS.Parent && nodeDistance === 0 ? (
                            <button className="lineage-btn-seed btn btn-primary btn-xs" disabled type="button">
                                <span className="fa fa-arrow-up" />
                            </button>
                        ) : (
                            <a
                                className="lineage-btn-seed btn btn-primary btn-xs"
                                href={parentUrl.toHref()}
                                title={'Parents for ' + node.get('name')}
                            >
                                <span className="fa fa-arrow-up" />
                            </a>
                        )
                    ) : (
                        <button className="lineage-btn-seed btn btn-primary btn-xs" disabled type="button">
                            <span className="fa fa-arrow-up" />
                        </button>
                    )}
                    <span style={{ paddingRight: '5px' }}>&nbsp;</span>
                    {children.size > 0 ? (
                        membersShown === LINEAGE_DIRECTIONS.Children && nodeDistance === 0 ? (
                            <button className="lineage-btn-seed btn btn-primary btn-xs" disabled type="button">
                                <span className="fa fa-arrow-down" />
                            </button>
                        ) : (
                            <a
                                className="lineage-btn-seed btn btn-primary btn-xs"
                                href={childrenUrl.toHref()}
                                title={'Children for ' + node.get('name')}
                            >
                                <span className="fa fa-arrow-down" />
                            </a>
                        )
                    ) : (
                        <button className="lineage-btn-seed btn btn-primary btn-xs" disabled type="button">
                            <span className="fa fa-arrow-down" />
                        </button>
                    )}
                </div>
            );
        },
    }),
    new GridColumn({ index: 'displayType', title: 'Type' }),
    new GridColumn({ index: 'date', title: 'Creation Date' }),
    new GridColumn({ index: 'description', title: 'Description' }),
    new GridColumn({ index: 'label', title: 'Alias' }),
];
