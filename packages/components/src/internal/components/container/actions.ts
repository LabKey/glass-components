import { useEffect, useState } from 'react';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { useAppContext } from '../../AppContext';
import { applyPermissions, useServerContext } from '../base/ServerContext';
import { Container } from '../base/models/Container';
import { User } from '../base/models/User';
import { resolveErrorMessage } from '../../util/messaging';
import { FetchContainerOptions } from '../security/APIWrapper';

export type ContainerUserMap = Record<string, ContainerUser>;

export interface ContainerUser {
    container: Container;
    containerUsers?: ContainerUserMap;
    user: User;
}

export interface UseContainerUser extends ContainerUser {
    error: string;
    isLoaded: boolean;
}

export type UseContainerUserOptions = Omit<FetchContainerOptions, 'containerPath'>;

function applyContainerUser(
    containerIdOrPath: string,
    container: Container,
    user: User,
    cu: ContainerUserMap = {},
    addIdOrPathAsKey = true
): ContainerUserMap {
    if (addIdOrPathAsKey) {
        cu[containerIdOrPath] = { container, user };
    }
    cu[container.path] = { container, user };
    return cu;
}

function identifiesContainer(containerIdOrPath: string, container: Container): boolean {
    return !!containerIdOrPath && (containerIdOrPath === container.path || containerIdOrPath === container.id);
}

/**
 * React hook that supplies the container, user, and the container-relative permissions for the user.
 * @param containerIdOrPath The container id or container path to request.
 * @param options Supply different request options for fetch containers endpoint.
 * Requests default to includeSubfolders=false, includeStandardProperties=false and includeInheritableFormats=false.
 * Example:
 * ```tsx
 * const SeeUserPermissions: React.FC = () => {
 *    // This component takes a "containerPath" as a property.
 *    const { containerPath } = props;
 *
 *    // Given the "containerPath" fetch the `container` and `user`.
 *    const { container, error, isLoaded, user } = useContainerUser(containerPath);
 *
 *    if (!isLoaded) {
 *        return <LoadingSpinner />;
 *    }
 *
 *    // Display container information and utilize user permissions in the container to control display logic.
 *    return (
 *        <div>
 *            <Alert>{error}</Alert>
 *            {!!container && (
 *                <>
 *                    <span>Folder Name: {container.name}</span>
 *                    <span>Folder Path: {container.path}</span>
 *                    {user.hasInsertPermission() && <span>{user.displayName} can insert data into {container.path}.</span>>}
 *                    {user.hasDeletePermission() && <span>{user.displayName} can delete data in {container.path}.</span>>}
 *                    {user.hasDesignSampleTypesPermission() && <span>{user.displayName} can design sample types in {container.path}.</span>>}
 *                </>
 *            )}
 *        </div>
 *    );
 * };
 * ```
 */
export function useContainerUser(containerIdOrPath: string, options?: UseContainerUserOptions): UseContainerUser {
    const [containerUsers, setContainerUsers] = useState<Record<string, ContainerUser>>({});
    const [error, setError] = useState<string>();
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const { api } = useAppContext();
    const { container, project, projectUser, user } = useServerContext();

    useEffect(() => {
        if (!containerIdOrPath) return;

        (async () => {
            setError(undefined);
            setLoadingState(LoadingState.LOADING);

            if (!options) {
                if (user && identifiesContainer(containerIdOrPath, container)) {
                    setContainerUsers(applyContainerUser(containerIdOrPath, container, user));
                    setLoadingState(LoadingState.LOADED);
                    return;
                }

                if (projectUser && identifiesContainer(containerIdOrPath, project)) {
                    setContainerUsers(applyContainerUser(containerIdOrPath, project, projectUser));
                    setLoadingState(LoadingState.LOADED);
                    return;
                }
            }

            try {
                const containers = await api.security.fetchContainers({
                    includeStandardProperties: false,
                    includeSubfolders: false,
                    ...options,
                    containerPath: containerIdOrPath,
                });

                const containerUsers_ = containers.reduce<ContainerUserMap>(
                    (cu, c, i) => applyContainerUser(containerIdOrPath, c, applyPermissions(c, user), cu, i === 0),
                    {}
                );

                setContainerUsers(containerUsers_);
            } catch (e) {
                setError(resolveErrorMessage(e));
            }

            setLoadingState(LoadingState.LOADED);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- ignore options
    }, [api, container, containerIdOrPath, project, projectUser, user]);

    return {
        container: containerUsers[containerIdOrPath]?.container,
        containerUsers,
        error,
        isLoaded: !isLoading(loadingState),
        user: containerUsers[containerIdOrPath]?.user,
    };
}
