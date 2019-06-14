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
import React from 'reactn'
import { QueryGridModel } from '@glass/base'

import { ChartSelector } from '../chart/ChartSelector'
import { Export } from './Export'
import { QueryGridPaging } from './QueryGridPaging'
import { ViewSelector } from "./ViewSelector";
import { URLBox } from './URLBox'
import { GridSelectionBanner } from "./GridSelectionBanner";

const layouts = {
    NO_BUTTONS: {
        LEFT: false,
        CENTER: 'col-sm-8 col-md-8',
        RIGHT: 'col-sm-4 col-md-4',
        MED_SM_LEFT: false,
        MED_SM_CENTER: 'col-xs-12',
        MED_SM_RIGHT: 'col-xs-12'
    },
    STANDARD: {
        LEFT: 'col-sm-4 col-md-4',
        CENTER: 'col-sm-4 col-md-4',
        RIGHT: 'col-sm-4 col-md-4',
        MED_SM_LEFT: 'col-md-7 col-sm-6 col-xs-12',
        MED_SM_CENTER: 'col-md-12 col-xs-12',
        MED_SM_RIGHT: 'col-md-5 col-sm-6 col-xs-12'
    }
};

type QueryGridBarButtonResolver = (model?: QueryGridModel) => React.ReactNode;
export type QueryGridBarButtons = React.ReactNode | QueryGridBarButtonResolver;

interface QueryGridBarProps {
    buttons?: QueryGridBarButtons
    model: QueryGridModel
}

/**
 * Displays a bar of controls for a query grid based on the properties of the provided model.
 * This includes
 * - a URLBox for use in filtering and sorting (based on model.showSearchBox),
 * - a paging element (based on model.isPaged)
 * - an export menu (always)
 * - a chart selector (based on model.showChartSelector)
 * - a view selector (based on model.showViewSelector)
 * You may also provide a set of buttons to be displayed within the bar.
 */
export class QueryGridBar extends React.Component<QueryGridBarProps, any> {

    render() {
        const { buttons, model } = this.props;

        const box = model && model.showSearchBox ? (
            <URLBox
                key={model.getId()}
                queryModel={model}/>
        ) : null;

        const paging = model && model.isPaged ? (
            <QueryGridPaging model={model}/>
        ) : null;

        const exportBtn = model ? (
            <Export model={model}/>
        ) : null;

        const chart = model && model.showChartSelector ? (
            <ChartSelector model={model}/>
        ) : null;

        const view = model && model.showViewSelector ? (
            <ViewSelector model={model}/>
        ) : null;

        const rightContent = (
            <div className="paging pull-right text-nowrap">
                {paging}
                {exportBtn != null ? (
                    <span style={{paddingLeft: '10px'}}>
                        {exportBtn}
                    </span>
                ) : null}
                {view !== null ? (
                    <span style={{paddingLeft: '10px'}}>
                        {view}
                    </span>
                ) : null}
            </div>
        );

        const layout = buttons || chart ? layouts.STANDARD : layouts.NO_BUTTONS;
        const buttonsNode = typeof buttons === 'function' ? (buttons as QueryGridBarButtonResolver)(model) : buttons;

        const selectionDetails = <GridSelectionBanner containerCls="QueryGrid-bottom-spacing" model={model}/>;

        return (
            <div>
                {/* On most layouts, render side-by-side */}
                <div className="hidden-md hidden-xs hidden-sm">
                    <div className="row QueryGrid-bottom-spacing">
                        {layout.LEFT && (
                            <div className={layout.LEFT + ''}>
                                <div className="btn-group">
                                    {buttonsNode}
                                </div>
                                {chart !== null ? (
                                    <span style={buttonsNode ? {paddingLeft: '10px'} : {}}>
                                        {chart}
                                    </span>
                                ) : null}
                            </div>
                        )}
                        <div className={layout.CENTER}>
                            {box}
                        </div>
                        <div className={layout.RIGHT}>
                            {rightContent}
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12">
                            {selectionDetails}
                        </div>
                    </div>
                </div>

                {/* On medium and x-small layout, render two rows */}
                <div className="visible-md visible-xs visible-sm">
                    <div className="row QueryGrid-bottom-spacing">
                        {layout.MED_SM_LEFT && (
                            <div className={layout.MED_SM_LEFT + ''}>
                                <div className="btn-group">
                                    {buttonsNode}
                                </div>
                                {chart !== null ? (
                                    <span style={buttonsNode ? {paddingLeft: '10px'} : {}}>
                                        {chart}
                                    </span>
                                ) : null}
                            </div>
                        )}
                        <div className={layout.MED_SM_RIGHT}>
                            {rightContent}
                        </div>
                    </div>
                    <div className="row QueryGrid-bottom-spacing">
                        <div className={layout.MED_SM_CENTER}>
                            {box}
                        </div>
                    </div>
                    <div className="row">
                        <div className={layout.MED_SM_CENTER}>
                            {selectionDetails}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}