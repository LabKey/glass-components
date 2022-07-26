import React, { FC, memo } from 'react';
import { MenuItem } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { RequiresPermission, ResponsiveMenuButton, isLoading } from '../../..';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { AssayImportSubMenuItem } from '../assay/AssayImportSubMenuItem';
import { InjectedAssayModel, withAssayModels } from '../assay/withAssayModels';

import { isSamplesSchema } from './utils';

interface Props {
    asSubMenu?: boolean;
    isPicklist?: boolean;
    model: QueryModel;
    providerType?: string;
    currentProductId?: string;
    targetProductId?: string;
    ignoreFilter?: boolean;
}

export const SamplesAssayButtonImpl: FC<Props & InjectedAssayModel> = memo(props => {
    const { model, providerType, asSubMenu, assayModel, isPicklist, currentProductId, targetProductId, ignoreFilter } = props;

    if (!isSamplesSchema(model?.schemaQuery) && !isPicklist) return null;

    const picklistName = isPicklist ? model.queryName : undefined;

    let items = (
        <AssayImportSubMenuItem
            queryModel={model?.hasSelections ? model : undefined}
            providerType={providerType}
            picklistName={picklistName}
            requireSelection={false}
            text={asSubMenu ? 'Import Assay Data' : null} // using null will render the submenu items inline in this button
            currentProductId={currentProductId}
            targetProductId={targetProductId}
            ignoreFilter={ignoreFilter}
        />
    );

    if (!isLoading(assayModel?.definitionsLoadingState) && assayModel.definitions.length === 0) {
        items = <MenuItem disabled>No assays defined</MenuItem>;
    }

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.Insert}>
            <ResponsiveMenuButton id="samples-assay-menu" items={items} text="Assay" asSubMenu={asSubMenu} />
        </RequiresPermission>
    );
});

export const SamplesAssayButton = withAssayModels<Props>(SamplesAssayButtonImpl);
