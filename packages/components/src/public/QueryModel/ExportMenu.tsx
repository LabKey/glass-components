import React, { FC, memo, PureComponent, ReactNode, useCallback } from 'react';
import { Set } from 'immutable';

import { exportRows as exportRows_ } from '../../internal/actions';

import { EXPORT_TYPES, MAX_SELECTION_ACTION_ROWS } from '../../internal/constants';
import { Tip } from '../../internal/components/base/Tip';

import { DropdownButton, MenuDivider, MenuHeader, MenuItem } from '../../internal/dropdowns';

import { QueryModel } from './QueryModel';
import { getQueryModelExportParams } from './utils';
import { Actions } from './withQueryModels';
import { SelectionMenuItem } from '../../internal/components/menus/SelectionMenuItem';

interface ExportMenuProps {
    actions: Actions;
    advancedOptions?: Record<string, any>;
    // exportRows needed for tests, defaults to exportRows imported from internal/actions
    exportRows?: (type: EXPORT_TYPES, exportParams: Record<string, any>, containerPath?: string) => void;
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
    { type: EXPORT_TYPES.LABEL, icon: 'fa-print', label: 'Print Label', hidden: true },
    { type: EXPORT_TYPES.LABEL_TEMPLATE, icon: 'fa-file-o', label: 'Download Template', hidden: true },
    { type: EXPORT_TYPES.STORAGE_MAP, icon: 'fa-file-excel-o', label: 'Storage Map (Excel)', hidden: true },
    // Note: EXPORT_TYPES and exportRows (used in export function below) also include support for FASTA and GENBANK,
    // but they were never used in the QueryGridPanel version of export. We're explicitly not supporting them in
    // this implementation until we need them.
] as ExportOption[];

interface ExportMenuItemProps {
    hasSelections: boolean;
    model: QueryModel;
    onExport: (option: ExportOption) => void;
    option: ExportOption;
    supportedTypes: Set<EXPORT_TYPES>;
}

const ExportMenuItem: FC<ExportMenuItemProps> = ({ model, onExport, option, supportedTypes }) => {
    const onClick = useCallback(() => {
        onExport(option);
    }, [onExport, option]);

    if (option.hidden && !supportedTypes?.includes(option.type)) return null;

    if (
        option.type === EXPORT_TYPES.LABEL ||
        (option.type === EXPORT_TYPES.LABEL_TEMPLATE && !supportedTypes?.includes(EXPORT_TYPES.LABEL))
    ) {
        const exportAndPrintHeader = 'Bartender';
        return (
            <React.Fragment key={option.type}>
                <MenuDivider />
                <MenuHeader text={exportAndPrintHeader} />
                {option.type === EXPORT_TYPES.LABEL && (
                    <SelectionMenuItem
                        nounPlural="samples"
                        queryModel={model}
                        text={
                            <>
                                <span className={`fa ${option.icon} export-menu-icon`} />
                                {option.label}
                            </>
                        }
                        maxSelection={MAX_SELECTION_ACTION_ROWS}
                    />
                )}
                {option.type !== EXPORT_TYPES.LABEL && (
                    <MenuItem onClick={onClick}>
                        <span className={`fa ${option.icon} export-menu-icon`} />
                        {option.label}
                    </MenuItem>
                )}
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
                    {option.label}
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

export interface ExportMenuImplProps extends ExportMenuProps {
    exportHandler: (option: ExportOption) => void;
    hasData: boolean;
    hasSelections?: boolean;
    id: string;
}

const ExportMenuImpl: FC<ExportMenuImplProps> = memo(props => {
    const { model, id, hasData, supportedTypes, hasSelections, exportHandler, onExport } = props;

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
                                model={model}
                            />
                        ))}
                    </DropdownButton>
                </Tip>
            </div>
        )
    );
});

export class ExportMenu extends PureComponent<ExportMenuProps> {
    export = (option: ExportOption): void => {
        const { actions, advancedOptions, exportRows = exportRows_, model, onExport } = this.props;
        const { type } = option;

        if (onExport?.[type]) {
            onExport[type](model.id);
        } else {
            // Issue 39332: add message about export start
            actions.addMessage(model.id, { type: 'success', content: option.label + ' export started.' }, 5000);
            exportRows(type, getQueryModelExportParams(model, type, advancedOptions), model.containerPath);
        }
    };

    render(): ReactNode {
        const { model, ...rest } = this.props;
        const { id, hasData, hasSelections } = model;

        return (
            <ExportMenuImpl
                {...rest}
                model={model}
                id={id}
                hasData={hasData}
                hasSelections={hasSelections}
                exportHandler={this.export}
            />
        );
    }
}
