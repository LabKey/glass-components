import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';

import { PathModel } from './models';

import { Alert } from '../base/Alert';

import { fetchParentPaths } from './actions';
import { LoadingSpinner } from '../../..';

export interface ConceptPathDisplayProps {
    title?: string;
    path: PathModel;
    isSelected?: boolean;
    isCollapsed?: boolean;
    onClick?: (path: PathModel, isAlternatePath?: boolean) => void;
}

export const ConceptPathDisplay: FC<ConceptPathDisplayProps> = memo(props => {
    const { path } = props;
    const [parentPaths, setParentPaths] = useState<PathModel[]>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (path) {
            fetchParentPaths(path.path)
                .then(response => {
                    setParentPaths(response);
                })
                .catch(reason => {
                    setError('Unable to load parent paths: ' + reason?.exception);
                    setParentPaths([]);
                });
        }
    }, [path, setParentPaths, setError]);

    return (
        <>
            <Alert>{error}</Alert>
            {path && <ConceptPathDisplayImpl key={path.path} {...props} parentPaths={parentPaths} />}
        </>
    );
});

interface ConceptPathDisplayImplProps extends ConceptPathDisplayProps {
    parentPaths: PathModel[];
}

export const ConceptPathDisplayImpl: FC<ConceptPathDisplayImplProps> = memo(props => {
    const { isCollapsed = false, isSelected = false, onClick = undefined, parentPaths, path, title } = props;
    const updatePath = useCallback((): void => {
        onClick?.(path, true);
    }, [path, onClick]);

    if (!path) return undefined;

    return (
        <div
            className={classNames('concept-path-container', {
                selected: isSelected,
                collapsed: isCollapsed,
            })}
            onClick={updatePath}
        >
            {title && <div className="title">{title}</div>}
            <div className="concept-path">
                {!parentPaths && <LoadingSpinner />}
                {parentPaths?.map((parent, idx) => {
                    return (
                        <>
                            <span className="concept-path-label">{parent.label}</span>
                            {idx !== parentPaths.length - 1 && <i className="fa fa-chevron-right" />}
                        </>
                    );
                })}
            </div>
        </div>
    );
});
