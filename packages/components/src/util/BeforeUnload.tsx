import React from 'react';

interface Props {
    beforeunload: (event: any) => any
}

/**
 * A HOC to be used for any LKS React page that needs to check for a dirty state on page navigation.
 * Note that this HOC will not work for app usages which use react-router since the dirty check is to be done on
 * route changes instead of on page navigation.
 */
export class BeforeUnload extends React.PureComponent<Props, any> {

    componentDidMount() {
        window.addEventListener("beforeunload", this.props.beforeunload);
    }

    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.props.beforeunload);
    }

    render() {
        return this.props.children;
    }
}
