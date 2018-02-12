(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react')) :
	typeof define === 'function' && define.amd ? define(['react'], factory) :
	(global.ReactInputMask = factory(global.React));
}(this, (function (React) { 'use strict';

React = React && React.hasOwnProperty('default') ? React['default'] : React;

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

function _instanceof(left, right) {
  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
    return right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

var defaultCharsRules = {
  '9': '[0-9]',
  'a': '[A-Za-z]',
  '*': '[A-Za-z0-9]'
};
var defaultMaskChar = '_';

function parseMask (mask, maskChar, charsRules) {
  if (maskChar === undefined) {
    maskChar = defaultMaskChar;
  }

  if (charsRules == null) {
    charsRules = defaultCharsRules;
  }

  if (!mask || typeof mask !== 'string') {
    return {
      maskChar: maskChar,
      charsRules: charsRules,
      mask: null,
      prefix: null,
      lastEditablePos: null,
      permanents: []
    };
  }

  var str = '';
  var prefix = '';
  var permanents = [];
  var isPermanent = false;
  var lastEditablePos = null;
  mask.split('').forEach(function (character) {
    if (!isPermanent && character === '\\') {
      isPermanent = true;
    } else {
      if (isPermanent || !charsRules[character]) {
        permanents.push(str.length);

        if (str.length === permanents.length - 1) {
          prefix += character;
        }
      } else {
        lastEditablePos = str.length + 1;
      }

      str += character;
      isPermanent = false;
    }
  });
  return {
    maskChar: maskChar,
    charsRules: charsRules,
    prefix: prefix,
    mask: str,
    lastEditablePos: lastEditablePos,
    permanents: permanents
  };
}

function isAndroidBrowser() {
  var windows = new RegExp('windows', 'i');
  var firefox = new RegExp('firefox', 'i');
  var android = new RegExp('android', 'i');
  var ua = navigator.userAgent;
  return !windows.test(ua) && !firefox.test(ua) && android.test(ua);
}
function isWindowsPhoneBrowser() {
  var windows = new RegExp('windows', 'i');
  var phone = new RegExp('phone', 'i');
  var ua = navigator.userAgent;
  return windows.test(ua) && phone.test(ua);
}
function isAndroidFirefox() {
  var windows = new RegExp('windows', 'i');
  var firefox = new RegExp('firefox', 'i');
  var android = new RegExp('android', 'i');
  var ua = navigator.userAgent;
  return !windows.test(ua) && firefox.test(ua) && android.test(ua);
}

function isPermanentChar(maskOptions, pos) {
  return maskOptions.permanents.indexOf(pos) !== -1;
}
function isAllowedChar(maskOptions, pos, character) {
  var mask = maskOptions.mask,
      charsRules = maskOptions.charsRules;

  if (!character) {
    return false;
  }

  if (isPermanentChar(maskOptions, pos)) {
    return mask[pos] === character;
  }

  var ruleChar = mask[pos];
  var charRule = charsRules[ruleChar];
  return new RegExp(charRule).test(character);
}
function isEmpty(maskOptions, value) {
  return value.split('').every(function (character, i) {
    return isPermanentChar(maskOptions, i) || !isAllowedChar(maskOptions, i, character);
  });
}
function getFilledLength(maskOptions, value) {
  var maskChar = maskOptions.maskChar,
      prefix = maskOptions.prefix;

  if (!maskChar) {
    while (value.length > prefix.length && isPermanentChar(maskOptions, value.length - 1)) {
      value = value.slice(0, value.length - 1);
    }

    return value.length;
  }

  var filledLength = prefix.length;

  for (var i = value.length; i >= prefix.length; i--) {
    var character = value[i];
    var isEnteredCharacter = !isPermanentChar(maskOptions, i) && isAllowedChar(maskOptions, i, character);

    if (isEnteredCharacter) {
      filledLength = i + 1;
      break;
    }
  }

  return filledLength;
}
function isFilled(maskOptions, value) {
  return getFilledLength(maskOptions, value) === maskOptions.mask.length;
}
function formatValue(maskOptions, value) {
  var maskChar = maskOptions.maskChar,
      mask = maskOptions.mask,
      prefix = maskOptions.prefix;

  if (!maskChar) {
    value = insertString(maskOptions, '', value, 0);

    if (value.length < prefix.length) {
      value = prefix;
    }

    while (value.length < mask.length && isPermanentChar(maskOptions, value.length)) {
      value += mask[value.length];
    }

    return value;
  }

  if (value) {
    var emptyValue = formatValue(maskOptions, '');
    return insertString(maskOptions, emptyValue, value, 0);
  }

  for (var i = 0; i < mask.length; i++) {
    if (isPermanentChar(maskOptions, i)) {
      value += mask[i];
    } else {
      value += maskChar;
    }
  }

  return value;
}
function clearRange(maskOptions, value, start, len) {
  var end = start + len;
  var maskChar = maskOptions.maskChar,
      mask = maskOptions.mask,
      prefix = maskOptions.prefix;
  var arrayValue = value.split('');

  if (!maskChar) {
    // remove any permanent chars after clear range, they will be added back by foramtValue
    for (var i = end; i < arrayValue.length; i++) {
      if (isPermanentChar(maskOptions, i)) {
        arrayValue[i] = '';
      }
    }

    start = Math.max(prefix.length, start);
    arrayValue.splice(start, end - start);
    value = arrayValue.join('');
    return formatValue(maskOptions, value);
  }

  return arrayValue.map(function (character, i) {
    if (i < start || i >= end) {
      return character;
    }

    if (isPermanentChar(maskOptions, i)) {
      return mask[i];
    }

    return maskChar;
  }).join('');
}
function insertString(maskOptions, value, insertStr, insertPos) {
  var mask = maskOptions.mask,
      maskChar = maskOptions.maskChar,
      prefix = maskOptions.prefix;
  var arrayInsertStr = insertStr.split('');
  var isInputFilled = isFilled(maskOptions, value);

  var isUsablePosition = function isUsablePosition(pos, character) {
    return !isPermanentChar(maskOptions, pos) || character === mask[pos];
  };

  var isUsableCharacter = function isUsableCharacter(character, pos) {
    return !maskChar || !isPermanentChar(maskOptions, pos) || character !== maskChar;
  };

  if (!maskChar && insertPos > value.length) {
    value += mask.slice(value.length, insertPos);
  }

  arrayInsertStr.every(function (insertCharacter) {
    while (!isUsablePosition(insertPos, insertCharacter)) {
      if (insertPos >= value.length) {
        value += mask[insertPos];
      }

      if (!isUsableCharacter(insertCharacter, insertPos)) {
        return true;
      }

      insertPos++; // stop iteration if maximum value length reached

      if (insertPos >= mask.length) {
        return false;
      }
    }

    var isAllowed = isAllowedChar(maskOptions, insertPos, insertCharacter) || insertCharacter === maskChar;

    if (!isAllowed) {
      return true;
    }

    if (insertPos < value.length) {
      if (maskChar || isInputFilled || insertPos < prefix.length) {
        value = value.slice(0, insertPos) + insertCharacter + value.slice(insertPos + 1);
      } else {
        value = value.slice(0, insertPos) + insertCharacter + value.slice(insertPos);
        value = formatValue(maskOptions, value);
      }
    } else if (!maskChar) {
      value += insertCharacter;
    }

    insertPos++; // stop iteration if maximum value length reached

    return insertPos < mask.length;
  });
  return value;
}
function getInsertStringLength(maskOptions, value, insertStr, insertPos) {
  var mask = maskOptions.mask,
      maskChar = maskOptions.maskChar;
  var arrayInsertStr = insertStr.split('');
  var initialInsertPos = insertPos;

  var isUsablePosition = function isUsablePosition(pos, character) {
    return !isPermanentChar(maskOptions, pos) || character === mask[pos];
  };

  arrayInsertStr.every(function (insertCharacter) {
    while (!isUsablePosition(insertPos, insertCharacter)) {
      insertPos++; // stop iteration if maximum value length reached

      if (insertPos >= mask.length) {
        return false;
      }
    }

    var isAllowed = isAllowedChar(maskOptions, insertPos, insertCharacter) || insertCharacter === maskChar;

    if (isAllowed) {
      insertPos++;
    } // stop iteration if maximum value length reached


    return insertPos < mask.length;
  });
  return insertPos - initialInsertPos;
}

function defer (fn) {
  var defer = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function () {
    return setTimeout(fn, 0);
  };

  return defer(fn);
}

// https://github.com/sanniassin/react-input-mask
var InputElement =
/*#__PURE__*/
function (_React$Component) {
  _inheritsLoose(InputElement, _React$Component);

  function InputElement(props) {
    var _this;

    _this = _React$Component.call(this, props) || this;

    _initialiseProps.call(_assertThisInitialized(_this));

    var mask = props.mask,
        maskChar = props.maskChar,
        formatChars = props.formatChars,
        defaultValue = props.defaultValue,
        value = props.value,
        alwaysShowMask = props.alwaysShowMask;
    _this.hasValue = value != null;
    _this.maskOptions = parseMask(mask, maskChar, formatChars);

    if (defaultValue == null) {
      defaultValue = '';
    }

    if (value == null) {
      value = defaultValue;
    }

    value = _this.getStringValue(value);

    if (_this.maskOptions.mask && (alwaysShowMask || value)) {
      value = formatValue(_this.maskOptions, value);
    }

    _this.value = value;
    return _this;
  }

  var _proto = InputElement.prototype;

  _proto.componentDidMount = function componentDidMount() {
    this.isAndroidBrowser = isAndroidBrowser();
    this.isWindowsPhoneBrowser = isWindowsPhoneBrowser();
    this.isAndroidFirefox = isAndroidFirefox();

    if (this.maskOptions.mask && this.getInputValue() !== this.value) {
      this.setInputValue(this.value);
    }
  };

  _proto.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    var oldMaskOptions = this.maskOptions;
    this.hasValue = nextProps.value != null;
    this.maskOptions = parseMask(nextProps.mask, nextProps.maskChar, nextProps.formatChars);

    if (!this.maskOptions.mask) {
      this.backspaceOrDeleteRemoval = null;
      this.lastCursorPos = null;
      return;
    }

    var isMaskChanged = this.maskOptions.mask && this.maskOptions.mask !== oldMaskOptions.mask;
    var showEmpty = nextProps.alwaysShowMask || this.isFocused();
    var newValue = this.hasValue ? this.getStringValue(nextProps.value) : this.value;

    if (!oldMaskOptions.mask && !this.hasValue) {
      newValue = this.getInputValue();
    }

    if (isMaskChanged || this.maskOptions.mask && (newValue || showEmpty)) {
      newValue = formatValue(this.maskOptions, newValue);

      if (isMaskChanged) {
        var pos = this.lastCursorPos;
        var filledLen = getFilledLength(this.maskOptions, newValue);

        if (pos === null || filledLen < pos) {
          if (isFilled(this.maskOptions, newValue)) {
            pos = filledLen;
          } else {
            pos = this.getRightEditablePos(filledLen);
          }

          this.setCursorPos(pos);
        }
      }
    }

    if (this.maskOptions.mask && isEmpty(this.maskOptions, newValue) && !showEmpty && (!this.hasValue || !nextProps.value)) {
      newValue = '';
    }

    this.value = newValue;
  };

  _proto.componentDidUpdate = function componentDidUpdate() {
    if (this.maskOptions.mask && this.getInputValue() !== this.value) {
      this.setInputValue(this.value);
    }
  };

  _proto.render = function render() {
    var _this2 = this;

    var _props = this.props,
        mask = _props.mask,
        alwaysShowMask = _props.alwaysShowMask,
        maskChar = _props.maskChar,
        formatChars = _props.formatChars,
        inputRef = _props.inputRef,
        props = _objectWithoutProperties(_props, ["mask", "alwaysShowMask", "maskChar", "formatChars", "inputRef"]);

    if (this.maskOptions.mask) {
      if (!props.disabled && !props.readOnly) {
        var handlersKeys = ['onChange', 'onKeyDown', 'onPaste', 'onMouseDown'];
        handlersKeys.forEach(function (key) {
          props[key] = _this2[key];
        });
      }

      if (props.value != null) {
        props.value = this.value;
      }
    }

    return React.createElement("input", _extends({
      ref: this.handleRef
    }, props, {
      onFocus: this.onFocus,
      onBlur: this.onBlur
    }));
  };

  return InputElement;
}(React.Component);

var _initialiseProps = function _initialiseProps() {
  var _this3 = this;

  Object.defineProperty(this, "lastCursorPos", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: null
  });
  Object.defineProperty(this, "focused", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: false
  });
  Object.defineProperty(this, "isDOMElement", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(element) {
      return (typeof HTMLElement === "undefined" ? "undefined" : _typeof(HTMLElement)) === 'object' ? _instanceof(element, HTMLElement) // DOM2
      : element.nodeType === 1 && typeof element.nodeName === 'string';
    }
  });
  Object.defineProperty(this, "getInputDOMNode", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value() {
      var input = _this3.input;

      if (!input) {
        return null;
      }

      if (_this3.isDOMElement(input)) {
        return input;
      } // React 0.13


      return React.findDOMNode(input);
    }
  });
  Object.defineProperty(this, "getInputValue", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value() {
      var input = _this3.getInputDOMNode();

      if (!input) {
        return null;
      }

      return input.value;
    }
  });
  Object.defineProperty(this, "setInputValue", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(_value) {
      var input = _this3.getInputDOMNode();

      if (!input) {
        return;
      }

      _this3.value = _value;
      input.value = _value;
    }
  });
  Object.defineProperty(this, "getLeftEditablePos", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(pos) {
      for (var i = pos; i >= 0; --i) {
        if (!isPermanentChar(_this3.maskOptions, i)) {
          return i;
        }
      }

      return null;
    }
  });
  Object.defineProperty(this, "getRightEditablePos", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(pos) {
      var mask = _this3.maskOptions.mask;

      for (var i = pos; i < mask.length; ++i) {
        if (!isPermanentChar(_this3.maskOptions, i)) {
          return i;
        }
      }

      return null;
    }
  });
  Object.defineProperty(this, "setCursorToEnd", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value() {
      var filledLen = getFilledLength(_this3.maskOptions, _this3.value);

      var pos = _this3.getRightEditablePos(filledLen);

      if (pos !== null) {
        _this3.setCursorPos(pos);
      }
    }
  });
  Object.defineProperty(this, "setSelection", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(start, len) {
      if (len === void 0) {
        len = 0;
      }

      var input = _this3.getInputDOMNode();

      if (!input) {
        return;
      }

      var end = start + len;

      if ('selectionStart' in input && 'selectionEnd' in input) {
        input.selectionStart = start;
        input.selectionEnd = end;
      } else {
        var range = input.createTextRange();
        range.collapse(true);
        range.moveStart('character', start);
        range.moveEnd('character', end - start);
        range.select();
      }
    }
  });
  Object.defineProperty(this, "getSelection", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value() {
      var input = _this3.getInputDOMNode();

      var start = 0;
      var end = 0;

      if ('selectionStart' in input && 'selectionEnd' in input) {
        start = input.selectionStart;
        end = input.selectionEnd;
      } else {
        var range = document.selection.createRange();

        if (range.parentElement() === input) {
          start = -range.moveStart('character', -input.value.length);
          end = -range.moveEnd('character', -input.value.length);
        }
      }

      return {
        start: start,
        end: end,
        length: end - start
      };
    }
  });
  Object.defineProperty(this, "getCursorPos", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value() {
      return _this3.getSelection().start;
    }
  });
  Object.defineProperty(this, "setCursorPos", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(pos) {
      _this3.setSelection(pos, 0);

      defer(function () {
        _this3.setSelection(pos, 0);
      });
      _this3.lastCursorPos = pos;
    }
  });
  Object.defineProperty(this, "isFocused", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value() {
      return _this3.focused;
    }
  });
  Object.defineProperty(this, "getStringValue", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(_value2) {
      return !_value2 && _value2 !== 0 ? '' : _value2 + '';
    }
  });
  Object.defineProperty(this, "onKeyDown", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(event) {
      _this3.backspaceOrDeleteRemoval = null;

      if (typeof _this3.props.onKeyDown === 'function') {
        _this3.props.onKeyDown(event);
      }

      var key = event.key,
          ctrlKey = event.ctrlKey,
          metaKey = event.metaKey,
          defaultPrevented = event.defaultPrevented;

      if (ctrlKey || metaKey || defaultPrevented) {
        return;
      }

      if (key === 'Backspace' || key === 'Delete') {
        var selection = _this3.getSelection();

        var canRemove = key === 'Backspace' && selection.end > 0 || key === 'Delete' && _this3.value.length > selection.start;

        if (!canRemove) {
          return;
        }

        _this3.backspaceOrDeleteRemoval = {
          key: key,
          selection: _this3.getSelection()
        };
      }
    }
  });
  Object.defineProperty(this, "onChange", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(event) {
      var beforePasteState = _this3.beforePasteState;
      var _this3$maskOptions = _this3.maskOptions,
          mask = _this3$maskOptions.mask,
          maskChar = _this3$maskOptions.maskChar,
          lastEditablePos = _this3$maskOptions.lastEditablePos,
          prefix = _this3$maskOptions.prefix;

      var value = _this3.getInputValue();

      if (beforePasteState) {
        _this3.beforePasteState = null;

        _this3.pasteText(beforePasteState.value, value, beforePasteState.selection, event);

        return;
      }

      var oldValue = _this3.value;

      var input = _this3.getInputDOMNode(); // autofill replaces whole value, ignore old one
      // https://github.com/sanniassin/react-input-mask/issues/113
      //
      // input.matches throws exception if selector isn't supported


      try {
        if (typeof input.matches === 'function' && input.matches(':-webkit-autofill')) {
          oldValue = '';
        }
      } catch (e) {}

      var selection = _this3.getSelection();

      var cursorPos = selection.end;
      var maskLen = mask.length;
      var valueLen = value.length;
      var oldValueLen = oldValue.length;
      var clearedValue;
      var enteredString;

      if (_this3.backspaceOrDeleteRemoval) {
        var deleteFromRight = _this3.backspaceOrDeleteRemoval.key === 'Delete';
        value = _this3.value;
        selection = _this3.backspaceOrDeleteRemoval.selection;
        cursorPos = selection.start;
        _this3.backspaceOrDeleteRemoval = null;

        if (selection.length) {
          value = clearRange(_this3.maskOptions, value, selection.start, selection.length);
        } else if (selection.start < prefix.length || !deleteFromRight && selection.start === prefix.length) {
          cursorPos = prefix.length;
        } else {
          var editablePos = deleteFromRight ? _this3.getRightEditablePos(cursorPos) : _this3.getLeftEditablePos(cursorPos - 1);

          if (editablePos !== null) {
            if (!maskChar) {
              value = value.substr(0, getFilledLength(_this3.maskOptions, value));
            }

            value = clearRange(_this3.maskOptions, value, editablePos, 1);
            cursorPos = editablePos;
          }
        }
      } else if (valueLen > oldValueLen) {
        var enteredStringLen = valueLen - oldValueLen;
        var startPos = selection.end - enteredStringLen;
        enteredString = value.substr(startPos, enteredStringLen);

        if (startPos < lastEditablePos && (enteredStringLen !== 1 || enteredString !== mask[startPos])) {
          cursorPos = _this3.getRightEditablePos(startPos);
        } else {
          cursorPos = startPos;
        }

        value = value.substr(0, startPos) + value.substr(startPos + enteredStringLen);
        clearedValue = clearRange(_this3.maskOptions, value, startPos, maskLen - startPos);
        clearedValue = insertString(_this3.maskOptions, clearedValue, enteredString, cursorPos);
        value = insertString(_this3.maskOptions, oldValue, enteredString, cursorPos);

        if (enteredStringLen !== 1 || cursorPos >= prefix.length && cursorPos < lastEditablePos) {
          cursorPos = Math.max(getFilledLength(_this3.maskOptions, clearedValue), cursorPos);

          if (cursorPos < lastEditablePos) {
            cursorPos = _this3.getRightEditablePos(cursorPos);
          }
        } else if (cursorPos < lastEditablePos) {
          cursorPos++;
        }
      } else if (valueLen < oldValueLen) {
        var removedLen = maskLen - valueLen;
        enteredString = value.substr(0, selection.end);
        var clearOnly = enteredString === oldValue.substr(0, selection.end);
        clearedValue = clearRange(_this3.maskOptions, oldValue, selection.end, removedLen);

        if (maskChar) {
          value = insertString(_this3.maskOptions, clearedValue, enteredString, 0);
        }

        clearedValue = clearRange(_this3.maskOptions, clearedValue, selection.end, maskLen - selection.end);
        clearedValue = insertString(_this3.maskOptions, clearedValue, enteredString, 0);

        if (!clearOnly) {
          cursorPos = Math.max(getFilledLength(_this3.maskOptions, clearedValue), cursorPos);

          if (cursorPos < lastEditablePos) {
            cursorPos = _this3.getRightEditablePos(cursorPos);
          }
        } else if (cursorPos < prefix.length) {
          cursorPos = prefix.length;
        }
      }

      value = formatValue(_this3.maskOptions, value);

      _this3.setInputValue(value);

      if (typeof _this3.props.onChange === 'function') {
        _this3.props.onChange(event);
      }

      if (_this3.isWindowsPhoneBrowser) {
        defer(function () {
          _this3.setSelection(cursorPos, 0);
        });
      } else {
        _this3.setCursorPos(cursorPos);
      }
    }
  });
  Object.defineProperty(this, "onFocus", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(event) {
      _this3.focused = true;

      if (_this3.maskOptions.mask) {
        if (!_this3.value) {
          var prefix = _this3.maskOptions.prefix;
          var value = formatValue(_this3.maskOptions, prefix);
          var inputValue = formatValue(_this3.maskOptions, value); // do not use this.getInputValue and this.setInputValue as this.input
          // can be undefined at this moment if autoFocus attribute is set

          var isInputValueChanged = inputValue !== event.target.value;

          if (isInputValueChanged) {
            event.target.value = inputValue;
          }

          _this3.value = inputValue;

          if (isInputValueChanged && typeof _this3.props.onChange === 'function') {
            _this3.props.onChange(event);
          }

          _this3.setCursorToEnd();
        } else if (getFilledLength(_this3.maskOptions, _this3.value) < _this3.maskOptions.mask.length) {
          _this3.setCursorToEnd();
        }
      }

      if (typeof _this3.props.onFocus === 'function') {
        _this3.props.onFocus(event);
      }
    }
  });
  Object.defineProperty(this, "onBlur", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(event) {
      _this3.focused = false;

      if (_this3.maskOptions.mask && !_this3.props.alwaysShowMask && isEmpty(_this3.maskOptions, _this3.value)) {
        var inputValue = '';

        var isInputValueChanged = inputValue !== _this3.getInputValue();

        if (isInputValueChanged) {
          _this3.setInputValue(inputValue);
        }

        if (isInputValueChanged && typeof _this3.props.onChange === 'function') {
          _this3.props.onChange(event);
        }
      }

      if (typeof _this3.props.onBlur === 'function') {
        _this3.props.onBlur(event);
      }
    }
  });
  Object.defineProperty(this, "onMouseDown", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(event) {
      // tiny unintentional mouse movements can break cursor
      // position on focus, so we have to restore it in that case
      //
      // https://github.com/sanniassin/react-input-mask/issues/108
      if (!_this3.focused && document.addEventListener) {
        _this3.mouseDownX = event.clientX;
        _this3.mouseDownY = event.clientY;
        _this3.mouseDownTime = new Date().getTime();

        var mouseUpHandler = function mouseUpHandler(mouseUpEvent) {
          document.removeEventListener('mouseup', mouseUpHandler);

          if (!_this3.focused) {
            return;
          }

          var deltaX = Math.abs(mouseUpEvent.clientX - _this3.mouseDownX);
          var deltaY = Math.abs(mouseUpEvent.clientY - _this3.mouseDownY);
          var axisDelta = Math.max(deltaX, deltaY);

          var timeDelta = new Date().getTime() - _this3.mouseDownTime;

          if (axisDelta <= 10 && timeDelta <= 200 || axisDelta <= 5 && timeDelta <= 300) {
            _this3.setCursorToEnd();
          }
        };

        document.addEventListener('mouseup', mouseUpHandler);
      }

      if (typeof _this3.props.onMouseDown === 'function') {
        _this3.props.onMouseDown(event);
      }
    }
  });
  Object.defineProperty(this, "onPaste", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(event) {
      if (typeof _this3.props.onPaste === 'function') {
        _this3.props.onPaste(event);
      } // we need raw pasted text, but event.clipboardData
      // may not work in Android browser, so we clean input
      // to get raw text in onChange handler


      if (!event.defaultPrevented) {
        _this3.beforePasteState = {
          value: _this3.getInputValue(),
          selection: _this3.getSelection()
        };

        _this3.setInputValue('');
      }
    }
  });
  Object.defineProperty(this, "pasteText", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(_value3, text, selection, event) {
      var cursorPos = selection.start;

      if (selection.length) {
        _value3 = clearRange(_this3.maskOptions, _value3, cursorPos, selection.length);
      }

      var textLen = getInsertStringLength(_this3.maskOptions, _value3, text, cursorPos);
      _value3 = insertString(_this3.maskOptions, _value3, text, cursorPos);
      cursorPos += textLen;
      cursorPos = _this3.getRightEditablePos(cursorPos) || cursorPos;

      _this3.setInputValue(_value3);

      if (event && typeof _this3.props.onChange === 'function') {
        _this3.props.onChange(event);
      }

      _this3.setCursorPos(cursorPos);
    }
  });
  Object.defineProperty(this, "handleRef", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function value(ref) {
      _this3.input = ref;

      if (typeof _this3.props.inputRef === 'function') {
        _this3.props.inputRef(ref);
      }
    }
  });
};

return InputElement;

})));
