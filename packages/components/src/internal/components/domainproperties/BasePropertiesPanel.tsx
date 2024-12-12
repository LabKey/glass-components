import React, { PropsWithChildren, ReactNode } from 'react';

import { isApp } from '../../app/utils';

import { Alert } from '../base/Alert';

import { DomainPanelStatus } from './models';
import { getDomainAlertClasses, getDomainPanelClass } from './actions';
import { CollapsiblePanelHeader } from './CollapsiblePanelHeader';
import { PROPERTIES_PANEL_ERROR_MSG } from './constants';
import { InjectedDomainPropertiesPanelCollapseProps } from './DomainPropertiesPanelCollapse';
import { Collapsible } from './Collapsible';

export interface BasePropertiesPanelProps {
    panelStatus: DomainPanelStatus;
    validate: boolean;
    warning?: string;
}

interface OwnProps extends PropsWithChildren {
    headerId: string;
    isValid: boolean;
    title: string;
    titlePrefix?: string;
    todoIconHelpMsg?: string;
    updateValidStatus: (model?: any) => void;
}

type Props = OwnProps & BasePropertiesPanelProps & InjectedDomainPropertiesPanelCollapseProps;

export class BasePropertiesPanel extends React.PureComponent<Props> {
    static defaultProps = {
        title: 'Properties',
        validate: false,
    };

    componentDidUpdate(prevProps: Props): void {
        const { validate, updateValidStatus } = this.props;

        if (validate && prevProps.validate !== validate) {
            updateValidStatus();
        }
    }

    toggleLocalPanel = (): void => {
        const { togglePanel, collapsed, updateValidStatus } = this.props;

        updateValidStatus();
        togglePanel(!collapsed);
    };

    render(): ReactNode {
        const {
            collapsed,
            collapsible,
            controlledCollapse,
            panelStatus,
            headerId,
            titlePrefix,
            title,
            isValid,
            children,
            warning,
            todoIconHelpMsg,
        } = this.props;
        const isApp_ = isApp();

        let body = <div className="panel-body">{children}</div>;

        if (collapsible || controlledCollapse) {
            body = (
                <Collapsible className="panel-collapse" expanded={!collapsed}>
                    {body}
                </Collapsible>
            );
        }

        return (
            <>
                <div className={getDomainPanelClass(collapsed, true, isApp_)}>
                    <CollapsiblePanelHeader
                        id={headerId}
                        title={title}
                        titlePrefix={titlePrefix}
                        togglePanel={this.toggleLocalPanel}
                        collapsed={collapsed}
                        collapsible={collapsible}
                        controlledCollapse={controlledCollapse}
                        panelStatus={panelStatus}
                        isValid={isValid}
                        iconHelpMsg={PROPERTIES_PANEL_ERROR_MSG}
                        todoIconHelpMsg={todoIconHelpMsg}
                    />
                    {body}
                </div>
                {!isValid && (
                    <div onClick={this.toggleLocalPanel} className={getDomainAlertClasses(collapsed, true, isApp_)}>
                        <Alert bsStyle="danger">{PROPERTIES_PANEL_ERROR_MSG}</Alert>
                    </div>
                )}
                {isValid && warning && (
                    <div onClick={this.toggleLocalPanel} className={getDomainAlertClasses(collapsed, true, isApp_)}>
                        <Alert bsStyle="warning">{warning}</Alert>
                    </div>
                )}
            </>
        );
    }
}
