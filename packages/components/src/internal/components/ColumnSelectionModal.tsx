import React, { ChangeEvent, FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, OverlayTrigger, Popover } from 'react-bootstrap';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import classNames from 'classnames';

import { QueryColumn } from '../../public/QueryColumn';
import { QueryInfo } from '../../public/QueryInfo';

import { Alert } from './base/Alert';
import { DragDropHandle } from './base/DragDropHandle';
import { ConfirmModal, ConfirmModalProps } from './base/ConfirmModal';
import { LoadingSpinner } from './base/LoadingSpinner';

type ExpandedColumnFilter = (column: QueryColumn, showAllColumns: boolean) => boolean;
type QueryColumnHandler = (column: QueryColumn) => void;

interface FieldLabelDisplayProps {
    column: QueryColumn;
    editing?: boolean;
    includeFieldKey?: boolean;
    onEditComplete?: (column?: QueryColumn, title?: string) => void;
}

export const FieldLabelDisplay: FC<FieldLabelDisplayProps> = memo(props => {
    const { column, editing, includeFieldKey, onEditComplete } = props;
    const initialTitle = useMemo(() => column.caption ?? column.name, [column.caption, column.name]);
    const [title, setTitle] = useState<string>(initialTitle);

    useEffect(() => {
        setTitle(initialTitle);
    }, [initialTitle]);

    const onBlur = useCallback(() => {
        if (title !== initialTitle) {
            onEditComplete(column, title);
        } else {
            onEditComplete();
        }
    }, [column, initialTitle, title, onEditComplete]);

    const onChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        setTitle(evt.target.value);
    }, []);

    if (editing) {
        return (
            <input
                autoFocus
                placeholder={undefined}
                className="form-control"
                defaultValue={title}
                onBlur={onBlur}
                onChange={onChange}
                type="text"
            />
        );
    }
    // only show hover tooltip for lookup child fields. Issue 46256: use encoded fieldKeyPath
    if (!includeFieldKey || column.fieldKeyPath.indexOf('/') === -1) {
        return <div className="field-name">{initialTitle}</div>;
    }

    const id = column.index + '-fieldlabel-popover';

    return (
        <OverlayTrigger
            overlay={
                <Popover id={id} key={id}>
                    {column.index}
                </Popover>
            }
            placement="left"
        >
            <div className="field-name">{initialTitle}</div>
        </OverlayTrigger>
    );
});

export interface ColumnChoiceProps {
    column: QueryColumn;
    isExpanded?: boolean;
    isInView?: boolean;
    onAddColumn: QueryColumnHandler;
    onCollapseColumn: QueryColumnHandler;
    onExpandColumn?: QueryColumnHandler;
}

// exported for jest tests
export const ColumnChoice: FC<ColumnChoiceProps> = memo(props => {
    const { column, isExpanded, isInView, onAddColumn, onExpandColumn, onCollapseColumn } = props;
    const supportsExpand = !!onExpandColumn;
    const colFieldKey = column.index;

    // 46256: use encoded fieldKeyPath
    const hasParentFieldKeys = column.fieldKeyPath.indexOf('/') > -1;
    const parentFieldKeys = hasParentFieldKeys
        ? column.fieldKeyPath.substring(0, column.fieldKeyPath.lastIndexOf('/')).split('/')
        : [];

    const _onAddColumn = useCallback(() => {
        onAddColumn(column);
    }, [column, onAddColumn]);

    const _onExpandColumn = useCallback(() => {
        onExpandColumn(column);
    }, [column, onExpandColumn]);

    const _onCollapseColumn = useCallback(() => {
        onCollapseColumn(column);
    }, [column, onCollapseColumn]);

    return (
        <div className="list-group-item flex" key={colFieldKey} data-fieldkey={colFieldKey}>
            {supportsExpand && (
                <>
                    {parentFieldKeys.map((parent, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <div className="field-expand-icon" key={`${colFieldKey}|${index}`} />
                    ))}
                    <div className="field-expand-icon">
                        {column.isLookup() && !isExpanded && (
                            <i className="fa fa-plus-square" onClick={_onExpandColumn} />
                        )}
                        {column.isLookup() && isExpanded && (
                            <i className="fa fa-minus-square" onClick={_onCollapseColumn} />
                        )}
                    </div>
                </>
            )}
            <FieldLabelDisplay column={column} />
            {isInView && (
                <div className="pull-right view-field__action disabled" title="This field is included in the view.">
                    <i className="fa fa-check" />
                </div>
            )}
            {!isInView && column.selectable && (
                <div
                    className="pull-right view-field__action"
                    title="Add this field to the view."
                    onClick={_onAddColumn}
                >
                    <i className="fa fa-plus" />
                </div>
            )}
        </div>
    );
});

