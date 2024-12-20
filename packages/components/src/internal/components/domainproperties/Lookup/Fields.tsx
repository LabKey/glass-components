import React from 'react';
import { List } from 'immutable';

import { decodeLookup, encodeLookup } from '../models';
import { LOOKUP_TYPE, PropDescType } from '../PropDescType';

import { createFormInputName } from '../utils';
import { DOMAIN_FIELD_LOOKUP_CONTAINER, DOMAIN_FIELD_LOOKUP_QUERY, DOMAIN_FIELD_LOOKUP_SCHEMA } from '../constants';

import { Container } from '../../base/models/Container';
import { SchemaDetails } from '../../../SchemaDetails';

import { ILookupContext, LookupContextConsumer } from './Context';

interface ILookupProps {
    context: ILookupContext;
    name: string; // Used for testing
}

interface IFolderSelectProps {
    disabled?: boolean;
    id: string;
    onChange: (any) => any;
    value?: any;
}

export class FolderSelect extends React.PureComponent<IFolderSelectProps, any> {
    render() {
        return (
            <LookupContextConsumer>
                {context => (
                    <FolderSelectImpl
                        {...this.props}
                        context={context}
                        name={createFormInputName(DOMAIN_FIELD_LOOKUP_CONTAINER)}
                    />
                )}
            </LookupContextConsumer>
        );
    }
}

export interface IFolderSelectImplState {
    containers: List<Container>;
    loading: boolean;
}

export type FolderSelectProps = IFolderSelectProps & ILookupProps;

class FolderSelectImpl extends React.Component<FolderSelectProps, IFolderSelectImplState> {
    constructor(props) {
        super(props);

        this.state = {
            containers: List(),
            loading: false,
        };
    }

    componentDidMount(): void {
        const { context } = this.props;

        this.setState({
            loading: true,
        });

        context.fetchContainers().then(containers => {
            this.setState({
                containers,
                loading: false,
            });
        });
    }

    render() {
        const { context } = this.props;
        const { containers } = this.state;

        return (
            <select {...this.props} className="form-control">
                {context.activeContainer && (
                    <option key="_current" value="">
                        Current {context.activeContainer.type.toLowerCase() === 'project' ? 'Project' : 'Folder'}
                    </option>
                )}
                {containers
                    .map(c => (
                        <option key={c.id} value={c.path}>
                            {c.path}
                        </option>
                    ))
                    .toArray()}
            </select>
        );
    }
}

interface ITargetTableSelectProps {
    containerPath: string;
    disabled?: boolean;
    id: string;
    lookupIsValid?: boolean;
    lookupURI?: string;
    onChange: (any) => any;
    schemaName: string;
    shouldDisableNonExists?: boolean; // Only certain fields should be disabled if the lookup value does not exist in the options
    value?: any;
}

export class TargetTableSelect extends React.PureComponent<ITargetTableSelectProps> {
    render() {
        return (
            <LookupContextConsumer>
                {context => (
                    <TargetTableSelectImpl
                        {...this.props}
                        context={context}
                        name={createFormInputName(DOMAIN_FIELD_LOOKUP_QUERY)}
                    />
                )}
            </LookupContextConsumer>
        );
    }
}

export interface ITargetTableSelectImplState {
    containerPath?: string;
    initialQueryInvalid?: boolean;
    initialQueryName?: string;
    loading?: boolean;
    prevPath?: string;
    prevSchemaName?: string;
    queries?: Array<{ name: string; type: PropDescType }>;
}

export type TargetTableSelectProps = ITargetTableSelectProps & ILookupProps;

class TargetTableSelectImpl extends React.Component<TargetTableSelectProps, ITargetTableSelectImplState> {
    static defaultProps = {
        shouldDisableNonExists: true,
    };

    constructor(props) {
        super(props);

        this.state = {
            containerPath: null, // explicitly use "null" instead of "undefined" due to container API
            loading: false,
            prevPath: null,
            prevSchemaName: undefined,
            queries: undefined,
        };
    }

