import React, { FC } from 'react';
import { addRowAfter } from '@remirror/pm/tables';

interface Props {
    nums: number[];
}

export const Comp: FC<Props> = (props) => {
    addRowAfter(null);
    // Should not compile because props.nums.at is ES2022, and our build lib is ES2021
    return (
        <div>{props.nums.at(-1)}</div>
    );
};
