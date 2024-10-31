import React, { FC, PropsWithChildren, useMemo } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Query } from '@labkey/api';

import { AppContext, AppContextProvider } from '../AppContext';
import { getTestAPIWrapper } from '../APIWrapper';

import {
    NotificationsContextProvider,
    NotificationsContextState,
} from '../components/notifications/NotificationsContext';
import { ServerContext, ServerContextProvider } from '../components/base/ServerContext';
import {
    LabelPrintingContextProps,
    LabelPrintingContextProvider,
} from '../components/labelPrinting/LabelPrintingContextProvider';
import { GlobalStateContextProvider } from '../GlobalStateContext';
import { URL_MAPPERS, URLService } from '../url/URLResolver';

import { QueryInfo } from '../../public/QueryInfo';
import { applyQueryMetadata, handleSelectRowsResponse, ISelectRowsResult } from '../query/api';
import { bindColumnRenderers, RowsResponse } from '../../public/QueryModel/QueryModelLoader';

export interface AppContextTestProviderProps<A = AppContext> extends PropsWithChildren {
    appContext?: Partial<A>;
    notificationContext?: Partial<NotificationsContextState>;
    printLabelsContext?: Partial<LabelPrintingContextProps>;
    serverContext?: Partial<ServerContext>;
}

export const AppContextTestProvider: FC<AppContextTestProviderProps> = props => {
    const { appContext, children, serverContext = {}, notificationContext, printLabelsContext } = props;
    const initialAppContext = useMemo(() => ({ api: getTestAPIWrapper(), ...appContext }), [appContext]);

    return (
        <ServerContextProvider initialContext={serverContext as ServerContext}>
            <AppContextProvider initialContext={initialAppContext}>
                <GlobalStateContextProvider>
                    <NotificationsContextProvider initialContext={notificationContext as NotificationsContextState}>
                        <LabelPrintingContextProvider initialContext={printLabelsContext as LabelPrintingContextProps}>
                            {children}
                        </LabelPrintingContextProvider>
                    </NotificationsContextProvider>
                </GlobalStateContextProvider>
            </AppContextProvider>
        </ServerContextProvider>
    );
};

/**
 * Instantiates a QueryInfo from a captured query details response payload. Cannot be used until you've called
 * initQueryGridState or initUnitTestMocks.
 * @param getQueryDetailsResponse getQueryDetails response object (e.g. imported from
 * test/data/mixtures-getQueryDetails.json)
 */
export const makeQueryInfo = (getQueryDetailsResponse): QueryInfo => {
    const queryInfo = applyQueryMetadata(getQueryDetailsResponse);
    return queryInfo.mutate({ columns: bindColumnRenderers(queryInfo.columns) });
};

export const parseQueryResponse = (getQueryResponse): Partial<ISelectRowsResult> => {
    // Hack: need to stringify and parse the query response object because Query.Response modifies the object in place,
    // which causes errors if you try to use the same response object twice.
    const response = new Query.Response(JSON.parse(JSON.stringify(getQueryResponse)));
    return handleSelectRowsResponse(response, new QueryInfo({}));
};

export const makeTestISelectRowsResult = (getQueryResponse, getQueryDetailsResponse): ISelectRowsResult => {
    const partial = parseQueryResponse(getQueryResponse);

    return {
        ...partial,
        queries: {
            [partial.key]: makeQueryInfo(getQueryDetailsResponse),
        },
    } as ISelectRowsResult;
};

/**
 * Creates rows and orderedRows objects needed by the QueryModel. Returns a Promise that resolves to an object that
 * looks like: { messages: any, rows: any, orderedRows: string[], rowCount: number }
 * @param getQueryResponse getQuery Response object (e.g. imported from test/data/mixtures-getQuery.json)
 */
export const makeTestData = (getQueryResponse): RowsResponse => {
    const { key, messages, models, orderedModels, rowCount } = parseQueryResponse(getQueryResponse);

    return {
        messages: messages.toJS(),
        orderedRows: orderedModels[key].toArray(),
        rowCount,
        rows: models[key],
    };
};

export function registerDefaultURLMappers(): void {
    URLService.registerURLMappers(
        ...URL_MAPPERS.ASSAY_MAPPERS,
        ...URL_MAPPERS.DATA_CLASS_MAPPERS,
        ...URL_MAPPERS.SAMPLE_TYPE_MAPPERS,
        ...URL_MAPPERS.LIST_MAPPERS,
        ...URL_MAPPERS.USER_DETAILS_MAPPERS,
        URL_MAPPERS.LOOKUP_MAPPER
    );
}

/**
 * Use this to sleep in the tests. If you make your test methods async you can use "await sleep();" to put your thread
 * to sleep temporarily which will allow async actions in your component to continue.
 * @param ms the amount of time (in ms) to sleep
 */
export const sleep = (ms = 0): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

// FIXME: This should be refactored as a React component
export const wrapDraggable = element => {
    return (
        // eslint-disable-next-line react/jsx-no-bind,no-empty-function
        <DragDropContext onDragEnd={() => {}}>
            <Droppable droppableId="jest-test-droppable">
                {provided => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        {element}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};
