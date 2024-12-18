import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { AddEntityButton, AddEntityElement } from './AddEntityButton';

describe('AddEntityButton', () => {
    test('Minimal props', async () => {
        const onClick = jest.fn();
        render(<AddEntityButton entity="EntityName" onClick={onClick} />);

        // verify the button is rendered
        expect(document.querySelectorAll('.container--action-button')).toHaveLength(1);
        expect(screen.getByText('Add EntityName')).toBeInTheDocument();

        // verify helper is not rendered
        expect(document.querySelectorAll('.label-help-target')).toHaveLength(0);

        // verify button click
        expect(onClick).toHaveBeenCalledTimes(0);
        await userEvent.click(screen.getByText('Add EntityName'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('Fully populated props', async () => {
        const onClick = jest.fn();
        render(
            <AddEntityButton
                entity="Something"
                onClick={onClick}
                buttonClass="test-button-class"
                containerClass="test-container-class"
                disabled
                title="test-title"
                helperTitle="test-helperTitle"
                helperBody={<p> Test Body Contents </p>}
            />
        );

        // verify the button is rendered
        expect(document.querySelectorAll('.container--action-button')).toHaveLength(1);
        expect(document.querySelectorAll('.test-container-class')).toHaveLength(1);
        expect(document.querySelectorAll('.test-button-class')).toHaveLength(1);
        expect(screen.getByText('Add Something')).toBeInTheDocument();
        expect(screen.getByTitle('test-title')).toBeInTheDocument();

        // verify helper is rendered
        expect(document.querySelectorAll('.label-help-target')).toHaveLength(1);

        // verify button disabled
        expect(document.querySelectorAll('.disabled')).toHaveLength(1);
        expect(onClick).toHaveBeenCalledTimes(0);
        await userEvent.click(screen.getByText('Add Something'));
        expect(onClick).toHaveBeenCalledTimes(0);
    });
});

describe('AddEntityElement', () => {
    test('default props', async () => {
        render(<AddEntityElement entity="EntityName" />);

        expect(document.querySelectorAll('.container--action-button')).toHaveLength(0);
        expect(document.querySelectorAll('.container--addition-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-plus-circle')).toHaveLength(1);
        expect(document.body.textContent).toBe(' Add EntityName');
    });
});
