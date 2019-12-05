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
import { List, Map, fromJS } from 'immutable';
import { Principal, SecurityAssignment, SecurityPolicy, SecurityRole } from "./models";
import policyJSON from "../../test/data/security-getPolicy.json";
import rolesJSON from "../../test/data/security-getRoles.json";
import { getRolesByUniqueName, processGetRolesResponse } from "./actions";
import {
    SECURITY_ROLE_APPADMIN, SECURITY_ROLE_AUTHOR,
    SECURITY_ROLE_EDITOR,
    SECURITY_ROLE_FOLDERADMIN,
    SECURITY_ROLE_READER
} from "../../test/data/constants";

const GROUP = Principal.createFromSelectRow(fromJS({
    UserId: {value: 1},
    Type: {value: 'g'},
    Name: {value: 'Group1'},
    DisplayName: {value: undefined},
}));

const USER1 = Principal.createFromSelectRow(fromJS({
    UserId: {value: 2},
    Type: {value: 'u'},
    Name: {value: 'bUser1'},
    DisplayName: {value: undefined},
}));

const USER2 = Principal.createFromSelectRow(fromJS({
    UserId: {value: 3},
    Type: {value: 'u'},
    Name: {value: 'aUser2'},
    DisplayName: {value: 'User 2 Display'},
}));

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe('Principal model', () => {

    test("createFromSelectRow group", () => {
        expect(GROUP.userId).toBe(1);
        expect(GROUP.type).toBe('g');
        expect(GROUP.name).toBe('Group1');
        expect(GROUP.displayName).toBe('Group1');
    });

    test("createFromSelectRow user without displayName", () => {
        expect(USER1.userId).toBe(2);
        expect(USER1.type).toBe('u');
        expect(USER1.name).toBe('bUser1');
        expect(USER1.displayName).toBe('bUser1');
    });

    test("createFromSelectRow user with displayName", () => {
        expect(USER2.userId).toBe(3);
        expect(USER2.type).toBe('u');
        expect(USER2.name).toBe('aUser2');
        expect(USER2.displayName).toBe('aUser2 (User 2 Display)');
    });

    test("filterAndSort", () => {
        const principals = List<Principal>([GROUP, USER1, USER2]);

        // testing filter params
        expect(Principal.filterAndSort(principals, undefined, undefined).size).toBe(3);
        expect(Principal.filterAndSort(principals, 'g', undefined).size).toBe(1);
        expect(Principal.filterAndSort(principals, 'g', List<number>([2])).size).toBe(1);
        expect(Principal.filterAndSort(principals, 'g', List<number>([1])).size).toBe(0);
        expect(Principal.filterAndSort(principals, 'u', undefined).size).toBe(2);
        expect(Principal.filterAndSort(principals, 'u', List<number>([1])).size).toBe(2);
        expect(Principal.filterAndSort(principals, 'u', List<number>([2])).size).toBe(1);
        expect(Principal.filterAndSort(principals, 'u', List<number>([2, 3])).size).toBe(0);

        // testing sort
        const users = Principal.filterAndSort(principals, 'u', undefined);
        expect(users.size).toBe(2);
        expect(users.get(0)).toBe(USER2);
        expect(users.get(1)).toBe(USER1);
    });

});

describe('SecurityRole model', () => {

    test("filter", () => {
        // check that we default to filtering to the policy relevantRoles
        const relevantRoles = SecurityRole.filter(ROLES, POLICY);
        expect(relevantRoles.size).toBe(POLICY.relevantRoles.size);

        // check that we can filter for an explicit list
        expect(SecurityRole.filter(ROLES, POLICY, List<string>()).size).toBe(0);
        const roleArr = ["org.labkey.api.security.roles.EditorRole", "org.labkey.api.security.roles.AuthorRole", "org.labkey.api.security.roles.ReaderRole"];
        expect(SecurityRole.filter(ROLES, POLICY, List<string>(roleArr)).size).toBe(3);
    });

});

