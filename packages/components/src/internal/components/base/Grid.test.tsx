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
import React from 'react';
import { render, screen } from '@testing-library/react';
import { fromJS } from 'immutable';

import { getColumnHoverText, Grid, GridHeader } from './Grid';
import { GridColumn, GridColumnProps } from './models/GridColumn';

const gridData = fromJS([
    {
        name: 'Dee Gordon',
        number: 9,
        position: 4,
    },
    {
        name: 'Mike Zunino',
        number: 3,
        position: 2,
    },
    {
        name: 'Kyle Seager',
        number: 15,
        position: 5,
    },
    {
        name: 'Zero',
        number: -1,
        position: 0,
    },
]);

const gridMessages = [
    {
        area: 'view',
        type: 'WARNING',
        content: 'There are 1 rows not shown due to unapproved QC state',
    },
];

const gridColumns: GridColumnProps[] = [
    {
        index: 'name',
        caption: 'Player Name',
    },
    {
        index: 'number',
        caption: 'Number',
    },
    new GridColumn({
        index: 'position',
        title: 'Position',
        cell: posNumber => {
            switch (posNumber) {
                case 0:
                    return 'Bench';
                case 2:
                    return 'C';
                case 4:
                    return '2B';
                case 5:
                    return '3B';
            }

            return `<${posNumber}>`;
        },
    }),
];

