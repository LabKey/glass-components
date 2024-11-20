import React from 'react';
import classNames from 'classnames';

import { HorizontalBarLegendData } from './utils';
import { DefaultRenderer } from '../../renderers/DefaultRenderer';

const CELL_EMPTY_COLOR = 'FFFFFF';

interface Props {
    emptyColor?: string;
    legendData: HorizontalBarLegendData[];
    activeIndex?: number;
}

export class ItemsLegend extends React.PureComponent<Props> {
    static defaultProps = {
        title: 'Container legend',
        emptyColor: CELL_EMPTY_COLOR,
        asModal: true,
    };

    render() {
        const { legendData, emptyColor, activeIndex } = this.props;

        const legendsDisplay = [];
        legendData.forEach((legend, index) => {
            let icon;
            if (legend.circleColor && legend.circleColor !== 'none') {
                icon = (
                    <i
                        className="color-icon__circle cell-legend-circle"
                        style={{ backgroundColor: legend.circleColor }}
                    />
                );
            } else if (legend.locked) {
                icon = (
                    <span className="cell-lock">
                        <span className="fa fa-lock" />
                    </span>
                );
            }

            const key = 'cell-legend-' + index;
            const hasBackground = legend.backgroundColor !== 'none';
            const style = { backgroundColor: hasBackground ? legend.backgroundColor : emptyColor };
            if (legend.borderColor) {
                style['border'] = '3px solid ' + legend.borderColor;
            }
            const legendDisplay = (
                <tr key={key} className="cell-legend-row">
                    <td>
                        <span
                            className={classNames('cell-legend-icon', {
                                'cell-legend-icon-spacing': legend.locked,
                                'cell-legend-icon-border': hasBackground,
                                'expired-form-field': legend.expired,
                            })}
                            style={style}
                        >
                            {icon}
                        </span>
                    </td>
                    <td>
                        <span className={classNames('cell-legend-label', {
                            'bold-text': activeIndex === index
                        })}>{legend.legendLabel}</span>
                    </td>
                    {legend.data && (
                        <td>
                            <span className="cell-legend-label"><DefaultRenderer data={legend.data} /></span>
                        </td>
                    )}
                </tr>);

            legendsDisplay.push(legendDisplay);
        });

        return (
            <div className="box-viewer-legend">
                <table>
                    <tbody>{legendsDisplay}</tbody>
                </table>
            </div>
        );
    }
}
