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
import * as React from 'react'
import { Link } from 'react-router'
import { List, Map } from 'immutable'
import { AppURL, Grid, GridColumn, SchemaDetails, LoadingSpinner, fetchSchemas } from '@glass/base'

const columns = List([
    new GridColumn({
        index: 'schemaName',
        title: 'Schema',
        cell: (schemaName: string, details: SchemaDetails) => {
            if (details) {
                return (
                    <Link className="text-capitalize" to={AppURL.create('q', details.fullyQualifiedName).toString()}>
                        {schemaName}
                    </Link>
                );
            }

            return <span className="text-capitalize">{schemaName}</span>;
        }
    }),
    new GridColumn({
        index: 'description',
        title: 'Description'
    })
]);

interface SchemaListingProps {
    schemaName?: string
    hideEmpty?: boolean
    asPanel?: boolean
    title?: string
}

interface SchemaListingState {
    schemas: List<Map<string, SchemaDetails>>
}

export class SchemaListing extends React.Component<SchemaListingProps, SchemaListingState> {

    constructor(props: SchemaListingProps) {
        super(props);

        this.state = {
            schemas: undefined
        }
    }

    componentWillMount() {
        const { schemaName } = this.props;
        this.loadSchemas(schemaName);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.schemaName !== nextProps.schemaName) {
            this.loadSchemas(nextProps.schemaName);
        }
    }

    loadSchemas(schemaName: string) {
        fetchSchemas(schemaName).then((schemas) => {
            this.setState(() => ({schemas}));
        });
    }

    render() {
        const { hideEmpty, asPanel, title } = this.props;
        const { schemas } = this.state;

        if (schemas) {
            if (hideEmpty && schemas.count() === 0) {
                return null;
            }

            if (asPanel) {
                return (
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            {title || 'Schemas'}
                        </div>
                        <div className="panel-body">
                            <SchemaListingDisplay schemas={schemas}/>
                        </div>
                    </div>
                )
            }

            return <SchemaListingDisplay schemas={schemas}/>;
        }

        return <LoadingSpinner/>;
    }
}


interface SchemaListingDisplayProps {
    schemas: List<Map<string, SchemaDetails>>
}

export class SchemaListingDisplay extends React.PureComponent<SchemaListingDisplayProps, any> {

    render() {
        const { schemas } = this.props;
        return <Grid data={schemas} columns={columns}/>;
    }
}