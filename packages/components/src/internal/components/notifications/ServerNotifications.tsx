import React, { ReactNode } from 'react';
import { DropdownButton } from 'react-bootstrap';

import { User } from '../base/models/User';

import { getPipelineActivityData } from './actions';
import { ServerActivityData } from './model';
import { ServerActivityList } from './ServerActivityList';
import { LoadingSpinner } from '../../../index';

interface Props {
    user?: User;
}

interface State {
    activityData: ServerActivityData[];
    isLoading: boolean;
    error: string;
    show: boolean;
}

export class ServerNotifications extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            activityData: undefined,
            isLoading: true,
            error: undefined,
            show: false,
        };
    }

    componentDidMount(): void {
        getPipelineActivityData()
            .then(response => {
                this.setState(() => ({ activityData: response, isLoading: false }));
            })
            .catch(reason => {
                this.setState(() => ({ error: reason, isLoading: false }));
            });
    }

    markAllRead = (): void => {
        console.log("markAllRead: not yet implemented");
    };

    viewAll = (): void => {
        console.log("viewAll: not yet implemented");
    };

    hasAnyUnread(): boolean {
        return this.state.activityData?.find(activity => activity.ReadOn == undefined) !== undefined;
    }

    hasAnyInProgress(): boolean {
        return this.state.activityData?.find(activity => activity.inProgress === true) !== undefined;
    }

    toggleMenu = (): void => {
        this.setState(state => ({ show: !state.show }));
    };

    render(): ReactNode {
        const { activityData, error, isLoading, show } = this.state;

        const title = (
            <h3 className="server-notifications-header">
                <div className="navbar-icon-connector" />
                Notifications
                {this.hasAnyUnread() && <div className="pull-right server-notifications-link" onClick={this.markAllRead}>Mark all as read</div>}
            </h3>
        );
        let body;
        if (isLoading) {
            body = <div className="server-notifications-footer"><LoadingSpinner /></div>;
        } else if (error) {
            body = <div className="server-notifications-footer server-notifications-error">{error}</div>;
        } else {
            body = <ServerActivityList activityData={activityData} onViewAll={this.viewAll} />;
        }
        const icon = (
            <span className="fa-stack navbar-icon" data-count={activityData?.length ? activityData.length : undefined}>
                <i className="fa fa-circle fa-stack-1x" />
                <i className={
                        'fa ' +
                        (this.hasAnyInProgress() ? 'fa-spinner fa-pulse' : 'fa-bell') +
                        ' fa-stack-1x server-notifications-icon'
                    }
                />
            </span>
        );
        return (
            <DropdownButton
                id="server-notifications-button"
                className="navbar-icon-button-right"
                noCaret={true}
                title={icon}
                open={show}
                onToggle={this.toggleMenu}
                pullRight={true}
            >
                {title}
                {body}
            </DropdownButton>
        );
    }
}
