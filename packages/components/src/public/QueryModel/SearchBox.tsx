import React, { ChangeEvent, FC, FormEvent, memo, useCallback, useState } from 'react';

interface Props {
    onSearch: (value: string) => void;
}

export const SearchBox: FC<Props> = memo(props => {
    const { onSearch } = props;
    const [searchValue, setSearchValue] = useState('');

    const onChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            setSearchValue(evt.target.value);
        },
        [setSearchValue]
    );

    const onSubmit = useCallback(
        (evt: FormEvent<HTMLFormElement>) => {
            evt.preventDefault();
            onSearch(searchValue);

            // reset the input value after it is submitted
            setSearchValue('');
        },
        [onSearch, searchValue]
    );

    return (
        <form className="grid-panel__search-form" onSubmit={onSubmit}>
            <div className="form-group">
                <i className="fa fa-search grid-panel__search-icon" />
                <span className="grid-panel__input-group">
                    <input
                        className="form-control grid-panel__search-input"
                        onChange={onChange}
                        placeholder="Search..."
                        size={25}
                        type="text"
                        value={searchValue}
                    />
                </span>
            </div>
        </form>
    );
});