export interface ColumnChoiceGroupProps extends ColumnChoiceProps {
    columnsInView: QueryColumn[];
    expandedColumnFilter?: ExpandedColumnFilter;
    expandedColumns?: Record<string, QueryInfo>;
    showAllColumns: boolean;
}

export const ColumnChoiceGroup: FC<ColumnChoiceGroupProps> = memo(props => {
    const {
        expandedColumnFilter,
        expandedColumns,
        column,
        onAddColumn,
        onExpandColumn,
        onCollapseColumn,
        columnsInView,
        showAllColumns,
    } = props;
    const isLookupExpanded = !!expandedColumns?.[column.index];

    const isColumnInView = useCallback(
        (col: QueryColumn) => columnsInView.findIndex(c => c.index === col.index) !== -1,
        [columnsInView]
    );

    return (
        <>
            <ColumnChoice
                column={column}
                isExpanded={isLookupExpanded}
                isInView={isColumnInView(column)}
                key={column.index}
                onAddColumn={onAddColumn}
                onCollapseColumn={onCollapseColumn}
                onExpandColumn={onExpandColumn}
            />
            {isLookupExpanded &&
                expandedColumns[column.index].columns.valueArray
                    .filter(fkCol => expandedColumnFilter?.(fkCol, showAllColumns) ?? true)
                    .map(fkCol => (
                        <ColumnChoiceGroup
                            column={fkCol}
                            key={fkCol.index}
                            isInView={isColumnInView(fkCol)}
                            onAddColumn={onAddColumn}
                            isExpanded={!!expandedColumns[fkCol.index]}
                            onExpandColumn={onExpandColumn}
                            onCollapseColumn={onCollapseColumn}
                            expandedColumns={expandedColumns}
                            columnsInView={columnsInView}
                            showAllColumns={showAllColumns}
                        />
                    ))}
        </>
    );
});

export interface ColumnInViewProps {
    allowEditLabel: boolean;
    column: QueryColumn;
    index: number;
    isDragDisabled: boolean;
    onClick: (index: number) => void;
    onEditTitle: () => void;
    onRemoveColumn: QueryColumnHandler;
    onUpdateTitle: (column: QueryColumn, title: string) => void;
    selected: boolean;
}

export const ColumnInView: FC<ColumnInViewProps> = memo(props => {
    const {
        allowEditLabel,
        column,
        isDragDisabled,
        onRemoveColumn,
        onClick,
        onEditTitle,
        onUpdateTitle,
        selected,
        index,
    } = props;
    const key = column.index;
    const [editing, setEditing] = useState<boolean>(false);

    const _onRemoveColumn = useCallback(() => {
        onRemoveColumn(column);
    }, [column, onRemoveColumn]);

    const _onClick = useCallback(() => {
        onClick(index);
    }, [onClick, index]);

    const _onUpdateTitle = useCallback(
        (col: QueryColumn, title: string) => {
            setEditing(false);
            if (col && title) {
                onUpdateTitle(col, title);
            }
        },
        [onUpdateTitle]
    );

    const _onEditTitle = useCallback(() => {
        setEditing(true);
        onEditTitle();
    }, [onEditTitle]);

    return (
        <Draggable key={key} draggableId={key} index={index} isDragDisabled={isDragDisabled}>
            {(dragProvided, snapshot) => (
                <div
                    className={classNames('list-group-item flex draggable', { active: selected && !editing })}
                    onClick={_onClick}
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                >
                    <div className="right-spacing" {...dragProvided.dragHandleProps}>
                        <DragDropHandle highlighted={snapshot.isDragging} {...dragProvided.dragHandleProps} />
                    </div>
                    <FieldLabelDisplay
                        column={column}
                        includeFieldKey
                        editing={editing}
                        onEditComplete={_onUpdateTitle}
                    />
                    {!editing && (
                        <span className="pull-right">
                            {allowEditLabel && (
                                <span
                                    className="edit-inline-field__toggle"
                                    title="Edit the field's label for this view."
                                    onClick={_onEditTitle}
                                >
                                    <i id={'select-' + index} className="fa fa-pencil" />
                                </span>
                            )}
                            <span
                                className="view-field__action clickable"
                                title="Remove this field from the view."
                                onClick={_onRemoveColumn}
                            >
                                <i className="fa fa-times" />
                            </span>
                        </span>
                    )}
                </div>
            )}
        </Draggable>
    );
});

