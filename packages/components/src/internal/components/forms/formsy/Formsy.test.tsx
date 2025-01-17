// This file was originally derived from the "formsy-react" package, specifically, v2.3.2.
// Credit: Christian Alfoni and the Formsy Authors
// Repository: https://github.com/formsy/formsy-react/tree/0226fab133a25
import React, { act, FC, PropsWithChildren, memo, useCallback, useRef, useState } from 'react';
import { createEvent, fireEvent, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { FormsyInjectedProps, ValidationError } from './types';
import { Formsy } from './Formsy';
import { withFormsy } from './withFormsy';
import { addFormsyRule } from './formsyRules';

type FormsyInputProps = Omit<React.HTMLProps<HTMLInputElement>, 'required' | 'value'> &
    FormsyInjectedProps<string> & { testId?: string };

const TestInput = withFormsy<FormsyInputProps, any>(props => {
    const { setValue, type } = props;
    const onChange = useCallback(
        evt => {
            setValue(evt.target[type === 'checkbox' ? 'checked' : 'value']);
        },
        [setValue, type]
    );

    return (
        <input
            type={type || 'text'}
            value={props.value || ''}
            onChange={onChange}
            data-is-valid={props.isValid}
            data-is-pristine={props.isPristine}
            data-error-message={props.errorMessage}
            data-error-messages={props.errorMessages.join(';')}
            data-is-form-disabled={props.isFormDisabled}
            data-is-form-submitted={props.isFormSubmitted}
            data-value={JSON.stringify(props.value)}
            data-testid={props.testId}
        />
    );
});

interface DynamicInputFormProps extends PropsWithChildren {
    inputName?: string;
    onSubmit: (model: any) => void;
}

const DynamicInputForm: FC<DynamicInputFormProps> = props => {
    const { children, inputName, onSubmit } = props;
    const [input, setInput] = useState<React.ReactNode>(null);

    const addInput = useCallback(() => {
        setInput(<TestInput name={inputName} value="" testId="test-input" />);
    }, [inputName]);

    return (
        <>
            <Formsy onSubmit={onSubmit} data-testid="form">
                {input}
                {children}
            </Formsy>
            <button type="button" onClick={addInput} data-testid="add-input-btn">
                Add input
            </button>
        </>
    );
};

type TestComponentProps = { name?: string; testId?: string } & FormsyInjectedProps<string>;

class TestComponent extends React.Component<TestComponentProps> {
    render() {
        const { testId, name } = this.props;
        return <input data-testid={testId} name={name} />;
    }
}

const TestInputHoc = withFormsy<TestComponentProps, any>(TestComponent);

describe('Formsy', () => {
    describe('Setting up a form', () => {
        it('should expose the users DOM node through an innerRef prop', () => {
            const refSpy = jest.fn();

            class TestForm extends React.Component {
                render() {
                    return (
                        <Formsy>
                            <TestInputHoc
                                name="name"
                                innerRef={(ref: any) => {
                                    if (!ref) {
                                        return;
                                    }

                                    refSpy(ref.constructor.name);
                                }}
                                testId="test-input"
                            />
                        </Formsy>
                    );
                }
            }

            render(<TestForm />);

            expect(refSpy).toHaveBeenCalledWith('TestComponent');
        });

        it('should render a form into the document', () => {
            const screen = render(<Formsy data-testid="form" />);
            const form = screen.getByTestId('form') as HTMLFormElement;

            expect(form.tagName.toLowerCase()).toEqual('form');
        });

        it('should set a class name if passed', () => {
            const screen = render(<Formsy data-testid="form" className="foo" />);
            const form = screen.getByTestId('form') as HTMLFormElement;

            expect(form.classList.contains('foo')).toBe(true);
        });

        it('should allow for null/undefined children', () => {
            const submitSpy = jest.fn();

            function TestForm() {
                return (
                    <Formsy onSubmit={formModel => submitSpy(formModel)} data-testid="form">
                        <h1>Test</h1>
                        {null}
                        {undefined}
                        <TestInput name="name" value="foo" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            fireEvent.submit(form);

            expect(submitSpy).toHaveBeenCalledWith({ name: 'foo' });
        });

        it('should allow for inputs being added dynamically', () => {
            const submitSpy = jest.fn();

            const screen = render(<DynamicInputForm onSubmit={formModel => submitSpy(formModel)} inputName="test" />);
            const form = screen.getByTestId('form');
            const addInputBtn = screen.getByTestId('add-input-btn');

            fireEvent.click(addInputBtn);
            fireEvent.submit(form);

            expect(submitSpy).toHaveBeenCalledWith({ test: '' });
        });

        it('should allow dynamically added inputs to update the form-model', () => {
            const submitSpy = jest.fn();

            const screen = render(<DynamicInputForm onSubmit={formModel => submitSpy(formModel)} inputName="test" />);
            const form = screen.getByTestId('form');
            const addInputBtn = screen.getByTestId('add-input-btn');

            fireEvent.click(addInputBtn);

            fireEvent.change(screen.getByTestId('test-input'), {
                target: { value: 'foo' },
            });

            fireEvent.submit(form);

            expect(submitSpy).toHaveBeenCalledWith({ test: 'foo' });
        });

        it('should allow a dynamically updated input to update the form-model', () => {
            const submitSpy = jest.fn();

            class TestForm extends React.Component<{ inputValue: any }, { inputValue: any }> {
                constructor(props) {
                    super(props);
                    this.state = { inputValue: props.inputValue };
                }

                updateInputValue = () => this.setState({ inputValue: 'bar' });

                render() {
                    const { inputValue } = this.state;
                    return (
                        <Formsy onSubmit={formModel => submitSpy(formModel)} data-testid="form">
                            <TestInput name="test" value={inputValue} testId="test-input" />
                            <button type="button" onClick={this.updateInputValue} data-testid="update-btn">
                                Update
                            </button>
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm inputValue="foo" />);
            const form = screen.getByTestId('form');
            const updateBtn = screen.getByTestId('update-btn');

            fireEvent.submit(form);

            expect(submitSpy).toHaveBeenCalledWith({ test: 'foo' });

            fireEvent.click(updateBtn);
            fireEvent.submit(form);

            expect(submitSpy).toHaveBeenCalledWith({ test: 'bar' });
        });
    });

    describe('mapModel', () => {
        it('should honor mapModel transformations', () => {
            const mapping = jest.fn(model => ({
                ...model,
                testChange: true,
            }));
            const onSubmit = jest.fn();

            function TestForm() {
                return (
                    <Formsy mapping={mapping} onSubmit={onSubmit} data-testid="form">
                        <TestInput name="parent.child" value="test" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            fireEvent.submit(form);

            expect(mapping).toHaveBeenCalledWith({ 'parent.child': 'test' });
            expect(onSubmit).toHaveBeenCalledWith(
                { 'parent.child': 'test', testChange: true },
                expect.any(Function),
                expect.any(Function),
                expect.any(Object)
            );
        });
    });

    describe('validations', () => {
        it('should run when the input changes', () => {
            const runRule = jest.fn();
            const notRunRule = jest.fn();

            addFormsyRule('runRule', runRule);
            addFormsyRule('notRunRule', notRunRule);

            const screen = render(
                <Formsy>
                    <TestInput name="one" validations="runRule" value="foo" testId="test-input" />
                </Formsy>
            );

            const input = screen.getByTestId('test-input');
            fireEvent.change(input, {
                target: { value: 'bar' },
            });

            expect(runRule).toHaveBeenCalledWith({ one: 'bar' }, 'bar', true);
            expect(notRunRule).not.toHaveBeenCalled();
        });

        it('should allow the validation to be changed', () => {
            const ruleA = jest.fn();
            const ruleB = jest.fn();
            addFormsyRule('ruleA', ruleA);
            addFormsyRule('ruleB', ruleB);

            class TestForm extends React.Component<{}, { rule: string }> {
                constructor(props) {
                    super(props);
                    this.state = { rule: 'ruleA' };
                }

                changeRule = () => {
                    this.setState({
                        rule: 'ruleB',
                    });
                };

                render() {
                    return (
                        <Formsy>
                            <TestInput name="one" validations={this.state.rule} value="foo" testId="test-input" />
                            <button type="button" onClick={this.changeRule} data-testid="change-rule-btn" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const changeRuleBtn = screen.getByTestId('change-rule-btn');
            const input = screen.getByTestId('test-input');

            fireEvent.click(changeRuleBtn);

            fireEvent.change(input, {
                target: { value: 'bar' },
            });

            expect(ruleB).toHaveBeenCalledWith({ one: 'bar' }, 'bar', true);
        });

        it('should invalidate a form if dynamically inserted input is invalid', () => {
            const isInValidSpy = jest.fn();
            const isValidSpy = jest.fn();

            class TestForm extends React.Component<{}, { showSecondInput: boolean }> {
                formRef = React.createRef<Formsy>();

                constructor(props) {
                    super(props);
                    this.state = { showSecondInput: false };
                }

                addInput = () => {
                    this.setState({
                        showSecondInput: true,
                    });
                };

                render() {
                    return (
                        <Formsy ref={this.formRef} onInvalid={isInValidSpy} onValid={isValidSpy}>
                            <TestInput name="one" validations="isEmail" value="foo@bar.com" />
                            {this.state.showSecondInput ? (
                                <TestInput name="two" validations="isEmail" value="foo@bar" />
                            ) : null}
                            <button type="button" onClick={this.addInput} data-testid="add-input-btn" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const addInputBtn = screen.getByTestId('add-input-btn');

            expect(isValidSpy).toHaveBeenCalled();

            fireEvent.click(addInputBtn);

            expect(isInValidSpy).toHaveBeenCalled();
        });

        it('should validate a form when removing an invalid input', () => {
            const isValidSpy = jest.fn();
            const isInValidSpy = jest.fn();

            class TestForm extends React.Component<{}, { showSecondInput: boolean }> {
                formRef = React.createRef<Formsy>();

                constructor(props) {
                    super(props);
                    this.state = { showSecondInput: true };
                }

                removeInput = () => {
                    this.setState({
                        showSecondInput: false,
                    });
                };

                render() {
                    return (
                        <Formsy ref={this.formRef} onValid={isValidSpy} onInvalid={isInValidSpy}>
                            <TestInput name="one" validations="isEmail" value="foo@bar.com" />
                            {this.state.showSecondInput ? (
                                <TestInput name="two" validations="isEmail" value="foo@bar" />
                            ) : null}
                            <button type="button" onClick={this.removeInput} data-testid="remove-input-btn" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const removeInputBtn = screen.getByTestId('remove-input-btn');

            expect(isInValidSpy).toHaveBeenCalled();

            fireEvent.click(removeInputBtn);

            expect(isValidSpy).toHaveBeenCalled();
        });

        it('runs multiple validations', () => {
            const ruleA = jest.fn();
            const ruleB = jest.fn();
            addFormsyRule('ruleA', ruleA);
            addFormsyRule('ruleB', ruleB);

            const screen = render(
                <Formsy>
                    <TestInput name="one" validations="ruleA,ruleB" value="foo" testId="test-input" />
                </Formsy>
            );

            const input = screen.getByTestId('test-input');

            fireEvent.change(input, { target: { value: 'bar' } });

            expect(ruleA).toHaveBeenCalledWith({ one: 'bar' }, 'bar', true);
            expect(ruleB).toHaveBeenCalledWith({ one: 'bar' }, 'bar', true);
        });
    });

    describe('onChange', () => {
        it('should not trigger onChange when form is mounted', () => {
            const hasChanged = jest.fn();

            function TestForm() {
                return <Formsy onChange={hasChanged} data-testid="form" />;
            }

            render(<TestForm />);
            expect(hasChanged).not.toHaveBeenCalled();
        });

        it('should trigger onChange once when form element is changed', () => {
            const hasChanged = jest.fn();
            const screen = render(
                <Formsy onChange={hasChanged}>
                    <TestInput name="foo" value="" testId="test-input" />
                </Formsy>
            );

            fireEvent.change(screen.getByTestId('test-input'), { target: { value: 'bar' } });

            expect(hasChanged).toHaveBeenCalledTimes(1);
        });

        it('should trigger onChange once when new input is added to form', () => {
            const hasChanged = jest.fn();

            class TestForm extends React.Component<{}, { showInput: boolean }> {
                constructor(props) {
                    super(props);
                    this.state = {
                        showInput: false,
                    };
                }

                showInput = () => {
                    this.setState({
                        showInput: true,
                    });
                };

                render() {
                    return (
                        <Formsy onChange={hasChanged}>
                            {this.state.showInput ? <TestInput name="test" /> : null}
                            <button type="button" onClick={this.showInput} data-testid="show-input-btn" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const showInputBtn = screen.getByTestId('show-input-btn');

            fireEvent.click(showInputBtn);

            expect(hasChanged).toHaveBeenCalledTimes(1);
        });
    });

    describe('Update a form', () => {
        it('should allow elements to check if the form is disabled', () => {
            class TestForm extends React.Component<{}, { disabled: boolean }> {
                constructor(props) {
                    super(props);
                    this.state = {
                        disabled: true,
                    };
                }

                enableForm = () => {
                    this.setState({ disabled: false });
                };

                render() {
                    return (
                        <Formsy disabled={this.state.disabled}>
                            <TestInput name="foo" testId="test-input" />
                            <button type="button" onClick={this.enableForm} data-testid="enable-form-btn" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input');
            const enableFormBtn = screen.getByTestId('enable-form-btn');

            expect(input.dataset.isFormDisabled).toEqual('true');

            fireEvent.click(enableFormBtn);

            expect(input.dataset.isFormDisabled).toEqual('false');
        });

        it('should be possible to pass error state of elements by changing an errors attribute', () => {
            class TestForm extends React.Component<
                {},
                { validationErrors: { [key: string]: React.ReactNode }; value: string }
            > {
                constructor(props) {
                    super(props);
                    this.state = {
                        validationErrors: { foo: 'bar' },
                        value: '',
                    };
                }

                onChange = values => {
                    this.setState(values.foo ? { validationErrors: {} } : { validationErrors: { foo: 'bar' } });
                };

                changeValue = () => {
                    this.setState({ value: 'new value' });
                };

                render() {
                    return (
                        <Formsy onChange={this.onChange} validationErrors={this.state.validationErrors}>
                            <TestInput name="foo" value={this.state.value} testId="test-input" />
                            <button type="button" onClick={this.changeValue} data-testid="change-value-btn" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input');
            const changeValueBtn = screen.getByTestId('change-value-btn');
            expect(input.dataset.errorMessage).toEqual('bar');

            fireEvent.click(changeValueBtn);

            expect(input.dataset.errorMessage).toEqual(undefined);
        });

        it('should prevent a default submit', () => {
            function TestForm() {
                return (
                    <Formsy data-testid="form">
                        <TestInput name="foo" validations="isEmail" value="foo@bar.com" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            const event = createEvent.submit(form);
            event.preventDefault = jest.fn();

            fireEvent(form, event);

            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should not prevent a default submit when preventDefaultSubmit is passed', () => {
            function TestForm() {
                return (
                    <Formsy data-testid="form" preventDefaultSubmit={false}>
                        <TestInput name="foo" validations="isEmail" value="foo@bar.com" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            const event = createEvent.submit(form);
            event.preventDefault = jest.fn();

            fireEvent(form, event);

            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('should trigger an onValidSubmit when submitting a valid form', () => {
            const isCalled = jest.fn();

            function TestForm() {
                return (
                    <Formsy onValidSubmit={isCalled} data-testid="form">
                        <TestInput name="foo" validations="isEmail" value="foo@bar.com" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            fireEvent.submit(form);

            expect(isCalled).toHaveBeenCalled();
        });

        it('should trigger an onInvalidSubmit when submitting an invalid form', () => {
            const isCalled = jest.fn();

            function TestForm() {
                return (
                    <Formsy onInvalidSubmit={isCalled} data-testid="form">
                        <TestInput name="foo" validations="isEmail" value="foo@bar" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            fireEvent.submit(form);

            expect(isCalled).toHaveBeenCalled();
        });
    });

    describe('value === false', () => {
        it('should call onSubmit correctly', () => {
            const onSubmit = jest.fn();

            function TestForm() {
                return (
                    <Formsy onSubmit={onSubmit} data-testid="form">
                        <TestInput name="foo" value={false} type="checkbox" />
                        <button type="submit">Save</button>
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            fireEvent.submit(form);

            expect(onSubmit).toHaveBeenCalledWith(
                { foo: false },
                expect.any(Function),
                expect.any(Function),
                expect.any(Object)
            );
        });

        it('should allow dynamic changes to false', () => {
            const onSubmit = jest.fn();

            class TestForm extends React.Component<{}, { value: boolean }> {
                constructor(props) {
                    super(props);
                    this.state = {
                        value: true,
                    };
                }

                changeValue = () => {
                    this.setState({
                        value: false,
                    });
                };

                render() {
                    return (
                        <Formsy onSubmit={onSubmit} data-testid="form">
                            <TestInput name="foo" value={this.state.value} type="checkbox" />
                            <button type="button" data-testid="change-value-btn" onClick={this.changeValue}>
                                Save
                            </button>
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');
            const changeValueBtn = screen.getByTestId('change-value-btn');

            fireEvent.click(changeValueBtn);
            fireEvent.submit(form);

            expect(onSubmit).toHaveBeenCalledWith(
                { foo: false },
                expect.any(Function),
                expect.any(Function),
                expect.any(Object)
            );
        });

        it('should say the form is submitted', () => {
            function TestForm() {
                return (
                    <Formsy>
                        <TestInput name="foo" value type="checkbox" testId="test-input" />
                        <button type="submit" data-testid="submit-btn">
                            Save
                        </button>
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input');
            const submitBtn = screen.getByTestId('submit-btn');

            expect(input.dataset.isFormSubmitted).toEqual('false');

            fireEvent.click(submitBtn);

            expect(input.dataset.isFormSubmitted).toEqual('true');
        });

        it('should be able to reset the form to its pristine state', () => {
            class TestForm extends React.Component<{}, { value: boolean }> {
                constructor(props) {
                    super(props);
                    this.state = {
                        value: true,
                    };
                }

                changeValue = () => {
                    this.setState({
                        value: false,
                    });
                };

                render() {
                    return (
                        <Formsy>
                            <TestInput name="foo" value={this.state.value} type="checkbox" testId="test-input" />
                            <button type="button" onClick={this.changeValue} data-testid="change-value-btn">
                                Change value
                            </button>
                            <button type="reset" data-testid="reset-btn">
                                Rest value
                            </button>
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input') as HTMLInputElement;
            const changeValueBtn = screen.getByTestId('change-value-btn');
            const resetBtn = screen.getByTestId('reset-btn');

            expect(input.dataset.value).toEqual('true');

            fireEvent.click(changeValueBtn);

            expect(input.dataset.value).toEqual('false');

            fireEvent.click(resetBtn);

            expect(input.dataset.value).toEqual('true');
        });

        it('should be able to set a value to components with updateInputsWithValue', () => {
            class TestForm extends React.Component<{}, { valueBar: boolean; valueFoo: boolean }> {
                formRef = React.createRef<Formsy>();

                constructor(props) {
                    super(props);
                    this.state = {
                        valueBar: true,
                        valueFoo: true,
                    };
                }

                updateInputsWithValue = () => {
                    this.formRef.current.updateInputsWithValue({ foo: false });
                };

                render() {
                    return (
                        <Formsy ref={this.formRef}>
                            <TestInput name="foo" value={this.state.valueFoo} type="checkbox" testId="test-input1" />
                            <TestInput name="bar" value={this.state.valueBar} type="checkbox" testId="test-input2" />
                            <button type="button" onClick={this.updateInputsWithValue} data-testid="update-btn" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const input1 = screen.getByTestId('test-input1');
            const input2 = screen.getByTestId('test-input2');
            const updateBtn = screen.getByTestId('update-btn');

            expect(input1.dataset.value).toEqual('true');
            expect(input2.dataset.value).toEqual('true');

            fireEvent.click(updateBtn);

            expect(input1.dataset.value).toEqual('false');
            expect(input2.dataset.value).toEqual('true');
        });

        it('should be able to reset the form using custom data', () => {
            class TestForm extends React.Component<{}, { value: number }> {
                formRef = React.createRef<Formsy>();

                constructor(props) {
                    super(props);
                    this.state = {
                        value: 1,
                    };
                }

                changeValue = () => {
                    this.setState({
                        value: 2,
                    });
                };

                resetValues = () => {
                    this.formRef.current.reset({
                        foo: 3,
                    });
                };

                render() {
                    const { value } = this.state;

                    return (
                        <Formsy ref={this.formRef}>
                            <TestInput name="foo" value={value} testId="test-input1" />
                            <button type="button" onClick={this.changeValue} data-testid="change-value-btn" />
                            <button type="button" onClick={this.resetValues} data-testid="reset-btn" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const input1 = screen.getByTestId('test-input1') as HTMLInputElement;
            const updateValueBtn = screen.getByTestId('change-value-btn');
            const resetBtn = screen.getByTestId('reset-btn');

            expect(input1.value).toEqual('1');

            fireEvent.click(updateValueBtn);

            expect(input1.value).toEqual('2');

            fireEvent.click(resetBtn);

            expect(input1.value).toEqual('3');
        });
    });

    describe('.reset()', () => {
        it('should be able to reset the form to empty values', () => {
            function TestForm() {
                const formRef = useRef<Formsy>();
                return (
                    <Formsy ref={formRef}>
                        <TestInput name="foo" value="42" type="checkbox" testId="test-input" />
                        <button
                            type="button"
                            onClick={() =>
                                formRef.current.reset({
                                    foo: '',
                                })
                            }
                            data-testid="reset-btn"
                        >
                            Reset
                        </button>
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input') as HTMLInputElement;
            const resetBtn = screen.getByTestId('reset-btn');

            fireEvent.click(resetBtn);

            expect(input.value).toEqual('');
        });

        it('should be able to reset the form using a button', () => {
            function TestForm() {
                return (
                    <Formsy>
                        <TestInput name="foo" value="foo" testId="test-input" />
                        <button type="reset" data-testid="reset-btn">
                            Reset
                        </button>
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input') as HTMLInputElement;
            const resetBtn = screen.getByTestId('reset-btn');

            expect(input.value).toEqual('foo');

            fireEvent.change(input, { target: { value: 'foobar' } });

            expect(input.value).toEqual('foobar');

            fireEvent.click(resetBtn);

            expect(input.value).toEqual('foo');
        });
    });

    describe('.isChanged()', () => {
        it('initially returns false', () => {
            const hasOnChanged = jest.fn();
            const formRef = React.createRef<Formsy>();
            render(
                <Formsy onChange={hasOnChanged} ref={formRef}>
                    <TestInput name="one" value="foo" />
                </Formsy>
            );

            expect(formRef.current.isChanged()).toEqual(false);
            expect(hasOnChanged).not.toHaveBeenCalled();
        });

        it('returns true when changed', () => {
            const hasOnChanged = jest.fn();
            const screen = render(
                <Formsy onChange={hasOnChanged}>
                    <TestInput name="one" value="foo" testId="test-input" />
                </Formsy>
            );
            const input = screen.getByTestId('test-input');
            fireEvent.change(input, {
                target: { value: 'bar' },
            });

            expect(hasOnChanged).toHaveBeenCalledWith({ one: 'bar' }, true);
        });

        it('returns false if changes are undone', () => {
            const hasOnChanged = jest.fn();
            const screen = render(
                <Formsy onChange={hasOnChanged}>
                    <TestInput name="one" value="foo" testId="test-input" />
                </Formsy>
            );
            const input = screen.getByTestId('test-input');
            fireEvent.change(input, {
                target: { value: 'bar' },
            });
            expect(hasOnChanged).toHaveBeenCalledWith({ one: 'bar' }, true);

            fireEvent.change(input, {
                target: { value: 'foo' },
            });
            expect(hasOnChanged).toHaveBeenCalledWith({ one: 'foo' }, false);
        });
    });

    describe('form valid state', () => {
        it('should allow to be changed with updateInputsWithError', () => {
            let isValid = true;

            class TestForm extends React.Component {
                onValidSubmit = (_model, _reset, updateInputsWithError) => {
                    updateInputsWithError({ foo: 'bar' }, true);
                };

                onValid = () => {
                    isValid = true;
                };

                onInvalid = () => {
                    isValid = false;
                };

                render() {
                    return (
                        <Formsy
                            onInvalid={this.onInvalid}
                            onValid={this.onValid}
                            onValidSubmit={this.onValidSubmit}
                            data-testid="form"
                        >
                            <TestInput name="foo" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            expect(isValid).toEqual(true);
            fireEvent.submit(form);

            expect(isValid).toEqual(false);
        });

        it('should throw an error when updateInputsWithError is called with a missing input', () => {
            const mockConsoleError = jest.spyOn(console, 'error');
            mockConsoleError.mockImplementation(() => {
                // do nothing
            });

            const errorSpy = jest.fn();

            class TestForm extends React.Component {
                onValidSubmit = (_model, _reset, updateInputsWithError) => {
                    try {
                        updateInputsWithError({ bar: 'bar' }, true);
                    } catch (e) {
                        errorSpy(e.message);
                    }
                };

                componentDidCatch(error: Error) {
                    errorSpy(error);
                }

                render() {
                    return (
                        <Formsy onValidSubmit={this.onValidSubmit} data-testid="form">
                            <TestInput name="foo" testId="test-input" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');
            fireEvent.submit(form);
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining('You are trying to update an input that does not exist')
            );
            mockConsoleError.mockRestore();
        });

        it('should be false when validationErrors is not empty', () => {
            let isValid = true;

            class TestForm extends React.Component<
                {},
                {
                    validationErrors: { [key: string]: ValidationError };
                }
            > {
                constructor(props) {
                    super(props);
                    this.state = {
                        validationErrors: {},
                    };
                }

                setValidationErrors = (empty?: unknown) => {
                    this.setState(!empty ? { validationErrors: { foo: 'bar' } } : { validationErrors: {} });
                };

                onValid = () => {
                    isValid = true;
                };

                onInvalid = () => {
                    isValid = false;
                };

                render() {
                    return (
                        <Formsy
                            onInvalid={this.onInvalid}
                            onValid={this.onValid}
                            validationErrors={this.state.validationErrors}
                        >
                            <TestInput name="foo" />
                            <button
                                type="button"
                                onClick={() => this.setValidationErrors()}
                                data-testid="validation-btn"
                            />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const validationBtn = screen.getByTestId('validation-btn');

            expect(isValid).toEqual(true);
            fireEvent.click(validationBtn);
            expect(isValid).toEqual(false);
        });

        it('should be true when validationErrors is not empty and preventExternalInvalidation is true', () => {
            let isValid = true;

            class TestForm extends React.Component<
                {},
                {
                    validationErrors: { [key: string]: ValidationError };
                }
            > {
                constructor(props) {
                    super(props);
                    this.state = {
                        validationErrors: {},
                    };
                }

                setValidationErrors = (empty?: unknown) => {
                    this.setState(!empty ? { validationErrors: { foo: 'bar' } } : { validationErrors: {} });
                };

                onValid = () => {
                    isValid = true;
                };

                onInvalid = () => {
                    isValid = false;
                };

                render() {
                    return (
                        <Formsy
                            onInvalid={this.onInvalid}
                            onValid={this.onValid}
                            preventExternalInvalidation
                            validationErrors={this.state.validationErrors}
                        >
                            <TestInput name="foo" />
                            <button
                                type="button"
                                onClick={() => this.setValidationErrors()}
                                data-testid="validation-btn"
                            />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const validationBtn = screen.getByTestId('validation-btn');

            expect(isValid).toEqual(true);

            fireEvent.click(validationBtn);

            expect(isValid).toEqual(true);
        });

        describe('revalidation', () => {
            beforeEach(() => {
                jest.useFakeTimers({ advanceTimers: true });
            });

            afterEach(() => {
                jest.useRealTimers();
            });

            it('should revalidate form when input added dynamically', async () => {
                const onValidSpy = jest.fn();
                const onInvalidSpy = jest.fn();

                const Inputs = memo(() => {
                    const [counter, setCounter] = useState(1);

                    const onClick = useCallback(() => {
                        setCounter(c => c + 1);
                    }, []);

                    return (
                        <>
                            <button type="button" onClick={onClick} data-testid="add-btn">
                                +
                            </button>
                            {Array.from(Array(counter)).map((_, index) => (
                                <TestInput
                                    key={index}
                                    name={`foo-${index}`}
                                    required
                                    value={index === 0 ? 'bla' : undefined}
                                />
                            ))}
                        </>
                    );
                });

                const TestForm = memo(() => {
                    return (
                        <Formsy onInvalid={onInvalidSpy} onValid={onValidSpy}>
                            <Inputs />
                        </Formsy>
                    );
                });

                const screen = render(<TestForm />);
                const plusButton = screen.getByTestId('add-btn');

                expect(onValidSpy).toHaveBeenCalledTimes(1);
                onValidSpy.mockReset();
                expect(onInvalidSpy).not.toHaveBeenCalled();

                await act(async () => {
                    await userEvent.click(plusButton);
                    jest.runAllTimers();
                });

                expect(onValidSpy).not.toHaveBeenCalled();
                expect(onInvalidSpy).toHaveBeenCalledTimes(2);
            });
        });

        it('should revalidate form once when mounting multiple inputs', () => {
            const validSpy = jest.fn();
            const TestForm = () => (
                <Formsy onValid={validSpy}>
                    {/* onValid is called each time the form revalidates */}
                    {Array.from(Array(5)).map((_, index) => (
                        <TestInput key={index} name={`foo-${index}`} required value="bla" />
                    ))}
                </Formsy>
            );

            render(<TestForm />);

            expect(validSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('onSubmit/onValidSubmit/onInvalidSubmit', () => {
        ['onSubmit', 'onValidSubmit', 'onInvalidSubmit'].forEach(key => {
            it(`should pass submit event to "${key}"`, () => {
                const submitSpy = jest.fn();

                const screen = render(
                    <Formsy {...{ [key]: submitSpy }}>
                        <button type="submit" data-testid="submit-btn" />
                        {key === 'onInvalidSubmit' && <TestInput name="test" required />}
                    </Formsy>
                );
                const button = screen.getByTestId('submit-btn');

                fireEvent.click(button);

                expect(submitSpy).toHaveBeenCalledWith(
                    expect.any(Object),
                    expect.any(Function),
                    expect.any(Function),
                    expect.any(Object)
                );
            });
        });
    });
});
