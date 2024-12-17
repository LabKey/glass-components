import React from 'react';
import {DropdownMenu} from "./dropdowns";
import {render, screen} from "@testing-library/react";

describe('DropdownMenu', () => {
    test('default props', () => {
        render(<DropdownMenu title="Test title" />);
        expect(document.querySelectorAll('.lk-dropdown')).toHaveLength(1);
        expect(document.querySelectorAll('.dropdown-menu')).toHaveLength(1);
        expect(document.querySelectorAll('a')).toHaveLength(1);
        expect(document.querySelector('a').getAttribute('title')).toBe(null);
        expect(document.querySelectorAll('.dropdown-menu-right')).toHaveLength(0);
        expect(document.querySelector('.lk-dropdown').textContent).toContain('Test title');
    });

    test('asAnchor false', () => {
        render(<DropdownMenu title="Test title" asAnchor={false} />);
        expect(document.querySelectorAll('.lk-dropdown')).toHaveLength(1);
        expect(document.querySelectorAll('.dropdown-menu')).toHaveLength(1);
        expect(document.querySelectorAll('a')).toHaveLength(0);
        expect(document.querySelectorAll('span')).toHaveLength(1);
        expect(document.querySelector('.lk-dropdown').textContent).toContain('Test title');
    });

    test('custom props', () => {
        render(<DropdownMenu title="Test title" className="test-class" label="Test label" pullRight />);
        expect(document.querySelectorAll('.lk-dropdown')).toHaveLength(1);
        expect(document.querySelectorAll('.dropdown-menu')).toHaveLength(1);
        expect(document.querySelectorAll('a')).toHaveLength(1);
        expect(document.querySelector('a').getAttribute('title')).toBe('Test label');
        expect(document.querySelectorAll('.test-class')).toHaveLength(1);
        expect(document.querySelectorAll('.dropdown-menu-right')).toHaveLength(1);
        expect(document.querySelector('.lk-dropdown').textContent).toContain('Test title');
    });
});
