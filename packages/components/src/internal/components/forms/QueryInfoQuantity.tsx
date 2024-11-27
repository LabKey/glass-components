import React, { PureComponent } from 'react';

import { EntityCreationType, EntityCreationTypeModel } from '../samples/models';

import { addFormsyRule } from './formsy';
import { FormsyInput } from './input/FormsyReactComponents';
import { RadioGroupInput } from './input/RadioGroupInput';

interface Props {
    countText: string;
    creationTypeOptions: EntityCreationTypeModel[];
    includeCountField: boolean;
    maxCount: number;
    onCountChange?: (count: number) => void;
}

interface State {
    count: number;
    selectedCreationType: EntityCreationType;
}

addFormsyRule<string>('isPositiveLt', (_, v, smax) => {
    if (v === '' || v === undefined) {
        return true;
    }

    const max = parseInt(smax, 10);
    const i = parseInt(v, 10);

    if (!isNaN(i) && i >= 1 && i <= max) return true;
    return max === 1 ? 'Only 1 allowed' : `Value must be between 1 and ${max.toLocaleString()}.`;
});

export class QueryInfoQuantity extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        const selectedOption = props.creationTypeOptions?.find(option => option.selected);
        this.state = {
            count: undefined,
            selectedCreationType: selectedOption?.type,
        };
    }

    onCountChange = (field, value): void => {
        this.setState(() => ({ count: value }));
        this.props.onCountChange?.(value);
    };

    onOptionChange = value => {
        this.setState(() => ({ selectedCreationType: value }));
    };

    render() {
        const { creationTypeOptions, includeCountField, maxCount } = this.props;
        const { count, selectedCreationType } = this.state;
        let text = this.props.countText;

        const options = [];
        if (creationTypeOptions) {
            creationTypeOptions.forEach(option => {
                const selected = selectedCreationType === option.type;
                if (selected) text = option.quantityLabel;
                options.push({
                    value: option.type,
                    description:
                        option.disabled && option.disabledDescription ? option.disabledDescription : option.description,
                    label: option.type,
                    disabled: option.disabled,
                    selected: option.selected,
                });
            });
        }
        return (
            <>
                {options.length > 0 && (
                    <div className="creation-type-radioinput">
                        <RadioGroupInput
                            name="creationType"
                            options={options}
                            formsy
                            onValueChange={this.onOptionChange}
                            showDescriptions
                        />
                    </div>
                )}
                {(options.length > 0 || includeCountField) && (
                    <FormsyInput
                        id="numItems"
                        label={text}
                        labelClassName="control-label text-left"
                        name="numItems"
                        max={maxCount}
                        min={1}
                        onChange={this.onCountChange}
                        required
                        step="1"
                        style={{ width: '125px' }}
                        type="number"
                        validations={`isPositiveLt:${maxCount}`}
                        value={count ? count.toString() : '1'}
                    />
                )}
            </>
        );
    }
}
