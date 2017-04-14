# react-input-mask

Yet another React component for input masking with attention to small usability details with cursor position, copy-paste, etc.

## [Demo](http://sanniassin.github.io/react-input-mask/demo.html)

## Install
```
npm install react-input-mask --save
```

## Properties
### `mask` : `string`

Mask string. Format characters are:<br/>
<code>9</code>: <code>0-9</code><br/>
<code>a</code>: <code>A-Z, a-z</code><br/>
<code>*</code>: <code>A-Z, a-z, 0-9</code>

Any character can be escaped with backslash, which usually will appear as double backslash in JS strings. For example, German phone mask with unremoveable prefix +49 will look like <code>mask="+4\\9 99 999 99"</code> or <code>mask={"+4\\\\9 99 999 99"}</code>

### `maskChar` : `string`

Character to cover unfilled editable parts of mask. Default character is "_". If set to null, unfilled parts will be empty, like in ordinary input.

### `formatChars` : `object`

Defines format characters with characters as keys and corresponding RegExp string as values. Default ones:
```js
{
  "9": "[0-9]",
  "a": "[A-Za-z]",
  "*": "[A-Za-z0-9]"
}
```

### `alwaysShowMask` : `boolean`

Show mask even in empty input without focus.

## Example
```js
import InputMask from 'react-input-mask';

class PhoneInput extends React.Component {
  render() {
    return <InputMask {...this.props} mask="+4\9 99 999 99" maskChar=" "/>;
  }
}
```

## Known issues
Screen keyboard backspace may not work in Android 4.x browser due to broken input events.

## Thanks
Thanks to [BrowserStack](https://www.browserstack.com/) for help with testing on real devices
