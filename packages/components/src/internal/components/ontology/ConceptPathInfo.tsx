import React, { FC, memo, useEffect, useState } from 'react';

import { Alert } from '../base/Alert';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { PathModel } from './models';
import { fetchAlternatePaths } from './actions';
import { ConceptPathDisplay } from './ConceptPathDisplay';

export interface ConceptPathInfoProps {
    alternatePathClickHandler: (path: PathModel, isAlternatePath?: boolean) => void;
    selectedCode?: string;
    selectedPath?: PathModel;
}

export const ConceptPathInfo: FC<ConceptPathInfoProps> = memo(props => {
    const { selectedCode } = props;
    const [error, setError] = useState<string>();
    const [alternatePaths, setAlternatePaths] = useState<PathModel[]>();

    useEffect(() => {
        if (selectedCode) {
            setAlternatePaths(undefined);
            fetchAlternatePaths(selectedCode)
                .then(response => {
                    setAlternatePaths(response);
                })
                .catch(reason => {
                    setError('Unable to load alternate concept paths: ' + (reason?.exception ?? 'error unknown'));
                    setAlternatePaths([]);
                });
        }
    }, [selectedCode, setAlternatePaths]);

    return (
        <>
            <Alert>{error}</Alert>
            <ConceptPathInfoImpl alternatePaths={alternatePaths} {...props} />
        </>
    );
});

interface ConceptPathInfoImplProps extends ConceptPathInfoProps {
    alternatePaths?: PathModel[];
}

// export for jest testing
export const ConceptPathInfoImpl: FC<ConceptPathInfoImplProps> = memo(props => {
    const { selectedCode, selectedPath, alternatePaths } = props;

    if (!selectedCode) {
        return <div className="none-selected">No concept selected</div>;
    }

    return (
        <div className="concept-pathinfo-container">
            {selectedPath && <div className="title">{selectedPath.label}</div>}
            {!alternatePaths && <LoadingSpinner msg="Loading path information for concept..." />}
            {alternatePaths?.length === 0 && <div className="no-path-info">No path information available</div>}
            {alternatePaths?.length > 0 && <AlternatePathPanel {...props} />}
        </div>
    );
});

// export for jest testing
export const AlternatePathPanel: FC<ConceptPathInfoImplProps> = memo(props => {
    const { selectedPath, alternatePaths, alternatePathClickHandler } = props;

    const altPaths = alternatePaths.filter(path => path.path !== selectedPath?.path);

    return (
        <>
            {selectedPath && (
                <div className="current-path-container">
                    <div className="title">Current Path</div>
                    <ConceptPathDisplay key={selectedPath.path} path={selectedPath} isSelected={true} />
                </div>
            )}
            <div className="alternate-paths-container">
                <div className="title">Alternate Path(s)</div>
                {altPaths?.length === 0 && <div className="no-path-info">No alternate paths</div>}
                {altPaths?.map(path => (
                    <ConceptPathDisplay key={path.path} path={path} onClick={alternatePathClickHandler} />
                ))}
            </div>
        </>
    );
});