    static getDerivedStateFromProps(
        nextProps: TargetTableSelectProps,
        prevState: ITargetTableSelectImplState
    ): ITargetTableSelectImplState {
        if (TargetTableSelectImpl.isChanged(nextProps, prevState)) {
            return {
                prevPath: nextProps.containerPath,
                prevSchemaName: nextProps.schemaName,
            };
        }

        // no state update
        return null;
    }

    static isChanged(props: Readonly<TargetTableSelectProps>, state: Readonly<ITargetTableSelectImplState>): boolean {
        return props.containerPath !== state.prevPath || props.schemaName !== state.prevSchemaName;
    }

    componentDidMount(): void {
        this.loadData();
    }

    componentDidUpdate(
        prevProps: Readonly<TargetTableSelectProps>,
        prevState: Readonly<ITargetTableSelectImplState>,
        snapshot?: any
    ): void {
        if (TargetTableSelectImpl.isChanged(prevProps, this.state)) {
            this.loadData();
        }
    }

    loadData(): void {
        const { containerPath, context, schemaName, value, lookupIsValid } = this.props;

        this.setState({
            loading: true,
            prevPath: containerPath,
            prevSchemaName: schemaName,
        });

        // special case for Current Project/Folder which uses a value of '' (empty string)
        const queryContainerPath = containerPath === '' ? null : containerPath;

        context
            .fetchQueries(queryContainerPath, schemaName)
            .then(queries => {
                const infos: Array<{ name: string; type: PropDescType }> = [];

                context
                    .getExcludedSchemaQueryNames(schemaName?.toLowerCase(), queryContainerPath)
                    .then(excludedQueries => {
                        queries?.forEach(q => {
                            if (excludedQueries && excludedQueries?.indexOf(q.name.toLowerCase()) > -1) return;

                            if (q.isIncludedForLookups) infos.push(...q.getLookupInfo(this.props.lookupURI));
                        });

                        const initialQueryName = value ? decodeLookup(value).queryName : undefined;

                        if (!lookupIsValid) infos.unshift({ name: initialQueryName, type: LOOKUP_TYPE });

                        this.setState({
                            loading: false,
                            queries: infos,
                            initialQueryName,
                            initialQueryInvalid: !lookupIsValid,
                        });
                    })
                    .catch(error => {
                        console.error(error);
                    });
            })
            .catch(e => {
                console.error(e);
            });
    }

    render() {
        const { id, onChange, value, name, disabled, lookupIsValid, shouldDisableNonExists } = this.props;
        const { loading, queries, initialQueryName, initialQueryInvalid } = this.state;

        const isEmpty = queries?.length === 0;
        const hasValue = !!value;
        const blankOption = !hasValue && !isEmpty;

        const queryNameOptionExists =
            initialQueryName && !isEmpty ? queries.find(query => query.name === initialQueryName) !== undefined : true; // default to true without a selected queryName

        // Certain cases disable the lookup field for a valid query that is not in the list of queries
        const disabledField = disabled || (shouldDisableNonExists && !queryNameOptionExists && lookupIsValid);

        return (
            <select
                className="form-control"
                disabled={loading || disabledField}
                value={value}
                id={id}
                name={name}
                onChange={onChange}
            >
                {value && disabledField && (
                    <option key="_disabled" value={value}>
                        {decodeLookup(value).queryName}
                    </option>
                )}
                {loading && (
                    <option disabled key="_loading" value={value}>
                        Loading...
                    </option>
                )}
                {blankOption && <option key="_default" value={undefined} />}
                {queries?.map(q => {
                    const encoded = encodeLookup(q.name, q.type);
                    return (
                        <option
                            key={encoded ?? ''}
                            value={encoded}
                            disabled={
                                // Disable if it is the initial query and it is an invalid lookup
                                initialQueryInvalid &&
                                q.name === initialQueryName &&
                                decodeLookup(value).queryName !== q.name
                            }
                        >
                            {q.name} (
                            {!lookupIsValid && q.name === initialQueryName
                                ? 'Unknown'
                                : q.type.shortDisplay || q.type.display}
                            )
                        </option>
                    );
                })}
                {!loading && isEmpty && (
                    <option disabled key="_empty" value={undefined}>
                        (No tables)
                    </option>
                )}
            </select>
        );
    }
}

