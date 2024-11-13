import React, { FC, useCallback } from 'react';

import { Modal } from '../../Modal';
import { User } from '../base/models/User';
import { resolveErrorMessage } from '../../util/messaging';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { Alert } from '../base/Alert';

import { LABKEY_PASSWORD_GAUGE } from '../../constants';

import { changePassword, getPasswordRuleInfo, PasswordRuleInfo } from './actions';
import { ChangePasswordModel } from './models';

interface PasswordInputProps {
    helpTip?: string;
    label: string;
    name: string;
    onChange: (name: string, value: string) => void;
    value: string;
}

const PasswordInput: FC<PasswordInputProps> = ({ helpTip, label, name, onChange, value }) => {
    const onChange_ = useCallback(event => onChange(event.target.name, event.target.value), [onChange]);
    return (
        <div className="form-group row">
            <div className="col-xs-4">
                <label className="control-label" htmlFor={name}>
                    {label}
                    {helpTip && (
                        <LabelHelpTip title={label}>
                            <div dangerouslySetInnerHTML={{ __html: helpTip }} />
                        </LabelHelpTip>
                    )}
                </label>
            </div>
            <div className="col-xs-8">
                <input
                    className="form-control"
                    type="password"
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange_}
                />
            </div>
        </div>
    );
};

interface Props {
    onHide: () => void; // TODO: rename
    onSuccess: () => void;
    user: User;
}

interface State {
    error: string;
    model: ChangePasswordModel;
    passwordRule: PasswordRuleInfo;
    submitting: boolean;
}

export class ChangePasswordModal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            model: new ChangePasswordModel({
                userId: props.user.id,
            }),
            passwordRule: undefined,
            submitting: false,
            error: undefined,
        };
    }

    componentDidMount(): void {
        getPasswordRuleInfo()
            .then(response => {
                this.setState(
                    () => ({ passwordRule: response }),
                    () => {
                        if (response?.shouldShowPasswordGuidance) {
                            LABKEY_PASSWORD_GAUGE.createComponent(
                                'strengthGuidance',
                                'password',
                                'email',
                                this.props.user.email
                            );
                            document.getElementById('strengthGuidance').style.width = '100%';
                        }
                    }
                );
            })
            .catch(response => {
                this.setState({ error: resolveErrorMessage(response) });
            });
    }

    onChange = (name, value): void => {
        this.setState(state => ({ model: state.model.set(name, value) as ChangePasswordModel }));
    };

    submitChangePassword = (): void => {
        this.setState({ submitting: true });

        changePassword(this.state.model)
            .then(() => {
                this.props.onHide();
                this.props.onSuccess();
                this.setState({ submitting: false });
            })
            .catch(response => {
                this.setState({ error: resolveErrorMessage(response), submitting: false });
            });
    };

    render() {
        const { onHide } = this.props;
        const { model, submitting, error, passwordRule } = this.state;
        const helpTip = passwordRule?.shouldShowPasswordGuidance
            ? passwordRule?.summary.replace('display:none;', '').replace('<a ', '<a style="display:none;" ')
            : passwordRule?.full;

        return (
            <Modal
                isConfirming={submitting}
                onCancel={onHide}
                onConfirm={this.submitChangePassword}
                title="Change Password"
            >
                <form>
                    <PasswordInput
                        label="Old Password"
                        name="oldPassword"
                        onChange={this.onChange}
                        value={model.oldPassword}
                    />
                    <PasswordInput
                        label="New Password"
                        name="password"
                        onChange={this.onChange}
                        value={model.password}
                        helpTip={helpTip}
                    />
                    {passwordRule?.shouldShowPasswordGuidance && (
                        <div className="row">
                            <div className="col-xs-4" />
                            <div className="col-xs-8">
                                <canvas id="strengthGuidance" width="350" height="30">
                                    Your browser does not support the HTML5 canvas element.
                                </canvas>
                            </div>
                        </div>
                    )}
                    <PasswordInput
                        label="Retype New Password"
                        name="password2"
                        onChange={this.onChange}
                        value={model.password2}
                    />
                </form>
                {error && <Alert>{error}</Alert>}
            </Modal>
        );
    }
}
