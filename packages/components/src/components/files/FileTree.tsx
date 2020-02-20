import { Treebeard, decorators } from 'react-treebeard';

import React, { PureComponent } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { Checkbox, Alert } from 'react-bootstrap';
import { List } from 'immutable';
import {LoadingSpinner} from "../..";

const customStyle = {
    tree: {
        base: {
            listStyle: 'none',
            backgroundColor: 'white',
            margin: 0,
            padding: 0,
            color: '#777',
            fontFamily: 'lucida grande ,tahoma,verdana,arial,sans-serif',
            fontSize: '14px',
        },
        node: {
            base: {
                position: 'relative',
            },
            link: {
                cursor: 'pointer',
                position: 'relative',
                padding: '0px 5px',
                display: 'block',
            },
            activeLink: {
                background: 'white',
            },
            toggle: {
                base: {
                    position: 'relative',
                    display: 'inline-block',
                    verticalAlign: 'top',
                    marginLeft: '-5px',
                    height: '24px',
                    width: '24px',
                },
                wrapper: {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    margin: '-7px 0 0 -7px',
                    height: '14px',
                },
                height: 14,
                width: 14,
                arrow: {
                    fill: '#777',
                    strokeWidth: 0,
                },
            },
            header: {
                base: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    color: '#777',
                },
                connector: {
                    width: '2px',
                    height: '12px',
                    borderLeft: 'solid 2px black',
                    borderBottom: 'solid 2px black',
                    position: 'absolute',
                    top: '0px',
                    left: '-21px',
                },
                title: {
                    lineHeight: '24px',
                    verticalAlign: 'middle',
                },
            },
            subtree: {
                listStyle: 'none',
                paddingLeft: '19px',
            },
            loading: {
                color: '#777',
            },
        },
    },
};

const DEFAULT_ROOT_PREFIX = '|root';
const CHECK_ID_PREFIX = 'filetree-check-';
const EMPTY_FILE_NAME = '*empty';
const LOADING_FILE_NAME = '*loading';

const Header = (props) => {
    const { style, onSelect, node, customStyles, checked, handleCheckbox } = props;
    const iconType = node.children ? 'folder' : 'file-text';
    const icon = iconType === 'folder' ? faFolder : faFileAlt;

    if (node.id.endsWith('|' + EMPTY_FILE_NAME)) {
        return ( <div className="filetree-empty-directory">No Files Found</div> );
    }

    if (node.id.endsWith('|' + LOADING_FILE_NAME)) {
        return (
            <div className="filetree-empty-directory">
                <LoadingSpinner />
            </div>
        );
    }

    // Do not always want to toggle directories when clicking a check box
    const checkClick = (evt): void => {
        evt.stopPropagation();
    };

    return (
        <span className={'filetree-checkbox-container' + (iconType === 'folder' ? '' : ' filetree-leaf-node')}>
            <Checkbox
                id={CHECK_ID_PREFIX + node.id}
                checked={checked}
                onChange={handleCheckbox}
                onClick={checkClick}
            />
            <div style={style.base} onClick={onSelect}>
                <div style={node.selected ? { ...style.title, ...customStyles.header.title } : style.title}>
                    <FontAwesomeIcon icon={icon} className="filetree-folder-icon" />
                    {node.name}
                </div>
            </div>
        </span>
    );
};

interface FileTreeProps {
    loadData: (directory?: string) => Promise<any>
    onFileSelect: (name: string, path: string, checked: boolean, isDirectory: boolean) => void
}

interface FileTreeState {
    cursor: any
    checked: List<string>
    data: Array<any>
    error?: string
    loading: boolean  // Only used for testing
}

export class FileTree extends PureComponent<FileTreeProps, FileTreeState> {
    constructor(props: FileTreeProps) {
        super(props);

        this.state = {
            cursor: undefined,
            checked: List<string>(),
            data: [],
            error: undefined,
            loading: false,
        };
    }

    componentDidMount(): void {
        const { loadData } = this.props;

        this.setState(() => ({loading: true}));
        loadData()
            .then(data => {
                let loadedData = data;

                // treebeard has bugs when there is not a single root node
                if (Array.isArray(data)) {
                    if (data.length < 1) {
                        data = [
                            { id: DEFAULT_ROOT_PREFIX + '|' + EMPTY_FILE_NAME, active: false, name: 'empty' },
                        ];
                    }

                    loadedData = {
                        name: 'root',
                        id: DEFAULT_ROOT_PREFIX, // Special id
                        children: data,
                        toggled: true,
                    };
                }

                if (!loadedData.id) {
                    loadedData.id = loadedData.name;
                }

                this.setState(() => ({ data: loadedData, loading: false }));
            })
            .catch((reason: any) => {
                this.setState(() => ({ error: reason, loading: false }));
            });
    }

    headerDecorator = (props) => {
        const { checked } = this.state;
        return <Header {...props} checked={checked.contains(props.node.id)} handleCheckbox={this.handleCheckbox} />;
    };

    getNodeIdFromId = (id: string): string => {
        const parts = id.split(CHECK_ID_PREFIX);
        if (parts.length === 2) {
            return parts[1];
        }

        return undefined;
    };

