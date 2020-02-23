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
import React from 'react';
import { storiesOf } from '@storybook/react';

import './stories.scss';
import { EntityDeleteConfirmModal } from '..';
import { text, withKnobs } from '@storybook/addon-knobs';
import { SampleTypeDataType } from '../components/entities/constants';

storiesOf('EntityDeleteConfirmModal', module)
    .addDecorator(withKnobs)
    .add("Error getting data", () => {
        return <EntityDeleteConfirmModal
            selectionKey={'nonesuch'}
            onConfirm={() => console.log('confirm')}
            onCancel={() => console.log('cancel')}
            entityDataType={SampleTypeDataType}
            nounSingular={text("Singular Noun", "sample")}
            nounPlural={text("Plural Noun", "samples")}
            dependencyText={text("Dependency text", "dependents")}
            helpLinkTopic={text("Help link topic", "help")}
        />
    })
    .add("Cannot delete any", () => {
        return <EntityDeleteConfirmModal
            selectionKey={'deleteNone'}
            onConfirm={() => console.log('confirm')}
            onCancel={() => console.log('cancel')}
            entityDataType={SampleTypeDataType}
            nounSingular={text("Singular Noun", "sample")}
            nounPlural={text("Plural Noun", "samples")}
            dependencyText={text("Dependency text", "dependents and obligations")}
            helpLinkTopic={text("Help link topic", "help")}
            />
    })
    .add("Can delete one", () => {
        return <EntityDeleteConfirmModal
            selectionKey={'deleteOne'}
            onConfirm={() => console.log('confirm')}
            onCancel={() => console.log('cancel')}
            entityDataType={SampleTypeDataType}
            nounSingular={text("Singular Noun", "sample")}
            nounPlural={text("Plural Noun", "samples")}
            dependencyText={text("Dependency text", "dependents")}
            helpLinkTopic={text("Help link topic", "help")}
        />
    })
    .add("Can delete all", () => {
        return <EntityDeleteConfirmModal
            selectionKey={'deleteAll'}
            onConfirm={() => console.log('confirm')}
            onCancel={() => console.log('cancel')}
            entityDataType={SampleTypeDataType}
            nounSingular={text("Singular Noun", "sample")}
            nounPlural={text("Plural Noun", "samples")}
            dependencyText={text("Dependency text", "dependents")}
            helpLinkTopic={text("Help link topic", "help")}
        />
    })
    .add("Can delete some", () => {
        return <EntityDeleteConfirmModal
            selectionKey={'deleteSome'}
            onConfirm={() => console.log('confirm')}
            onCancel={() => console.log('cancel')}
            entityDataType={SampleTypeDataType}
            nounSingular={text("Singular Noun", "sample")}
            nounPlural={text("Plural Noun", "samples")}
            dependencyText={text("Dependency text", "dependents")}
            helpLinkTopic={text("Help link topic", "help")}
        />
    })
;
