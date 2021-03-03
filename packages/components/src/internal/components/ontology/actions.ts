import { ActionURL, Ajax, getServerContext, Utils } from '@labkey/api';

import { ConceptModel, OntologyModel, PathModel } from './models';

const ONTOLOGY_CONTROLLER = 'ontology';
const GET_CHILD_PATHS_ACTION = 'getChildPaths.api';
const GET_ONTOLOGY_ACTION = 'getOntology.api';
const GET_CONCEPT_ACTION = 'getConcept.api';
const GET_ALTERNATE_CONCEPT_PATHS_ACTION = 'getAlternateConceptPaths.api';
const SHARED_CONTAINER = 'shared';

class Ontology {
    static getOntology(ontologyId: string): Promise<OntologyModel> {
        return new Promise<OntologyModel>((resolve, reject) => {
            const { container } = getServerContext();

            Ajax.request({
                url: ActionURL.buildURL(ONTOLOGY_CONTROLLER, GET_ONTOLOGY_ACTION, container?.path, {
                    abbreviation: ontologyId,
                }),
                method: 'GET',
                success: Utils.getCallbackWrapper(response => {
                    resolve(new OntologyModel(response));
                }),
                failure: Utils.getCallbackWrapper(
                    response => {
                        console.error(response);
                        reject(response);
                    },
                    null,
                    false
                ),
            });
        });
    }

    static getConcept(code: string): Promise<ConceptModel> {
        return new Promise<ConceptModel>((resolve, reject) => {
            const { container } = getServerContext();

            Ajax.request({
                url: ActionURL.buildURL(ONTOLOGY_CONTROLLER, GET_CONCEPT_ACTION, container?.path, {
                    code,
                }),
                method: 'GET',
                success: Utils.getCallbackWrapper(response => {
                    resolve(new ConceptModel(response.concept));
                }),
                failure: Utils.getCallbackWrapper(
                    response => {
                        console.error(response);
                        reject(response);
                    },
                    null,
                    false
                ),
            });
        });
    }
}

export function getOntologyDetails(ontologyId: string): Promise<OntologyModel> {
    return Ontology.getOntology(ontologyId);
}

export function getOntologyChildPathsAndConcepts(ontologyPath: string, container: string = SHARED_CONTAINER): Promise<PathModel> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: ActionURL.buildURL(ONTOLOGY_CONTROLLER, GET_CHILD_PATHS_ACTION, container, {
                path: ontologyPath,
            }),
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                const parent = response.parent;
                const { path, code, children } = parent;
                const childPaths = children?.map(child => new PathModel(child));
                resolve(new PathModel({ path, code, children: childPaths }));
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    console.error(response);
                    reject(response);
                },
                null,
                false
            ),
        });
    });
}

function getAlternateConceptPaths(conceptCode?: string, container: string = SHARED_CONTAINER): Promise<PathModel[]> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: ActionURL.buildURL(ONTOLOGY_CONTROLLER, GET_ALTERNATE_CONCEPT_PATHS_ACTION, container, {
                code: conceptCode,
            }),
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                resolve(response.paths?.map(path => new PathModel(path)));
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    console.error(response);
                    reject(response);
                },
                null,
                false
            ),
        });
    });
}

export function fetchChildPaths(ontologyPath?: string): Promise<PathModel> {
    return getOntologyChildPathsAndConcepts(ontologyPath);
}

export function fetchAlternatePaths(conceptCode: string): Promise<PathModel[]> {
    return getAlternateConceptPaths(conceptCode);
}

export function fetchConceptForCode(code: string): Promise<ConceptModel> {
    return Ontology.getConcept(code);
}
