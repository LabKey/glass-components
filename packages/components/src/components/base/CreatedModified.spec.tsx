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
import * as React from 'react'
import {Map, fromJS} from 'immutable'
import { mount } from 'enzyme'

import { CreatedModified } from "./CreatedModified";

const createdRow = Map<string, any>(fromJS({
   Created: {
      formattedValue: "2019-05-15 19:45",
      value: "2019-05-15 19:45:40.593"
   },
   CreatedBy: {
      displayValue: "username",
      url: "#/q/core/siteusers/1004",
      value: 1001
   }
}));

const createdModifiedRow = Map<string, any>(fromJS({
   Created: {
      formattedValue: "2019-05-15 19:45",
      value: "2019-05-15 19:45:40.593"
   },
   CreatedBy: {
      displayValue: "username",
      url: "#/q/core/siteusers/1001",
      value: 1001
   },
   Modified: {
      formattedValue: "2019-05-16 19:45",
      value: "2019-05-16 19:45:40.593"
   },
   ModifiedBy: {
      displayValue: "username2",
      url: "#/q/core/siteusers/1002",
      value: 1002
   }
}));

describe("<CreatedModified/>", () => {

   test("with created row", () => {
      const component = (<CreatedModified row={createdRow}/>);

      const wrapper = mount(component);
      expect(wrapper.text()).toContain('Created ');

      const titleAttr = wrapper.find('span').getDOMNode().getAttribute('title');
      expect(titleAttr).toContain('Created by: username');
      expect(titleAttr.indexOf('Modified')).toBe(-1);

      wrapper.unmount();
   });

   test("with modified row", () => {
      const component = (<CreatedModified row={createdModifiedRow}/>);

      const wrapper = mount(component);
      expect(wrapper.text()).toContain('Modified ');

      const titleAttr = wrapper.find('span').getDOMNode().getAttribute('title');
      expect(titleAttr).toContain('Created by: username');
      expect(titleAttr).toContain('Modified by: username2');

      wrapper.unmount();
   });

});