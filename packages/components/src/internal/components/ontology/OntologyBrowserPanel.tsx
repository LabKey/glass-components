import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { Alert, LabelHelpTip, LoadingSpinner } from '../../..';

import { fetchAlternatePaths, fetchConceptForCode, getOntologyDetails } from './actions';
import { ConceptModel, OntologyModel, PathModel } from './models';
import { ConceptInformationTabs } from './ConceptInformationTabs';
import { OntologyTreePanel } from './OntologyTreePanel';
import { OntologySelectionPanel } from './OntologySelectionPanel';
import { OntologyTreeSearchContainer } from './OntologyTreeSearchContainer';

export interface OntologyBrowserProps {
    asPanel?: boolean;
    initOntologyId?: string;
    initConceptCode?: string;
    initConcept?: ConceptModel;
    initPath?: PathModel;
    onPathSelect?: (path: PathModel, concept: ConceptModel) => void;
    hideConceptInfo?: boolean;
    filters?: Map<string, PathModel>;
    filterChangeHandler?: (filter: PathModel) => void;
}

export const OntologyBrowserPage: FC<OntologyBrowserProps> = memo( props => {
    const {initConceptCode, ...rest} = props;
    const [concept, setConcept] = useState<ConceptModel>();
    const [loading, setLoading] = useState<boolean>();

    useEffect(() => {
        if (initConceptCode && !concept) {
            setLoading(true);
            (async () => {
                const loadingConcept = await fetchConceptForCode(initConceptCode);
                setConcept(loadingConcept);
                setLoading(false);
            }) ();
        }
    });

    if (loading){
        return <LoadingSpinner />;
    }

    return <OntologyBrowserPanel {...rest} initConcept={concept} />
});

export const OntologyBrowserPanel: FC<OntologyBrowserProps> = memo(props => {
    const {
        asPanel,
        initOntologyId,
        initConcept,
        initPath,
        onPathSelect,
        hideConceptInfo = false,
        filters,
        filterChangeHandler,
    } = props;
    const [error, setError] = useState<string>();
    const [selectedOntologyId, setSelectedOntologyId] = useState<string>();
    const [ontology, setOntologyModel] = useState<OntologyModel>();
    const [selectedConcept, setSelectedConcept] = useState<ConceptModel>(initConcept);
    const [selectedPath, setSelectedPath] = useState<PathModel>();
    const [alternatePath, setAlternatePath] = useState<PathModel>(initPath);
    const ontologyId = selectedOntologyId ?? (!error ? initOntologyId : undefined);

    const onSelectedPathChange = useCallback(
        (path: PathModel, isAlternatePath = false): Promise<void> => {
            if (path === undefined) {
                return;
            }

            if (isAlternatePath) {
                setAlternatePath(path);
            } else {
                setSelectedPath(path);
            }
        },
        [setSelectedPath, setAlternatePath]
    );

    const onOntologySelection = useCallback(
        (name: string, value: string, model: PathModel) => {
            setSelectedOntologyId(model?.path.replace(/\//g, ''));
        },
        [setSelectedOntologyId]
    );

    useEffect(() => {
        if (ontologyId) {
            getOntologyDetails(ontologyId)
                .then((ontology: OntologyModel) => {
                    setOntologyModel(ontology);
                })
                .catch(() => {
                    setError('Error: unable to load ontology concept information for ' + ontologyId + '.');
                    setSelectedOntologyId(undefined);
                });
        } else {
            setOntologyModel(undefined);
        }
    }, [ontologyId, setOntologyModel, setSelectedOntologyId, setError]);

    useEffect(() => {
        if (initConcept) {
            fetchAlternatePaths(initConcept.code).then(paths => {
                onSelectedPathChange(paths?.[0], true);
            });
        }
    }, [initConcept]);

    useEffect(() => {
        if (selectedPath?.code) {
            fetchConceptForCode(selectedPath.code).then(concept => {
                setSelectedConcept(concept);
                onPathSelect?.(selectedPath, concept);
            });
        }
    }, [selectedPath, setSelectedConcept, onPathSelect]);

    return (
        <>
            <Alert>{error}</Alert>
            {!ontologyId && <OntologySelectionPanel onOntologySelection={onOntologySelection} asPanel={asPanel} />}
            {ontologyId && (
                <OntologyBrowserPanelImpl
                    ontology={ontology}
                    selectedConcept={selectedConcept}
                    alternatePath={alternatePath}
                    selectedPath={selectedPath}
                    setSelectedPath={onSelectedPathChange}
                    asPanel={asPanel}
                    hideConceptInfo={hideConceptInfo}
                    filters={filters}
                    onFilterChange={filterChangeHandler}
                />
            )}
        </>
    );
});

OntologyBrowserPanel.defaultProps = {
    asPanel: true,
};

interface OntologyBrowserPanelImplProps {
    ontology: OntologyModel;
    selectedConcept?: ConceptModel;
    alternatePath?: PathModel;
    selectedPath?: PathModel;
    setSelectedPath: (path: PathModel, isAlternatePath?: boolean) => void;
    asPanel: boolean;
    hideConceptInfo?: boolean;
    filters?: Map<string, PathModel>;
    onFilterChange?: (changedNode: PathModel) => void;
}

// exported for jest testing
export const OntologyBrowserPanelImpl: FC<OntologyBrowserPanelImplProps> = memo(props => {
    const {
        ontology,
        selectedConcept,
        alternatePath,
        selectedPath,
        setSelectedPath,
        asPanel,
        hideConceptInfo,
        filters,
        onFilterChange,
    } = props;

    if (!ontology) {
        return <LoadingSpinner />;
    }

    const { conceptCount, description } = ontology;
    const root = ontology.getPathModel();

    const body = (
        <Row className={hideConceptInfo ? 'filter-panel-row' : ''}>
            <Col xs={hideConceptInfo ? 12 : 6} className={hideConceptInfo ? '' : 'left-panel'}>
                <OntologyTreeSearchContainer ontology={ontology} searchPathClickHandler={setSelectedPath} />
                <OntologyTreePanel
                    root={root}
                    onNodeSelection={setSelectedPath}
                    alternatePath={alternatePath}
                    showFilterIcon={hideConceptInfo}
                    filters={filters}
                    onFilterChange={onFilterChange}
                />
            </Col>
            {!hideConceptInfo && (
                <Col xs={6} className="right-panel">
                    <ConceptInformationTabs
                        concept={selectedConcept}
                        selectedPath={selectedPath}
                        alternatePathClickHandler={setSelectedPath}
                    />
                </Col>
            )}
        </Row>
    );

    if (!asPanel) {
        return <div className="ontology-browser-container">{body}</div>;
    }

    return (
        <div className="panel panel-default ontology-browser-container">
            <div className="panel-heading">
                Browse {ontology.getDisplayName()}
                &nbsp;
                <LabelHelpTip
                    title="Ontology Details"
                    placement="bottom"
                    iconComponent={<i className="fa fa-info-circle" />}
                >
                    {description && <p className="ontology-description">{description}</p>}
                    <p className="ontology-concept-count">{Number(conceptCount).toLocaleString()} total concepts</p>
                </LabelHelpTip>
            </div>
            <div className="panel-body">{body}</div>
        </div>
    );
});
