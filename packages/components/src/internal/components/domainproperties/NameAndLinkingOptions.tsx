import React, { ReactNode, PureComponent } from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { helpLinkNode, URL_ENCODING_TOPIC } from '../../util/helpLinks';

import { OntologyConceptAnnotation } from '../ontology/OntologyConceptAnnotation';

import { ONTOLOGY_MODULE_NAME } from '../ontology/actions';

import { hasModule } from '../../app/utils';

import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName } from './actions';
import {
    DOMAIN_FIELD_DESCRIPTION,
    DOMAIN_FIELD_IMPORTALIASES,
    DOMAIN_FIELD_LABEL,
    DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT,
    DOMAIN_FIELD_URL,
} from './constants';
import { DomainField, IDomainFormDisplayOptions } from './models';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

interface NameAndLinkingProps {
    appPropertiesOnly?: boolean;
    domainIndex: number;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    field: DomainField;
    index: number;
    onChange: (string, any) => void;
}

export class NameAndLinkingOptions extends PureComponent<NameAndLinkingProps> {
    handleChange = (evt: any): void => {
        this.onChange(evt.target.id, evt.target.value);
    };

    onChange = (id: string, value: any): void => {
        this.props?.onChange(id, value);
    };

    getImportAliasHelpText = (): ReactNode => {
        return (
            <>
                Define alternate field names to be used when importing from a file.
                <br />
                <br />
                Multiple aliases may be separated by spaces or commas. To define an alias that contains spaces, use
                double-quotes (") around it.
            </>
        );
    };

    getURLHelpText = (): ReactNode => {
        return (
            <>
                Use this to change the display of the field value within a data grid into a link. Multiple formats are
                supported, which allows ways to easily substitute and link to other locations in LabKey.
                <br />
                <br />
                Learn more about using {helpLinkNode(URL_ENCODING_TOPIC, 'URL Formatting Options')}.
            </>
        );
    };

    render(): ReactNode {
        const { index, field, domainIndex, appPropertiesOnly, domainFormDisplayOptions } = this.props;

        return (
            <div>
                <Row>
                    <Col xs={12}>
                        <SectionHeading title="Name and Linking Options" cls="domain-field-section-hdr" />
                    </Col>
                </Row>
                <Row>
                    <Col xs={5}>
                        <div className="domain-field-label">Description</div>
                        <FormControl
                            componentClass="textarea"
                            className="form-control textarea-noresize"
                            rows={4}
                            value={field.description || ''}
                            id={createFormInputId(DOMAIN_FIELD_DESCRIPTION, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_DESCRIPTION)}
                            onChange={this.handleChange}
                            disabled={isFieldFullyLocked(field.lockType)}
                        />
                    </Col>
                    <Col xs={3}>
                        <div className="domain-field-label">Label</div>
                        <FormControl
                            type="text"
                            value={field.label || ''}
                            id={createFormInputId(DOMAIN_FIELD_LABEL, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_LABEL)}
                            onChange={this.handleChange}
                            disabled={isFieldFullyLocked(field.lockType)}
                        />
                        {!field.isUniqueIdField() && !domainFormDisplayOptions.hideImportAliases && (
                            <>
                                <div className="domain-field-label">
                                    <DomainFieldLabel
                                        label="Import Aliases"
                                        helpTipBody={this.getImportAliasHelpText()}
                                    />
                                </div>
                                <FormControl
                                    type="text"
                                    value={field.importAliases || ''}
                                    id={createFormInputId(DOMAIN_FIELD_IMPORTALIASES, domainIndex, index)}
                                    name={createFormInputName(DOMAIN_FIELD_IMPORTALIASES)}
                                    onChange={this.handleChange}
                                    disabled={isFieldFullyLocked(field.lockType)}
                                />
                            </>
                        )}
                    </Col>
                    <Col xs={4}>
                        <div className="domain-field-label">
                            <DomainFieldLabel label="URL" helpTipBody={this.getURLHelpText()} />
                        </div>
                        <FormControl
                            type="text"
                            value={field.URL || ''}
                            id={createFormInputId(DOMAIN_FIELD_URL, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_URL)}
                            onChange={this.handleChange}
                            disabled={isFieldFullyLocked(field.lockType)}
                        />
                        {!appPropertiesOnly && hasModule(ONTOLOGY_MODULE_NAME) && (
                            <OntologyConceptAnnotation
                                id={createFormInputId(DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT, domainIndex, index)}
                                field={field}
                                onChange={this.onChange}
                            />
                        )}
                    </Col>
                </Row>
            </div>
        );
    }
}
