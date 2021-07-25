/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';
import { List } from 'immutable';

import { SelectInput } from '../../..';

import { Principal, SecurityRole } from './models';

interface Props {
    role: SecurityRole;
    principals: List<Principal>;
    onSelect: (selected: Principal) => void;
    placeholder?: string;
}

export class AddRoleAssignmentInput extends PureComponent<Props> {
    static defaultProps = {
        placeholder: 'Add member or group...',
    };

    onChange = (name: string, formValue: any, selected: Principal): void => {
        if (selected) {
            this.props.onSelect(selected);
        }
    };

    render() {
        const { role, principals, placeholder } = this.props;
        const name = 'addRoleAssignment';

        return (
            <SelectInput
                autoValue={false}
                name={name}
                key={name + ':' + role.uniqueName}
                options={principals.toArray()}
                placeholder={placeholder}
                inputClass="col-xs-12"
                valueKey="userId"
                labelKey="displayName"
                onChange={this.onChange}
                selectedOptions={null}
            />
        );
    }
}