describe('Grid', () => {
    function validateHasData(hasData = true): void {
        expect(document.querySelectorAll('tr')).toHaveLength(hasData ? 5 : 2);
        expect(document.querySelectorAll('th')).toHaveLength(3);
        expect(document.querySelectorAll('td')).toHaveLength(hasData ? 12 : 1);

        if (hasData) {
            expect(screen.getByText('Dee Gordon')).toBeInTheDocument();
            expect(screen.getByText('Mike Zunino')).toBeInTheDocument();
            expect(screen.getByText('Kyle Seager')).toBeInTheDocument();
            expect(screen.getByText('Zero')).toBeInTheDocument();
        }
    }

    function validateHeaderCells(useCaption = true): void {
        expect(screen.getByText(useCaption ? 'Player Name' : 'name')).toBeInTheDocument();
        expect(screen.getByText(useCaption ? 'Number' : 'number')).toBeInTheDocument();
        expect(screen.getByText(useCaption ? 'Position' : 'position')).toBeInTheDocument();
    }

    function validatePositionCells(posName = true): void {
        expect(screen.getByText(posName ? '2B' : '4')).toBeInTheDocument();
        expect(screen.getByText(posName ? 'C' : '2')).toBeInTheDocument();
        expect(screen.getByText(posName ? '3B' : '5')).toBeInTheDocument();
        expect(screen.getByText(posName ? 'Bench' : '0')).toBeInTheDocument();
    }

    test('handles empty props', () => {
        const component = render(<Grid />);
        expect(component.container.firstChild).not.toBeNull();
    });

    test('rendering with data', () => {
        render(<Grid data={gridData} />);
        validateHasData();
        validateHeaderCells(false);
        validatePositionCells(false);
    });

    test('rendering with data and columns', () => {
        render(<Grid data={gridData} columns={gridColumns} />);
        validateHasData();
        validateHeaderCells();
        validatePositionCells();

        expect(document.querySelector('.table')).not.toBeNull();
        expect(document.querySelector('.table-cellular')).toBeNull();
        expect(document.querySelector('.table-bordered')).not.toBeNull();
        expect(document.querySelector('.table-condensed')).toBeNull();
        expect(document.querySelector('.table-striped')).not.toBeNull();
    });

    test('rendering with no data and columns', () => {
        render(<Grid data={[]} columns={gridColumns} emptyText="my empty text" gridId="someId" />);
        expect(screen.getByText('my empty text')).toBeInTheDocument();
        expect(document.querySelector('.table-responsive').getAttribute('data-gridid')).toBe('someId');
        validateHasData(false);
        validateHeaderCells();
    });

    test('render with non-default properties', () => {
        render(<Grid data={gridData} columns={gridColumns} bordered={false} cellular condensed striped={false} />);
        validateHasData();
        validateHeaderCells();
        validatePositionCells();

        expect(document.querySelector('.table')).toBeNull();
        expect(document.querySelector('.table-cellular')).not.toBeNull();
        expect(document.querySelector('.table-bordered')).toBeNull();
        expect(document.querySelector('.table-condensed')).not.toBeNull();
        expect(document.querySelector('.table-striped')).toBeNull();
    });

    test('header title and calcWidths', () => {
        const columns = [
            {
                index: 'name',
                caption: 'Player Name',
                showHeader: true,
                title: 'My test grid title',
                phiProtected: true,
            },
        ];

        render(<Grid data={gridData} columns={columns} calcWidths />);

        expect(document.querySelector('.grid-header-cell').getAttribute('style')).toBe('min-width: 189px;');
        expect(document.querySelector('.grid-header-cell')).not.toBeNull();
        expect(document.querySelector('.phi-protected')).not.toBeNull();
    });

    test('rendering with fixedWidth and width', () => {
        const columns: GridColumnProps[] = [
            {
                index: 'name',
                showHeader: true,
                fixedWidth: 321,
                width: 567,
            },
            {
                index: 'number',
                showHeader: true,
                width: 123,
            },
            {
                index: 'position',
                showHeader: true,
                fixedWidth: 567,
            },
        ];
        render(<Grid data={gridData} columns={columns} />);
        const headerCells = document.querySelectorAll('.grid-header-cell');
        expect(headerCells).toHaveLength(3);
        expect(headerCells[0].getAttribute('style')).toBe('width: 321px;');
        expect(headerCells[1].getAttribute('style')).toBe('min-width: 123px;');
        expect(headerCells[2].getAttribute('style')).toBe('width: 567px;');
    });

    test('render with messages', () => {
        const message = {
            area: 'view',
            content: 'There are 1 rows not shown due to unapproved QC state',
            type: 'WARNING',
        };

        render(<Grid data={gridData} messages={[message]} />);
        validateHasData();
        validateHeaderCells(false);
        validatePositionCells(false);

        expect(screen.getByText(message.content)).toBeInTheDocument();
    });

    test('with phi data', () => {
        const columns = [
            ...gridColumns,
            new GridColumn({
                index: 'age',
                title: 'Age',
                raw: {
                    phiProtected: true,
                    description: 'Your age',
                },
            }),
            new GridColumn({
                index: 'teamPlayer',
                title: 'Team Player',
                raw: {
                    description: 'Are you a team player?',
                },
            }),
            new GridColumn({
                index: 'lefty',
                title: 'Lefty',
                raw: {
                    phiProtected: true,
                },
            }),
            new GridColumn({
                index: 'weight',
                title: 'Weight',
                raw: {
                    description: 'Your weight',
                },
                hideTooltip: true,
            }),
        ];

        render(<Grid data={gridData} columns={columns} />);

        validateHeaderCells();
        expect(screen.getByText('Age')).toBeInTheDocument();
        expect(screen.getByText('Team Player')).toBeInTheDocument();
        expect(screen.getByText('Lefty')).toBeInTheDocument();
        expect(screen.getByText('Weight')).toBeInTheDocument();
        validatePositionCells();

        expect(document.querySelectorAll('.phi-protected').length).toBe(2);
        expect(screen.getByTitle('Your age (PHI protected data removed)')).toBeInTheDocument();
        expect(screen.getByTitle('Are you a team player?')).toBeInTheDocument();
        expect(screen.getByTitle('PHI protected data removed')).toBeInTheDocument();
        expect(screen.queryByTitle('Your weight')).toBeNull();
    });

    test('show field key for lookups in tooltip', () => {
        const columns = [
            ...gridColumns,
            new GridColumn({
                index: 'Ancestors/Sources/Lab/Name',
                title: 'Issue 46256',
                raw: {
                    index: 'Ancestors/Sources/Lab/Name',
                    fieldKeyPath: 'Ancestors/Sources/Lab/Name',
                },
            }),
        ];

        render(<Grid data={gridData} columns={columns} />);

        validateHeaderCells();
        expect(screen.getByText('Issue 46256')).toBeInTheDocument();
        validatePositionCells();

        expect(screen.getByTitle('Ancestors/Sources/Lab/Name')).toBeInTheDocument();
    });

    test('hide tooltip', () => {
        const columns = [
            ...gridColumns,
            new GridColumn({
                index: 'weight',
                title: 'Weight',
                raw: {
                    description: 'Your weight',
                },
                hideTooltip: true,
            }),
        ];

        render(<Grid data={gridData} columns={columns} />);
        validateHeaderCells();
        expect(screen.getByText('Weight')).toBeInTheDocument();
        validatePositionCells();

        expect(screen.queryByTitle('Your weight')).toBeNull();
    });
});

