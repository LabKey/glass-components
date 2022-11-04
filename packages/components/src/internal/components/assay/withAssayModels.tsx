import React, { ComponentType, createContext, FC, PureComponent, ReactNode } from 'react';
import { List } from 'immutable';
import { produce } from 'immer';
import { withRouter, WithRouterProps } from 'react-router';

import { fetchProtocol } from '../domainproperties/assay/actions';

import { isAssayEnabled } from '../../app/utils';

import { AssayDefinitionModel } from '../../AssayDefinitionModel';
import { AssayProtocolModel } from '../domainproperties/assay/models';

import { LoadingState } from '../../../public/LoadingState';

import { AssayStateModel } from './models';
import { clearAssayDefinitionCache, fetchAllAssays } from './actions';

export interface AssayLoader {
    clearDefinitionsCache: () => void;
    loadDefinitions: (containerPath?: string) => Promise<List<AssayDefinitionModel>>;
    loadProtocol: (protocolId: number, containerPath?: string) => Promise<AssayProtocolModel>;
}

interface AssayContextModel {
    assayDefinition: AssayDefinitionModel;
    assayProtocol: AssayProtocolModel;
}

export interface WithAssayModelProps {
    assayContainerPath?: string;
    assayLoader?: AssayLoader;
    assayName?: string;
}

export interface InjectedAssayModel extends AssayContextModel {
    assayModel: AssayStateModel;
    reloadAssays: () => void;
}

interface State {
    context: AssayContextModel;
    model: AssayStateModel;
}

export const AssayContext = createContext<AssayContextModel>(undefined);
export const AssayContextProvider = AssayContext.Provider;
export const AssayContextConsumer = AssayContext.Consumer;

const DefaultAssayLoader: AssayLoader = {
    clearDefinitionsCache: clearAssayDefinitionCache,
    loadDefinitions: (containerPath: string) => fetchAllAssays(undefined, containerPath),
    loadProtocol: (protocolId: number, containerPath?: string) =>
        fetchProtocol(protocolId, undefined, undefined, containerPath),
};

/**
 * Provides a wrapped component with assay definitions. These definitions are loaded into the
 * [[AssayStateModel]] which is injected into the component as the "assayModel" property.
 * Optionally, if the "assayName" property is specified it will load the associated assay
 * protocol and pass it, along with it's specific assay definition, as props "assayProtocol"
 * and "assayDefinition".
 * @param ComponentToWrap: The component definition (e.g. class, function) to wrap.
 * This will have [[InjectedAssayModel]] props injected into it when instantiated.
 * @param defaultProps: Provide alternative "defaultProps" for this wrapped component.
 */
