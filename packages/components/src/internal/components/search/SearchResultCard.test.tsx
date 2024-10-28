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
import { render } from '@testing-library/react';

import { SearchResultCard } from './SearchResultCard';

describe('<SearchResultCard/>', () => {
    test('default', () => {
        const summary = 'Card Summary';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
        };
        render(<SearchResultCard cardData={cardData} summary="Card Summary" url="#card" isTopResult={false} />);

        // When there is no category or typeName the first card detail will be the summary
        expect(document.querySelectorAll('.search-result__summary')[0].textContent).toEqual(summary);
        expect(document.querySelector('img').getAttribute('src')).toBe('/labkey/_images/testsource.svg');
    });

    test('category', () => {
        const category = 'My Category';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
            category,
        };
        render(<SearchResultCard cardData={cardData} summary="Card Summary" url="#card" isTopResult={false} />);

        expect(document.querySelector('.status-pill').textContent).toEqual(category);
    });

    test('typeName', () => {
        const typeName = 'My Type';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
            typeName,
        };
        const wrapper = render(
            <SearchResultCard cardData={cardData} summary="Card Summary" url="#card" isTopResult={false} />
        );

        expect(document.querySelector('.status-pill').textContent).toEqual(typeName);
        expect(document.querySelectorAll('.folder-field_archived-tag')).toHaveLength(0);
    });

    test('archived', () => {
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
            category: 'samples',
        };
        const wrapper = render(
            <SearchResultCard
                cardData={cardData}
                summary="Card Summary"
                url="#card"
                isTopResult={false}
                archived={true}
            />
        );

        expect(document.querySelectorAll('.folder-field_archived-tag')).toHaveLength(1);
    });

    test('iconDir', () => {
        const iconUrl = '/url/for/icon.png';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
            iconDir: 'test/dir',
        };
        const wrapper = render(
            <SearchResultCard cardData={cardData} summary="Card Summary" url="#card" isTopResult={false} />
        );
        expect(document.querySelector('img').getAttribute('src')).toBe('/labkey/test/dir/testsource.svg');
    });

    test('iconUrl', () => {
        const iconUrl = '/url/for/icon.png';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
            iconDir: 'test/dir',
        };
        const wrapper = render(
            <SearchResultCard
                cardData={cardData}
                summary="Card Summary"
                url="#card"
                isTopResult={false}
                iconUrl={iconUrl}
            />
        );
        expect(document.querySelector('img').getAttribute('src')).toBe(iconUrl);
    });

    test('no summary', () => {
        render(<SearchResultCard cardData={{}} summary={undefined} url="#card" isTopResult={false} />);
        expect(document.querySelector('.search-result__summary').textContent).toEqual('No summary provided');
    });

    test('summary empty', () => {
        render(<SearchResultCard cardData={{}} summary="" url="#card" isTopResult={false} />);

        expect(document.querySelector('.search-result__summary').textContent).toEqual('No summary provided');
    });

    test('none empty summary', () => {
        const shortSummary = 'Short summary';
        const longSummary = 'This is a very long summary it should get truncated at some point';
        render(<SearchResultCard cardData={{}} summary={shortSummary} url="#card" isTopResult={false} />);

        expect(document.querySelector('.search-result__summary').textContent).toEqual(shortSummary);
    });

    test('long summary', () => {
        const longSummary = 'This is a very long summary it should get truncated at some point';
        render(<SearchResultCard cardData={{}} summary={longSummary} url="#card" isTopResult={false} />);

        // Long summary should get truncated
        expect(document.querySelector('.search-result__summary').textContent).toEqual(longSummary);
    });
});
