import React from 'react';

export interface DisableableInputProps {
    allowDisable?: boolean;
    initiallyDisabled?: boolean;
    onToggleDisable?: (disabled: boolean) => void;
    value?: any;
}

export interface DisableableInputState {
    inputValue?: any;
    isDisabled?: boolean;
}

// TODO: convert this to a hook, use the hook instead of inheriting from this class
export class DisableableInput<P extends DisableableInputProps, S extends DisableableInputState> extends React.Component<
    P,
    S
> {
    static defaultProps = {
        allowDisable: false,
        initiallyDisabled: false,
    };

    getInputValue() {
        if (!this.props.allowDisable || this.state.inputValue === undefined) return this.props.value;

        return this.state.inputValue;
    }

    toggleDisabled = (): void => {
        const { value } = this.props;
        const { inputValue } = this.state;

        this.setState(
            state => ({
                isDisabled: !state.isDisabled,
                inputValue: state.isDisabled ? inputValue : value,
            }),
            () => {
                this.props.onToggleDisable?.(this.state.isDisabled);
            }
        );
    };
}
