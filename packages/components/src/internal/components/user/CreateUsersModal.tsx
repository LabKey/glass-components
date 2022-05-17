import React, { ReactNode } from 'react';
import { Checkbox, FormControl, Modal } from 'react-bootstrap';
import { Security } from '@labkey/api';

import { WizardNavButtons, Alert, SelectInput } from '../../..';
import { UserLimitSettings } from '../security/APIWrapper';

interface Props {
    onCancel: () => void;
    onComplete: (response: any, roles: string[]) => void;
    show: boolean;
    userLimitSettings?: UserLimitSettings;

    // optional array of role options, objects with id and label values (i.e. [{id: "org.labkey.api.security.roles.ReaderRole", label: "Reader (default)"}])
    // note that the createNewUser action will not use this value but it will be passed back to the onComplete
    roleOptions?: any[];
}

interface State {
    emailText: string;
    sendEmail: boolean;
    optionalMessage: string;
    roles: string[];
    isSubmitting: boolean;
    error: string;
}

const DEFAULT_STATE = {
    emailText: '',
    sendEmail: true,
    optionalMessage: '',
    roles: undefined,
    isSubmitting: false,
    error: undefined,
};

export class CreateUsersModal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = DEFAULT_STATE;
    }

    handleEmail = (evt: any): void => {
        const emailText = evt.target.value;
        this.setState(() => ({ emailText }));
    };

    handleOptionalMessage = (evt: any): void => {
        const optionalMessage = evt.target.value;
        this.setState(() => ({ optionalMessage }));
    };

    handleSendEmail = (evt: any): void => {
        const sendEmail = evt.target.checked;
        this.setState(state => ({
            sendEmail,
            // reset the optional message if we unchecked the sendEmail checkbox
            optionalMessage: !sendEmail ? '' : state.optionalMessage,
        }));
    };

    handleRoles = (name, formValue, selectedOptions: Array<{ id: string; label: string }>): void => {
        const roles = selectedOptions ? selectedOptions.map(option => option.id) : undefined;
        this.setState({ roles });
    };

    createUsers = (): void => {
        const { emailText, sendEmail, optionalMessage } = this.state;
        this.setState(() => ({ isSubmitting: true, error: undefined }));

        // convert the email addresses from newline separated to semicolon separated
        const email = emailText.replace(/\n/g, ';');

        Security.createNewUser({
            email,
            sendEmail,
            optionalMessage: optionalMessage && optionalMessage.length > 0 ? optionalMessage : undefined,
            success: response => {
                this.props.onComplete(response, this.getSelectedRoles());
                this.setState(() => DEFAULT_STATE);
            },
            failure: error => {
                console.error(error);
                this.setState(() => ({ isSubmitting: false, error: error.exception }));
            },
        });
    };

    hasRoleOptions(): boolean {
        return this.props.roleOptions && this.props.roleOptions.length > 0;
    }

    getSelectedRoles(): string[] {
        return this.hasRoleOptions() ? this.state.roles || [this.props.roleOptions[0].id] : undefined;
    }

    renderForm(): ReactNode {
        const { userLimitSettings } = this.props;
        const { emailText, sendEmail, optionalMessage } = this.state;

        return (
            <>
                <div className="create-users-label-bottom">
                    Enter one or more email addresses, each on its own line:
                </div>
                <FormControl
                    componentClass="textarea"
                    className="form-control create-users-textarea"
                    id="create-users-email-input"
                    rows={5}
                    value={emailText || ''}
                    onChange={this.handleEmail}
                />
                {userLimitSettings?.userLimit && (
                    <div>Number of users that can be added: {userLimitSettings.remainingUsers}</div>
                )}
                {this.hasRoleOptions() && (
                    <>
                        <div className="create-users-label-top create-users-label-bottom">Roles:</div>
                        <SelectInput
                            containerClass="form-group row"
                            inputClass="col-sm-12"
                            name="create-users-role"
                            key="create-users-role-selection"
                            placeholder="Select role..."
                            value={this.getSelectedRoles()}
                            options={this.props.roleOptions}
                            valueKey="id"
                            onChange={this.handleRoles}
                            clearable={false}
                            multiple
                        />
                    </>
                )}
                <Checkbox
                    id="create-users-sendEmail-input"
                    className="create-users-label-top"
                    checked={sendEmail}
                    onChange={this.handleSendEmail}
                >
                    Send notification emails to all new users?
                </Checkbox>
                <div className="create-users-label-bottom">Optional Message:</div>
                <FormControl
                    componentClass="textarea"
                    className="form-control create-users-textarea"
                    id="create-users-optionalMessage-input"
                    rows={5}
                    value={optionalMessage || ''}
                    placeholder="Add your message to be included in the invite email..."
                    disabled={!sendEmail}
                    onChange={this.handleOptionalMessage}
                />
            </>
        );
    }

    renderButtons(): ReactNode {
        return (
            <WizardNavButtons
                containerClassName=""
                cancel={this.props.onCancel}
                finish={true}
                finishText="Create Users"
                isFinishing={this.state.isSubmitting}
                isFinishingText="Creating Users..."
                nextStep={this.createUsers}
            />
        );
    }

    render(): ReactNode {
        const { show, onCancel } = this.props;
        const { error } = this.state;

        return (
            <Modal show={show} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Users</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {this.renderForm()}
                    {error && <Alert style={{ marginTop: '10px' }}>{error}</Alert>}
                </Modal.Body>
                <Modal.Footer>{this.renderButtons()}</Modal.Footer>
            </Modal>
        );
    }
}
