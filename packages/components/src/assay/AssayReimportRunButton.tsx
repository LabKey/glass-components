import React, { FC, memo } from 'react';
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

import { applyURL, AppURL } from '../internal/url/AppURL';
import { AssayLink } from '../internal/AssayDefinitionModel';

import { AssayContextConsumer } from '../internal/components/assay/withAssayModels';

interface AssayReImportRunButtonProps {
    replacedByRunId?: string | number;
    runId: string | number;
}

export const AssayReimportRunButton: FC<AssayReImportRunButtonProps> = memo(({ replacedByRunId, runId }) => {
    if (replacedByRunId) {
        return (
            <OverlayTrigger
                overlay={
                    <Popover id="assay-submenu-warning">
                        This run has already been replaced by Run {replacedByRunId} and cannot be re-imported.
                    </Popover>
                }
                placement="left"
            >
                <MenuItem disabled>Re-Import Run</MenuItem>
            </OverlayTrigger>
        );
    }

    return (
        <AssayContextConsumer>
            {({ assayDefinition, assayProtocol }) => {
                if (runId !== undefined && assayDefinition.reRunSupport?.toLowerCase() !== 'none') {
                    let url;
                    if (assayProtocol.isGPAT()) {
                        url = AppURL.create('assays', assayProtocol.providerName, assayProtocol.name, 'upload')
                            .addParam('runId', runId)
                            .toHref();
                    } else {
                        url =
                            assayDefinition.links.get(AssayLink.IMPORT) +
                            '&reRunId=' +
                            runId +
                            applyURL('returnUrl', { returnUrl: assayDefinition.getRunsUrl() });
                    }
                    return (
                        <OverlayTrigger
                            overlay={
                                <Popover id="assay-submenu-info">
                                    Import a revised version of this run, with updated metadata or data file.
                                </Popover>
                            }
                            placement="left"
                        >
                            <MenuItem href={url}>Re-Import Run</MenuItem>
                        </OverlayTrigger>
                    );
                }

                return null;
            }}
        </AssayContextConsumer>
    );
});
