import React, { ChangeEvent, FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import { FormsyInjectedProps, withFormsy } from '../formsy';
import { LabelHelpTip } from '../../base/LabelHelpTip';

// export for jest test usage
export interface RadioGroupOption {
    description?: ReactNode;
    disabled?: boolean;
    label: ReactNode;
    selected?: boolean;
    value: string;
}

interface RadioGroupOptionImplProps {
    isSelected: boolean;
    name: string;
    onSetValue: (value: string) => void;
    option: RadioGroupOption;
    showDescriptions: boolean;
}

const RadioGroupOption: FC<RadioGroupOptionImplProps> = memo(props => {
    const { isSelected, name, option, showDescriptions, onSetValue } = props;

    const onLabelClick = useCallback(() => {
        onSetValue(option.value);
    }, [onSetValue, option.value]);

    const onRadioChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            onSetValue(evt.target.value);
        },
        [onSetValue]
    );

    return (
        <div className="radio-input-wrapper">
            <input
                className="radioinput-input"
                checked={isSelected && !option.disabled}
                type="radio"
                name={name}
                value={option.value}
                onChange={onRadioChange}
                disabled={option.disabled}
            />
            <span className={classNames('radioinput-label', { selected: isSelected })} onClick={onLabelClick}>
                {option.label}
            </span>
            {showDescriptions && option.description && (
                <span className="radioinput-description"> - {option.description}</span>
            )}
            {!showDescriptions && option.description && <LabelHelpTip>{option.description}</LabelHelpTip>}
        </div>
    );
});

RadioGroupOption.displayName = 'RadioGroupOption';

interface OwnProps {
    formsy?: boolean;
    name: string;
    onValueChange?: (value) => void;
    options: RadioGroupOption[];
    showDescriptions?: boolean;
}

type RadioGroupInputProps = OwnProps & FormsyInjectedProps<any>;

const RadioGroupInputImpl: FC<RadioGroupInputProps> = memo(props => {
    const { options, name, showDescriptions, formsy, setValue, onValueChange } = props;
    const selected = useMemo(() => options?.find(option => option.selected), [options]);
    const [selectedValue, setSelectedValue] = useState<string>(selected?.value);

    useEffect(
        () => {
            if (selected?.value && formsy) {
                setValue?.(selected.value);
            }
        },
        [
            /* constructor */
        ]
    );

    const onSetValue = useCallback(
        (value: string): void => {
            setSelectedValue(value);
            onValueChange?.(value);
        },
        [onValueChange]
    );

    const onValueChange_ = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            onSetValue(evt.target.value);
        },
        [onSetValue]
    );

    if (options?.length === 1) {
        return (
            <div key={options[0].value}>
                <input checked hidden name={name} onChange={onValueChange_} type="radio" value={options[0].value} />
            </div>
        );
    }

    return (
        <>
            {options?.map(option => (
                <RadioGroupOption
                    key={option.value}
                    name={name}
                    onSetValue={onSetValue}
                    option={option}
                    isSelected={selectedValue === option.value}
                    showDescriptions={showDescriptions}
                />
            ))}
        </>
    );
});

RadioGroupInputImpl.displayName = 'RadioGroupInputImpl';

const RadioGroupInputFormsy = withFormsy<OwnProps, any>(RadioGroupInputImpl);

export const RadioGroupInput: FC<OwnProps> = props => {
    const { formsy = true } = props;
    if (formsy) {
        return <RadioGroupInputFormsy {...props} formsy />;
    }
    return <RadioGroupInputImpl {...(props as any)} formsy={false} />;
};

RadioGroupInput.displayName = 'RadioGroupInput';
