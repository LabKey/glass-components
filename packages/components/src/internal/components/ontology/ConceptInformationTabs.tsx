import React, { FC, memo, SyntheticEvent, useCallback, useState } from 'react';
import { Col, Nav, NavItem, Row, Tab, TabContainer } from 'react-bootstrap';

import { ConceptModel } from './models';

interface ConceptInformationTabsProps {
    concept?: ConceptModel;
}

const enum ConceptInfoTabs {
    CONCEPT_OVERVIEW_TAB = 'overview',
    PATH_INFO_TAB = 'pathinfo',
}

export const ConceptInformationTabs: FC<ConceptInformationTabsProps> = memo(props => {
    const { concept } = props;
    const [activeTab, setActiveTab] = useState<ConceptInfoTabs>(ConceptInfoTabs.CONCEPT_OVERVIEW_TAB);

    const onSelectionChange = useCallback(
        (event: SyntheticEvent<TabContainer, Event>) => {
            const tab: ConceptInfoTabs = event as any; // Crummy cast to make TS happy
            setActiveTab(tab);
        },
        [setActiveTab]
    );

    return (
        <>
            <div>
                <Tab.Container
                    id="concept-information-tabs"
                    className="concept-information-tabs"
                    onSelect={onSelectionChange}
                    activeKey={activeTab}
                    defaultActiveKey={ConceptInfoTabs.CONCEPT_OVERVIEW_TAB}
                >
                    <Row className="clearfix">
                        <Col>
                            <Nav bsStyle="tabs">
                                <NavItem eventKey={ConceptInfoTabs.CONCEPT_OVERVIEW_TAB}>Overview</NavItem>
                                <NavItem eventKey={ConceptInfoTabs.PATH_INFO_TAB}>Path Information</NavItem>
                            </Nav>
                        </Col>
                        <Col>
                            <Tab.Content animation>
                                <Tab.Pane
                                    className="ontology-concept-overview-container"
                                    eventKey={ConceptInfoTabs.CONCEPT_OVERVIEW_TAB}
                                >
                                    <ConceptOverviewPanel concept={concept} />
                                </Tab.Pane>
                                <Tab.Pane
                                    className="ontology-concept-pathinfo-container"
                                    eventKey={ConceptInfoTabs.PATH_INFO_TAB}
                                >
                                    <div className="placeholder">Coming soon...</div>
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </div>
        </>
    );
});

// Read-only element displaying the concept's details
const ConceptOverviewPanel: FC<{ concept: ConceptModel }> = memo(props => {
    const { concept } = props;

    if (!concept) {
        return <div className="none-selected">No concept selected</div>;
    }

    const { code, label, description } = concept;

    return (
        <>
            {label && <div className="title margin-bottom">{label}</div>}
            {code && <span className="code">{code}</span>}
            {description && (
                <div>
                    <div className="description-title">Description</div>
                    <p className="description-text">{description}</p>
                </div>
            )}
        </>
    );
});