export interface ColumnSelectionModalProps extends Omit<ConfirmModalProps, 'canConfirm' | 'onConfirm'> {
    allowEditLabel?: boolean;
    allowShowAll?: boolean;
    error?: ReactNode;
    expandedColumnFilter?: ExpandedColumnFilter;
    initialSelectedColumn?: QueryColumn;
    initialSelectedColumns?: QueryColumn[];
    isLoaded?: boolean;
    leftColumnTitle?: ReactNode;
    onExpand?: (fk: QueryColumn) => Promise<QueryInfo>;
    onSubmit: (selectedColumns: QueryColumn[]) => Promise<void>;
    queryInfo: QueryInfo;
    rightColumnTitle?: ReactNode;
    saveError?: ReactNode;
}

export const ColumnSelectionModal: FC<ColumnSelectionModalProps> = memo(props => {
    const {
        allowEditLabel,
        allowShowAll,
        error,
        expandedColumnFilter,
        initialSelectedColumn,
        initialSelectedColumns,
        isLoaded,
        leftColumnTitle,
        onExpand,
        onSubmit,
        queryInfo,
        rightColumnTitle,
        ...confirmModalProps
    } = props;
    const [editingColumnTitle, setEditingColumnTitle] = useState<boolean>(false);
    const [expandedColumns, setExpandedColumns] = useState<Record<string, QueryInfo>>({});
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [queryError, setQueryError] = useState<string>();
    const [selectedColumns, setSelectedColumns] = useState<QueryColumn[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>();
    const [showAllColumns, setShowAllColumns] = useState<boolean>(false);

    useEffect(() => {
        if (isLoaded) {
            const selectedColumns_ = initialSelectedColumns ?? [];
            setSelectedColumns(selectedColumns_);

            if (initialSelectedColumn) {
                setSelectedIndex(selectedColumns_.findIndex(col => initialSelectedColumn.index === col.index));
            }
        }
    }, [initialSelectedColumn, initialSelectedColumns, isLoaded]);

    const onAddColumn = useCallback<QueryColumnHandler>(
        column => {
            if (selectedIndex !== undefined) {
                setSelectedColumns(columns => [
                    ...columns.slice(0, selectedIndex + 1),
                    column,
                    ...columns.slice(selectedIndex + 1),
                ]);
            } else {
                setSelectedColumns(columns => [...columns, column]);
            }
            setIsDirty(true);
        },
        [selectedIndex, setIsDirty]
    );

    const onCollapseColumn = useCallback<QueryColumnHandler>(column => {
        setQueryError(undefined);
        setExpandedColumns(expanded => ({ ...expanded, [column.index]: undefined }));
    }, []);

    const onConfirm = useCallback(() => {
        onSubmit(selectedColumns);
    }, [selectedColumns, onSubmit]);

    const onDragEnd = useCallback(
        (dropResult: DropResult) => {
            const { destination, draggableId, source } = dropResult;
            if (destination === null || source.index === destination.index) {
                return;
            }
            const { index } = destination;

            const colInMotion = selectedColumns[source.index];
            let updatedColumns = selectedColumns.filter(col => col.index != draggableId);
            updatedColumns = [...updatedColumns.slice(0, index), colInMotion, ...updatedColumns.slice(index)];
            setSelectedColumns(updatedColumns);
            if (source.index === selectedIndex) {
                setSelectedIndex(index);
            } else if (selectedIndex !== undefined) {
                if (source.index > selectedIndex && index <= selectedIndex) {
                    setSelectedIndex(selectedIndex + 1);
                } else if (source.index < selectedIndex && index >= selectedIndex) {
                    setSelectedIndex(selectedIndex - 1);
                }
            }
            setIsDirty(true);
        },
        [selectedColumns, selectedIndex]
    );

    const onEditTitle = useCallback(() => {
        setEditingColumnTitle(true);
    }, []);

    const onExpandColumn = useCallback<QueryColumnHandler>(
        async column => {
            try {
                setQueryError(undefined);
                const queryInfo_ = await onExpand(column);
                setExpandedColumns(expanded => ({ ...expanded, [column.index]: queryInfo_ }));
            } catch (e) {
                setQueryError(e.message);
            }
        },
        [onExpand]
    );

    const onRemoveColumn = useCallback<QueryColumnHandler>(removedColumn => {
        setSelectedColumns(columns => columns.filter(c => c.index !== removedColumn.index));
        setIsDirty(true);
    }, []);

    const onRevertEdits = useCallback(() => {
        setSelectedColumns(initialSelectedColumns ?? []);
        setIsDirty(false);
        setSelectedIndex(undefined);
    }, [initialSelectedColumns]);

    const onSelectField = useCallback((index: number): void => {
        setSelectedIndex(selectedIndex_ => (selectedIndex_ === index ? undefined : index));
    }, []);

    const onUpdateTitle = useCallback(
        (updatedColumn: QueryColumn, caption: string) => {
            const relabeledColumn = updatedColumn.mutate({ caption });
            const index = selectedColumns.findIndex(column => column.index === updatedColumn.index);
            setSelectedColumns([
                ...selectedColumns.slice(0, index),
                relabeledColumn,
                ...selectedColumns.slice(index + 1),
            ]);
            setIsDirty(true);
            setEditingColumnTitle(false);
        },
        [selectedColumns]
    );

    const onToggleShowAll = useCallback(() => {
        setShowAllColumns(s => !s);
    }, []);

    const availableColumns = useMemo<QueryColumn[]>(() => {
        if (!isLoaded || !queryInfo) return [];
        return queryInfo.columns.valueArray
            .filter(c => expandedColumnFilter?.(c, showAllColumns) ?? true)
            .filter(c => c.fieldKeyArray.length === 1); // at the top level don't include lookup fields
    }, [expandedColumnFilter, isLoaded, queryInfo, showAllColumns]);

    return (
        <ConfirmModal {...confirmModalProps} canConfirm={isDirty && selectedColumns.length > 0} onConfirm={onConfirm}>
            <Alert>{error}</Alert>
            <Alert>{queryError}</Alert>
            {!isLoaded && <LoadingSpinner />}
            {isLoaded && (
                <div className="field-modal__container row">
                    <Col xs={12} sm={6} className="field-modal__col-2">
                        <div key="title" className="field-modal__col-title">
                            {leftColumnTitle}
                        </div>
                        <div key="field-list" className="list-group field-modal__col-content">
                            {availableColumns.map(column => (
                                <ColumnChoiceGroup
                                    column={column}
                                    key={column.index}
                                    onAddColumn={onAddColumn}
                                    onExpandColumn={onExpand ? onExpandColumn : undefined}
                                    onCollapseColumn={onCollapseColumn}
                                    expandedColumnFilter={expandedColumnFilter}
                                    expandedColumns={expandedColumns}
                                    columnsInView={selectedColumns}
                                    showAllColumns={showAllColumns}
                                />
                            ))}
                        </div>
                        {allowShowAll && (
                            <div key="toggleAll" className="field-modal__footer">
                                <input type="checkbox" checked={showAllColumns} onChange={onToggleShowAll} />
                                &nbsp;Show all system and user-defined fields
                            </div>
                        )}
                    </Col>
                    <Col xs={12} sm={6} className="field-modal__col-2">
                        <div className="field-modal__col-title">
                            {rightColumnTitle}
                            <span
                                className={'pull-right ' + (isDirty ? 'action-text' : 'disabled-action-text')}
                                onClick={isDirty ? onRevertEdits : undefined}
                            >
                                Undo edits
                            </span>
                        </div>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="field-droppable">
                                {dropProvided => (
                                    <div
                                        className="list-group field-modal__col-content"
                                        {...dropProvided.droppableProps}
                                        ref={dropProvided.innerRef}
                                    >
                                        {selectedColumns.map((column, index) => (
                                            <ColumnInView
                                                allowEditLabel={allowEditLabel}
                                                key={column.index}
                                                column={column}
                                                index={index}
                                                isDragDisabled={editingColumnTitle}
                                                onRemoveColumn={onRemoveColumn}
                                                selected={selectedIndex === index}
                                                onClick={onSelectField}
                                                onEditTitle={onEditTitle}
                                                onUpdateTitle={onUpdateTitle}
                                            />
                                        ))}
                                        {dropProvided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </Col>
                </div>
            )}
        </ConfirmModal>
    );
});

ColumnSelectionModal.defaultProps = {
    allowEditLabel: false,
    allowShowAll: false,
    backdrop: 'static',
    cancelButtonText: 'Cancel',
    confirmButtonText: 'Update Fields',
    confirmVariant: 'success',
    isLoaded: true,
    leftColumnTitle: 'Available Fields',
    rightColumnTitle: 'Selected Fields',
    show: true,
    size: 'lg',
};

ColumnSelectionModal.displayName = 'ColumnSelectionModal';
