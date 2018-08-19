# react-input-mask

[![Build Status](https://img.shields.io/travis/sanniassin/react-input-mask/master.svg?style=flat)](https://travis-ci.org/sanniassin/react-input-mask) [![npm version](https://img.shields.io/npm/v/react-input-mask.svg?style=flat)](https://www.npmjs.com/package/react-input-mask) [![npm downloads](https://img.shields.io/npm/dm/react-input-mask.svg?style=flat)](https://www.npmjs.com/package/react-input-mask)

Input masking component for React. Made with attention to UX. Compatible with IE8+.

#### [Demo](http://sanniassin.github.io/react-input-mask/demo.html)

# Table of Contents
* [Install](#install)
* [Properties](#properties)
* [Examples](#examples)
* [Known Issues](#known-issues)

# Install
```npm install react-input-mask --save```

Also you can use it without a module bundler
```html
<!-- Load React first -->
<script src="https://unpkg.com/react/dist/react.min.js"></script>
<script src="https://unpkg.com/react-dom/dist/react-dom.min.js"></script>
<!-- Will be exported to window.ReactInputMask -->
<script src="https://unpkg.com/react-input-mask/dist/react-input-mask.min.js"></script>
```

# Properties
### `mask` : `string`
Mask string. Default format characters are:<br/>
`9`: `0-9`<br/>
`a`: `A-Z, a-z`<br/>
`*`: `A-Z, a-z, 0-9`

Any character can be escaped with a backslash. It will appear as a double backslash in JS strings. For example, a German phone mask with unremoveable prefix +49 will look like <code>mask="+4\\9 99 999 99"</code> or <code>mask={'+4\\\\9 99 999 99'}</code>

### `maskChar` : `string`
Character to cover unfilled parts of the mask. Default character is "\_". If set to null or empty string, unfilled parts will be empty as in ordinary input.

### `formatChars` : `object`
Defines format characters with characters as a keys and corresponding RegExp strings as a values. Default ones:
```js
{
  '9': '[0-9]',
  'a': '[A-Za-z]',
  '*': '[A-Za-z0-9]'
}
```

### `alwaysShowMask` : `boolean`
Show mask when input is empty and has no focus.

### `inputRef` : `function`
Use `inputRef` instead of `ref` if you need input node to manage focus, selection, etc.

## Experimental :fire:
The following props are considered experimental because they are more prone to issues and are likely to be changed in the future. Use with caution.

### `beforeMaskedValueChange` : `function`
In case you need to implement more complex masking behavior, you can provide `beforeMaskedValueChange` function to change masked value and cursor position before it will be applied to the input. `beforeMaskedValueChange` receives following arguments:
1. **newState** (object): New input state. Contains `value` and `selection` fields. `selection` is null on input blur or when function is called before input mount. Example: `{ value: '12/1_/____', selection: { start: 4, end: 4 } }`
2. **oldState** (object): Input state before change. Contains `value` and `selection` fields. `selection` is null on input focus or when function is called before input mount.
3. **userInput** (string): Raw entered or pasted string. `null` if user didn't enter anything (e.g. triggered by deletion or rerender due to props change).
4. **maskOptions** (object): Mask options. Example:
```js
{
  mask: '99/99/9999',
  maskChar: '_',
  alwaysShowMask: false,
  formatChars: {
    '9': '[0-9]',
    'a': '[A-Za-z]',
    '*': '[A-Za-z0-9]'
  },
  permanents: [2, 5] // permanents is an array of indexes of the non-editable characters in the mask
}
```

`beforeMaskedValueChange` must return an object with following fields:
1. **value** (string): New value.
2. **selection** (object): New selection. If `selection` in `newState` argument is null, it must be null too.

Please note that `beforeMaskedValueChange` executes more often than `onChange` and must be pure.

### `children` : `function`
**NOTE: To make this feature more reliable, please tell about your use case in [this issue](https://github.com/sanniassin/react-input-mask/issues/139)**

To use another component instead of regular `<input />` pass render function as a children. Function receives `props` argument which contains props that aren't used by react-input-mask's internals. I.e. it passes down every prop except the following ones: `onChange`, `onPaste`, `onMouseDown`, `onFocus`, `onBlur`, `value`, `disabled`, `readOnly`. These properties, if used, should always be passed directly to react-input-mask instead of children and shouldn't be altered in chldren's function.
```jsx
import React from 'react';
import InputMask from 'react-input-mask';
import MaterialInput from '@material-ui/core/Input';

// Will work fine
const Input = (props) => (
  <InputMask mask="99/99/9999" value={props.value} onChange={props.onChange}>
    {(inputProps) => <MaterialInput {...inputProps} type="tel" disableUnderline />}
  </InputMask>
);

// Will throw an error because InputMask's and children's onChange aren't the same
const InvalidInput = (props) => (
  <InputMask mask="99/99/9999" value={props.value}>
    {(inputProps) => <MaterialInput {...inputProps} type="tel" disableUnderline onChange={props.onChange} />}
  </InputMask>
);
```

# Examples
```jsx
import React from 'react';
import InputMask from 'react-input-mask';

class PhoneInput extends React.Component {
  render() {
    return <InputMask {...this.props} mask="+4\9 99 999 99" maskChar=" " />;
  }
}
```

Mask for ZIP Code. Uses beforeMaskedValueChange to omit trailing minus if it wasn't entered by user:
```jsx
import React from 'react';
import InputMask from 'react-input-mask';

class Input extends React.Component {
  state = {
    value: ''
  }

  onChange = (event) => {
    this.setState({
      value: event.target.value
    });
  }

  beforeMaskedValueChange = (newState, oldState, userInput) => {
    var { value } = newState;
    var selection = newState.selection;
    var cursorPosition = selection ? selection.start : null;

    // keep minus if entered by user
    if (value.endsWith('-') && userInput !== '-' && !this.state.value.endsWith('-')) {
      if (cursorPosition === value.length) {
        cursorPosition--;
        selection = { start: cursorPosition, end: cursorPosition };
      }
      value = value.slice(0, -1);
    }

    return {
      value,
      selection
    };
  }

  render() {
    return <InputMask mask="99999-9999" maskChar={null} value={this.state.value} onChange={this.onChange} beforeMaskedValueChange={this.beforeMaskedValueChange} />;
  }
}
```

# Known Issues
### Autofill
Browser's autofill requires either empty value in input or value which exactly matches beginning of the autofilled value. I.e. autofilled value "+1 (555) 123-4567" will work with "+1" or "+1 (5", but won't work with "+1 (\_\_\_) \_\_\_-\_\_\_\_" or "1 (555)". There are several possible solutions:
1. Set `maskChar` to null and trim space after "+1" with `beforeMaskedValueChange` if no more digits are entered.
2. Apply mask only if value is not empty. In general, this is the most reliable solution because we can't be sure about formatting in autofilled value.
3. Use less formatting in the mask.

Please note that it might lead to worse user experience (should I enter +1 if input is empty?). You should choose what's more important to your users — smooth typing experience or autofill. Phone and ZIP code inputs are very likely to be autofilled and it's a good idea to care about it, while security confirmation code in two-factor authorization shouldn't care about autofill at all.

# Thanks
Thanks to [BrowserStack](https://www.browserstack.com/) for the help with testing on real devices
