import React, { FC, memo, useCallback, useState } from 'react';

import { MenuItem } from '../../dropdowns';
import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { ChartBuilderModal } from './ChartBuilderModal';

export const ChartBuilderMenuItem: FC<RequiresModelAndActions> = memo(({ actions, model }) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const { createNotification } = useNotificationsContext();

    const onShowModal = useCallback(() => {
        setShowModal(true);
    }, []);

    const onHideModal = useCallback(
        (successMsg?: string) => {
            setShowModal(false);
            if (successMsg) {
                createNotification({ message: successMsg, alertClass: 'success' });
            }
        },
        [createNotification]
    );

    return (
        <>
            <MenuItem onClick={onShowModal}>
                <i className="fa fa-plus-circle" />
                <span className="chart-menu-label">Create Chart</span>
            </MenuItem>
            {showModal && <ChartBuilderModal actions={actions} model={model} onHide={onHideModal} />}
        </>
    );
});
