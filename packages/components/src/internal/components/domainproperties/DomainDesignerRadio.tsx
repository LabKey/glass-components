import React, { ChangeEvent, FC, memo, PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
    checked: boolean;
    disabled?: boolean;
    name: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    value: string | number;
}

// Note: This component is specifically for the Domain Designer, if you need to render a radio input you should
// probably be using RadioGroupInput instead.
export const DomainDesignerRadio: FC<Props> = memo(({ checked, children, disabled, name, onChange, value }) => (
    <div className="radio">
        <label>
            <input checked={checked} disabled={disabled} name={name} onChange={onChange} type="radio" value={value} />
            {children}
        </label>
    </div>
));
