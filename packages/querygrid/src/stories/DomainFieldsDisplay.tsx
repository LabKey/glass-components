/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { text, withKnobs } from '@storybook/addon-knobs'

import { DomainFieldsDisplay } from "../components/domainproperties/DomainFieldsDisplay"
import { DomainDesign } from "../components/domainproperties/models";
import data from "../test/data/property-getDomain.json";
import '../../../domainproperties/src/stories/stories.scss'

storiesOf("DomainFieldsDisplay", module)
    .addDecorator(withKnobs)
    .add("with empty domain", () => {
        const domain = new DomainDesign();

        return (
            <DomainFieldsDisplay
                title="Empty Domain Properties Example"
                domain={domain}
            />
        )
    })
    .add("with knobs", () => {
        const domain = new DomainDesign(data);

        return (
            <DomainFieldsDisplay
                title={text('Title', 'Study Properties')}
                domain={domain}
            />
        )
    });