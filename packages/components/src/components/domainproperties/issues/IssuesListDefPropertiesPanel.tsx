import React from 'react';

import { Form } from 'react-bootstrap';

import { Utils } from '@labkey/api';

import { List } from 'immutable';

import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import {getCoreGroups, getCoreUsersInGroups} from '../../permissions/actions';
import { Principal } from '../../..';

import { AssignmentOptions, BasicPropertiesFields } from './IssuesListDefPropertiesPanelFormElements';
import { IssuesListDefModel } from './models';
import {UserGroup} from "../../permissions/models";
import produce from "immer";

const PROPERTIES_HEADER_ID = 'issues-properties-hdr';

interface OwnProps {
    model: IssuesListDefModel;
    onChange: (model: IssuesListDefModel) => void;
    successBsStyle?: string;
}

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid: boolean;
    coreGroups: List<Principal>;
    coreUsers: List<UserGroup>;
}

export class IssuesPropertiesPanelImpl extends React.PureComponent<
    Props & InjectedDomainPropertiesPanelCollapseProps,
    State
> {
    constructor(props: Props & InjectedDomainPropertiesPanelCollapseProps) {
        super(props);

        this.state = {
            isValid: true,
            coreGroups: List<Principal>(),
            coreUsers: List<UserGroup>()
        };
    }

    componentDidMount() {
        getCoreGroups().then((coreGroupsData: List<Principal>) => {
            this.setState(() => ({
                coreGroups: coreGroupsData,
            }));
        });

        getCoreUsersInGroups().then((coreUsersData: List<UserGroup>) => {
            this.setState(() => ({
                coreUsers: coreUsersData,
            }));
        });
    }

    updateValidStatus = (newModel?: IssuesListDefModel) => {
        const { model, onChange } = this.props;
        const updatedModel = newModel || model;
        const isValid = updatedModel && updatedModel.hasValidProperties();
        this.setState(
            () => ({ isValid }),
            () => {
                if (newModel) {
                    onChange(updatedModel);
                }
            }
        );
    };

    onInputChange = e => {
        const id = e.target.id;
        let value = e.target.value;

        // special case for empty string, set as null instead
        if (Utils.isString(value) && value.length === 0) {
            value = null;
        }

        this.onChange(id, value);
    };

    onChange = (identifier, value): void => {
        const { model } = this.props;
        const newModel = produce(model, (draft: IssuesListDefModel) =>{
            draft[identifier] = value;
        });

        this.updateValidStatus(newModel);
    };

    onSelectChange = (selection, name) => {
        if (selection instanceof Principal) {
            this.onChange(name, selection.userId)
        }
        else {
            this.onChange(name, selection);
        }
    };

    render() {
        const { model, successBsStyle } = this.props;
        const { isValid, coreGroups, coreUsers } = this.state;

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title="Issues List Properties"
                titlePrefix={model.name}
                updateValidStatus={this.updateValidStatus}
                isValid={isValid}
            >
                <Form>
                    <BasicPropertiesFields model={model} onInputChange={this.onInputChange} onSelect={this.onSelectChange} />
                    <AssignmentOptions
                        model={model}
                        coreGroups={coreGroups}
                        coreUsers={coreUsers}
                        onSelect={this.onSelectChange}
                    />
                </Form>
            </BasePropertiesPanel>
        );
    }
}

export const IssuesListDefPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(IssuesPropertiesPanelImpl);
