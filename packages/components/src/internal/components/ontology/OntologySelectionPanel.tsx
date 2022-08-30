import React, { FC, memo, useEffect, useState } from 'react';
import { getServerContext } from '@labkey/api';

import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { buildURL } from '../../url/AppURL';
import { SelectInput } from '../forms/input/SelectInput';

import { PathModel } from './models';
import { fetchChildPaths, ONTOLOGY_CONTROLLER } from './actions';

interface OntologySelectionPanelProps {
    asPanel: boolean;
    onOntologySelection: (name: string, value: string, model: PathModel) => void;
}

export const OntologySelectionPanel: FC<OntologySelectionPanelProps> = memo(props => {
    const { onOntologySelection } = props;
    const [error, setError] = useState<string>();
    const [ontologies, setOntologies] = useState<PathModel[]>();

    useEffect(() => {
        fetchChildPaths('/')
            .then(response => {
                // if only one ontology present, just select it
                if (response.children.length === 1) {
                    onOntologySelection('ontology-select', undefined, response.children[0]);
                } else {
                    setOntologies(response.children);
                }
            })
            .catch(reason => {
                setError('Error: unable to load ontology information for selection. ' + reason?.exception);
                setOntologies([]);
            });
    }, [setOntologies, setError, onOntologySelection]);

    return <OntologySelectionPanelImpl {...props} error={error} ontologies={ontologies} />;
});

interface OntologySelectionPanelImplProps extends OntologySelectionPanelProps {
    error: string;
    ontologies: PathModel[];
}

// exported for jest testing
export const OntologySelectionPanelImpl: FC<OntologySelectionPanelImplProps> = memo(props => {
    const { onOntologySelection, asPanel, error, ontologies } = props;

    const body = (
        <>
            <Alert>{error}</Alert>
            {!ontologies && <LoadingSpinner msg="Loading ontologies..." />}
            {ontologies?.length === 0 && (
                <Alert bsStyle="warning">
                    No ontologies have been loaded for this server.
                    {getServerContext().user.isRootAdmin && (
                        <>
                            &nbsp;Click <a href={buildURL(ONTOLOGY_CONTROLLER, 'begin')}>here</a> to get started.
                        </>
                    )}
                </Alert>
            )}
            {ontologies && (
                <SelectInput
                    key="ontology-select"
                    name="ontology-select"
                    id="ontology-select"
                    label="Select Ontology"
                    description="Select an ontology to load and browse concepts."
                    inputClass="col-sm-6 col-xs-12"
                    labelClass="control-label col-sm-3 text-left col-xs-12"
                    valueKey="code"
                    onChange={onOntologySelection}
                    options={ontologies}
                />
            )}
        </>
    );

    if (!asPanel) {
        return body;
    }

    return (
        <>
            <div className="panel panel-default ontology-browser-container">
                <div className="panel-heading">Browse Ontology Concepts</div>
                <div className="panel-body">{body}</div>
            </div>
        </>
    );
});
