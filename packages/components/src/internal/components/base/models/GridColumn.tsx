import React, { ReactNode } from 'react';

export type GridColumnCellRenderer<D = any, R = any> = (
    data?: D,
    row?: R,
    col?: GridColumn,
    rowNumber?: number,
    colNumber?: number
) => ReactNode;

export interface GridColumnProps {
    align?: string;
    caption?: string;
    cell?: GridColumnCellRenderer;
    fixedWidth?: number;
    format?: string;
    headerCls?: string;
    helpTipRenderer?: string;
    hideTooltip?: boolean;
    index: string;
    jsonType?: string;
    raw?: any;
    showHeader?: boolean;
    tableCell?: boolean;
    title?: string;
    width?: number;
}

const defaultCell: GridColumnCellRenderer = d => {
    let display = null;
    if (d != undefined) {
        if (typeof d === 'string' || typeof d === 'number') {
            display = d;
        } else if (typeof d === 'boolean') {
            display = d ? 'true' : 'false';
        } else {
            if (d.has('formattedValue')) {
                display = d.get('formattedValue');
            } else {
                const o = d.has('displayValue') ? d.get('displayValue') : d.get('value');
                display = o !== null && o !== undefined ? o.toString() : null;
            }

            if (d.get('url')) {
                display = <a href={d.get('url')}>{display}</a>;
            }
        }
    }

    return display;
};

export class GridColumn implements GridColumnProps {
    align: string;
    cell: GridColumnCellRenderer;
    format: string;
    headerCls: string;
    helpTipRenderer?: string;
    hideTooltip?: boolean;
    index: string;
    fixedWidth: number;
    raw: any;
    tableCell: boolean;
    title: string;
    showHeader: boolean;
    width: number;

    constructor(config: GridColumnProps) {
        this.align = config.align;
        this.cell = config.cell ?? defaultCell;
        this.format = config.format;
        this.index = config.index;
        this.fixedWidth = config.fixedWidth;
        this.raw = config.raw;
        this.headerCls = config.headerCls;
        this.helpTipRenderer = config.helpTipRenderer;
        this.width = config.width;

        // react render displays '&nbsp', see: https://facebook.github.io/react/docs/jsx-gotchas.html
        if (config.title && config.title == '&nbsp;') {
            this.title = '';
        } else {
            this.title = config.title;
        }

        this.showHeader = config.showHeader !== false; // defaults to true
        this.tableCell = config.tableCell === true; // defaults to false
        this.hideTooltip = config.hideTooltip === true; // defaults to false
    }
}
