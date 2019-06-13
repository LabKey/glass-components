/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable'

import { getBrowserHistory } from "./global";

// This type is roughly equivalent to the Location object from this history package
// but here we have all fields optional to make it also compatible with the window.location object
export type Location = {
    action?: string
    hash?: string
    key?: string
    pathname?: string
    query?: any //{[key:string]: string}
    search?: string
    state?: any // {[key:string]: string}
}

export function getLocation() : Location
{
    let location : Location = getBrowserHistory().location;
    let query =  Map<string, string>(location.query).asMutable();

    // check for query params that are before the hash
    if (location.search && location.search.length > 0)
    {
        const params = location.search.substring(1).split('&');
        params.forEach( (p) => {
            const keyVal = p.split('=');
            query.set(decodeURI(keyVal[0].trim()), decodeURI(keyVal[1].trim()));
        });
    }

    // and check for query params after the hash
    if (location.hash && location.hash.indexOf('?') > -1) {
        const index = location.hash.indexOf('?');

        const params = location.hash.substring(index + 1).split('&');
        params.forEach( (p) => {
            const keyVal = p.split('=');
            query.set(decodeURI(keyVal[0].trim()), decodeURI(keyVal[1].trim()));
        });

        location.hash = location.hash.substring(0, index);
    }

    location.query = query.asImmutable();
    return location;
}

export function buildQueryString(params: Map<string, string | number>): string {
    let q = '', sep = '';
    params.forEach((v, k) => {
        q += sep + k + '=' + v;
        sep = '&';
    });

    return q.length > 0 ? '?' + q : '';
}

function build(pathname: string, hash?: string, params?: Map<string, string | number>): string {
    return pathname + (hash || '') + (params ? buildQueryString(params) : '');
}

function setParameter(location: Location, key: string, value: string | number, asReplace: boolean = false) {
    const params = Map<string, string | number>();
    setParameters(location, params.set(key, value), asReplace);
}

function setParameters(location: Location, params: Map<string, string | number>, asReplace: boolean = false) {
    const { query } = location;

    let newParams = Map<string, string | number>(query).asMutable();
    params.forEach((value, key) => {
        if (value === undefined || value === '') {
            newParams.delete(key);
        }
        else {
            newParams.set(key, value);
        }
    });

    if (asReplace) {
        getBrowserHistory().replace(build(location.pathname, location.hash, newParams.asImmutable()));
    }
    else {
        getBrowserHistory().push(build(location.pathname, location.hash, newParams.asImmutable()))
    }
}

export function pushParameter(location: Location, key: string, value: string | number) {
    setParameter(location, key, value);
}

export function pushParameters(location: Location, params: Map<string, string | number>) {
    setParameters(location, params);
}

export function replaceParameter(location: Location, key: string, value: string | number) {
    setParameter(location, key, value, true);
}

export function replaceParameters(location: Location, params: Map<string, string | number>) {
    setParameters(location, params, true);
}
