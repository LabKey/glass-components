import React, { PureComponent, ReactNode } from 'react';
import { Network } from 'vis-network';

import { DropdownButton, MenuItem } from '../../../dropdowns';

const PAN_INCREMENT = 20;
const ZOOM_INCREMENT = 0.05;

interface GraphControlsProps {
    getNetwork: () => Network;
    onReset: (selectSeed: boolean) => void;
    onToggleSettings: () => void;
}

export class VisGraphControls extends PureComponent<GraphControlsProps> {
    panDown = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: 0, y: -PAN_INCREMENT } });
    };

    panUp = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: 0, y: PAN_INCREMENT } });
    };

    panLeft = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: PAN_INCREMENT, y: 0 } });
    };

    panRight = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: -PAN_INCREMENT, y: 0 } });
    };

    reset = (): void => {
        this.props.onReset?.(false);
    };

    resetSelect = (): void => {
        this.props.onReset?.(true);
    };

    zoomIn = (): void => {
        const network = this.props.getNetwork();
        network.moveTo({
            scale: network.getScale() + ZOOM_INCREMENT,
        });
    };

    zoomOut = (): void => {
        const network = this.props.getNetwork();
        const scale = network.getScale() - ZOOM_INCREMENT;
        if (scale > 0) {
            network.moveTo({ scale });
        }
    };

    render(): ReactNode {
        return (
            <div className="lineage-visgraph-controls">
                <div className="lineage-visgraph-control-settings">
                    <div className="btn-group">
                        {!!this.props.onToggleSettings && (
                            <button className="btn btn-default" onClick={this.props.onToggleSettings} type="button">
                                <i className="fa fa-gear" />
                            </button>
                        )}
                        <DropdownButton title={<i className="fa fa-undo" />} pullRight>
                            <MenuItem onClick={this.resetSelect}>Reset view and select seed</MenuItem>
                            <MenuItem onClick={this.reset}>Reset view</MenuItem>
                        </DropdownButton>
                    </div>
                </div>
                <div className="lineage-visgraph-control-zoom">
                    <div className="btn-group">
                        <button className="btn btn-default" onClick={this.zoomOut} type="button">
                            <i className="fa fa-search-minus" />
                        </button>
                        <button className="btn btn-default" onClick={this.zoomIn} type="button">
                            <i className="fa fa-search-plus" />
                        </button>
                    </div>
                </div>
                <div className="lineage-visgraph-control-pan">
                    <button
                        className="lineage-visgraph-control-pan-up btn btn-default"
                        onClick={this.panUp}
                        type="button"
                    >
                        <i className="fa fa-arrow-up" />
                    </button>
                    <div className="btn-group">
                        <button className="btn btn-default" onClick={this.panLeft} type="button">
                            <i className="fa fa-arrow-left" />
                        </button>
                        <button className="btn btn-default" onClick={this.panDown} type="button">
                            <i className="fa fa-arrow-down" />
                        </button>
                        <button className="btn btn-default" onClick={this.panRight} type="button">
                            <i className="fa fa-arrow-right" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
