/*
 * Copyright (c) 2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { createContext, PropsWithChildren, ReactElement, useContext, useMemo } from 'react';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from './APIWrapper';

export interface NavigationSettings {
    showCurrentContainer: boolean;
}

export interface AppContext {
    api?: ComponentsAPIWrapper;
    navigation?: NavigationSettings;
}

export type ExtendableAppContext<T> = T & AppContext;

// The "any" used here should be fine, it gets re-typed in useAppContext, so as long as you're using that and providing
// a type (e.g. useAppContext<MyAppContextType>()) you'll be fine.
const Context = createContext<ExtendableAppContext<any>>(undefined);

export interface AppContextProviderProps<T> {
    initialContext?: ExtendableAppContext<T>;
}

/**
 * AppContextProvider is a generic, where the type T is a type that extends AppContext. This allows consuming
 * applications to add their own custom attributes to the AppContext. There are a few general rules to follow when
 * adding new properties to the AppContext:
 *   - Be judicious when adding something to the AppContext, only add something when you really need it accessible all
 *     over your app, at any level in the React Component tree
 *   - AppContext is not mutable by design, this is where static app-level pieces of configuration should live, the
 *     AppContext state should never change during runtime
 *   - If it needs to be accessed by anything in ui-components, then it should live on the AppContext in above
 *   - If it is app specific, then it should live on the Type (T) that you pass to this component
 *   - If it is app specific, and it's accessed by something in ui-components, then consider changing the design of
 *       of your components so they do not depend on something app specific, or have them take an equivalent prop
 *       that you pass to the component from your context aware app (feel free ask someone for help with this type
 *       of design)
 */
export function AppContextProvider<T>({
    children,
    initialContext,
}: PropsWithChildren<AppContextProviderProps<T>>): ReactElement {
    const value = useMemo<AppContext>(
        () => ({
            // Provide a default API so that external users don't have to specify it
            api: getDefaultAPIWrapper(),
            // By default we don't show the container in SubNav, but apps can override this
            navigation: { showCurrentContainer: false },
            ...initialContext,
        }),
        [initialContext]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
}

/**
 * To use the AppContext provided by a AppContextProvider, use this convenient hook. If you find yourself constantly
 * grabbing the same attribute or two from useAppContext it may be convenient to create a wrapper around this hook
 * that grabs only what you need, this is most helpful for our packages like Workflow.
 */
export function useAppContext<T>(): ExtendableAppContext<T> {
    const context = useContext<ExtendableAppContext<T>>(Context);
    if (context === undefined) {
        throw new Error('useAppContext must be used within a AppContext.Provider');
    }
    return context;
}
