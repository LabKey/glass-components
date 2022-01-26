import React, { ReactNode } from 'react';
import { Utils } from '@labkey/api';

import { AppURL } from '../../url/AppURL';
import {ACTIVE_JOB_INDICATOR_CLS, App, AssayUploadResultModel, ProductMenuModel, Tip} from '../../../index';

export function hasActivePipelineJob(menu: ProductMenuModel, sectionKey: string, itemLabel: string): boolean {
    if (!menu.isLoaded) return false;

    const section = menu.getSection(sectionKey);
    if (section) {
        const menuItem = section.items.find(set => Utils.caseInsensitiveEquals(set.get('label'), itemLabel));
        return menuItem?.hasActiveJob;
    }

    return false;
}

export function getPipelineLinkMsg(response: AssayUploadResultModel): ReactNode {
    return (
        <>
            Click <a href={AppURL.create('pipeline', response.jobId).toHref()}> here </a> to check the status of the
            background import.{' '}
        </>
    );
}

export function getWorkflowLinkMsg(workflowJobId?: string, workflowTaskId?: string): ReactNode {
    if (workflowJobId) {
        let jobTasksUrl = AppURL.create(App.WORKFLOW_KEY, workflowJobId, 'tasks');
        if (workflowTaskId) {
            jobTasksUrl = jobTasksUrl.addParams({
                taskId: workflowTaskId,
            });
        }

        return (
            <>
                Click
                <a href={jobTasksUrl.toHref()} className="alert-link">
                    {' '}
                    here{' '}
                </a>
                to go back to the workflow task.
            </>
        );
    }
    return null;
}

export function getTitleDisplay(content: ReactNode, hasActivePipelineJob: boolean): ReactNode {
    return hasActivePipelineJob ? (
        <>
            <Tip caption="Background import in progress">
                <i className={'fa ' + ACTIVE_JOB_INDICATOR_CLS} />
            </Tip>
            <span className="page-detail-header-title-padding">{content}</span>
        </>
    ) : (
        content
    );
}
