import { fromJS } from 'immutable';

import { FILELINK_RANGE_URI } from '../components/domainproperties/constants';

import { getAttachmentCardProp, getAttachmentTitleFromName } from './FileColumnRenderer';
import { AttachmentCardProps, IAttachment } from './AttachmentCard';
import { TEST_BIO_LIMS_STARTER_MODULE_CONTEXT, TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT } from '../productFixtures';

const DEFAULT_DATA = fromJS({ url: 'testurl', value: 'test.txt', displayValue: 'Test.txt' });

describe('getAttachmentCardProp', () => {
    function validate(
        results: AttachmentCardProps,
        hasCard = true,
        noun = 'attachment',
        allowRemove = false,
        imageURL?: string,
        attachment?: IAttachment
    ): void {
        if (!hasCard) expect(results).toBe(null);
        if (hasCard) {
            expect(results.noun).toBe(noun);
            expect(results.imageURL).toBe(imageURL);
            expect(results.allowRemove).toBe(allowRemove);

            if (attachment) {
                expect(results.attachment.name).toBe(attachment.name);
                expect(results.attachment.title).toBe(attachment.title);
                expect(results.attachment.iconFontCls).toBe(attachment.iconFontCls);
                expect(results.attachment.unavailable).toBe(attachment.unavailable);
            }
        }
    }

    test('no data', () => {
        validate(getAttachmentCardProp(null), false);
    });

    test('no name', () => {
        const data = { url: 'test' };
        validate(getAttachmentCardProp(fromJS(data)), false);
        validate(getAttachmentCardProp(data), false);
    });

    test('no name', () => {
        const data = { url: 'test' };
        validate(getAttachmentCardProp(data), false, 'attachment', false, undefined, { name: '' });
        validate(getAttachmentCardProp(fromJS(data)), false, 'attachment', false, undefined, { name: '' });
    });

    test('file rangeURI', () => {
        validate(getAttachmentCardProp(DEFAULT_DATA, true), true, 'file', false, undefined, {
            name: 'Test.txt',
            title: 'Test.txt',
            iconFontCls: 'fa fa-file-text-o',
            unavailable: false,
        });

        validate(getAttachmentCardProp(DEFAULT_DATA.toJS(), true), true, 'file', false, undefined, {
            name: 'Test.txt',
            title: 'Test.txt',
            iconFontCls: 'fa fa-file-text-o',
            unavailable: false,
        });
    });

    test('file rangeURI, unavailable', () => {
        const data = { name: 'test.txt', displayValue: 'test.txt (unavailable)' };
        validate(getAttachmentCardProp(fromJS(data), true), true, 'file', false, undefined, {
            name: 'test.txt',
            title: 'test.txt',
            iconFontCls: 'fa fa-exclamation-triangle',
            unavailable: true,
        });

        validate(getAttachmentCardProp(data, true), true, 'file', false, undefined, {
            name: 'test.txt',
            title: 'test.txt',
            iconFontCls: 'fa fa-exclamation-triangle',
            unavailable: true,
        });
    });

    test('isImage', () => {
        const data = { url: 'testurl', value: 'test.png', displayValue: 'Test.png' };
        validate(getAttachmentCardProp(data), true, 'attachment', false, 'testurl', {
            name: 'Test.png',
            title: 'Test.png',
            iconFontCls: 'fa fa-file-image-o',
            unavailable: false,
        });
        validate(getAttachmentCardProp(fromJS(data)), true, 'attachment', false, 'testurl', {
            name: 'Test.png',
            title: 'Test.png',
            iconFontCls: 'fa fa-file-image-o',
            unavailable: false,
        });
    });

    test('allowRemove', () => {
        validate(getAttachmentCardProp(DEFAULT_DATA.toJS(), false, jest.fn()), true, 'attachment', true);
        validate(getAttachmentCardProp(DEFAULT_DATA, false, jest.fn()), true, 'attachment', true);
    });

    test('styling, not enabled', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT };
        const data = { url: 'testurl', value: 'test.png', displayValue: 'Test.png', style: ';font-style: italic' };
        const result = getAttachmentCardProp(data);
        expect(result.titleStyle).toBeUndefined();
    });

    test('styling, enabled', () => {
        LABKEY.moduleContext = { ...TEST_BIO_LIMS_STARTER_MODULE_CONTEXT };
        const data = { url: 'testurl', value: 'test.png', displayValue: 'Test.png', style: ';font-style: italic' };
        const result = getAttachmentCardProp(data);
        expect(result.titleStyle).toStrictEqual({ fontStyle: 'italic' });
    });
});

describe('getAttachmentTitleFromName', () => {
    test('without dir prefix', () => {
        expect(getAttachmentTitleFromName('test.tsv')).toBe('test.tsv');
    });

    test('with dir prefix', () => {
        expect(getAttachmentTitleFromName('something/test.tsv')).toBe('test.tsv');
        expect(getAttachmentTitleFromName('sampletype/test.tsv')).toBe('test.tsv');
        expect(getAttachmentTitleFromName('sampleset/test.tsv')).toBe('test.tsv');
    });

    test('with backslash dir prefix', () => {
        expect(getAttachmentTitleFromName('something\\test.tsv')).toBe('test.tsv');
        expect(getAttachmentTitleFromName('sampletype\\test.tsv')).toBe('test.tsv');
        expect(getAttachmentTitleFromName('sampleset\\test.tsv')).toBe('test.tsv');
    });
});
