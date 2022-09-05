import React, { Dispatch, FC, memo, SetStateAction, useCallback, useMemo } from 'react';
import { Col, Row } from 'react-bootstrap';

import { List } from 'immutable';

import { ExpandableContainer } from '../ExpandableContainer';

import { RemovableButton } from '../permissions/RemovableButton';
import { Principal } from '../permissions/models';
import { SelectInput } from '../forms/input/SelectInput';

import { DisableableButton } from '../buttons/DisableableButton';

import { Member } from './models';

export interface GroupProps {
    addMember: (groupId: string, principalId: number, principalName: string, principalType: string) => void;
    deleteGroup: (id: string) => void;
    id: string;
    members: Member[];
    name: string;
    onClickAssignment: (selectedUserId: number) => void;
    onRemoveMember: (groupId: string, memberId: number) => void;
    selectedPrincipalId: number;
    setDirty: Dispatch<SetStateAction<boolean>>;
    usersAndGroups: List<Principal>;
}

export const Group: FC<GroupProps> = memo(props => {
    const {
        name,
        id,
        members,
        usersAndGroups,
        onClickAssignment,
        selectedPrincipalId,
        deleteGroup,
        addMember,
        onRemoveMember,
        setDirty,
    } = props;

    const generateClause = useMemo(() => {
        return (
            <div className="container-expandable-heading--clause">
                <span className="permissions-title"> {name} </span>
            </div>
        );
    }, [name]);

    const generateLinks = useMemo(() => {
        return (
            <span className="container-expandable-heading">
                <span>
                    {members.length} member{members.length !== 1 ? 's' : ''}
                </span>
            </span>
        );
    }, [members]);

    const onClick = useCallback(
        (userId: number) => {
            onClickAssignment(userId);
        },
        [onClickAssignment]
    );

    const onRemove = useCallback(
        (memberId: number) => {
            onRemoveMember(id, memberId);
        },
        [id, onRemoveMember]
    );

    const generateMemberButtons = useCallback(
        (members: Member[], title: string) => {
            return (
                <Col xs={12} sm={6}>
                    <div>{title}:</div>
                    <ul className="permissions-groups-members-ul">
                        {members.length > 0 ? (
                            members.map(member => (
                                <li key={member.id} className="permissions-groups-member-li">
                                    <RemovableButton
                                        id={member.id}
                                        display={member.name}
                                        onClick={onClick}
                                        onRemove={onRemove}
                                        bsStyle={selectedPrincipalId === member.id ? 'primary' : undefined}
                                        added={false}
                                    />
                                </li>
                            ))
                        ) : (
                            <li className="permissions-groups-member-li permissions-groups-member-none">None</li>
                        )}
                    </ul>
                </Col>
            );
        },
        [onClick, onRemove, selectedPrincipalId]
    );

    const disabledMsg = useMemo(() => {
        return members.length !== 0 ? 'To delete this group, first remove all members.' : undefined;
    }, [members]);

    const onDeleteGroup = useCallback(() => {
        deleteGroup(id);
        setDirty(true);
    }, [deleteGroup, id, setDirty]);

    const principalsToAdd = useMemo(() => {
        const addedPrincipalIds = new Set(members.map(principal => principal.id));

        return usersAndGroups
            .filter(principal => !addedPrincipalIds.has(principal.userId) && principal.userId !== parseInt(id, 10))
            .map(principal => {
                if (principal.type === 'u') {
                    return principal;
                } else {
                    return principal.set('name', <strong> {principal.name} </strong>);
                }
            });
    }, [members, usersAndGroups, id]);

    const onSelectMember = useCallback(
        (name: string, formValue: any, selected: Principal) => {
            addMember(id, selected.userId, selected.displayName, selected.type);
        },
        [id, addMember]
    );

    const { groups, users } = useMemo(() => {
        return {
            groups: members.filter(member => member.type === 'g'),
            users: members.filter(member => member.type === 'u'),
        };
    }, [members]);

    return (
        <ExpandableContainer
            clause={generateClause}
            links={generateLinks}
            iconFaCls="users fa-3x"
            useGreyTheme={true}
            isExpandable={true}
        >
            <div className="permissions-groups-expandable-container">
                <Row className="expandable-container__member-buttons">
                    {generateMemberButtons(groups, 'Groups')}
                    {generateMemberButtons(users, 'Users')}
                </Row>

                <Row className="expandable-container__action-container">
                    <Col xs={12} sm={6}>
                        <SelectInput
                            autoValue={false}
                            options={principalsToAdd.toArray()}
                            placeholder="Add member..."
                            inputClass="col-xs-12"
                            valueKey="userId"
                            labelKey="name"
                            onChange={onSelectMember}
                            selectedOptions={null}
                        />
                    </Col>

                    <Col xs={12} sm={6}>
                        <DisableableButton
                            className="pull-right alert-button"
                            bsStyle="danger"
                            disabledMsg={disabledMsg}
                            onClick={onDeleteGroup}
                        >
                            Delete Empty Group
                        </DisableableButton>
                    </Col>
                </Row>
            </div>
        </ExpandableContainer>
    );
});
