import React, { ChangeEvent, FC, FormEvent, memo, useCallback, useEffect, useState, useMemo } from 'react';
import { ActionValue } from '../../internal/components/omnibox/actions/Action';

interface Props {
    actionValues: ActionValue[];
    onSearch: (value: string) => void;
}

export const SearchBox: FC<Props> = memo(props => {
    const { actionValues, onSearch } = props;
    const [searchValue, setSearchValue] = useState('');
    const appliedSearch = useMemo(
        () => actionValues.find(actionValue => actionValue.action.keyword === 'search')?.value,
        [actionValues]
    );

    useEffect(() => {
        if (appliedSearch) setSearchValue(appliedSearch);
    }, [appliedSearch]);

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
        },
        [onSearch, searchValue]
    );

    const removeSearch = useCallback(() => {
        onSearch('');
        setSearchValue('');
    }, [onSearch]);

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
                    {appliedSearch?.length > 0 && (
                        <i className="fa fa-remove grid-panel__remove-icon" onClick={removeSearch} />
                    )}
                </span>
            </div>
        </form>
    );
});
