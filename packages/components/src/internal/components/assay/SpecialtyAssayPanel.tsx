import React, {FC, memo, useMemo, useCallback, useState} from "react";
import {Col, Row} from "react-bootstrap";
import {Alert} from "../../../index";
import {AssayProvider} from "./AssayPicker";
import { Utils } from "@labkey/api";

interface SpecialtyAssayPanelProps {
    selected?: AssayProvider
    values?: Array<AssayProvider>
    onChange: (value: string) => void
    warning?: string
}

export const SpecialtyAssayPanel: FC<SpecialtyAssayPanelProps> = memo(props => {
    const { values, selected, onChange, warning, children } = props;

    const options = useMemo(() => {
        return values?.filter(v => v.name !== "General").map(val => {
            return <option value={val.name}>{val.name}</option>
        })
    }, [values])

    const onSelectChange = useCallback((e) => {
        onChange(e.target.value);
    }, [onChange])

    return (
        <div>
            <Row>
                <Col xs={6}>
                    <div className={'margin-bottom'}>
                        <b>Use Instrument Specific Data Format</b>
                    </div>
                    <div className={'margin-bottom'}>
                        { selected &&
                            <select value={selected.name} onChange={onSelectChange} className={"form-control"}>
                                {options}
                            </select>
                        }
                    </div>
                    <p><div dangerouslySetInnerHTML={{ __html: selected?.description }} /></p>
                    { warning &&
                        <Alert bsStyle={'warning'}>
                            <i className="fa fa-flag" style={{marginRight: '20px'}}/>{warning}
                        </Alert>
                    }
                </Col>
            </Row>
            <Row>
                <Col xs={6}>
                    <div className={ warning ? 'margin-bottom' : 'margin-top margin-bottom' }>
                        <b>Supported File Types</b>
                    </div>
                    <p>{selected?.fileTypes.join(', ')}</p>
                </Col>
            </Row>
            {children}
        </div>
    )
})
