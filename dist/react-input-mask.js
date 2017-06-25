(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react')) :
	typeof define === 'function' && define.amd ? define(['react'], factory) :
	(global.ReactInputMask = factory(global.React));
}(this, (function (React) { 'use strict';

React = 'default' in React ? React['default'] : React;

var defaultCharsRules = {
  '9': '[0-9]',
  'a': '[A-Za-z]',
  '*': '[A-Za-z0-9]'
};

var defaultMaskChar = '_';

var parseMask = function (mask, maskChar, charsRules) {
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

  mask.split('').forEach(function (character, i) {
    if (!isPermanent && character === '\\') {
      isPermanent = true;
    } else {
      if (isPermanent || !charsRules[character]) {
        permanents.push(str.length);
        if (prefix.length === i) {
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
};

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
    value = value.slice(0, getFilledLength(maskOptions, value));

    if (value.length < prefix.length) {
      value = prefix;
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

      insertPos++;

      // stop iteration if maximum value length reached
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

    insertPos++;

    // stop iteration if maximum value length reached
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
      insertPos++;

      // stop iteration if maximum value length reached
      if (insertPos >= mask.length) {
        return false;
      }
    }

    var isAllowed = isAllowedChar(maskOptions, insertPos, insertCharacter) || insertCharacter === maskChar;

    if (isAllowed) {
      insertPos++;
    }

    // stop iteration if maximum value length reached
    return insertPos < mask.length;
  });

  return insertPos - initialInsertPos;
}

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// https://github.com/sanniassin/react-input-mask
var InputElement = function (_React$Component) {
  _inherits(InputElement, _React$Component);

  function InputElement(props) {
    _classCallCheck(this, InputElement);

    var _this = _possibleConstructorReturn(this, (InputElement.__proto__ || Object.getPrototypeOf(InputElement)).call(this, props));

    _initialiseProps.call(_this);

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

    _this.state = { value: value };
    return _this;
  }

  _createClass(InputElement, [{
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.unmounted = true;
    }
  }]);

  return InputElement;
}(React.Component);

var _initialiseProps = function _initialiseProps() {
  var _this2 = this;

  this.lastCursorPos = null;

  this.componentDidMount = function () {
    _this2.isAndroidBrowser = isAndroidBrowser();
    _this2.isWindowsPhoneBrowser = isWindowsPhoneBrowser();
    _this2.isAndroidFirefox = isAndroidFirefox();

    var input = _this2.getInputDOMNode();

    // workaround for Jest
    // it doesn't mount a real node so input will be null
    if (input && Object.getOwnPropertyDescriptor && Object.getPrototypeOf && Object.defineProperty) {
      var valueDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
      _this2.canUseAccessors = !!(valueDescriptor && valueDescriptor.get && valueDescriptor.set);
    }

    if (_this2.maskOptions.mask && _this2.props.value == null) {
      _this2.updateUncontrolledInput();
    }
  };

  this.componentWillReceiveProps = function (nextProps) {
    var oldMaskOptions = _this2.maskOptions;

    _this2.hasValue = nextProps.value != null;
    _this2.maskOptions = parseMask(nextProps.mask, nextProps.maskChar, nextProps.formatChars);

    if (!_this2.maskOptions.mask) {
      _this2.lastCursorPos = null;
      return;
    }

    var isMaskChanged = _this2.maskOptions.mask && _this2.maskOptions.mask !== oldMaskOptions.mask;
    var showEmpty = nextProps.alwaysShowMask || _this2.isFocused();
    var newValue = _this2.hasValue ? _this2.getStringValue(nextProps.value) : _this2.state.value;

    if (!oldMaskOptions.mask && !_this2.hasValue) {
      newValue = _this2.getInputDOMNode().value;
    }

    if (isMaskChanged || _this2.maskOptions.mask && (newValue || showEmpty)) {
      newValue = formatValue(_this2.maskOptions, newValue);

      if (isMaskChanged) {
        var pos = _this2.lastCursorPos;
        var filledLen = getFilledLength(_this2.maskOptions, newValue);
        if (pos === null || filledLen < pos) {
          if (isFilled(_this2.maskOptions, newValue)) {
            pos = filledLen;
          } else {
            pos = _this2.getRightEditablePos(filledLen);
          }
          _this2.setCursorPos(pos);
        }
      }
    }

    if (_this2.maskOptions.mask && isEmpty(_this2.maskOptions, newValue) && !showEmpty && (!_this2.hasValue || !nextProps.value)) {
      newValue = '';
    }

    _this2.value = newValue;

    if (_this2.state.value !== newValue) {
      _this2.setState({ value: newValue });
    }
  };

  this.componentDidUpdate = function (prevProps) {
    if ((_this2.maskOptions.mask || prevProps.mask) && _this2.props.value == null) {
      _this2.updateUncontrolledInput();
    }

    if (_this2.valueDescriptor && _this2.getInputValue() !== _this2.state.value) {
      _this2.setInputValue(_this2.state.value);
    }
  };

  this.isDOMElement = function (element) {
    return (typeof HTMLElement === 'undefined' ? 'undefined' : _typeof(HTMLElement)) === 'object' ? element instanceof HTMLElement // DOM2
    : element.nodeType === 1 && typeof element.nodeName === 'string';
  };

  this.getInputDOMNode = function () {
    var input = _this2.input;

    if (!input) {
      return null;
    }

    if (_this2.isDOMElement(input)) {
      return input;
    }

    // React 0.13
    return React.findDOMNode(input);
  };

  this.enableValueAccessors = function () {
    if (_this2.canUseAccessors) {
      var input = _this2.getInputDOMNode();
      _this2.valueDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
      Object.defineProperty(input, 'value', {
        configurable: true,
        enumerable: true,
        get: function get() {
          return _this2.value;
        },
        set: function set(value) {
          _this2.value = value;
          _this2.valueDescriptor.set.call(input, value);
        }
      });
    }
  };

  this.disableValueAccessors = function () {
    var valueDescriptor = _this2.valueDescriptor;

    var input = _this2.getInputDOMNode();
    if (!valueDescriptor || !input) {
      return;
    }

    _this2.valueDescriptor = null;
    Object.defineProperty(input, 'value', valueDescriptor);
  };

  this.getInputValue = function () {
    var input = _this2.getInputDOMNode();
    var valueDescriptor = _this2.valueDescriptor;


    var value;
    if (valueDescriptor) {
      value = valueDescriptor.get.call(input);
    } else {
      value = input.value;
    }

    return value;
  };

  this.setInputValue = function (value) {
    var input = _this2.getInputDOMNode();
    if (!input) {
      return;
    }

    _this2.value = value;
    input.value = value;
  };

  this.getLeftEditablePos = function (pos) {
    for (var i = pos; i >= 0; --i) {
      if (!isPermanentChar(_this2.maskOptions, i)) {
        return i;
      }
    }
    return null;
  };

  this.getRightEditablePos = function (pos) {
    var mask = _this2.maskOptions.mask;

    for (var i = pos; i < mask.length; ++i) {
      if (!isPermanentChar(_this2.maskOptions, i)) {
        return i;
      }
    }
    return null;
  };

  this.setCursorToEnd = function () {
    var filledLen = getFilledLength(_this2.maskOptions, _this2.state.value);
    var pos = _this2.getRightEditablePos(filledLen);
    if (pos !== null) {
      _this2.setCursorPos(pos);
    }
  };

  this.setSelection = function (start) {
    var len = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var input = _this2.getInputDOMNode();
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
  };

  this.getSelection = function () {
    var input = _this2.getInputDOMNode();
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
  };

  this.getCursorPos = function () {
    return _this2.getSelection().start;
  };

  this.setCursorPos = function (pos) {
    var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (fn) {
      return setTimeout(fn, 0);
    };

    _this2.setSelection(pos, 0);
    raf(function () {
      _this2.setSelection(pos, 0);
    });

    _this2.lastCursorPos = pos;
  };

  this.isFocused = function () {
    return document.activeElement === _this2.getInputDOMNode();
  };

  this.getStringValue = function (value) {
    return !value && value !== 0 ? '' : value + '';
  };

  this.updateUncontrolledInput = function () {
    if (_this2.getInputValue() !== _this2.state.value) {
      _this2.setInputValue(_this2.state.value);
    }
  };

  this.onKeyDown = function (event) {
    var key = event.key,
        ctrlKey = event.ctrlKey,
        metaKey = event.metaKey;

    var hasHandler = typeof _this2.props.onKeyDown === 'function';
    if (ctrlKey || metaKey) {
      if (hasHandler) {
        _this2.props.onKeyDown(event);
      }
      return;
    }

    var cursorPos = _this2.getCursorPos();
    var value = _this2.state.value;
    var prefix = _this2.maskOptions.prefix;

    var preventDefault = false;
    switch (key) {
      case 'Backspace':
      case 'Delete':
        var deleteFromRight = key === 'Delete';
        var selectionRange = _this2.getSelection();
        if (selectionRange.length) {
          value = clearRange(_this2.maskOptions, value, selectionRange.start, selectionRange.length);
        } else if (cursorPos < prefix.length || !deleteFromRight && cursorPos === prefix.length) {
          cursorPos = prefix.length;
        } else {
          var editablePos = deleteFromRight ? _this2.getRightEditablePos(cursorPos) : _this2.getLeftEditablePos(cursorPos - 1);

          if (editablePos !== null) {
            value = clearRange(_this2.maskOptions, value, editablePos, 1);
            cursorPos = editablePos;
          }
        }
        preventDefault = true;
        break;
      default:
        break;
    }

    if (hasHandler) {
      _this2.props.onKeyDown(event);
    }

    if (value !== _this2.state.value) {
      preventDefault = true;

      _this2.setInputValue(value);
      _this2.setState({
        value: _this2.hasValue ? _this2.state.value : value
      });

      if (typeof _this2.props.onChange === 'function') {
        _this2.props.onChange(event);
      }
    }

    if (preventDefault) {
      event.preventDefault();
      _this2.setCursorPos(cursorPos);
    }
  };

  this.onKeyPress = function (event) {
    var key = event.key,
        ctrlKey = event.ctrlKey,
        metaKey = event.metaKey;

    var hasHandler = typeof _this2.props.onKeyPress === 'function';
    if (key === 'Enter' || ctrlKey || metaKey) {
      if (hasHandler) {
        _this2.props.onKeyPress(event);
      }
      return;
    }

    if (_this2.isWindowsPhoneBrowser) {
      return;
    }

    var cursorPos = _this2.getCursorPos();
    var selection = _this2.getSelection();
    var value = _this2.state.value;
    var _maskOptions = _this2.maskOptions,
        mask = _maskOptions.mask,
        lastEditablePos = _maskOptions.lastEditablePos,
        prefix = _maskOptions.prefix;


    if (isPermanentChar(_this2.maskOptions, cursorPos) && mask[cursorPos] === key) {
      value = insertString(_this2.maskOptions, value, key, cursorPos);
      ++cursorPos;
    } else {
      var editablePos = _this2.getRightEditablePos(cursorPos);
      if (editablePos !== null && isAllowedChar(_this2.maskOptions, editablePos, key)) {
        value = clearRange(_this2.maskOptions, value, selection.start, selection.length);
        value = insertString(_this2.maskOptions, value, key, editablePos);
        cursorPos = editablePos + 1;
      }
    }

    if (value !== _this2.state.value) {
      _this2.setInputValue(value);
      _this2.setState({
        value: _this2.hasValue ? _this2.state.value : value
      });
      if (typeof _this2.props.onChange === 'function') {
        _this2.props.onChange(event);
      }
    }

    event.preventDefault();

    if (cursorPos < lastEditablePos && cursorPos > prefix.length) {
      cursorPos = _this2.getRightEditablePos(cursorPos);
    }
    _this2.setCursorPos(cursorPos);
  };

  this.onChange = function (event) {
    var pasteSelection = _this2.pasteSelection;
    var _maskOptions2 = _this2.maskOptions,
        mask = _maskOptions2.mask,
        maskChar = _maskOptions2.maskChar,
        lastEditablePos = _maskOptions2.lastEditablePos,
        prefix = _maskOptions2.prefix;

    var value = _this2.getInputValue();
    if (!value && _this2.preventEmptyChange) {
      _this2.disableValueAccessors();
      _this2.preventEmptyChange = false;
      _this2.setInputValue(_this2.state.value);
      return;
    }
    var oldValue = _this2.state.value;
    if (pasteSelection) {
      _this2.pasteSelection = null;
      _this2.pasteText(oldValue, value, pasteSelection, event);
      return;
    }
    var selection = _this2.getSelection();
    var cursorPos = selection.end;
    var maskLen = mask.length;
    var valueLen = value.length;
    var oldValueLen = oldValue.length;

    var clearedValue;
    var enteredString;

    if (valueLen > oldValueLen) {
      var enteredStringLen = valueLen - oldValueLen;
      var startPos = selection.end - enteredStringLen;
      enteredString = value.substr(startPos, enteredStringLen);

      if (startPos < lastEditablePos && (enteredStringLen !== 1 || enteredString !== mask[startPos])) {
        cursorPos = _this2.getRightEditablePos(startPos);
      } else {
        cursorPos = startPos;
      }

      value = value.substr(0, startPos) + value.substr(startPos + enteredStringLen);

      clearedValue = clearRange(_this2.maskOptions, value, startPos, maskLen - startPos);
      clearedValue = insertString(_this2.maskOptions, clearedValue, enteredString, cursorPos);

      value = insertString(_this2.maskOptions, oldValue, enteredString, cursorPos);

      if (enteredStringLen !== 1 || cursorPos >= prefix.length && cursorPos < lastEditablePos) {
        cursorPos = getFilledLength(_this2.maskOptions, clearedValue);
      } else if (cursorPos < lastEditablePos) {
        cursorPos++;
      }
    } else if (valueLen < oldValueLen) {
      var removedLen = maskLen - valueLen;
      enteredString = value.substr(0, selection.end);
      var clearOnly = enteredString === oldValue.substr(0, selection.end);

      clearedValue = clearRange(_this2.maskOptions, oldValue, selection.end, removedLen);

      if (maskChar) {
        value = insertString(_this2.maskOptions, clearedValue, enteredString, 0);
      }

      clearedValue = clearRange(_this2.maskOptions, clearedValue, selection.end, maskLen - selection.end);
      clearedValue = insertString(_this2.maskOptions, clearedValue, enteredString, 0);

      if (!clearOnly) {
        cursorPos = getFilledLength(_this2.maskOptions, clearedValue);
      } else if (cursorPos < prefix.length) {
        cursorPos = prefix.length;
      }
    }
    value = formatValue(_this2.maskOptions, value);

    if (_this2.isWindowsPhoneBrowser) {
      event.persist();
      setTimeout(function () {
        if (_this2.unmounted) {
          return;
        }

        _this2.setInputValue(value);

        if (!_this2.hasValue) {
          _this2.setState({
            value: value
          });
        }

        if (typeof _this2.props.onChange === 'function') {
          _this2.props.onChange(event);
        }

        _this2.setCursorPos(cursorPos);
      }, 0);
    } else {
      // prevent android autocomplete insertion on backspace
      if (!_this2.canUseAccessors || !_this2.isAndroidBrowser) {
        _this2.setInputValue(value);
      }

      if (_this2.canUseAccessors && (_this2.isAndroidFirefox && value && !_this2.getInputValue() || _this2.isAndroidBrowser)) {
        _this2.value = value;
        _this2.enableValueAccessors();
        if (_this2.isAndroidFirefox) {
          _this2.preventEmptyChange = true;
        }
        setTimeout(function () {
          _this2.preventEmptyChange = false;
          _this2.disableValueAccessors();
        }, 0);
      }

      _this2.setState({
        value: _this2.hasValue ? _this2.state.value : value
      });

      if (typeof _this2.props.onChange === 'function') {
        _this2.props.onChange(event);
      }

      _this2.setCursorPos(cursorPos);
    }
  };

  this.onFocus = function (event) {
    if (!_this2.state.value) {
      var prefix = _this2.maskOptions.prefix;
      var value = formatValue(_this2.maskOptions, prefix);
      var inputValue = formatValue(_this2.maskOptions, value);

      // do not use this.getInputValue and this.setInputValue as this.input
      // can be undefined at this moment if autoFocus attribute is set
      var isInputValueChanged = inputValue !== event.target.value;

      if (isInputValueChanged) {
        event.target.value = inputValue;
      }

      _this2.setState({
        value: _this2.hasValue ? _this2.state.value : inputValue
      }, _this2.setCursorToEnd);

      if (isInputValueChanged && typeof _this2.props.onChange === 'function') {
        _this2.props.onChange(event);
      }
    } else if (getFilledLength(_this2.maskOptions, _this2.state.value) < _this2.maskOptions.mask.length) {
      _this2.setCursorToEnd();
    }

    if (typeof _this2.props.onFocus === 'function') {
      _this2.props.onFocus(event);
    }
  };

  this.onBlur = function (event) {
    if (!_this2.props.alwaysShowMask && isEmpty(_this2.maskOptions, _this2.state.value)) {
      var inputValue = '';
      var isInputValueChanged = inputValue !== _this2.getInputValue();

      if (isInputValueChanged) {
        _this2.setInputValue(inputValue);
      }

      _this2.setState({
        value: _this2.hasValue ? _this2.state.value : ''
      });

      if (isInputValueChanged && typeof _this2.props.onChange === 'function') {
        _this2.props.onChange(event);
      }
    }

    if (typeof _this2.props.onBlur === 'function') {
      _this2.props.onBlur(event);
    }
  };

  this.onPaste = function (event) {
    if (_this2.isAndroidBrowser) {
      _this2.pasteSelection = _this2.getSelection();
      _this2.setInputValue('');
      return;
    }

    var text;
    if (window.clipboardData && window.clipboardData.getData) {
      // IE
      text = window.clipboardData.getData('Text');
    } else if (event.clipboardData && event.clipboardData.getData) {
      text = event.clipboardData.getData('text/plain');
    }

    if (text) {
      var value = _this2.state.value;
      var selection = _this2.getSelection();
      _this2.pasteText(value, text, selection, event);
    }

    event.preventDefault();
  };

  this.pasteText = function (value, text, selection, event) {
    var cursorPos = selection.start;
    if (selection.length) {
      value = clearRange(_this2.maskOptions, value, cursorPos, selection.length);
    }
    var textLen = getInsertStringLength(_this2.maskOptions, value, text, cursorPos);
    value = insertString(_this2.maskOptions, value, text, cursorPos);
    cursorPos += textLen;
    cursorPos = _this2.getRightEditablePos(cursorPos) || cursorPos;

    if (value !== _this2.getInputValue()) {
      if (event) {
        _this2.setInputValue(value);
      }
      _this2.setState({
        value: _this2.hasValue ? _this2.state.value : value
      });
      if (event && typeof _this2.props.onChange === 'function') {
        _this2.props.onChange(event);
      }
    }

    _this2.setCursorPos(cursorPos);
  };

  this.render = function () {
    var _props = _this2.props,
        mask = _props.mask,
        alwaysShowMask = _props.alwaysShowMask,
        maskChar = _props.maskChar,
        formatChars = _props.formatChars,
        props = _objectWithoutProperties(_props, ['mask', 'alwaysShowMask', 'maskChar', 'formatChars']);

    if (_this2.maskOptions.mask) {
      if (!props.disabled && !props.readOnly) {
        var handlersKeys = ['onFocus', 'onBlur', 'onChange', 'onKeyDown', 'onKeyPress', 'onPaste'];
        handlersKeys.forEach(function (key) {
          props[key] = _this2[key];
        });
      }

      if (props.value != null) {
        props.value = _this2.state.value;
      }
    }

    return React.createElement('input', _extends({ ref: function ref(_ref) {
        return _this2.input = _ref;
      } }, props));
  };
};

return InputElement;

})));
