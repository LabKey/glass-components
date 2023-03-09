import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Panel, FormControl, Row, Button } from 'react-bootstrap';

import { Alert } from '../base/Alert';

import { HelpLink } from '../../util/helpLinks';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { BarTenderConfiguration, BarTenderResponse } from './models';
import { withLabelPrintingContext, LabelPrintingProviderProps } from './LabelPrintingContextProvider';
import { BAR_TENDER_TOPIC, BARTENDER_CONFIGURATION_TITLE, LABEL_NOT_FOUND_ERROR } from './constants';
import { LabelsConfigurationPanel } from './LabelsConfigurationPanel';

interface OwnProps extends InjectedRouteLeaveProps {
    api?: ComponentsAPIWrapper;
    onChange: () => void;
    onSuccess: () => void;
    title?: string;
}

type Props = LabelPrintingProviderProps & OwnProps;

const SUCCESSFUL_NOTIFICATION_MESSAGE = 'Successfully connected to BarTender web service.';
const FAILED_NOTIFICATION_MESSAGE = 'Failed to connect to BarTender web service.';
const UNKNOWN_STATUS_MESSAGE = 'Unrecognized status code returned from BarTender service';
const FAILED_TO_SAVE_MESSAGE = 'Failed to save connection configuration';

interface SaveButtonProps {
    dirty: boolean;
    onSave: () => void;
    submitting: boolean;
    testing: boolean;
}

const SaveButton: FC<SaveButtonProps> = memo(({ dirty, onSave, submitting, testing }) => (
    <Button
        className="pull-right alert-button"
        bsStyle="success"
        disabled={submitting || !dirty || testing}
        onClick={onSave}
    >
        Save
    </Button>
));

interface SettingsInputProps {
    description: string;
    label: string;
    name: string;
    onChange: (name: string, value: string) => void;
    type: 'text' | 'url';
    value: string;
}

const SettingsInput: FC<SettingsInputProps> = memo(({ children, description, label, name, onChange, type, value }) => {
    const onChange_ = useCallback(
        (event): void => {
            onChange(name, event.target.value);
        },
        [name, onChange]
    );

    return (
        <Row className="form-group">
            <Col xs={12}>
                {children}
                <div>
                    {label}{' '}
                    <LabelHelpTip title={label}>
                        <p>{description}</p>
                    </LabelHelpTip>
                </div>
            </Col>
            <Col xs={12}>
                <FormControl
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange_}
                    placeholder="BarTender Web Service URL"
                />
            </Col>
        </Row>
    );
});

const btTestConnectionTemplate = (label: string): string => {
    // Should be able to run connection test w/o a default label set.
    const formatNode = `<Format>${label}</Format>`;

    return `<XMLScript Version="2.0">
            <Command Name="Job1">
                <FormatSetup>
                    ${formatNode}
                </FormatSetup>
            </Command>
        </XMLScript>`;
};
const apiWrapper = getDefaultAPIWrapper();
// exported for jest testing
export const BarTenderSettingsFormImpl: FC<Props> = memo(props => {
    const { api = apiWrapper, title = BARTENDER_CONFIGURATION_TITLE, onChange, onSuccess } = props;
    const [btServiceURL, setBtServiceURL] = useState<string>();
    const [defaultLabel, setDefaultLabel] = useState<number>();
    const [dirty, setDirty] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [testing, setTesting] = useState<boolean>();
    const [connectionValidated, setConnectionValidated] = useState<boolean>();
    const [failureMessage, setFailureMessage] = useState<string>();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        api.labelprinting.fetchBarTenderConfiguration().then(btConfiguration => {
            setBtServiceURL(btConfiguration.serviceURL);
            setDefaultLabel(btConfiguration.defaultLabel);
            setLoading(false);
        });
    }, [api?.labelprinting]);

    const onChangeHandler = useCallback(
        (name: string, value: string): void => {
            setBtServiceURL(value);
            setDirty(true);
            setConnectionValidated(undefined);
            onChange?.();
        },
        [onChange]
    );

    const onSave = useCallback((): void => {
        setSubmitting(true);
        setFailureMessage(undefined); //Will update with new message if still needed.
        const config = new BarTenderConfiguration({ serviceURL: btServiceURL });

        api.labelprinting
            .saveBarTenderURLConfiguration(config)
            .then((btConfig: BarTenderConfiguration): void => {
                setBtServiceURL(btConfig.serviceURL);
                setDirty(false);
                setSubmitting(false);

                onSuccess?.();
            })
            .catch((reason: string) => {
                console.error(reason);
                setSubmitting(false);
                setFailureMessage(FAILED_TO_SAVE_MESSAGE);
            });
    }, [api?.labelprinting, btServiceURL, onSuccess]);

    const onConnectionFailure = (message: string): void => {
        setTesting(false);
        setConnectionValidated(false);
        setFailureMessage(message);
    };

    const onVerifyBarTenderConfiguration = useCallback((): void => {
        setTesting(true);

        api.labelprinting
            .printBarTenderLabels(btTestConnectionTemplate(''), btServiceURL)
            .then((btResponse: BarTenderResponse) => {
                if (btResponse.ranToCompletion()) {
                    setTesting(false);
                    setConnectionValidated(true);
                    setFailureMessage(undefined);
                } else if (btResponse.faulted()) {
                    onConnectionFailure(btResponse.getFaultMessage());
                } else {
                    onConnectionFailure(UNKNOWN_STATUS_MESSAGE);
                }
            })
            .catch(() => {
                onConnectionFailure(FAILED_NOTIFICATION_MESSAGE);
            });
    }, [api?.labelprinting, btServiceURL]);

    const isBlank = !btServiceURL || btServiceURL.trim() === '';

    if (loading) return <LoadingSpinner />;

    return (
        <Row>
            <Col xs={12}>
                <Panel title={title}>
                    <Panel.Heading>{title}</Panel.Heading>
                    <Panel.Body>
                        {connectionValidated && (
                            <div>
                                <Alert bsStyle="success">{SUCCESSFUL_NOTIFICATION_MESSAGE}</Alert>
                            </div>
                        )}
                        {connectionValidated === false && <Alert bsStyle="danger">{failureMessage}</Alert>}

                        <SettingsInput
                            description="URL of the BarTender service to use when printing labels."
                            label="BarTender Web Service URL"
                            name="btServiceURL"
                            onChange={onChangeHandler}
                            type="url"
                            value={btServiceURL}
                        >
                            <div className="pull-right">
                                <HelpLink topic={BAR_TENDER_TOPIC} className="label-printing--help-link">
                                    Learn more about BarTender
                                </HelpLink>
                            </div>
                        </SettingsInput>

                        <div className="bt-service-buttons">
                            <SaveButton dirty={dirty} onSave={onSave} submitting={submitting} testing={testing} />

                            <Button
                                className="button-right-spacing pull-right"
                                bsStyle="default"
                                disabled={isBlank}
                                onClick={onVerifyBarTenderConfiguration}
                            >
                                Test Connection
                            </Button>
                        </div>
                        <div className="label-templates-panel">
                            <LabelsConfigurationPanel {...props} api={api} defaultLabel={defaultLabel} />
                        </div>
                    </Panel.Body>
                </Panel>
            </Col>
        </Row>
    );
});

export const BarTenderSettingsForm = withLabelPrintingContext(BarTenderSettingsFormImpl);
