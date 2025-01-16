import { User } from '@labkey/api';

import { FetchedGroup } from '../../security/APIWrapper';

import { getUserGroupOptions } from './UserSelectInput';

describe('getUserGroupOptions', () => {
    const users = [
        {
            displayName: 'editorjob',
            id: 1016,
            userId: 1016,
            email: 'editorjob@labkey.com',
        },
        {
            displayName: 'readerjob',
            id: 1015,
            avatar: '/_images/defaultavatar.png',
            userId: 1015,
            email: 'readerjob@labkey.com',
        },
        {
            displayName: 'user1',
            id: 1006,
            userId: 1006,
            email: 'user1@test',
        },
        {
            displayName: 'user2',
            id: 1007,
            userId: 1007,
            email: 'user2@test',
        },
        {
            displayName: 'user21010',
            id: 1010,
            userId: 1010,
            email: 'user2@labkey.com',
        },
    ] as User[];
    const groups = [
        {
            isSystemGroup: true,
            name: 'Site Administrators',
            id: -1,
            type: 'g',
            isProjectGroup: false,
        },
        {
            isSystemGroup: false,
            name: 'group1',
            groups: [
                {
                    isSystemGroup: false,
                    name: 'megagroup',
                    id: 1009,
                    isProjectGroup: true,
                },
            ],
            id: 1008,
            type: 'g',
            isProjectGroup: true,
        },
        {
            isSystemGroup: false,
            name: 'groupLimitedPerm',
            groups: [],
            id: 1017,
            type: 'g',
            isProjectGroup: true,
        },
        {
            isSystemGroup: false,
            name: 'groupreader',
            groups: [],
            id: 1018,
            type: 'g',
            isProjectGroup: true,
        },
        {
            isSystemGroup: false,
            name: 'megagroup',
            groups: [],
            id: 1009,
            type: 'g',
            isProjectGroup: true,
        },
    ] as FetchedGroup[];
    test('with users', () => {
        expect(getUserGroupOptions([])).toEqual([]);
        expect(getUserGroupOptions([users[0]])).toEqual([{ label: 'editorjob', value: 1016 }]);
        expect(getUserGroupOptions(users)).toEqual([
            { label: 'editorjob', value: 1016 },
            { label: 'readerjob', value: 1015 },
            { label: 'user1', value: 1006 },
            { label: 'user2', value: 1007 },
            { label: 'user21010', value: 1010 },
        ]);
        expect(getUserGroupOptions(users, null, 'job')).toEqual([
            { label: 'editorjob', value: 1016 },
            { label: 'readerjob', value: 1015 },
        ]);
        expect(getUserGroupOptions(users, null, 'User2')).toEqual([
            { label: 'user2', value: 1007 },
            { label: 'user21010', value: 1010 },
        ]);
        expect(getUserGroupOptions(users, null, 'User2', true)).toEqual([
            { label: 'user2', value: 'user2' },
            { label: 'user21010', value: 'user21010' },
        ]);
        expect(getUserGroupOptions(users, null, 'User2', false, true)).toEqual([
            { label: 'user2', value: 'user2@test' },
            { label: 'user21010', value: 'user2@labkey.com' },
        ]);
    });

    test('with users and groups', () => {
        expect(getUserGroupOptions([], [])).toEqual([]);
        expect(getUserGroupOptions([], groups)).toEqual([
            {
                label: 'Project Groups',
                options: [
                    { label: 'group1', value: 1008 },
                    { label: 'groupLimitedPerm', value: 1017 },
                    { label: 'groupreader', value: 1018 },
                    { label: 'megagroup', value: 1009 },
                ],
            },
        ]);
       expect(getUserGroupOptions(users, groups)).toEqual([
            {
                label: 'Project Groups',
                options: [
                    { label: 'group1', value: 1008 },
                    { label: 'groupLimitedPerm', value: 1017 },
                    { label: 'groupreader', value: 1018 },
                    { label: 'megagroup', value: 1009 },
                ],
            },
            {
                label: 'Users',
                options: [
                    { label: 'editorjob', value: 1016 },
                    { label: 'readerjob', value: 1015 },
                    { label: 'user1', value: 1006 },
                    { label: 'user2', value: 1007 },
                    { label: 'user21010', value: 1010 },
                ],
            },
        ]);
        expect(getUserGroupOptions(users, groups, 'er')).toEqual([
            {
                label: 'Project Groups',
                options: [
                    { label: 'groupLimitedPerm', value: 1017 },
                    { label: 'groupreader', value: 1018 },
                ],
            },
            {
                label: 'Users',
                options: [
                    { label: 'readerjob', value: 1015 },
                    { label: 'user1', value: 1006 },
                    { label: 'user2', value: 1007 },
                    { label: 'user21010', value: 1010 },
                ],
            },
        ]);
        expect(getUserGroupOptions(users, groups, 'user')).toEqual([
            { label: 'user1', value: 1006 },
            { label: 'user2', value: 1007 },
            { label: 'user21010', value: 1010 },
        ]);
    });
});
