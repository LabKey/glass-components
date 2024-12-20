import { useEffect, useState } from 'react';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { useAppContext } from '../../AppContext';
import { applyPermissions, useServerContext } from '../base/ServerContext';
import { Container } from '../base/models/Container';
import { User } from '../base/models/User';
import { resolveErrorMessage } from '../../util/messaging';
import { FetchContainerOptions } from '../security/APIWrapper';

export interface ContainerUser {
    container: Container;
    containerUsers?: { [key: string]: ContainerUser };
    user: User;
}

export interface UseContainerUser extends ContainerUser {
    error: string;
    isLoaded: boolean;
}

export type UseContainerUserOptions = Omit<FetchContainerOptions, 'containerPath'>;

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
    const { user } = useServerContext();

    useEffect(() => {
        if (!containerIdOrPath) return;

        (async () => {
            setError(undefined);
            setLoadingState(LoadingState.LOADING);

            try {
                const containers = await api.security.fetchContainers({
                    includeStandardProperties: false,
                    includeSubfolders: false,
                    ...options,
                    containerPath: containerIdOrPath,
                });

                const containerUsers_ = containers.reduce<Record<string, ContainerUser>>((cu, c, i) => {
                    const u = applyPermissions(c, user);

                    if (i === 0) {
                        cu[containerIdOrPath] = { container: c, user: u };
                    }

                    cu[c.path] = { container: c, user: u };
                    return cu;
                }, {});

                setContainerUsers(containerUsers_);
            } catch (e) {
                setError(resolveErrorMessage(e));
            }

            setLoadingState(LoadingState.LOADED);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- ignore options
    }, [api, containerIdOrPath, user]);

    return {
        container: containerUsers[containerIdOrPath]?.container,
        containerUsers,
        error,
        isLoaded: !isLoading(loadingState),
        user: containerUsers[containerIdOrPath]?.user,
    };
}
