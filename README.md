# react-input-mask

Yet another React component for input maasking.

## Properties
### `mask` : `string`

Mask string. Format characters are:<br/>
<code>9</code>: <code>0-9</code><br/>
<code>a</code>: <code>A-Z, a-z</code><br/>
<code>*</code>: <code>A-Z, a-z, 0-9</code>

Any character can be escaped with backslash, which usually will appear as double backslash in JS strings. For example, German phone mask with unremoveable prefix +49 will look like <code>"+4\\\\9 99 999 99"</code>
