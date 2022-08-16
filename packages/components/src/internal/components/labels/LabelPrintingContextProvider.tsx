import React, { ComponentType, FC, useContext } from 'react';
import { userCanPrintLabels } from './utils';
import { User } from '../base/models/User';
import { fetchBarTenderConfiguration } from './actions';

interface Props {
    user: User;
}

interface State {
    labelTemplate: string
    printServiceUrl: string
    canPrintLabels: boolean
}

export type LabelPrintingProviderProps = State;

const LabelPrintingContext = React.createContext<LabelPrintingProviderProps>(undefined);

export const LabelPrintingProvider = (Component: React.ComponentType) => {
    return class LabelPrintingProviderImpl extends React.Component<Props, State> {
        constructor(props: Props) {
            super(props);

            this.state = {
                labelTemplate: undefined,
                printServiceUrl: undefined,
                canPrintLabels: false
            }
        }

        componentDidMount()
        {
            if (userCanPrintLabels(this.props.user)) {
                fetchBarTenderConfiguration().then(btConfiguration => {
                    this.setState(() => ({
                        labelTemplate: btConfiguration.defaultLabel,
                        printServiceUrl: btConfiguration.serviceURL,
                        canPrintLabels: !!btConfiguration.serviceURL
                    }));
                });
            }
        }

        render() {
            return (
                <LabelPrintingContext.Provider value={this.state}>
                    <Component {...this.props} {...this.state}/>
                </LabelPrintingContext.Provider>
            )
        }
    }
}

export const useLabelPrintingContext = (): State => {
    return useContext(LabelPrintingContext);
};

export function withLabelPrintingContext<T>(Component: ComponentType<T & State>): ComponentType<T> {
    return props => {
        const context = useLabelPrintingContext();
        return (
            <Component {...props} {...context} />
        );
    };
}
