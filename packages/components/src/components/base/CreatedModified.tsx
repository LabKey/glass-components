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
import classNames from 'classnames';
import { Map } from 'immutable';
import moment from 'moment';
import { Query } from '@labkey/api';

import { LoadingSpinner } from './LoadingSpinner';

interface IRowConfig {
    createdBy: string;
    createdTS: any;
    display: boolean;
    hasCreated: boolean;
    hasModified: boolean;
    modifiedBy: string;
    modifiedTS: any;
    useCreated: boolean;
}

interface CreatedModifiedProps {
    className?: string;
    row: Map<string, any>;
    useServerDate?: boolean;
}

interface State {
    serverDate: Date;
    loading: boolean;
}

export class CreatedModified extends React.Component<CreatedModifiedProps, State> {
    static defaultProps = {
        useServerDate: true,
    };

    constructor(props) {
        super(props);

        this.state = {
            serverDate: undefined,
            loading: props.useServerDate,
        };
    }

    componentWillMount() {
        if (this.props.useServerDate) {
            Query.getServerDate({
                success: serverDate => this.setState(() => ({ serverDate, loading: false })),
                failure: error => this.setState(() => ({ loading: false })),
            });
        }
    }

    formatTitle(config: IRowConfig): string {
        const title = [];

        if (config.display) {
            if (config.hasCreated) {
                title.push('Created: ' + config.createdTS);

                if (config.createdBy) {
                    title.push('Created by: ' + config.createdBy);
                }
            }

            if (!config.useCreated && config.hasModified) {
                title.push('Modified: ' + config.modifiedTS);

                if (config.modifiedBy) {
                    title.push('Modified by: ' + config.modifiedBy);
                }
            }
        }

        if (title.length > 0) {
            return title.join('\n');
        }

        return '';
    }

    processRow(): IRowConfig {
        const { row } = this.props;

        if (row) {
            const createdBy = row.getIn(['CreatedBy', 'displayValue']) || row.getIn(['createdby', 'displayValue']);
            const createdTS = row.getIn(['Created', 'value']) || row.getIn(['created', 'value']);

            const modifiedBy = row.getIn(['ModifiedBy', 'displayValue']) || row.getIn(['modifiedby', 'displayValue']);
            const modifiedTS = row.getIn(['Modified', 'value']) || row.getIn(['modified', 'value']);

            const hasCreated = createdTS !== undefined;
            const hasModified = modifiedTS !== undefined;

            return {
                createdBy,
                createdTS: hasCreated ? createdTS : undefined,
                display: hasCreated || hasModified,
                hasCreated,
                hasModified,
                modifiedBy,
                modifiedTS: hasModified ? modifiedTS : undefined,
                useCreated: !hasModified || createdTS === modifiedTS,
            };
        }

        return {
            createdBy: undefined,
            createdTS: undefined,
            display: false,
            hasCreated: false,
            hasModified: false,
            modifiedBy: undefined,
            modifiedTS: undefined,
            useCreated: false,
        };
    }

    render() {
        const { className } = this.props;
        const { serverDate, loading } = this.state;

        if (loading) {
            return <LoadingSpinner />;
        }

        const config = this.processRow();
        if (config.display) {
            // also supports '/'
            const timestamp = config.useCreated ? config.createdTS : config.modifiedTS;
            const displayTxt = serverDate ? moment(timestamp).from(serverDate) : moment(timestamp).fromNow();

            return (
                <span title={this.formatTitle(config)} className={classNames('createdmodified', className)}>
                    {config.useCreated ? 'Created' : 'Modified'} {displayTxt}
                </span>
            );
        }

        return null;
    }
}
