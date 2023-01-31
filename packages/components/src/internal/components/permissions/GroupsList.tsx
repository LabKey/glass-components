import React, { FC, memo, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { AppURL } from '../../url/AppURL';
import { User } from '../base/models/User';
import { fetchGroupMembership } from '../administration/actions';
import { useAppContext } from '../../AppContext';
import { useServerContext } from '../base/ServerContext';
import { GroupMembership, MemberType } from '../administration/models';

interface Props {
    asRow?: boolean;
    currentUser: User;
    groups: [{ displayValue: string; value: number }];
    showLinks?: boolean;
}

export const GroupsList: FC<Props> = memo(props => {
    const { groups, currentUser, asRow = true, showLinks = true } = props;
    const [groupMembership, setGroupMembership] = useState<GroupMembership>();
    const { api } = useAppContext();
    const { container } = useServerContext();

    useEffect(() => {
        (async () => {
            if (currentUser.hasAdminPermission()) {
                const groupMembership_ = await fetchGroupMembership(container, api.security);
                setGroupMembership(groupMembership_);
            }
        })();
    }, [api.security, container, currentUser]);

    if (!groups) return null;

    const body = (
        <ul className="principal-detail-ul">
            {groups.length > 0 ? (
                groups.map(group => (
                    <li key={group.value} className="principal-detail-li">
                        {currentUser.isAdmin &&
                        showLinks &&
                        groupMembership?.[group.value].type !== MemberType.siteGroup ? (
                            <a
                                href={AppURL.create('admin', 'groups')
                                    .addParam('expand', group.value)
                                    .toHref()}
                            >
                                {group.displayValue}
                            </a>
                        ) : (
                            group.displayValue
                        )}
                    </li>
                ))
            ) : (
                <li className="principal-detail-li">None</li>
            )}
        </ul>
    );

    if (!asRow) return body;

    return (
        <>
            <hr className="principal-hr" />
            <Row>
                <Col xs={4} className="principal-detail-label">
                    Groups
                </Col>
                <Col xs={8} className="principal-detail-value">
                    {body}
                </Col>
            </Row>
        </>
    );
});
