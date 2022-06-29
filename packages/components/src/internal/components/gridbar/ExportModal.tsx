import React, { FC, memo, useCallback, useState } from 'react';
import { Checkbox, Label, Modal } from 'react-bootstrap';

import { QueryModelMap } from '../../../public/QueryModel/withQueryModels';

interface ExportModalProperties {
    canExport: boolean;
    onClose: () => void;
    onExport: (tabs: Set<string>) => Promise<void>;
    queryModels: QueryModelMap;
    tabOrder: string[];
    title?: string;
}
const DEFAULT_TITLE = 'Select the Tabs to Export';

export const ExportModal: FC<ExportModalProperties> = memo(props => {
    const { queryModels, tabOrder, onClose, onExport, canExport, title = DEFAULT_TITLE } = props;
    const [selected, setSelected] = useState<Set<string>>(() => {
        let selected = new Set<string>();
        tabOrder.forEach(modelId => {
            if (queryModels[modelId].rowCount > 0) selected = selected.add(modelId);
        });
        return selected;
    });

    const closeHandler = useCallback(() => {
        onClose();
    }, [onClose]);

    const exportHandler = useCallback(() => {
        onExport(selected);
    }, [onExport, selected]);

    const onChecked = useCallback(
        evt => {
            const modelId = evt.target.value;
            const draftSelected = new Set(selected);
            if (evt.target.checked) {
                setSelected(draftSelected.add(modelId));
            } else {
                draftSelected.delete(modelId);
                setSelected(draftSelected);
            }
        },
        [selected]
    );

    if (queryModels == null) return null;

    return (
        <Modal onHide={closeHandler} show={true}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="export-modal-body">
                    <ul>
                        {tabOrder.map(modelId => {
                            const model = queryModels[modelId];
                            return (
                                <Checkbox
                                    checked={selected.has(modelId)}
                                    className="export-modal-checkbox"
                                    key={modelId}
                                    value={modelId}
                                    onChange={onChecked}
                                >
                                    {`${model.title} (${model.rowCount})`}
                                </Checkbox>
                            );
                        })}
                    </ul>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div className="pull-left">
                    <button type="button" className="btn btn-default" onClick={closeHandler}>
                        Cancel
                    </button>
                </div>
                <div className="pull-right">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={exportHandler}
                        disabled={selected.size === 0 || !canExport}
                    >
                        Export
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
});
