import React from 'react';
import { Alert, Col, FormControl, Row } from 'react-bootstrap';
import { Utils } from '@labkey/api';
import { AUTOINT_TYPE, DomainField, IAppDomainHeader, IDomainField, PropDescType } from '../models';
import { LabelHelpTip } from '../../base/LabelHelpTip';
import { createNewDomainField } from "../actions";
import { ListModel } from "./models";

const AUTO_INC_KEY_OPTION_TEXT = 'Auto integer key';
const AUTO_INC_KEY_OPTION_VALUE = -1;
const AUTO_INC_FIELD_CONFIG = {
    required: true,
    name: 'Key',
    dataType: AUTOINT_TYPE,
    rangeURI: AUTOINT_TYPE.rangeURI,
    isPrimaryKey: true,
    lockType: "PKLocked",
} as Partial<IDomainField>;

interface Props extends IAppDomainHeader {
    model: ListModel;
    onModelChange: (model: ListModel) => void;
}

export class SetKeyFieldNamePanel extends React.PureComponent<Props> {

    onSelectionChange = (e: any) => {
        const { model, onModelChange } = this.props;
        const { name, value } = e.target;
        const selectedRowIndex = Utils.isNumber(parseInt(value)) ? parseInt(value) : undefined;

        if (selectedRowIndex === undefined) {
            return;
        }

        // start by removing the previous primary key field setting
        let updatedFields = model.domain.fields.map((field) => {
                return field.isPrimaryKey
                    ? field.merge({isPrimaryKey: false, required: false, lockType:"NotLocked"}) as DomainField
                    : field
            }).toList();

        // now set the selected fields as the new primary key, and if that pk is an auto increment field add it as a new field
        let newKeyField;
        let keyType;
        if (selectedRowIndex === AUTO_INC_KEY_OPTION_VALUE) {
            newKeyField = createNewDomainField(model.domain, AUTO_INC_FIELD_CONFIG);
            updatedFields = updatedFields.insert(0, newKeyField);
            keyType = 'AutoIncrementInteger';
        }
        else {
            newKeyField = updatedFields.get(selectedRowIndex).merge({ isPrimaryKey: true, required: true, lockType:"PKLocked" }) as DomainField;
            updatedFields = updatedFields.set(selectedRowIndex, newKeyField);
            keyType = newKeyField.dataType.name === 'int' ? 'Integer' : 'Varchar';

            // filter out any previously added Auto Inc key fields since we aren't using that anymore
            updatedFields = updatedFields.filter((field) => !PropDescType.isAutoIncrement(field.dataType)).toList();
        }

        const updatedModel = model.merge({
            domain: model.domain.set('fields', updatedFields),
            keyName: newKeyField.name,
            keyType,
        }) as ListModel;

        onModelChange(updatedModel);
    };

    isValidKeyField(field: DomainField): boolean {
        const dataType = field.dataType.name;
        const hasName = typeof field.name !== 'undefined' && field.name.trim().length > 0;
        return (dataType == 'string' || dataType == 'int') && hasName
    }

    render() {
        const { domain } = this.props;
        const pkRowIndex = domain && domain.fields.findIndex(i => (i.isPrimaryKey));
        const pkField = pkRowIndex > -1 ? domain.fields.get(pkRowIndex) : undefined;
        const isAutoIncPk = pkField !== undefined && PropDescType.isAutoIncrement(pkField.dataType);

        return (
            <Alert>
                <div>
                    Select a key value for this list which uniquely identifies the item. You can use "{AUTO_INC_KEY_OPTION_TEXT}"
                    to define your own below.
                </div>
                <Row className='domain-set-key-panel'>
                    <Col xs={3}>
                        Key Field Name *
                        <LabelHelpTip
                            title=""
                            body={() => {
                                return <> Only integer or text fields can be made the primary key. </>;
                            }}
                        />
                    </Col>
                    <Col xs={6}>
                        <FormControl
                            componentClass="select"
                            name="keyField"
                            onChange={this.onSelectionChange}
                            className='domain-set-key-panel__select'
                            value={pkRowIndex > -1 ? pkRowIndex : undefined}
                        >
                            {!pkField && <option key={'_default'} value={undefined}>Select a field from the list</option>}
                            {!isAutoIncPk && <option key={'_autoInc'} value={AUTO_INC_KEY_OPTION_VALUE}>{AUTO_INC_KEY_OPTION_TEXT}</option>}

                            {domain && domain.fields.map((field, index) => {
                                const display = isAutoIncPk && index === pkRowIndex ? AUTO_INC_KEY_OPTION_TEXT : field.name;
                                return this.isValidKeyField(field) ? <option value={index} key={index}>{display}</option> : undefined;
                            })}
                        </FormControl>
                    </Col>
                </Row>
            </Alert>
        );
    }
}
