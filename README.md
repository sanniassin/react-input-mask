# react-input-mask

Yet another React component for input masking with attention to small usability details with cursor position, copy-paste, etc.

## Demo
http://codepen.io/anon/pen/LVLKPR

## Properties
### `mask` : `string`

Mask string. Format characters are:<br/>
<code>9</code>: <code>0-9</code><br/>
<code>a</code>: <code>A-Z, a-z</code><br/>
<code>*</code>: <code>A-Z, a-z, 0-9</code>

Any character can be escaped with backslash, which usually will appear as double backslash in JS strings. For example, German phone mask with unremoveable prefix +49 will look like <code>"+4\\\\9 99 999 99"</code>

### `maskChar` : `string`

Character to cover unfilled editable parts of mask. Default character is "_"

## Example
```js
var PhoneInput = React.createClass({
  render: function() {
    return <InputElement {...this.props} mask="+4\\9 99 999 99" maskChar=" "/>;
  }
});
```
