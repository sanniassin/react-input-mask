# react-input-mask

[![Build Status](https://img.shields.io/travis/sanniassin/react-input-mask/master.svg?style=flat)](https://travis-ci.org/sanniassin/react-input-mask) [![npm version](https://img.shields.io/npm/v/react-input-mask.svg?style=flat)](https://www.npmjs.com/package/react-input-mask) [![npm downloads](https://img.shields.io/npm/dm/react-input-mask.svg?style=flat)](https://www.npmjs.com/package/react-input-mask)

Yet another React component for input masking. Made with attention to UX. Compatible with IE8+.

#### [Demo](http://sanniassin.github.io/react-input-mask/demo.html)

## Install
```npm install react-input-mask --save```

Also you can use it without a module bundler
```html
<!-- Load React first -->
<script src="https://unpkg.com/react/dist/react.min.js"></script>
<script src="https://unpkg.com/react-dom/dist/react-dom.min.js"></script>
<!-- Will be exported to window.ReactInputMask -->
<script src="https://unpkg.com/react-input-mask/dist/react-input-mask.min.js"></script>
```

## Properties
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

### `beforeChange` : `function`

In case you need to implement more complex masking behavior, you can provide `beforeChange` function to change masked value and cursor position before it will be applied to the input. `beforeChange` receives following arguments:
1. **value** (string): New masked value.
2. **cursorPosition** (number): New cursor position. `null` if change was triggered by the `blur` event.
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

`beforeChange` must return an object with the following fields:
1. **value** (string): New value.
2. **cursorPosition** (number): New cursor position.

Please note that `beforeChange` executes more often than `onChange`, so it's recommended to make it pure.


## Example
```jsx
import React from 'react';
import InputMask from 'react-input-mask';

class PhoneInput extends React.Component {
  render() {
    return <InputMask {...this.props} mask="+4\9 99 999 99" maskChar=" " />;
  }
}
```

Mask for ZIP Code. Uses beforeChange to omit trailing minus if it wasn't entered by user:
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

  beforeChange = (value, cursorPosition, enteredString) => {
    // keep minus if entered by user
    if (value.endsWith('-') && enteredString !== '-' && !this.state.value.endsWith('-')) {
      if (cursorPosition === value.length) {
        cursorPosition--;
      }
      value = value.slice(0, -1);
    }

    return {
      value: value,
      cursorPosition: cursorPosition
    };
  }

  render() {
    return <InputMask mask="99999-9999" maskChar={null} value={this.state.value} onChange={this.onChange} beforeChange={this.beforeChange} />;
  }
}
```

## Thanks
Thanks to [BrowserStack](https://www.browserstack.com/) for the help with testing on real devices
