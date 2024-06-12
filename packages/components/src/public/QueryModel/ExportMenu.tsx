import React, { FC, memo, PureComponent, ReactNode, useCallback } from 'react';
import { Set } from 'immutable';

import { exportRows } from '../../internal/actions';

import { EXPORT_TYPES } from '../../internal/constants';
import { Tip } from '../../internal/components/base/Tip';

import { DropdownButton, MenuDivider, MenuHeader, MenuItem } from '../../internal/dropdowns';

import { QueryModel } from './QueryModel';
import { getQueryModelExportParams } from './utils';

interface ExportMenuOption {
    onExport: () => void;
    option: ExportOption;
}

export interface ExtraExportMenuOptions {
    extraOptions: ExportMenuOption[];
    label: string;
}

interface ExportMenuProps {
    advancedOptions?: Record<string, any>;
    extraExportMenuOptions?: ExtraExportMenuOptions[];
    model: QueryModel;
    onExport?: Record<string, (modelId?: string) => void>;
    supportedTypes?: Set<EXPORT_TYPES>;
}

export interface ExportOption {
    hidden?: boolean;
    icon: string;
    label: string;
    type: EXPORT_TYPES;
}

const exportOptions = [
    { type: EXPORT_TYPES.CSV, icon: 'fa-file-o', label: 'CSV' },
    { type: EXPORT_TYPES.EXCEL, icon: 'fa-file-excel-o', label: 'Excel' },
    { type: EXPORT_TYPES.TSV, icon: 'fa-file-text-o', label: 'TSV' },
    { type: EXPORT_TYPES.LABEL, icon: 'fa-tag', label: 'Label', hidden: true },
    { type: EXPORT_TYPES.STORAGE_MAP, icon: 'fa-file-excel-o', label: 'Storage Map (Excel)', hidden: true },
    // Note: EXPORT_TYPES and exportRows (used in export function below) also include support for FASTA and GENBANK,
    // but they were never used in the QueryGridPanel version of export. We're explicitly not supporting them in
    // this implementation until we need them.
] as ExportOption[];

interface ExportMenuItemProps {
    hasSelections: boolean;
    onExport: (option: ExportOption) => void;
    option: ExportOption;
    supportedTypes: Set<EXPORT_TYPES>;
}

const ExportMenuItem: FC<ExportMenuItemProps> = ({ hasSelections, onExport, option, supportedTypes }) => {
    const onClick = useCallback(() => {
        onExport(option);
    }, [onExport, option]);

    if (option.hidden && !supportedTypes?.includes(option.type)) return null;

    if (option.type === EXPORT_TYPES.LABEL) {
        const exportAndPrintHeader = 'Export and Print' + (hasSelections ? ' Selected Data' : ' Data');
        return (
            <React.Fragment key={option.type}>
                <MenuDivider />
                <MenuHeader text={exportAndPrintHeader} />
                <MenuItem onClick={onClick}>
                    <span className={`fa ${option.icon} export-menu-icon`} />
                    &nbsp; {option.label}
                </MenuItem>
            </React.Fragment>
        );
    }

    if (option.type === EXPORT_TYPES.STORAGE_MAP) {
        return (
            <React.Fragment key={option.type}>
                <MenuDivider />
                <MenuHeader text="Export Map" />
                <MenuItem onClick={onClick}>
                    <span className={`fa ${option.icon} export-menu-icon`} />
                    &nbsp; {option.label}
                </MenuItem>
            </React.Fragment>
        );
    }

    return (
        <MenuItem key={option.type} onClick={onClick}>
            <div className="export-menu__item">
                <span className={`fa ${option.icon} export-menu-icon`} />
                <span>{option.label}</span>
            </div>
        </MenuItem>
    );
};

export interface ExportMenuImplProps extends Omit<ExportMenuProps, 'model'> {
    exportHandler: (option: ExportOption) => void;
    extraExportMenuOptions?: ExtraExportMenuOptions[];
    hasData: boolean;
    hasSelections?: boolean;
    id: string;
}

const ExportMenuImpl: FC<ExportMenuImplProps> = memo(props => {
    const { id, hasData, supportedTypes, hasSelections, exportHandler, onExport, extraExportMenuOptions } = props;

    const exportCallback = useCallback(
        (option: ExportOption) => {
            const { type } = option;
            if (onExport?.[type]) {
                onExport[type]?.(id);
            } else {
                exportHandler(option);
            }
        },
        [exportHandler, id, onExport]
    );

    const exportHeader = 'Export' + (hasSelections ? ' Selected' : '') + ' Data';

    return (
        hasData && (
            <div className="export-menu">
                <Tip caption="Export">
                    <DropdownButton noCaret pullRight title={<span className="fa fa-download" />}>
                        <MenuHeader text={exportHeader} />

                        {exportOptions.map(option => (
                            <ExportMenuItem
                                key={option.label}
                                hasSelections={hasSelections}
                                onExport={exportCallback}
                                option={option}
                                supportedTypes={supportedTypes}
                            />
                        ))}

                        {extraExportMenuOptions?.map(obj => (
                            <React.Fragment key={obj.label}>
                                <MenuDivider />

                                <MenuHeader text={obj.label} />

                                {obj.extraOptions.map(option => (
                                    <ExportMenuItem
                                        key={option.option.label}
                                        hasSelections={hasSelections}
                                        supportedTypes={supportedTypes}
                                        {...option}
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                    </DropdownButton>
                </Tip>
            </div>
        )
    );
});

export class ExportMenu extends PureComponent<ExportMenuProps> {
    export = (option: ExportOption): void => {
        const { model, advancedOptions, onExport } = this.props;
        const { type } = option;

        if (onExport?.[type]) {
            onExport[type](model.id);
        } else {
            exportRows(type, getQueryModelExportParams(model, type, advancedOptions), model.containerPath);
        }
    };

    render(): ReactNode {
        const { model, ...rest } = this.props;
        const { id, hasData, hasSelections } = model;

        return (
            <ExportMenuImpl
                {...rest}
                id={id}
                hasData={hasData}
                hasSelections={hasSelections}
                exportHandler={this.export}
            />
        );
    }
}
