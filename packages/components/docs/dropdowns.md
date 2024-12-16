# Dropdown Menu Components
### DropdownButton, DropdownMenu, SplitButton, and MenuItem

We have an internal set of components for creating Bootstrap Drodpown menus. This set of comoponents is similar to the
react-bootstrap components, but differs in a few critical ways. Most notably our internal components do not require an
`id` prop, instead we automatically generate the necessary ids.

## DropdownButton
Our `DropdownButton` is nearly identical to the react-bootstrap version, which only a few minor differences. As stated
above, it does not have an `id` prop, instead that is automatically generated for you. Our version also provides a few
different ways to add classNames to the component:

- `bsStyle`: This is the "bootstrap style" you want the button to appear as, e.g. "success", it defaults to "default"
- `className`: This is a className that will be applied to the outermost div rendered by `DropdownButton`
  - use this to provide a unique clasName that makes it easier to identify the dropdown in the DOM, which is useful for
  tests (see below) as well as debugging in production systems
- `buttonClassName`: This is a className applied to the button that toggles the dropdown menu
  - use this if you need to apply some distinct styling to your dropdown toggle

This component is wrapped in `forwardRef` and has an `onMouseEnter` and `onMouseLeave`, which allows it to be used in
conjunction with `Popover` and `Tooltip`:

```typescript jsx
const MySpecialDropdown = () => {
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState<HTMLDivElement>(
        'special-dropdown-portal-id',
        true,
        false,
        200
    );
    const tooltip = (
        <Tooltip id="view-menu-tooltip" placement="top" targetRef={targetRef}>
            Special Tooltip
        </Tooltip>
    );

    return (
        <DropdownButton
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            title="I am so very special"
            ref={targetRef}
        >
            /* ... */
            {show && createPortal(tooltip, portalEl)}
        </DropdownButton>
    );
};
```

## SplitButton
Our `SplitButton` is nearly identical to the react-bootstrap version, which only a few minor differences. As stated
above, it does not have an `id` prop, instead that is automatically generated for you. Our version also provides a few
different ways to add classNames to the component:

- `bsStyle`: This is the "bootstrap style" you want the button to appear as, e.g. "success", it defaults to "default"
- `className`: This is a className that will be applied to the outermost div rendered by `SplitButton`
  - use this to provide a unique clasName that makes it easier to identify the dropdown in the DOM, which is useful for
    tests (see below) as well as debugging in production systems
- `buttonClassName`: This is a className applied to the button that renders to the left of the dropdown toggle
  - use this if you need to apply some distinct styling to your button
- `toggleClassName`: This is a className applied to the button that toggles the dropdown menu
  - use this if you need to apply some distinct styling to your dropdown toggle

We also provide three ways to enable or disable parts of the component:
- `disabled`: disables the button and the dropdown toggle, this is the react-boostrap behavior
- `buttonDisabled`: disables the button, but does not affect the dropdown toggle
- `menuDisabled`:  disables the dropdown toggle, preventing the menu from being opened


## DropdownMenu
`DropdownMenu` is our own custom component meant to replace the "low level" usages of the react-bootstrap `Dropdown`,
`Dropdown.Toggle` and `Dropdown.Menu` components. It's most useful when you need a dropdown menu, but you don't want it
styled like a button (see the usage in ThreadBlock.tsx). Previously to accomplish this you'd need to do something like:

```typescript jsx
<Dropdown componentClass="div" id="my-anchor-menu">
    <Dropdown.Toggle useAnchor={true}>
        <i className="fa fa-ellipsis-v" />
    </Dropdown.Toggle>
    <Dropdown.Menu className="pull-right">
        <MenuItem onClick={doThing}>
            Do Thing
        </MenuItem>
        <MenuItem onClick={doOtherThing}>
            Do Other Thing
        </MenuItem>
    </Dropdown.Menu>
</Dropdown>
```

But now you can do this:

```typescript jsx
import { DropdownMenu, MenuItem } from '@labkey/components';

<DropdownMenu title={<i className="fa fa-ellipsis-v" />}>
    <MenuItem onClick={doThing}>
        Do Thing
    </MenuItem>
    <MenuItem onClick={doOtherThing}>
        Do Other Thing
    </MenuItem>
</DropdownMenu>
```

## MenuItem, MenuHeader, MenuDivider

Our `MenuItem` component is mostly the same as the react-bootstrap version, but it does not accept the `header` or
`divider` props; instead, we have `<MenuHeader />` and `<MenuDivider />` components:

```typescript jsx
import { DropdownButton, MenuDivider, MenuHeader } from '@labkey/components';

<DropdownButton title="I am so very special">
    <MenuHeader text="My Section" />
    <MenuItem>Section 1 Item 1</MenuItem>
    <MenuItem>Section 1 Item 2</MenuItem>
    <MenuDivider />
    <MenuHeader text="My Other Section" />
    <MenuItem>Section 2 Item 1</MenuItem>
    <MenuItem>Section 2 Item 2</MenuItem>
</DropdownButton>
```

Like the `DropdownButton` our `MenuItem` is also wrapped with `ForwardRef` so you can render them with `Tooltip` or
`Popover` components. We already have wrapped versions of `MenuItem` that provide this functionality, so you should
probably consider using those instead of wiring it up yourself (see `SelectionMenuItem.tsx` and
`DisableableMenuItem.tsx`).

## Selenium Tests
When writing selenium tests you should be able to use the `MultiMenu.MultiMenuFinder` in order to locate a dropdown menu
on the page. If your search context only has a single menu all you should need to do is something like:

```Java
MultiMenu dropdown = new MultiMenu.MultiMenuFinder(getDriver()).findWhenNeeded(this);
```

If you have multiple dropdowns next to each other it is best to give each one a descriptive className like so:

```typescript jsx
import { DropdownButton } from '@labkey/components';

<DropdownButton className="my-special-dropdown" title="I am so very special">
    /* ... */
</DropdownButton>
```

Then in your selenium test code you can find it via `withClass`:

```java
MultiMenu dropdown = new MultiMenu.MultiMenuFinder(getDriver()).withClass("my-special-dropdown").findWhenNeeded(this);
```