export function withAssayModels<Props>(
    ComponentToWrap: ComponentType<Props & InjectedAssayModel>,
    defaultProps?: WithAssayModelProps
): ComponentType<Props & WithAssayModelProps> {
    type WrappedProps = Props & WithAssayModelProps;

    class ComponentWithAssays extends PureComponent<WrappedProps, State> {
        static defaultProps;

        state: Readonly<State> = produce<State>({} as State, () => ({
            context: { assayDefinition: undefined, assayProtocol: undefined },
            model: new AssayStateModel(),
        }));

        private _mounted = false;

        componentDidMount = (): void => {
            this._mounted = true;
            this.load();
        };

        componentDidUpdate = (prevProps: WrappedProps): void => {
            const { assayContainerPath, assayName } = this.props;
            if (assayName !== prevProps.assayName || assayContainerPath !== prevProps.assayContainerPath) {
                this.load();
            }
        };

        componentWillUnmount = (): void => {
            this._mounted = false;
        };

        load = async (): Promise<void> => {
            if (!isAssayEnabled()) {
                this.updateModel({
                    definitions: [],
                    definitionsLoadingState: LoadingState.LOADED,
                });
            } else {
                await this.loadDefinitions();
                await this.loadProtocol();
            }
        };

        loadDefinitions = async (): Promise<void> => {
            const { assayContainerPath, assayLoader } = this.props;
            const { model } = this.state;

            if (model.definitionsLoadingState === LoadingState.LOADED) {
                return;
            }

            this.updateModel({ definitionsError: undefined, definitionsLoadingState: LoadingState.LOADING });

            try {
                const definitions = await assayLoader.loadDefinitions(assayContainerPath);

                this.updateModel({
                    definitions: definitions.toArray(),
                    definitionsLoadingState: LoadingState.LOADED,
                });
            } catch (definitionsError) {
                this.updateModel({ definitionsError, definitionsLoadingState: LoadingState.LOADED });
            }
        };

        loadProtocol = async (): Promise<void> => {
            const { assayContainerPath, assayLoader, assayName } = this.props;
            const { model } = this.state;

            // If an "assayName" is not provided and one has not ever been loaded by this instance,
            // then do not attempt to process the "assayName" as it is an optional behavior to load the protocol.
            if (!assayName && model.protocolLoadingState === LoadingState.INITIALIZED) {
                return;
            }

            const assayDefinition = model.getByName(assayName);
            let modelProps: Partial<AssayStateModel>;

            if (assayDefinition) {
                modelProps = { protocolError: undefined, protocolLoadingState: LoadingState.LOADING };
            } else {
                modelProps = {
                    protocolError: `Load protocol failed. Unable to resolve assay definition for assay name "${assayName}".`,
                    protocolLoadingState: LoadingState.LOADED,
                };
            }

            this.update({
                context: { assayDefinition, assayProtocol: undefined },
                model: model.mutate(modelProps),
            });

            if (!assayDefinition) {
                return;
            }

            try {
                const assayProtocol = await assayLoader.loadProtocol(assayDefinition.id, assayContainerPath);

                this.update({
                    context: { assayDefinition, assayProtocol },
                    model: model.mutate({ protocolLoadingState: LoadingState.LOADED }),
                });
            } catch (protocolError) {
                this.updateModel({ protocolError, protocolLoadingState: LoadingState.LOADED });
            }
        };

        reload = async (): Promise<void> => {
            this.props.assayLoader.clearDefinitionsCache();

            await this.update({
                context: { assayDefinition: undefined, assayProtocol: undefined },
                model: new AssayStateModel(),
            });

            await this.load();
        };

        update = (newState: Partial<State>): Promise<void> => {
            return new Promise(resolve => {
                if (this._mounted) {
                    this.setState(
                        produce<State>(draft => {
                            Object.assign(draft, newState);
                        }),
                        () => {
                            resolve();
                        }
                    );
                }
            });
        };

        updateModel = (newModel: Partial<AssayStateModel>): Promise<void> => {
            return new Promise(resolve => {
                if (this._mounted) {
                    this.setState(
                        produce<State>(draft => {
                            Object.assign(draft.model, newModel);
                        }),
                        () => {
                            resolve();
                        }
                    );
                }
            });
        };

        render = (): ReactNode => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { assayLoader, assayName, ...props } = this.props;
            const { context, model } = this.state;

            return (
                <AssayContextProvider value={context}>
                    <ComponentToWrap assayModel={model} reloadAssays={this.reload} {...context} {...(props as Props)} />
                </AssayContextProvider>
            );
        };
    }

    ComponentWithAssays.defaultProps = {
        assayLoader: defaultProps?.assayLoader ?? DefaultAssayLoader,
    };

    return ComponentWithAssays;
}

/**
 * Provides a [[withAssayModels]] wrapped component that is additionally wrapped by react-router's withRouter.
 * This additional wrapping allows for sourcing the "assayName" property from the URL. NOTE: This is specifically
 * configured to expect a route param called "protocol" which is expected to a be (string) name of a specific assay
 * protocol.
 * @param ComponentToWrap: The component definition (e.g. class, function) to wrap.
 * This will have [[InjectedAssayModel]] props injected into it when instantiated.
 * @param defaultProps: Provide alternative "defaultProps" for this wrapped component.
 */
export function withAssayModelsFromLocation<Props>(
    ComponentToWrap: ComponentType<Props & InjectedAssayModel>,
    defaultProps?: WithAssayModelProps
): ComponentType<Props & WithAssayModelProps & WithRouterProps> {
    const WrappedComponent = withAssayModels<Props>(ComponentToWrap, defaultProps);

    const AssayFromLocation: FC<Props & WithRouterProps> = props => {
        return <WrappedComponent {...props} assayName={props.params?.protocol} />;
    };

    return withRouter(AssayFromLocation);
}
