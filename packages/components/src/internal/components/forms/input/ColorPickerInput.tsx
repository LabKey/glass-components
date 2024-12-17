import React, { FC, memo, useCallback, useState } from 'react';
import { ColorResult, CompactPicker } from 'react-color';
import classNames from 'classnames';

import { ColorIcon } from '../../base/ColorIcon';
import { RemoveEntityButton } from '../../buttons/RemoveEntityButton';

interface Props {
    allowRemove?: boolean;
    colors?: string[];
    disabled?: boolean;
    name?: string;
    onChange: (name: string, value: string) => void;
    text?: string;
    value: string;
}

export const ColorPickerInput: FC<Props> = memo(props => {
    const { allowRemove, colors, disabled, name, onChange, text, value } = props;
    const [showPicker, setShowPicker] = useState<boolean>(false);
    const onChangeComplete = useCallback(
        (color?: ColorResult) => {
            onChange(name, color?.hex);
        },
        [name, onChange]
    );
    const onRemove = useCallback(() => {
        onChangeComplete();
    }, [onChangeComplete]);
    const togglePicker = useCallback(() => {
        setShowPicker(s => !s);
    }, []);

    return (
        <div className="color-picker">
            <button
                type="button"
                className="color-picker__button btn btn-default"
                onClick={togglePicker}
                disabled={disabled}
            >
                {text ? text : value ? <ColorIcon cls="color-picker__chip-small" asSquare value={value} /> : 'None'}
                <i className={classNames('fa', { 'fa-caret-up': showPicker, 'fa-caret-down': !showPicker })} />
            </button>

            {text !== undefined && <ColorIcon cls="color-picker__chip" asSquare value={value} />}

            {allowRemove && value && !disabled && (
                <RemoveEntityButton onClick={onRemove} labelClass="color-picker__remove" />
            )}

            <div className="color-picker__picker">
                {showPicker && (
                    <>
                        <div className="color-picker__mask" onClick={togglePicker} />
                        <CompactPicker onChangeComplete={onChangeComplete} color={value} colors={colors} />
                    </>
                )}
            </div>
        </div>
    );
});

ColorPickerInput.displayName = 'ColorPickerInput';
