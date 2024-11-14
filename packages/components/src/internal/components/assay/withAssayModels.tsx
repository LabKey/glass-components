import React, { ComponentType, createContext, FC, PureComponent, ReactNode } from 'react';
import { produce } from 'immer';
import { useParams } from 'react-router-dom';

import { isAssayEnabled } from '../../app/utils';

import { AssayDefinitionModel } from '../../AssayDefinitionModel';
import { AssayProtocolModel } from '../domainproperties/assay/models';

import { LoadingState } from '../../../public/LoadingState';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { ModuleContext } from '../base/ServerContext';

import { AssayStateModel } from './models';
import { GetAssayDefinitionsOptions } from './actions';

interface AssayContextModel {
    assayDefinition: AssayDefinitionModel;
    assayProtocol: AssayProtocolModel;
}

export interface WithAssayModelProps {
    api?: ComponentsAPIWrapper;
    assayContainerPath?: string;
    assayName?: string;
    excludedAssayDesigns?: number[];
    moduleContext?: ModuleContext;
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

/**
 * Provides a wrapped component with assay definitions. These definitions are loaded into the
 * [[AssayStateModel]] which is injected into the component as the "assayModel" property.
 * Optionally, if the "assayName" property is specified it will load the associated assay
 * protocol and pass it, along with its specific assay definition, as props "assayProtocol"
 * and "assayDefinition".
 * @param ComponentToWrap The component definition (e.g. class, function) to wrap.
 * This will have [[InjectedAssayModel]] props injected into it when instantiated.
 */
export function withAssayModels<Props>(
    ComponentToWrap: ComponentType<Props & InjectedAssayModel>
): ComponentType<Props & WithAssayModelProps> {
    type WrappedProps = Props & WithAssayModelProps;

    class ComponentWithAssays extends PureComponent<WrappedProps, State> {
        static defaultProps;

        state: Readonly<State> = produce<State>({} as State, () => ({
            context: { assayDefinition: undefined, assayProtocol: undefined },
            model: new AssayStateModel(),
        }));

        private _mounted = false;

        get api() {
            return this.props.api ?? getDefaultAPIWrapper();
        }

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
            if (!isAssayEnabled(this.props.moduleContext)) {
                await this.updateModel({
                    definitions: [],
                    definitionsLoadingState: LoadingState.LOADED,
                });
            } else {
                await this.loadDefinitions();
                await this.loadProtocol();
            }
        };

        loadDefinitions = async (): Promise<void> => {
            const { assayContainerPath, assayName, excludedAssayDesigns } = this.props;
            const { model } = this.state;

            if (model.definitionsLoadingState === LoadingState.LOADED) {
                return;
            }

            await this.updateModel({ definitionsError: undefined, definitionsLoadingState: LoadingState.LOADING });

            try {
                const params: GetAssayDefinitionsOptions = { containerPath: assayContainerPath };

                // If an "assayName" prop is specified, then filter for only the related assay definition
                if (assayName) {
                    params.name = assayName;
                }

                let definitions = await this.api.assay.getAssayDefinitions(params);

                if (excludedAssayDesigns?.length > 0) {
                    definitions = definitions.filter(def => excludedAssayDesigns.indexOf(def.id) === -1);
                }

                await this.updateModel({
                    definitions,
                    definitionsLoadingState: LoadingState.LOADED,
                });
            } catch (definitionsError) {
                await this.updateModel({
                    definitions: [],
                    definitionsError,
                    definitionsLoadingState: LoadingState.LOADED,
                });
            }
        };

        loadProtocol = async (): Promise<void> => {
            const { assayContainerPath, assayName } = this.props;
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

            await this.update({
                context: { assayDefinition, assayProtocol: undefined },
                model: model.mutate(modelProps),
            });

            if (!assayDefinition) {
                return;
            }

            try {
                const assayProtocol = await this.api.assay.getProtocol({
                    containerPath: assayContainerPath,
                    protocolId: assayDefinition.id,
                });

                await this.update({
                    context: { assayDefinition, assayProtocol },
                    model: model.mutate({ protocolLoadingState: LoadingState.LOADED }),
                });
            } catch (protocolError) {
                await this.updateModel({ protocolError, protocolLoadingState: LoadingState.LOADED });
            }
        };

        reload = async (): Promise<void> => {
            this.api.assay.clearAssayDefinitionCache();

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
            const { assayName, ...props } = this.props;
            const { context, model } = this.state;

            return (
                <AssayContextProvider value={context}>
                    <ComponentToWrap assayModel={model} reloadAssays={this.reload} {...context} {...(props as Props)} />
                </AssayContextProvider>
            );
        };
    }

    return ComponentWithAssays;
}

/**
 * Provides a [[withAssayModels]] wrapped component that sources the "assayName" property from the URL. NOTE: This is
 * specifically configured to expect a route param called "protocol" which is expected to a be (string) name of a
 * specific assay protocol.
 * @param ComponentToWrap The component definition (e.g. class, function) to wrap.
 * This will have [[InjectedAssayModel]] props injected into it when instantiated.
 * @param defaultProps Provide alternative "defaultProps" for this wrapped component.
 */
// TODO: this component seems kind of unnecessary, it seems like every consumer should be able to just use the RR6
//  useParams hook directly, it's not particularly complicated.
export function withAssayModelsFromLocation<Props>(
    ComponentToWrap: ComponentType<Props & InjectedAssayModel>
): ComponentType<Props & WithAssayModelProps> {
    const WrappedComponent = withAssayModels<Props>(ComponentToWrap);

    const AssayFromLocation: FC<Props> = props => {
        const protocol = useParams().protocol;
        return <WrappedComponent {...props} assayName={protocol} />;
    };

    return AssayFromLocation;
}
