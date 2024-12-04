import React, { FC, memo, MutableRefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { getServerContext, PermissionTypes, Security } from '@labkey/api';

import classNames from 'classnames';

import { LKS_PRODUCT_ID } from '../../app/constants';
import { hasPremiumModule } from '../../app/utils';

import { naturalSortByProperty } from '../../../public/sort';

import { Alert } from '../base/Alert';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { getContainerTabs, getRegisteredProducts } from './actions';
import { ADMIN_LOOK_AND_FEEL_URL, PRODUCT_SERVICES_URL } from './constants';
import { ContainerTabModel, ProductModel } from './models';
import { ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductSectionsDrawer } from './ProductSectionsDrawer';
import { ProductLKSDrawer } from './ProductLKSDrawer';
import { ProductNavigationHeader } from './ProductNavigationHeader';

interface ProductNavigationMenuProps {
    disableLKSContainerLink?: boolean;
    onCloseMenu?: () => void;
    menuRef: MutableRefObject<HTMLDivElement>;
}

export const ProductNavigationMenu: FC<ProductNavigationMenuProps> = memo(props => {
    const { disableLKSContainerLink } = props;
    const { homeContainer } = getServerContext();
    const [error, setError] = useState<string>();
    const [products, setProducts] = useState<ProductModel[]>(); // the array of products that have been registered for this LK server
    const [tabs, setTabs] = useState<ContainerTabModel[]>(); // the array of container tabs for the current LK container
    const [selectedProductId, setSelectedProductId] = useState<string>();
    const [homeVisible, setHomeVisible] = useState<boolean>(false); // is home project visible to this user.

    const onSelection = useCallback(
        (productId: string) => {
            setSelectedProductId(productId);
        },
        [setSelectedProductId]
    );

    useEffect(() => {
        getRegisteredProducts().then(setProducts).catch(setError);

        Security.getContainers({
            container: homeContainer,
            includeSubfolders: false,
            includeEffectivePermissions: true,
            success: data => {
                setHomeVisible(data.effectivePermissions?.indexOf(PermissionTypes.Read) > -1);
            },
            failure: errorInfo => {
                console.error(errorInfo);
                setError('Error: unable to get LabKey folder information.');
            },
        });

        getContainerTabs().then(setTabs).catch(setError);
    }, []);

    return (
        <ProductNavigationMenuImpl
            disableLKSContainerLink={disableLKSContainerLink}
            error={error}
            homeVisible={homeVisible}
            onCloseMenu={props.onCloseMenu}
            onSelection={onSelection}
            menuRef={props.menuRef}
            products={products?.sort(naturalSortByProperty('productName'))}
            selectedProductId={selectedProductId}
            tabs={tabs}
        />
    );
});

interface ProductNavigationMenuImplProps extends ProductNavigationMenuProps {
    disableLKSContainerLink: boolean;
    error: string;
    homeVisible: boolean;
    onSelection: (productId: string) => void;
    products: ProductModel[];
    selectedProductId: string;
    tabs: ContainerTabModel[];
}

// exported for jest testing
export const ProductNavigationMenuImpl: FC<ProductNavigationMenuImplProps> = memo(props => {
    const { error, products, homeVisible, disableLKSContainerLink, tabs, onCloseMenu, selectedProductId, onSelection } =
        props;

    const selectedProduct = getSelectedProduct(products, selectedProductId);
    const showProductDrawer = selectedProductId === undefined;
    const showLKSDrawer = selectedProductId === LKS_PRODUCT_ID;
    const showSectionsDrawer = selectedProduct !== undefined;
    const { user } = getServerContext();
    const showMenuSettings = useMemo(() => {
        return hasPremiumModule() && user.isRootAdmin;
    }, [user]);
    const className = classNames('product-navigation-container', 'navbar-menu__content', { wider: showProductDrawer });
    const onHeaderClick = useCallback(() => onSelection(undefined), [onSelection]);
    const loading = !products || !tabs;

    return (
        <div className={className} ref={props.menuRef}>
            <ProductNavigationHeader
                productId={selectedProductId}
                onClick={onHeaderClick}
                title={selectedProduct?.productName}
            />

            {loading && <LoadingSpinner wrapperClassName="product-navigation-loading-item" />}

            {error && <Alert>{error}</Alert>}

            {!loading && !error && (
                <ul className="product-navigation-listing">
                    {showProductDrawer && <ProductAppsDrawer products={products} onClick={onSelection} />}
                    {showLKSDrawer && (
                        <ProductLKSDrawer
                            disableLKSContainerLink={disableLKSContainerLink}
                            showHome={homeVisible}
                            tabs={tabs}
                        />
                    )}
                    {showSectionsDrawer && (
                        <ProductSectionsDrawer product={selectedProduct} onCloseMenu={onCloseMenu} />
                    )}
                </ul>
            )}

            {selectedProductId === undefined && (
                <div className="product-navigation-footer">
                    {showMenuSettings && (
                        <div className="bottom-padding-less">
                            <a href={ADMIN_LOOK_AND_FEEL_URL} target="_blank" rel="noopener noreferrer">
                                Menu Settings
                            </a>
                        </div>
                    )}
                    <div>
                        <a href={PRODUCT_SERVICES_URL} target="_blank" rel="noopener noreferrer">
                            More LabKey Solutions
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
});

// exported for jest testing
export function getSelectedProduct(products: ProductModel[], productId: string): ProductModel {
    return products?.find(product => product.productId === productId);
}
