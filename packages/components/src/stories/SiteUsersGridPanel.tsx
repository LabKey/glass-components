/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';
import { List, Map } from 'immutable';
import { Security } from '@labkey/api';

import { SecurityPolicy, SecurityRole } from '../components/permissions/models';
import { getRolesByUniqueName, processGetRolesResponse } from '../components/permissions/actions';
import { SiteUsersGridPanel } from '../components/user/SiteUsersGridPanel';
import policyJSON from '../test/data/security-getPolicy.json';
import './stories.scss';
import { SECURITY_ROLE_AUTHOR, SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER } from '../test/data/constants';

const ROLE_OPTIONS = [
    { id: SECURITY_ROLE_READER, label: 'Reader (default)' },
    { id: SECURITY_ROLE_AUTHOR, label: 'Author' },
    { id: SECURITY_ROLE_EDITOR, label: 'Editor' },
];

interface Props {
    allowDelete: boolean;
    showRoleOptions: boolean;
}

interface State {
    policy: SecurityPolicy;
    roles: List<SecurityRole>;
    rolesByUniqueName: Map<string, SecurityRole>;
}

class SiteUsersGridPanelWrapper extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            policy: SecurityPolicy.create(policyJSON),
            roles: undefined,
            rolesByUniqueName: undefined,
        };
    }

    componentDidMount() {
        Security.getRoles({
            success: (response: any) => {
                const roles = processGetRolesResponse(response);
                const rolesByUniqueName = getRolesByUniqueName(roles);
                this.setState(() => ({ roles, rolesByUniqueName }));
            },
        });
    }

    render() {
        return (
            <SiteUsersGridPanel
                {...this.state}
                onCreateComplete={(response, role) => console.log(response, role)}
                onUsersStateChangeComplete={response => console.log(response)}
                newUserRoleOptions={this.props.showRoleOptions ? ROLE_OPTIONS : undefined}
                allowDelete={this.props.allowDelete}
            />
        );
    }
}

storiesOf('SiteUsersGridPanel', module)
    .addDecorator(withKnobs)
    .add('default props', () => {
        return <SiteUsersGridPanelWrapper allowDelete={true} showRoleOptions={false} />;
    })
    .add('without delete', () => {
        return <SiteUsersGridPanelWrapper allowDelete={false} showRoleOptions={false} />;
    })
    .add('with role options on create', () => {
        return <SiteUsersGridPanelWrapper allowDelete={true} showRoleOptions={true} />;
    });
