import React, { ComponentType, PureComponent } from 'react';
import classNames from 'classnames';
import { fromJS, List } from 'immutable';
import { Alert, Grid, LoadingSpinner } from '..';
import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from './withQueryModels';
import { PaginationButtons, PaginationInfo } from './Pagination';
import { PageSizeSelector } from './PageSizeSelector';
import { ViewSelector } from './ViewSelector';

interface GridPanelProps {
    asPanel?: boolean;
    isPaged?: boolean;
    showViewSelector?: boolean;
    hideEmptyViewSelector?: boolean;
    pageSizes?: number[];
    ButtonsComponent?: ComponentType<RequiresModelAndActions>
}

type Props = GridPanelProps & RequiresModelAndActions;

export class GridPanel extends PureComponent<Props> {
    static defaultProps = {
        asPanel: true,
        isPaged: true,
        showViewSelector: true,
        hideEmptyViewSelector: false,
    };

    componentDidMount(): void {
        const { model, actions } = this.props;
        actions.loadModel(model.id);
    }

    render() {
        const {
            model,
            actions,
            asPanel,
            isPaged,
            showViewSelector,
            hideEmptyViewSelector,
            pageSizes,
            ButtonsComponent
        } = this.props;
        const { id, error, messages, queryInfo } = model;
        const hasData = model.hasData;
        const paginate = isPaged && hasData;
        let body;

        if (model.error !== undefined) {
            body = <Alert>{error}</Alert>;
        } else {
            let buttons;

            if (ButtonsComponent !== undefined) {
                buttons = <ButtonsComponent model={model} actions={actions} />;
            }

            body = (
                <>
                    <div className="grid-panel__bar">
                        <div className="grid-panel__bar-left">
                            <div className="grid-bar__section">
                                {buttons}
                            </div>
                        </div>

                        <div className="grid-panel__bar-right">
                            <div className="grid-bar__section">
                                {paginate && <PaginationInfo model={model} actions={actions} />}
                                {paginate && <PaginationButtons model={model} actions={actions} />}
                                {paginate && <PageSizeSelector model={model} actions={actions} pageSizes={pageSizes} />}
                                {
                                    (showViewSelector && queryInfo) &&
                                    <ViewSelector
                                        model={model}
                                        actions={actions}
                                        hideEmptyViewSelector={hideEmptyViewSelector}
                                    />
                                }
                            </div>
                        </div>
                    </div>

                    <div className="grid-panel__info">
                        {/* Loading State and Selection Status */}
                        {model.isLoading && <LoadingSpinner />}
                    </div>

                    <div className="grid-panel__grid">
                        {
                            hasData &&
                            <Grid
                                calcWidths
                                condensed
                                gridId={id}
                                messages={fromJS(messages)}
                                columns={List(model.displayColumns)}
                                data={model.gridData}
                            />
                        }
                    </div>
                </>
            );
        }

        return (
            <div className={classNames('grid-panel', {'panel': asPanel, 'panel-default': asPanel})}>
                <div className={classNames('grid-panel__body', {'panel-body': asPanel})}>
                    {body}
                </div>
            </div>
        );
    }
}


class GridPanelWithModelImpl extends PureComponent<GridPanelProps & InjectedQueryModels> {
    render() {
        const { queryModels, actions, ...props } = this.props;
        return <GridPanel actions={actions} model={Object.values(queryModels)[0]} {...props} />;
    }
}

/**
 * GridPanelWithModel is a GridPanel component that also accepts the props for withQueryModels, however it assumes
 * that there will only ever be one model.
 *
 * In the future when GridPanel supports multiple models we will render tabs.
 */
export const GridPanelWithModel = withQueryModels<GridPanelProps>(GridPanelWithModelImpl);
