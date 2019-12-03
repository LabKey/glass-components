/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { List } from 'immutable'
import { Security } from '@labkey/api'
import { PermissionsProviderProps, Principal } from "./models";
import { LoadingPage } from "../../components/base/LoadingPage";
import { getPrincipals, getPrincipalsById, getRolesByUniqueName, processGetRolesResponse } from "./actions";

const Context = React.createContext<PermissionsProviderProps>(undefined);
const PermissionsContextProvider = Context.Provider;
export const PermissionsContextConsumer = Context.Consumer;

type Props = PermissionsProviderProps;

interface State extends PermissionsProviderProps {}

export const PermissionsPageContextProvider = <P extends PermissionsProviderProps>(Component: React.ComponentType<P>) => {

    class PermissionsProviderImpl extends React.Component<Props, State> {

        constructor(props: Props) {
            super(props);

            this.state = {
                roles: undefined,
                rolesByUniqueName: undefined,
                principals: undefined,
                principalsById: undefined,
                error: undefined
            };
        }

        componentDidMount() {
            this.loadSecurityRoles();
            this.loadPrincipals();
        }

        loadSecurityRoles() {
            Security.getRoles({
                success: (response: any) => {
                    const roles = processGetRolesResponse(response);
                    const rolesByUniqueName = getRolesByUniqueName(roles);
                    this.setState(() => ({roles, rolesByUniqueName}));
                },
                failure: (response) => {
                    this.setState(() => ({error: response.exception}));
                }
            });
        }

        loadPrincipals() {
            getPrincipals()
                .then((principals: List<Principal>) => {
                    const principalsById = getPrincipalsById(principals);
                    this.setState(() => ({principals, principalsById}));
                }).catch((response) => {
                    this.setState(() => ({error: response.message}));
                });
        }

        render() {
            const isLoaded = (this.state.roles && this.state.principals) || this.state.error;

            if (isLoaded) {
                return (
                    <PermissionsContextProvider value={this.state}>
                        <Component {...this.props} {...this.state}/>
                    </PermissionsContextProvider>
                );
            }
            else {
                return <LoadingPage/>;
            }
        }
    }

    return PermissionsProviderImpl;
};
