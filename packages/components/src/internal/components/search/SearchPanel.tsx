import React, { ChangeEvent, FC, FormEvent, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { Section } from '../base/Section';

import { HelpLink } from '../../util/helpLinks';

import { resolveErrorMessage } from '../../util/messaging';

import { PaginationButtons } from '../buttons/PaginationButtons';

import { biologicsIsPrimaryApp, isPlatesEnabled } from '../../app/utils';

import { useServerContext } from '../base/ServerContext';

import { SearchResultsPanel } from './SearchResultsPanel';

import { GetCardDataFn, SearchResultsModel } from './models';
import { SEARCH_HELP_TOPIC, SEARCH_PAGE_DEFAULT_SIZE, SearchCategory } from './constants';
import { searchUsingIndex } from './actions';
import { getSearchResultCardData } from './utils';

interface SearchPanelProps {
    appName: string;
    offset?: number; // Result number to start from
    pageSize?: number; // number of results to return/display
    search: (form: any) => any;
    searchMetadata?: any;
    searchTerm: string;
    title: string;
}

export interface SearchPanelImplProps extends Omit<SearchPanelProps, 'getCardDataFn'> {
    model: SearchResultsModel;
    onPageChange: (direction: number) => void;
}

export const SearchPanelImpl: FC<SearchPanelImplProps> = memo(props => {
    const { appName = 'Labkey', searchTerm, model, search, onPageChange, pageSize, offset, title } = props;
    const [searchQuery, setSearchQuery] = useState<string>(searchTerm);
    const totalHits = useMemo(() => model?.getIn(['entities', 'totalHits']), [model]);
    const currentPage = offset / pageSize ? offset / pageSize : 0;

    useEffect(() => {
        setSearchQuery(searchTerm);
    }, [searchTerm]);

    const emptyTextMessage = useMemo((): ReactNode => {
        return (
            <div className="search-panel__no-results panel-body">
                <div className="font-large">No Results Found</div>
                <hr />
                <div>
                    We suggest to check your spelling or broaden your search.
                    <br />
                    <br />
                    Can't find what you're looking for? Check the{' '}
                    <HelpLink topic={SEARCH_HELP_TOPIC}>documentation</HelpLink> for {appName}
                </div>
            </div>
        );
    }, [appName]);

    const pageBack = useCallback(() => {
        onPageChange(-1);
    }, [onPageChange]);

    const pageForward = useCallback(() => {
        onPageChange(1);
    }, [onPageChange]);

    const onSearchChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            setSearchQuery(evt.target.value);
        },
        [setSearchQuery]
    );

    const onSubmit = useCallback(
        (evt: FormEvent<HTMLFormElement> | undefined) => {
            evt?.preventDefault();
            search({ q: searchQuery });
        },
        [search, searchQuery]
    );

    const onSearchClick = useCallback(() => {
        onSubmit(undefined);
    }, [onSubmit]);

    const hasPages = totalHits > pageSize;

    const helpLink = (
        <HelpLink topic={SEARCH_HELP_TOPIC} className="search-form__help-link">
            <i className="fa fa-question-circle search-form__help-icon" />
            Help with search
        </HelpLink>
    );

    return (
        <Section panelClassName="test-loc-search-panel" title={title} context={helpLink}>
            <div className="search-form panel-body">
                <form onSubmit={onSubmit}>
                    <span className="input-group">
                        <span className="input-group-addon clickable" onClick={onSearchClick}>
                            <i className="fa fa-search search-icon" />
                        </span>
                        <input
                            className="form-control search-input"
                            onChange={onSearchChange}
                            placeholder="Search"
                            size={34}
                            type="text"
                            value={searchQuery}
                        />
                    </span>
                </form>
                <button
                    className="margin-left success submit-button btn btn-default"
                    onClick={onSearchClick}
                    type="submit"
                >
                    Search
                </button>
                {hasPages && (
                    <div className="page-buttons">
                        <PaginationButtons
                            total={totalHits}
                            currentPage={currentPage}
                            perPage={pageSize}
                            previousPage={pageBack}
                            nextPage={pageForward}
                        />
                    </div>
                )}
            </div>
            {searchTerm && <SearchResultsPanel model={model} emptyResultDisplay={emptyTextMessage} offset={offset} />}
        </Section>
    );
});

// FIXME: This component should be moved into premium, the props should be refactored:
//      - search prop should be removed, and it should be handled internally via react router hooks (setting search
//      params via useSearchParams setter).
//      - offset, pageSize, and searchTerm (q) can be taken directly off the URL via useSearchParams
//      - searchMetadata is the only needed prop
export const SearchPanel: FC<SearchPanelProps> = memo(props => {
    const { offset = 0, pageSize = SEARCH_PAGE_DEFAULT_SIZE, searchTerm, search, searchMetadata } = props;
    const [model, setModel] = useState<SearchResultsModel>(() => SearchResultsModel.create({ isLoading: true }));
    const { moduleContext } = useServerContext();
    const isBiologics = biologicsIsPrimaryApp(moduleContext);
    const platesEnabled = isPlatesEnabled(moduleContext);
    const category = useMemo(() => {
        const categories = [
            SearchCategory.Assay,
            SearchCategory.AssayBatch,
            SearchCategory.AssayRun,
            SearchCategory.Data,
            SearchCategory.DataClass,
            SearchCategory.File,
            SearchCategory.FileWorkflowJob,
            SearchCategory.Material,
            SearchCategory.MaterialSource,
            SearchCategory.Notebook,
            SearchCategory.NotebookTemplate,
            SearchCategory.StorageLocation,
            SearchCategory.TerminalStorageLocation,
            SearchCategory.WorkflowJob,
        ];

        if (isBiologics) {
            categories.push(SearchCategory.Media, SearchCategory.MediaData);
        }
        if (platesEnabled) {
            categories.push(SearchCategory.Plate);
            categories.push(SearchCategory.PlateSet);
        }

        return categories;
    }, [isBiologics, platesEnabled]);
    const getCardDataFn = useCallback<GetCardDataFn>(
        (data, cat) => getSearchResultCardData(data, cat, searchMetadata),
        [searchMetadata]
    );

    useEffect(() => {
        if (!searchTerm) return;
        (async () => {
            setModel(SearchResultsModel.create({ isLoading: true }));
            try {
                const entities = await searchUsingIndex(
                    {
                        category,
                        escapeQuery: true,
                        q: searchTerm,
                        limit: pageSize,
                        offset,
                    },
                    getCardDataFn
                );
                setModel(SearchResultsModel.create({ entities, isLoaded: true }));
            } catch (response) {
                if (!response.exception) {
                    console.error(response);
                }
                setModel(
                    SearchResultsModel.create({
                        error: resolveErrorMessage(response.exception) ?? 'Unknown error getting search results.',
                        isLoaded: true,
                    })
                );
            }
        })();
    }, [category, getCardDataFn, offset, pageSize, searchTerm]);

    const onPage = useCallback(
        direction => {
            // FIXME: offset is a string because it comes from queryParams and we aren't properly parsing it upstream
            //  so the comment below is inaccurate. We should fix the code so it's always a number.

            // because JS is dumb and treats offset as a string...
            const newOffset = direction * pageSize + offset * 1;
            search({ q: searchTerm, pageSize, offset: newOffset });
        },
        [search, searchTerm, pageSize, offset]
    );

    return <SearchPanelImpl {...props} search={search} model={model} onPageChange={onPage} offset={offset} />;
});
