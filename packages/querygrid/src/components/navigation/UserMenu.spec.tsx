/*
 * Copyright (c) 2019 LabKey Corporation
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
import React from 'reactn';
import { List } from 'immutable';
import renderer from 'react-test-renderer';
import { User } from '@glass/base';

import { UserMenu } from './UserMenu';
import { MenuSectionModel, ProductMenuModel } from './model';

beforeAll(() => {
    LABKEY.devMode = false;
});

describe("UserMenu", () => {
    let sections = List<MenuSectionModel>().asMutable();
    sections.push( MenuSectionModel.create({
        key: "user",
        label: "Your Items",
        url: undefined,
        items: [
            {
                key: "profile",
                label: "Profile",
                url: "profile/link/here",
                requiresLogin: true
            },
            {
                key: "docs",
                label: "Documentation",
                url: "http://show/me/the/docs",
                requiresLogin: false
            }
        ]
    }));

    test("not initialized", () => {
        const model = new ProductMenuModel({
            productId: "testProduct"
        });
        const tree = renderer.create(<UserMenu model={model} user={new User()} showSwitchToLabKey={true}/>).toJSON();
        expect(tree).toBe(null);
    });

    test("user not logged in", () => {
        const productId = "notLoggedInUser";
        const user = new User( {
            isSignedIn: false
        });

        const model = new ProductMenuModel(
            {
                isLoaded: true,
                isLoading: false,
                productId,
                sections: sections.asImmutable()
            }
        );
        const tree = renderer.create(<UserMenu model={model} user={user} showSwitchToLabKey={true}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("user logged in, but not in dev mode", () => {
        const productId = "loggedInUser";
        const user = new User( {
            isSignedIn: true
        });

        const model = new ProductMenuModel(
            {
                isLoaded: true,
                isLoading: false,
                productId,
                sections: sections.asImmutable()
            }
        );
        const tree = renderer.create(<UserMenu model={model} user={user} showSwitchToLabKey={true}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("user logged in dev mode", () => {
        const productId = "logginedInDevMode";
        const user = new User( {
            isSignedIn: true
        });
        LABKEY.devMode = true;
        const model = new ProductMenuModel(
            {
                isLoaded: true,
                isLoading: false,
                productId,
                sections: sections.asImmutable()
            }
        );
        const tree = renderer.create(<UserMenu model={model} user={user} showSwitchToLabKey={true}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("user logged in extra items", () => {
        const productId = "extraUserItems";
        const user = new User( {
            isSignedIn: true
        });

        const model = new ProductMenuModel(
            {
                isLoaded: true,
                isLoading: false,
                productId,
                sections: sections.asImmutable()
            }
        );
        let extraUserItems = [
            <div key="e1">Extra One</div>,
            <div key="e2">Extra Two</div>
        ];
        const tree = renderer.create(<UserMenu model={model} user={user} showSwitchToLabKey={true} extraUserItems={extraUserItems}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("user logged in, without switch to labkey", () => {
        const productId = "switchToLabkey";
        const user = new User( {
            isSignedIn: true
        });

        const model = new ProductMenuModel(
            {
                isLoaded: true,
                isLoading: false,
                productId,
                sections: sections.asImmutable()
            }
        );
        const tree = renderer.create(<UserMenu model={model} user={user} showSwitchToLabKey={false}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("user logged in extra dev mode items", () => {
        const productId = "extraDevItems";
        const user = new User( {
            isSignedIn: true
        });

        const model = new ProductMenuModel(

            {
                isLoaded: true,
                isLoading: false,
                productId,
                sections: sections.asImmutable()
            }
        );
        let extraUserItems = [
            <div key="e1">Extra One</div>,
            <div key="e2">Extra Two</div>
        ];
        let extraDevItems = [
            <div key="e1">Extra Dev One</div>,
            <div key="e2">Extra Dev Two</div>
        ];
        const tree = renderer.create(<UserMenu model={model} user={user} showSwitchToLabKey={true} extraUserItems={extraUserItems} extraDevItems={extraDevItems}/>).toJSON();
        expect(tree).toMatchSnapshot();
    })
});