/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { List, Map } from 'immutable'
import moment from 'moment'

import { NotificationItemModel, NotificationItemProps, Persistence } from './model'
import { createNotification, setTrialBannerDismissSessionKey } from './actions'

import { NotificationItem } from "./NotificationItem";
import { User } from "@glass/models";
import { dismissNotifications } from "./global";
import { getDateFormat } from "../../utils/Date";


interface NotificationProps {
    notificationHeader?: string
    user?: User
}


export class Notification extends React.Component<NotificationProps, any> {

    componentWillMount() {
        Notification.createSystemNotification();
    }

    componentWillUnmount() {
        dismissNotifications();
    }

    static renderTrialServicesNotification(props: NotificationItemProps, user: User, data: any) {
        if (LABKEY.moduleContext.trialservices.trialEndDate) {
            let endDate = moment(LABKEY.moduleContext.trialservices.trialEndDate, getDateFormat());
            let today = moment();
            let secondsDiff = endDate.diff(today, 'seconds');
            let dayDiff = endDate.diff(today, 'days');
            // seems a little silly, but if we have any time left in the current day, we count it as a day
            if (secondsDiff % 86400 > 0)
                dayDiff++;
            let message = '';
            if (dayDiff <= 0)
                message = "This LabKey trial site has expired.";
            else
                message = "This LabKey trial site will expire in " + dayDiff + ((dayDiff == 1) ? " day." : " days.");
            if (LABKEY.moduleContext.trialservices.upgradeLink && user.isAdmin)
                return (
                    <span>
                        {message}
                        &nbsp;<a href={LABKEY.moduleContext.trialservices.upgradeLink} target="_blank">{LABKEY.moduleContext.trialservices.upgradeLinkText}</a>
                    </span>
                );
            else
                return message;
        }
        return null;
    }

    static createSystemNotification() {
        if (LABKEY.moduleContext && LABKEY.moduleContext.trialservices && LABKEY.moduleContext.trialservices.trialEndDate) {

            createNotification({
                alertClass: 'warning',
                id: 'trial_ending',
                message: Notification.renderTrialServicesNotification,
                onDismiss: setTrialBannerDismissSessionKey,
                persistence: Persistence.LOGIN_SESSION
            });
        }
    }

    static renderItems(notifications: List<NotificationItemModel>, user: User) {

        if (notifications.size > 1) {
            return (
                <ul>
                {notifications.map((item, index) => (
                    <li key={index}>
                        <NotificationItem item={item} user={user}/>
                    </li>
                ))}
                </ul>
            )
        }

        return notifications.map((item, index) => (
            <NotificationItem item={item} key={index} user={user}/>
        ));
    }

    getNotifications() {
        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.Notifications;
    }

    getAlertClassLists() {
        let listMap = Map<string, List<NotificationItemModel>>();
        const notifications = this.getNotifications();
        if (notifications) {
            notifications.forEach((item) => {
                if (!item.isDismissed) {
                    if (!listMap.get(item.alertClass)) {
                        listMap = listMap.set(item.alertClass, List<NotificationItemModel>().asMutable());
                    }
                    listMap.get(item.alertClass).push(item);
                }
            });
        }
        return listMap.asImmutable();
    }

    render() {
        const { notificationHeader, user } = this.props;

        return (
            this.getAlertClassLists()
                .filter(list => list.size > 0)
                .map((list, alertClass) => (
                    <div className={'notification-container alert alert-' + alertClass} key={alertClass}>
                        {notificationHeader}
                        {Notification.renderItems(list, user)}
                    </div>
                )).toArray()
        );
    }
}


