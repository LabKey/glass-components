/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { mount } from 'enzyme';
import { SiteUsersGridPanel } from './SiteUsersGridPanel';
import { SecurityPolicy } from "../permissions/models";
import { getRolesByUniqueName, processGetRolesResponse } from "../permissions/actions";
import { initQueryGridState } from "../../global";
import policyJSON from "../../test/data/security-getPolicy.json";
import rolesJSON from "../../test/data/security-getRoles.json";

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

beforeAll(() => {
    initQueryGridState()
});

describe("<SiteUsersGridPanel/>", () => {

    test("active users view", () => {
        const component = (
            <SiteUsersGridPanel
                onCreateComplete={jest.fn()}
                onUsersStateChangeComplete={jest.fn()}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('QueryGridPanel')).toHaveLength(1);
        expect(wrapper.find('UserDetailsPanel')).toHaveLength(1);
        expect(wrapper.find('.panel-heading').first().text()).toBe('Active Users');
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('#users-manage-btn-managebtn').hostNodes()).toHaveLength(1);
        wrapper.find('#users-manage-btn-managebtn').hostNodes().simulate('click');
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Deactivate Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Reactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Delete Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Inactive Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Active Users')).toHaveLength(0);
        wrapper.unmount();
    });

    test("without delete", () => {
        const component = (
            <SiteUsersGridPanel
                onCreateComplete={jest.fn()}
                onUsersStateChangeComplete={jest.fn()}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                allowDelete={false}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('QueryGridPanel')).toHaveLength(1);
        expect(wrapper.find('UserDetailsPanel')).toHaveLength(1);
        expect(wrapper.find('.panel-heading').first().text()).toBe('Active Users');
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('#users-manage-btn-managebtn').hostNodes()).toHaveLength(1);
        wrapper.find('#users-manage-btn-managebtn').hostNodes().simulate('click');
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Deactivate Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Reactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Delete Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Inactive Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Active Users')).toHaveLength(0);
        wrapper.unmount();
    });

    test("inactive users view", () => {
        const component = (
            <SiteUsersGridPanel
                onCreateComplete={jest.fn()}
                onUsersStateChangeComplete={jest.fn()}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const wrapper = mount(component);
        wrapper.setState({usersView: 'inactive'});

        expect(wrapper.find('QueryGridPanel')).toHaveLength(1);
        expect(wrapper.find('UserDetailsPanel')).toHaveLength(1);
        expect(wrapper.find('.panel-heading').first().text()).toBe('Inactive Users');
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('#users-manage-btn-managebtn').hostNodes()).toHaveLength(1);
        wrapper.find('#users-manage-btn-managebtn').hostNodes().simulate('click');
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Deactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Reactivate Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Delete Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Inactive Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Active Users')).toHaveLength(1);
        wrapper.unmount();
    });

    test("all users view", () => {
        const component = (
            <SiteUsersGridPanel
                onCreateComplete={jest.fn()}
                onUsersStateChangeComplete={jest.fn()}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const wrapper = mount(component);
        wrapper.setState({usersView: 'all'});

        expect(wrapper.find('QueryGridPanel')).toHaveLength(1);
        expect(wrapper.find('UserDetailsPanel')).toHaveLength(1);
        expect(wrapper.find('.panel-heading').first().text()).toBe('All Users');
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('#users-manage-btn-managebtn').hostNodes()).toHaveLength(1);
        wrapper.find('#users-manage-btn-managebtn').hostNodes().simulate('click');
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Deactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Reactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Delete Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Inactive Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Active Users')).toHaveLength(1);
        wrapper.unmount();
    });

});