describe('SecurityAssignment model', () => {

    test("isTypeMatch", () => {
        expect(SecurityAssignment.isTypeMatch('g', 'g')).toBeTruthy();
        expect(SecurityAssignment.isTypeMatch('g', 'u')).toBeFalsy();
        expect(SecurityAssignment.isTypeMatch('u', 'u')).toBeTruthy();
        expect(SecurityAssignment.isTypeMatch('u', 'g')).toBeFalsy();
        expect(SecurityAssignment.isTypeMatch(undefined, 'u')).toBeTruthy();
        expect(SecurityAssignment.isTypeMatch(undefined, 'g')).toBeFalsy();
    });

    test("getDisplayName", () => {
        const group = new SecurityAssignment({userId: 1, type: 'g', displayName: 'DisplayName'});
        expect(SecurityAssignment.getDisplayName(group)).toBe('DisplayName');

        const userActive = new SecurityAssignment({userId: 1, type: 'u', displayName: 'DisplayName'});
        expect(SecurityAssignment.getDisplayName(userActive)).toBe('DisplayName');

        const userActiveNoDisplay = new SecurityAssignment({userId: 1, type: 'u', displayName: undefined});
        expect(SecurityAssignment.getDisplayName(userActiveNoDisplay)).toBe('1');

        const userInactive = new SecurityAssignment({userId: 1, type: undefined, displayName: 'DisplayName'});
        expect(SecurityAssignment.getDisplayName(userInactive)).toBe('Inactive User (1)');
    });

});

describe('SecurityPolicy model', () => {

    test("getAssignmentsByRole", () => {
        const byRole = SecurityPolicy.getAssignmentsByRole(POLICY.assignments);
        expect(byRole.size).toBe(7);
        expect(byRole.get(SECURITY_ROLE_APPADMIN)).toBe(undefined);
        expect(byRole.get(SECURITY_ROLE_FOLDERADMIN).size).toBe(2);
        expect(byRole.get(SECURITY_ROLE_EDITOR).size).toBe(3);
        expect(byRole.get(SECURITY_ROLE_READER).size).toBe(5);
    });

    test("removeAssignment", () => {
        const originalAssignmentSize = POLICY.assignments.size;

        // test for a valid removal
        let updatedPolicy = SecurityPolicy.removeAssignment(POLICY, 4971, ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR));
        expect(updatedPolicy.assignments.size).toBe(originalAssignmentSize - 1);
        let byRole = SecurityPolicy.getAssignmentsByRole(updatedPolicy.assignments);
        expect(byRole.get(SECURITY_ROLE_EDITOR).size).toBe(2);

        // test removing all assignments for a role
        updatedPolicy = SecurityPolicy.removeAssignment(updatedPolicy, 1004, ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR));
        updatedPolicy = SecurityPolicy.removeAssignment(updatedPolicy, 11842, ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR));
        expect(updatedPolicy.assignments.size).toBe(originalAssignmentSize - 3);
        byRole = SecurityPolicy.getAssignmentsByRole(updatedPolicy.assignments);
        expect(byRole.get(SECURITY_ROLE_EDITOR)).toBe(undefined);

        // test for a invalid removal (userId that doesn't exist for role, userId in another role)
        expect(SecurityPolicy.removeAssignment(POLICY, 49711111, ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR)).assignments.size).toBe(originalAssignmentSize);
        expect(SecurityPolicy.removeAssignment(POLICY, 4971, ROLES_BY_NAME.get(SECURITY_ROLE_READER)).assignments.size).toBe(originalAssignmentSize);
    });

    test("addAssignment", () => {
        const originalAssignmentSize = POLICY.assignments.size;

        // test for a valid addition of a group and then a user to role that has existing assignments
        let updatedPolicy = SecurityPolicy.addAssignment(POLICY, GROUP, ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR));
        updatedPolicy = SecurityPolicy.addAssignment(updatedPolicy, USER1, ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR));
        expect(updatedPolicy.assignments.size).toBe(originalAssignmentSize + 2);
        let byRole = SecurityPolicy.getAssignmentsByRole(updatedPolicy.assignments);
        expect(byRole.get(SECURITY_ROLE_EDITOR).size).toBe(5);

        // test for a valid addition of a group and then a user to role that has no existing assignments
        expect(byRole.get(SECURITY_ROLE_AUTHOR)).toBe(undefined);
        updatedPolicy = SecurityPolicy.addAssignment(updatedPolicy, GROUP, ROLES_BY_NAME.get(SECURITY_ROLE_AUTHOR));
        updatedPolicy = SecurityPolicy.addAssignment(updatedPolicy, USER1, ROLES_BY_NAME.get(SECURITY_ROLE_AUTHOR));
        expect(updatedPolicy.assignments.size).toBe(originalAssignmentSize + 4);
        byRole = SecurityPolicy.getAssignmentsByRole(updatedPolicy.assignments);
        expect(byRole.get(SECURITY_ROLE_AUTHOR).size).toBe(2);
    });

});
