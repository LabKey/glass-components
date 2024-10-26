import { List, fromJS } from 'immutable';
import React from 'react';
import { render } from '@testing-library/react';

import { QueryColumn } from '../../../../public/QueryColumn';

import { MultiValueRenderer } from '../../../renderers/MultiValueRenderer';
import { AliasRenderer } from '../../../renderers/AliasRenderer';
import { AppendUnits } from '../../../renderers/AppendUnits';
import { AssayRunReferenceRenderer } from '../../../renderers/AssayRunReferenceRenderer';
import { LabelColorRenderer } from '../../../renderers/LabelColorRenderer';
import { FileColumnRenderer } from '../../../renderers/FileColumnRenderer';

import { DetailDisplay, resolveDetailRenderer, defaultTitleRenderer, Renderer } from './DetailDisplay';

describe('DetailDisplay', () => {
    const namePatternCol = new QueryColumn({
        align: 'left',
        caption: 'Naming Pattern',
        conceptURI: null,
        defaultValue: null,
        dimension: false,
        fieldKey: 'NameExpression',
        fieldKeyArray: ['NameExpression'],
        filterable: true,
        hidden: true,
        inputType: 'textarea',
        isKeyField: false,
        jsonType: 'string',
        measure: false,
        multiValue: false,
        name: 'NameExpression',
        phiProtected: false,
        rangeURI: null,
        readOnly: false,
        required: false,
        shortCaption: 'Naming Pattern',
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
        derivationDataScope: null,
    });

    const aliquotNamePatternCol = new QueryColumn({
        align: 'left',
        caption: 'Aliquot Naming Pattern',
        conceptURI: null,
        defaultValue: null,
        dimension: false,
        fieldKey: 'AliquotNameExpression',
        fieldKeyArray: ['AliquotNameExpression'],
        filterable: true,
        hidden: true,
        inputType: 'text',
        isKeyField: false,
        jsonType: 'string',
        measure: false,
        multiValue: false,
        name: 'AliquotNameExpression',
        phiProtected: false,
        rangeURI: null,
        readOnly: false,
        required: false,
        shortCaption: 'Aliquot Naming Pattern',
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
        derivationDataScope: null,
    });

    const metricCol = new QueryColumn({
        align: 'left',
        caption: 'Metric Unit',
        conceptURI: null,
        defaultValue: null,
        dimension: false,
        fieldKey: 'MetricUnit',
        fieldKeyArray: ['MetricUnit'],
        filterable: true,
        hidden: true,
        inputType: 'text',
        isKeyField: false,
        jsonType: 'string',
        measure: false,
        multiValue: false,
        name: 'MetricUnit',
        phiProtected: false,
        rangeURI: null,
        readOnly: false,
        required: false,
        shortCaption: 'Metric Unit',
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
        derivationDataScope: null,
    });

    test('with fieldHelpTexts', () => {
        const cols = List.of(namePatternCol, aliquotNamePatternCol, metricCol);

        const fieldHelpText = {
            nameexpression: 'Example name that will be generated from the current pattern: S-1001',
            aliquotnameexpression: 'Example aliquot name that will be generated from the current pattern: Sample112.1',
        };

        const data = [
            fromJS({
                NameExpression: {
                    value: 'S-${genId}',
                },
                AliquotNameExpression: {
                    value: '${${AliquotedFrom}.:withCounter}',
                },
                metricCol: {
                    value: 'mL',
                },
            }),
        ];

        render(
            <DetailDisplay
                asPanel={true}
                editingMode={false}
                data={data}
                displayColumns={cols}
                fieldHelpTexts={fieldHelpText}
            />
        );

        expect(document.querySelectorAll('tr')).toHaveLength(3);
        expect(document.querySelectorAll('.label-help-target')).toHaveLength(2);
    });
});

