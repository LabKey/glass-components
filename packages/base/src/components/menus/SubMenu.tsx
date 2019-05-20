import * as React from "react";
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap'
import { List } from 'immutable'

import { ISubItem, SubMenuItem } from './SubMenuItem'

export interface MenuOption {
    disabled?: boolean
    disabledMsg?: string
    href: string
    name: string
    key: string
}

interface SubMenuProps {
    currentMenuChoice?: string
    options: List<MenuOption>
    text: string
}

export class SubMenu extends React.Component<SubMenuProps, any> {

    constructor(props: SubMenuProps) {
        super(props);

        this.isCurrentMenuChoice = this.isCurrentMenuChoice.bind(this);
    }

    isCurrentMenuChoice(option: MenuOption): boolean {
        const { currentMenuChoice } = this.props;
        return currentMenuChoice && option.key.toLowerCase() === currentMenuChoice.toLowerCase();
    }

    getCurrentMenuChoiceItem() {
        const { options } = this.props;
        const currentOption = options.find(this.isCurrentMenuChoice);

        if (currentOption) {
            return this.renderMenuItem(currentOption, 0);
        }

        return undefined;
    }

    getItems(): Array<ISubItem> {
        const { options } = this.props;

        let items = [];
        options.forEach(option => {
            if (!this.isCurrentMenuChoice(option)) {
                items.push({
                    disabled: option.disabled,
                    disabledMsg: option.disabledMsg,
                    text: option.name,
                    href: option.href
                });
            }
        });
        return items;
    }

    renderMenuItem(option: MenuOption, key: any) {
        let itemProps = Object.assign({}, option);

        // remove ISubItem specific props
        delete itemProps.name;
        delete itemProps.disabledMsg;

        const menuItem = (
            <MenuItem
                {...itemProps}
                key={key}>
                {option.name}
            </MenuItem>
        );

        if (option.disabledMsg && option.disabled) {
            const overlay = <Popover id="attach-submenu-warning">{option.disabledMsg}</Popover>;
            return (
                <OverlayTrigger overlay={overlay} placement={"right"}>
                    {menuItem}
                </OverlayTrigger>
            );
        }
        return menuItem;
    }

    render() {
        const { currentMenuChoice, options, text } = this.props;

        let items = [];
        // if there are 2 items or fewer, just show the items as the menu
        if (currentMenuChoice && options.size < 3) {
            options.forEach((option, i) => {
                items.push(
                    this.renderMenuItem(option, i)
                )
            });
        }
        else {
            if (currentMenuChoice) {
                items.push(this.getCurrentMenuChoiceItem());
            }
            let menuProps = {
                key: 1,
                items: this.getItems(),
                maxWithoutFilter: 10,
                text
            };
            items.push(<SubMenuItem {...menuProps}/>);
        }

        return items;
    }
}