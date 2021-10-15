import React from 'react';
import { Panel } from 'react-bootstrap';

import { Alert } from '../../..';

import { DomainPanelStatus } from './models';
import { getDomainAlertClasses, getDomainPanelClass, updateDomainPanelClassList } from './actions';
import { CollapsiblePanelHeader } from './CollapsiblePanelHeader';
import { PROPERTIES_PANEL_ERROR_MSG, PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG } from './constants';
import { InjectedDomainPropertiesPanelCollapseProps } from './DomainPropertiesPanelCollapse';

export interface BasePropertiesPanelProps {
    panelStatus: DomainPanelStatus;
    hasWarning?: string;
    validate: boolean;
    useTheme: boolean;
}

interface OwnProps {
    headerId: string;
    title: string;
    titlePrefix: string;
    isValid: boolean;
    updateValidStatus: (model?: any) => any;
}

type Props = OwnProps & BasePropertiesPanelProps & InjectedDomainPropertiesPanelCollapseProps;

export class BasePropertiesPanel extends React.PureComponent<Props, any> {
    static defaultProps = {
        title: 'Properties',
        validate: false,
        useTheme: false,
    };

    UNSAFE_componentWillReceiveProps(nextProps: Readonly<Props>): void {
        const { validate, updateValidStatus } = this.props;

        if (nextProps.validate && validate !== nextProps.validate) {
            updateValidStatus();
        }
    }

    componentDidMount(): void {
        updateDomainPanelClassList(this.props.useTheme, undefined, this.props.headerId);
    }

    componentDidUpdate(prevProps: Props): void {
        updateDomainPanelClassList(prevProps.useTheme, undefined, this.props.headerId);
    }

    toggleLocalPanel = (evt: any): void => {
        const { togglePanel, collapsed, updateValidStatus } = this.props;

        updateValidStatus();
        togglePanel(evt, !collapsed);
    };

    render() {
        const {
            collapsed,
            collapsible,
            controlledCollapse,
            panelStatus,
            useTheme,
            headerId,
            titlePrefix,
            title,
            isValid,
            children,
            hasWarning,
        } = this.props;

        return (
            <>
                <Panel
                    className={getDomainPanelClass(collapsed, true, useTheme)}
                    expanded={!collapsed}
                    onToggle={function () {}} // this is added to suppress JS warning about providing an expanded prop without onToggle
                >
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
                        useTheme={useTheme}
                    />
                    <Panel.Body collapsible={collapsible || controlledCollapse}>{children}</Panel.Body>
                </Panel>
                {!isValid && (
                    <div onClick={this.toggleLocalPanel} className={getDomainAlertClasses(collapsed, true, useTheme)}>
                        <Alert bsStyle="danger">{PROPERTIES_PANEL_ERROR_MSG}</Alert>
                    </div>
                )}
                {isValid && hasWarning && (
                    <div onClick={this.toggleLocalPanel} className={getDomainAlertClasses(collapsed, true, useTheme)}>
                        <Alert bsStyle="warning">{hasWarning}</Alert>
                    </div>
                )}
            </>
        );
    }
}