interface ISchemaSelectProps {
    containerPath: string;
    disabled?: boolean;
    id: string;
    onChange: (any) => any;
    value?: any;
}

export class SchemaSelect extends React.PureComponent<ISchemaSelectProps, any> {
    render() {
        return (
            <LookupContextConsumer>
                {context => (
                    <SchemaSelectImpl
                        {...this.props}
                        context={context}
                        name={createFormInputName(DOMAIN_FIELD_LOOKUP_SCHEMA)}
                    />
                )}
            </LookupContextConsumer>
        );
    }
}

export type SchemaSelectProps = ISchemaSelectProps & ILookupProps;

export interface ISchemaSelectImplState {
    containerPath?: string;
    loading?: boolean;
    prevPath?: string;
    schemas?: SchemaDetails[];
}

class SchemaSelectImpl extends React.Component<SchemaSelectProps, ISchemaSelectImplState> {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            prevPath: null,
            schemas: undefined,
        };
    }

    static getDerivedStateFromProps(
        nextProps: SchemaSelectProps,
        prevState: ISchemaSelectImplState
    ): ISchemaSelectImplState {
        if (nextProps.containerPath !== prevState.containerPath) {
            return {
                prevPath: nextProps.containerPath,
            };
        }

        // no state update
        return null;
    }

    componentDidMount(): void {
        this.loadData();
    }

    componentDidUpdate(
        prevProps: Readonly<SchemaSelectProps>,
        prevState: Readonly<ISchemaSelectImplState>,
        snapshot?: any
    ): void {
        if (prevProps.containerPath !== this.state.prevPath) {
            this.loadData();
        }
    }

    loadData(): void {
        const { containerPath, context } = this.props;

        this.setState({
            loading: true,
            prevPath: containerPath,
        });

        context.fetchSchemas(containerPath).then(allSchemas => {
            const schemas = [];
            context.getExcludedSchemaQueryNames('assay', containerPath).then(excludedAssayNames => {
                if (!excludedAssayNames || excludedAssayNames.length === 0) schemas.push(...allSchemas);
                else {
                    allSchemas.forEach(schema => {
                        if (
                            !(
                                schema.fullyQualifiedName.indexOf('assay.') === 0 &&
                                excludedAssayNames.indexOf(schema.schemaName.toLowerCase()) > -1
                            )
                        )
                            schemas.push(schema);
                    });
                }

                this.setState({
                    loading: false,
                    schemas,
                });
            });
        });
    }

    render() {
        const { id, onChange, value, name, disabled } = this.props;
        const { schemas, loading } = this.state;

        const isEmpty = schemas?.length === 0;
        const hasValue = !!value;
        const blankOption = !hasValue && !isEmpty;

        return (
            <select
                className="form-control"
                disabled={disabled}
                value={value}
                id={id}
                name={name}
                onChange={onChange}
            >
                {disabled && value && (
                    <option key="_disabled" value={value}>
                        {value}
                    </option>
                )}
                {loading && (
                    <option disabled key="_loading" value={value}>
                        Loading...
                    </option>
                )}
                {blankOption && <option key="_default" value={undefined} />}
                {schemas?.map(s => (
                    <option key={s.fullyQualifiedName} value={s.fullyQualifiedName}>
                        {s.fullyQualifiedName}
                    </option>
                ))}
                {!loading && isEmpty && (
                    <option disabled key="_empty" value={undefined}>
                        (No schemas)
                    </option>
                )}
            </select>
        );
    }
}