describe('GridHeader', () => {
    const DEFAULT_PROPS = {
        showHeader: true,
        columns: [
            new GridColumn({ index: 'a', title: 'A', showHeader: true }),
            new GridColumn({ index: 'b', title: 'B', showHeader: true }),
        ],
    };

    function validate(columnCount: number, labelHelpTipCount = 0, draggable = 'false'): void {
        expect(document.querySelectorAll('thead').length).toBe(1);
        expect(document.querySelectorAll('.grid-header-cell').length).toBe(columnCount);
        expect(document.querySelectorAll('.label-help-target').length).toBe(labelHelpTipCount);

        if (columnCount > 0) {
            expect(document.querySelector('.grid-header-cell').getAttribute('draggable')).toBe(draggable);
        }
    }

    test('default props', () => {
        render(<GridHeader {...DEFAULT_PROPS} />);
        validate(2);
    });

    test('column not showHeader', () => {
        render(
            <GridHeader
                {...DEFAULT_PROPS}
                columns={[
                    new GridColumn({ index: 'a', title: 'A', showHeader: true }),
                    new GridColumn({ index: 'b', title: 'B', showHeader: false }),
                ]}
            />
        );
        validate(1);
    });

    test('grid not showHeader', () => {
        render(<GridHeader {...DEFAULT_PROPS} showHeader={false} />);
        validate(0);
    });

    test('column helpTipRenderer', () => {
        render(
            <GridHeader
                {...DEFAULT_PROPS}
                columns={[
                    new GridColumn({ index: 'a', title: 'A', showHeader: true }),
                    new GridColumn({ index: 'b', title: 'B', showHeader: true, helpTipRenderer: 'TestRenderer' }),
                ]}
            />
        );
        validate(2, 1);
    });

    test('draggable', () => {
        render(<GridHeader {...DEFAULT_PROPS} onColumnDrop={jest.fn} />);
        validate(2, 0, 'true');
        expect(document.querySelectorAll('.grid-header-drag-over').length).toBe(0);
    });
});

describe('getColumnHoverText', () => {
    test('no hover text', () => {
        expect(getColumnHoverText({})).toBe(undefined);
        expect(
            getColumnHoverText({
                description: undefined,
                index: undefined,
                phiProtected: undefined,
            })
        ).toBe(undefined);
        expect(
            getColumnHoverText({
                description: '  ',
                index: 'name',
                phiProtected: false,
            })
        ).toBe('name');
    });

    test('with hover text', () => {
        expect(
            getColumnHoverText({
                description: ' desc ',
                index: 'name',
                fieldKeyPath: 'name',
                phiProtected: false,
            })
        ).toBe('desc (name)');
        expect(
            getColumnHoverText({
                description: ' desc ',
                index: 'name',
                fieldKeyPath: 'name',
                phiProtected: true,
            })
        ).toBe('desc (name) (PHI protected data removed)');
        expect(
            getColumnHoverText({
                description: ' desc ',
                index: 'parent/name',
                fieldKeyPath: 'parent/name',
                phiProtected: true,
            })
        ).toBe('desc (parent/name) (PHI protected data removed)');
        expect(
            getColumnHoverText({
                description: ' desc ',
                index: 'parent/name',
                fieldKeyPath: 'parent/name',
                phiProtected: false,
            })
        ).toBe('desc (parent/name)');
        expect(
            getColumnHoverText({
                description: undefined,
                index: 'parent/name',
                fieldKeyPath: 'parent/name',
                phiProtected: false,
            })
        ).toBe('parent/name');
    });
});