describe('defaultTitleRenderer', () => {
    test('editable', () => {
        const col = new QueryColumn({
            caption: 'test',
            readOnly: false,
            userEditable: true,
            shownInUpdateView: true,
            required: true,
        });
        render(<div>{defaultTitleRenderer(col)}</div>);
        expect(document.querySelector('span').innerHTML).toEqual(
            'test&nbsp;<span class="required-symbol">* </span><div class="overlay-trigger"><i class="fa fa-question-circle"></i></div>'
        );
    });

    test('not editable', () => {
        const col = new QueryColumn({
            caption: 'test',
            readOnly: false,
            userEditable: true,
            shownInUpdateView: false,
            required: true,
        });
        render(<div>{defaultTitleRenderer(col)}</div>);
        expect(document.querySelector('span').innerHTML).toEqual('test');
    });
});

describe('resolveDetailRenderer', () => {
    function validate(renderer: Renderer, count: Record<string, number>): void {
        expect(renderer.toString().indexOf('MultiValueRenderer') > -1).toEqual(!!count['multivaluedetailrenderer']);
        expect(renderer.toString().indexOf('AliasRenderer') > -1).toEqual(!!count['aliasrenderer']);
        expect(renderer.toString().indexOf('AppendUnits') > -1).toEqual(!!count['appendunits']);
        expect(renderer.toString().indexOf('AssayRunReferenceRenderer') > -1).toEqual(!!count['assayrunreference']);
        expect(renderer.toString().indexOf('LabelColorRenderer') > -1).toEqual(!!count['labelcolorrenderer']);
        expect(renderer.toString().indexOf('FileColumnRenderer') > -1).toEqual(!!count['filecolumnrenderer']);
        expect(renderer.toString().indexOf('FolderColumnRenderer') > -1).toEqual(!!count['foldercolumnrenderer']);
    }

    test('multivaluedetailrenderer', () => {
        const renderer = resolveDetailRenderer(new QueryColumn({ detailRenderer: 'MultiValueDetailRenderer' }));
        validate(renderer, { multivaluedetailrenderer: 1 });
    });

    test('aliasrenderer', () => {
        const renderer = resolveDetailRenderer(new QueryColumn({ detailRenderer: 'AliasRenderer' }));
        validate(renderer, { aliasrenderer: 1 });
    });

    test('appendunits', () => {
        const renderer = resolveDetailRenderer(new QueryColumn({ detailRenderer: 'AppendUnits' }));
        validate(renderer, { appendunits: 1 });
    });

    test('assayrunreference', () => {
        const renderer = resolveDetailRenderer(new QueryColumn({ detailRenderer: 'AssayRunReference' }));
        validate(renderer, { assayrunreference: 1 });
    });

    test('labelcolorrenderer', () => {
        const renderer = resolveDetailRenderer(new QueryColumn({ detailRenderer: 'LabelColorRenderer' }));
        validate(renderer, { labelcolorrenderer: 1 });
    });

    test('filecolumnrenderer', () => {
        const renderer = resolveDetailRenderer(new QueryColumn({ detailRenderer: 'FileColumnRenderer' }));
        validate(renderer, { filecolumnrenderer: 1 });
    });

    test('sampletypeimportaliasrenderer', () => {
        const renderer = resolveDetailRenderer(new QueryColumn({ detailRenderer: 'SampleTypeImportAliasRenderer' }));
        validate(renderer, { aliasrenderer: 1 });
    });

    test('sourcetypeimportaliasrenderer', () => {
        const renderer = resolveDetailRenderer(new QueryColumn({ detailRenderer: 'SourceTypeImportAliasRenderer' }));
        validate(renderer, { aliasrenderer: 1 });
    });

    test('expirationdatecolumnrenderer', () => {
        const renderer = resolveDetailRenderer(new QueryColumn({ detailRenderer: 'ExpirationDateColumnRenderer' }));
        validate(renderer, { expirationdatecolumnrenderer: 1 });
    });

    test('foldercolumnrenderer', () => {
        const renderer = resolveDetailRenderer(new QueryColumn({ detailRenderer: 'FolderColumnRenderer' }));
        validate(renderer, { foldercolumnrenderer: 1 });
    });

    test('bogus renderer', () => {
        expect(resolveDetailRenderer(new QueryColumn({ detailRenderer: 'BogusRenderer' }))).toBeUndefined();
    });

    test('without detailRenderer prop', () => {
        expect(resolveDetailRenderer(new QueryColumn({ detailRenderer: undefined }))).toBeUndefined();
    });
});