    getDataNode = (id: string, node: any): any => {
        if (node.id === id) {
            return node;
        }

        if (node.children) {
            // First get which child is the correct descendant path
            const childPath = node.children.filter(child => {
                return id.startsWith(child.id);
            });

            if (childPath && childPath.length > 0) {
                return this.getDataNode(id, childPath[0]);
            }
        }

        return undefined;
    };

    getPathFromId = (id: string): string => {
        let path = id;

        // strip off default root id if exists
        if (path.startsWith(DEFAULT_ROOT_PREFIX)) {
            path = path.substring(DEFAULT_ROOT_PREFIX.length);
        }

        return path.replace(/\|/g, '/');
    };

    getNameFromId = (id: string): string => {
        const parts = id.split('|');
        return parts[parts.length - 1];
    };

    // Callback to parent with actual path of selected file
    onFileSelect = (id: string, checked: boolean, isDirectory: boolean): void => {
        const { onFileSelect } = this.props;

        const fileName = this.getNameFromId(id);

        if (fileName !== EMPTY_FILE_NAME) {
            onFileSelect(this.getNameFromId(id), this.getPathFromId(id), checked, isDirectory);
        }
    };

    setCheckedValue = (node: any, checked: boolean): void => {
        // Recurse through children if directory
        if (node.children) {
            node.children.forEach(child => {
                this.setCheckedValue(child, checked);
            });
        }

        // Add or remove checked value from state
        if (checked) {
            this.setState(
                state => ({ checked: state.checked.push(node.id) }),
                () => this.onFileSelect(node.id, checked, !!node.children)
            );
        } else {
            this.setState(
                state => ({
                    checked: state.checked.filter(check => {
                        return check !== node.id;
                    }) as List<string>,
                }),
                () => this.onFileSelect(node.id, checked, !!node.children)
            );
        }
    };

    // recursively toggle all child files. afterCascade used to check selection box of each subfile
    cascadeToggle = (node, afterCascade: (any) => any): void => {
        const afterToggle = () => {
            afterCascade(node);
            if (node.children) {
                node.children.forEach(child => {
                    this.cascadeToggle(child, afterCascade);
                });
            }
        };

        this.onToggle(node, true, afterToggle);
    };

    handleCheckbox = (evt): void => {
        const { data } = this.state;
        const { checked } = evt.target;
        const id = this.getNodeIdFromId(evt.target.id);

        const node = this.getDataNode(id, data);
        if (node.children && checked) {
            // Toggle open selected directory and check the children
            const callback = checkNode => {
                this.setCheckedValue(checkNode, checked);
            };

            this.cascadeToggle(node, callback);
        }
        this.setCheckedValue(node, checked);
    };

    loadDirectory = (nodeId: string, callback?: () => any): any => {
        const { loadData } = this.props;

        this.setState(() => ({loading: true}));
        loadData(this.getPathFromId(nodeId))
            .then(children => {

                const { data } = this.state;
                let dataNode = this.getDataNode(nodeId, data);

                children = children.map(child => {
                    child.id = dataNode.id + '|' + child.name; // generate Id from path
                    return child;
                });

                if (children.length < 1) {
                    children = [{ id: dataNode.id + '|' + EMPTY_FILE_NAME, active: false, name: 'empty' }];
                }

                dataNode.children = children; // This is not immutable so this is updating the data object
                this.setState(
                    () => ({ cursor: dataNode, data: {...data}, error: undefined, loading: false }),
                    callback
                );
            })
            .catch((reason: any) => {
                this.setState(() => ({ error: reason.message ? reason.message : 'Unable to fetch data', loading: false }));
            });
    };

    // This function is called from within the treebeard package. The node that is passed back is a pointer to a specific
    // node in this.state.data. This function is updating that node which is directly updating this.state.data, then
    // we make a clone of this.state.data for setState.  Directly manipulating anything in this.state is NOT a recommended React
    // pattern.  This is done in this case to work with the treebeard package, but should not be copied elsewhere.
    onToggle = (node: any, toggled: boolean, callback?: () => any): void => {
        const { cursor, data } = this.state;

        if (cursor) {
            node.active = false;
        }
        node.active = true;
        node.toggled = toggled;

        if (node.children) {
            // load data if not already loaded
            if (node.children.length === 0) {
                node.children = [{ id: node.id + '|' + LOADING_FILE_NAME }];
                this.setState(
                    () => ({ cursor: node, data: { ...data }}),
                    () => {
                        this.loadDirectory(node.id, callback);
                    }
                );
            } else {
                this.setState(
                    () => ({ cursor: node, data: {...data}, error: undefined }),
                    callback
                );
            }
        }
    };

    render(): React.ReactNode {
        const { data, error } = this.state;

        return (
            <div className="filetree-container">
                {error ? (
                    <Alert bsStyle="danger">{error}</Alert>
                ) : (
                    <Treebeard
                        data={data}
                        onToggle={this.onToggle}
                        decorators={{ ...decorators, Header: this.headerDecorator }}
                        style={customStyle}
                    />
                )}
            </div>
        );
    };
}
