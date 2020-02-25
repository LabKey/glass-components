import React from 'react';
import { Alert, Col, FormControl, Row } from 'react-bootstrap';
import {List} from "immutable";
import {AUTOINT_TYPE, DomainField, IDomainField} from '../models';
import {LabelHelpTip, ListModel} from '../../..';

// TODO: define props - IAppDomainHeader (and some other properties, model, onModelChange, keyField, onAddField)
export class SetKeyFieldNamePanel extends React.PureComponent<any> {

    setKeyField = (fields, newKey) => {
        const newKeyField = fields.get(newKey);
        const updatedNewKeyField = newKeyField.merge({ isPrimaryKey: true, required: true, lockType:"PKLocked" }) as DomainField;
        return fields.set(newKey, updatedNewKeyField) as List<DomainField>;
    };

    unsetKeyField = (fields, prevKey) => {
        const prevKeyField = fields.get(prevKey) as DomainField;
        const updatedPrevKeyField = prevKeyField.merge({isPrimaryKey: false, required: false, lockType:"NotLocked"}) as DomainField;
        return fields.set(prevKey, updatedPrevKeyField) as List<DomainField>;
    };

    addAutoIntField() {
        const autoIncrementFieldConfig = {
            required: true,
            name: 'Key',
            dataType: AUTOINT_TYPE,
            rangeURI: AUTOINT_TYPE.rangeURI,
            isPrimaryKey: true,
            lockType: "PKLocked", // PK lock type: required, datatype
        } as Partial<IDomainField>;

        this.props.onAddField(autoIncrementFieldConfig);
    }

    removeAutoIntField = (fields) => { //TODO RP: properly identify the field by its dataType
        return fields.filter((field) => {
            return field.get('name') !== 'Key'
        }) as List<DomainField>;
    };

    onSelectionChange = (e) => {
        const {model, keyField, onDomainChange, onModelChange} = this.props;
        const {domain} = model;
        const {fields} = domain;
        const { name, value } = e.target;
        let newFields;

        // Making first selection of key
        if (keyField == '-2') {
            if (value == '-1') {
                this.addAutoIntField(); // Selecting auto int key
                return;
            }
            else {
                newFields = this.setKeyField(fields, value);  // Selecting regular field
            }
        }
        // Changing key from one field to another
        else {
            if (keyField == '-1') {
                const fieldsNoKey = this.removeAutoIntField(fields); // Auto int to regular field
                newFields = this.setKeyField(fieldsNoKey, value);
            }
            else if (value == '-1') {
                newFields = this.unsetKeyField(fields, keyField); // Regular to auto int field

                onDomainChange(domain.merge({fields: newFields}));
                console.log("Old key field correct un-set.");

                this.addAutoIntField();
                return;
            }
            else if (value !== '-1') {
                const fieldsNoKey = this.unsetKeyField(fields, keyField); // Regular to regular field
                newFields = this.setKeyField(fieldsNoKey, value);
            }
        }

        const newKeyField = fields.get(value);
        let keyType;
        if (newKeyField.dataType.name === 'int') {
            keyType = 'Integer';
        }
        else if (newKeyField.dataType.name === 'string') {
            keyType = 'Varchar';
        }

        const updatedModel = model.merge({
            domain: domain.set('fields', newFields),
            keyName: newKeyField.name,
            keyType,
        }) as ListModel;

        onModelChange(name, value, updatedModel);
    };

    render() {
        const { keyField, domain } = this.props;
        let fieldNames = [];
        if (domain) {
            const fields = domain.fields;

            fieldNames =
                fields &&
                fields.reduce(function(accum: string[], field: IDomainField) {
                    const dataType = field.dataType.name;
                    if (
                        (dataType == 'string' || dataType == 'int') &&
                        typeof field.name !== 'undefined' &&
                        field.name.trim().length > 0
                    ) {
                        accum.push(field.name);
                    }
                    return accum;
                }, []);
        }
        let autoIntIsPK = (keyField == '-1');
        if (domain && domain.fields.size > 0) {
            const pkIndex = domain.fields.findIndex(i => (i.isPrimaryKey));

            // TODO RP: identify using type, not name, once type is set up
            const thing = domain.fields.get(pkIndex).name;
            autoIntIsPK = (thing == 'Key');
        }
        return (
            <Alert>
                <div>
                    Select a key value for this list which uniquely identifies the item. You can use "Auto integer key"
                    to define your own below.
                </div>
                <Row className='domain-set-key-panel'>
                    <Col xs={3}>
                        Key Field Name
                        <LabelHelpTip
                            title=""
                            body={() => {
                                return <> Only integer or text fields can be made the primary key. </>;
                            }}
                        />
                        *
                    </Col>
                    <Col xs={3}>
                        <FormControl
                            componentClass="select"
                            name="keyField"
                            onChange={e => this.onSelectionChange(e)}
                            value={keyField}
                            className='domain-set-key-panel__select'
                        >
                            <option disabled value={-2}> Select a field from the list </option>

                            {fieldNames.map((fieldName, index) => {
                                return (
                                    <option value={index} key={index + 1}>
                                        {fieldName}
                                    </option>
                                );
                            })}

                            {!autoIntIsPK &&
                                <option value={-1}>Auto integer key</option>
                            }
                        </FormControl>
                    </Col>
                </Row>
            </Alert>
        );
    }
}
