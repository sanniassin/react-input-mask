(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react'), require('react-dom')) :
  typeof define === 'function' && define.amd ? define(['react', 'react-dom'], factory) :
  (global.ReactInputMask = factory(global.React,global.ReactDOM));
}(this, (function (React,reactDom) { 'use strict';

  React = React && React.hasOwnProperty('default') ? React['default'] : React;

  function _defaults2(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

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
    _defaults2(subClass.prototype, superClass && superClass.prototype);

    _defaults2(subClass, superClass);
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

  /**
   * Copyright (c) 2013-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var invariant = function (condition, format, a, b, c, d, e, f) {
    {
      if (format === undefined) {
        throw new Error('invariant requires an error message argument');
      }
    }

    if (!condition) {
      var error;

      if (format === undefined) {
        error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
      } else {
        var args = [a, b, c, d, e, f];
        var argIndex = 0;
        error = new Error(format.replace(/%s/g, function () {
          return args[argIndex++];
        }));
        error.name = 'Invariant Violation';
      }

      error.framesToPop = 1; // we don't care about invariant's own frame

      throw error;
    }
  };

  var invariant_1 = invariant;

  /**
   * Copyright 2014-2015, Facebook, Inc.
   * All rights reserved.
   *
   * This source code is licensed under the BSD-style license found in the
   * LICENSE file in the root directory of this source tree. An additional grant
   * of patent rights can be found in the PATENTS file in the same directory.
   */

  var warning = function () {};

  {
    warning = function (condition, format, args) {
      var len = arguments.length;
      args = new Array(len > 2 ? len - 2 : 0);

      for (var key = 2; key < len; key++) {
        args[key - 2] = arguments[key];
      }

      if (format === undefined) {
        throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
      }

      if (format.length < 10 || /^[s\W]*$/.test(format)) {
        throw new Error('The warning format should be able to uniquely identify this ' + 'warning. Please, use a more descriptive format than: ' + format);
      }

      if (!condition) {
        var argIndex = 0;
        var message = 'Warning: ' + format.replace(/%s/g, function () {
          return args[argIndex++];
        });

        if (typeof console !== 'undefined') {
          console.error(message);
        }

        try {
          // This error was thrown as a convenience so that you can use this stack
          // to find the callsite that caused this warning to fire.
          throw new Error(message);
        } catch (x) {}
      }
    };
  }

  var warning_1 = warning;

  function setInputSelection(input, start, end) {
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
  function getInputSelection(input) {
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

  var defaultFormatChars = {
    '9': '[0-9]',
    'a': '[A-Za-z]',
    '*': '[A-Za-z0-9]'
  };
  var defaultMaskChar = '_';

  function parseMask (mask, maskChar, formatChars) {
    var parsedMaskString = '';
    var prefix = '';
    var lastEditablePosition = null;
    var permanents = [];

    if (maskChar === undefined) {
      maskChar = defaultMaskChar;
    }

    if (formatChars == null) {
      formatChars = defaultFormatChars;
    }

    if (!mask || typeof mask !== 'string') {
      return {
        maskChar: maskChar,
        formatChars: formatChars,
        mask: null,
        prefix: null,
        lastEditablePosition: null,
        permanents: []
      };
    }

    var isPermanent = false;
    mask.split('').forEach(function (character) {
      if (!isPermanent && character === '\\') {
        isPermanent = true;
      } else {
        if (isPermanent || !formatChars[character]) {
          permanents.push(parsedMaskString.length);

          if (parsedMaskString.length === permanents.length - 1) {
            prefix += character;
          }
        } else {
          lastEditablePosition = parsedMaskString.length + 1;
        }

        parsedMaskString += character;
        isPermanent = false;
      }
    });
    return {
      maskChar: maskChar,
      formatChars: formatChars,
      prefix: prefix,
      mask: parsedMaskString,
      lastEditablePosition: lastEditablePosition,
      permanents: permanents
    };
  }

  /* eslint no-use-before-define: ["error", { functions: false }] */
  function isPermanentCharacter(maskOptions, pos) {
    return maskOptions.permanents.indexOf(pos) !== -1;
  }
  function isAllowedCharacter(maskOptions, pos, character) {
    var mask = maskOptions.mask,
        formatChars = maskOptions.formatChars;

    if (!character) {
      return false;
    }

    if (isPermanentCharacter(maskOptions, pos)) {
      return mask[pos] === character;
    }

    var ruleChar = mask[pos];
    var charRule = formatChars[ruleChar];
    return new RegExp(charRule).test(character);
  }
  function isEmpty(maskOptions, value) {
    return value.split('').every(function (character, i) {
      return isPermanentCharacter(maskOptions, i) || !isAllowedCharacter(maskOptions, i, character);
    });
  }
  function getFilledLength(maskOptions, value) {
    var maskChar = maskOptions.maskChar,
        prefix = maskOptions.prefix;

    if (!maskChar) {
      while (value.length > prefix.length && isPermanentCharacter(maskOptions, value.length - 1)) {
        value = value.slice(0, value.length - 1);
      }

      return value.length;
    }

    var filledLength = prefix.length;

    for (var i = value.length; i >= prefix.length; i--) {
      var character = value[i];
      var isEnteredCharacter = !isPermanentCharacter(maskOptions, i) && isAllowedCharacter(maskOptions, i, character);

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

      while (value.length < mask.length && isPermanentCharacter(maskOptions, value.length)) {
        value += mask[value.length];
      }

      return value;
    }

    if (value) {
      var emptyValue = formatValue(maskOptions, '');
      return insertString(maskOptions, emptyValue, value, 0);
    }

    for (var i = 0; i < mask.length; i++) {
      if (isPermanentCharacter(maskOptions, i)) {
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
      // remove any permanent chars after clear range, they will be added back by formatValue
      for (var i = end; i < arrayValue.length; i++) {
        if (isPermanentCharacter(maskOptions, i)) {
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

      if (isPermanentCharacter(maskOptions, i)) {
        return mask[i];
      }

      return maskChar;
    }).join('');
  }
  function insertString(maskOptions, value, insertStr, insertPosition) {
    var mask = maskOptions.mask,
        maskChar = maskOptions.maskChar,
        prefix = maskOptions.prefix;
    var arrayInsertStr = insertStr.split('');
    var isInputFilled = isFilled(maskOptions, value);

    var isUsablePosition = function isUsablePosition(pos, character) {
      return !isPermanentCharacter(maskOptions, pos) || character === mask[pos];
    };

    var isUsableCharacter = function isUsableCharacter(character, pos) {
      return !maskChar || !isPermanentCharacter(maskOptions, pos) || character !== maskChar;
    };

    if (!maskChar && insertPosition > value.length) {
      value += mask.slice(value.length, insertPosition);
    }

    arrayInsertStr.every(function (insertCharacter) {
      while (!isUsablePosition(insertPosition, insertCharacter)) {
        if (insertPosition >= value.length) {
          value += mask[insertPosition];
        }

        if (!isUsableCharacter(insertCharacter, insertPosition)) {
          return true;
        }

        insertPosition++; // stop iteration if maximum value length reached

        if (insertPosition >= mask.length) {
          return false;
        }
      }

      var isAllowed = isAllowedCharacter(maskOptions, insertPosition, insertCharacter) || insertCharacter === maskChar;

      if (!isAllowed) {
        return true;
      }

      if (insertPosition < value.length) {
        if (maskChar || isInputFilled || insertPosition < prefix.length) {
          value = value.slice(0, insertPosition) + insertCharacter + value.slice(insertPosition + 1);
        } else {
          value = value.slice(0, insertPosition) + insertCharacter + value.slice(insertPosition);
          value = formatValue(maskOptions, value);
        }
      } else if (!maskChar) {
        value += insertCharacter;
      }

      insertPosition++; // stop iteration if maximum value length reached

      return insertPosition < mask.length;
    });
    return value;
  }
  function getInsertStringLength(maskOptions, value, insertStr, insertPosition) {
    var mask = maskOptions.mask,
        maskChar = maskOptions.maskChar;
    var arrayInsertStr = insertStr.split('');
    var initialInsertPosition = insertPosition;

    var isUsablePosition = function isUsablePosition(pos, character) {
      return !isPermanentCharacter(maskOptions, pos) || character === mask[pos];
    };

    arrayInsertStr.every(function (insertCharacter) {
      while (!isUsablePosition(insertPosition, insertCharacter)) {
        insertPosition++; // stop iteration if maximum value length reached

        if (insertPosition >= mask.length) {
          return false;
        }
      }

      var isAllowed = isAllowedCharacter(maskOptions, insertPosition, insertCharacter) || insertCharacter === maskChar;

      if (isAllowed) {
        insertPosition++;
      } // stop iteration if maximum value length reached


      return insertPosition < mask.length;
    });
    return insertPosition - initialInsertPosition;
  }
  function getLeftEditablePosition(maskOptions, pos) {
    for (var i = pos; i >= 0; --i) {
      if (!isPermanentCharacter(maskOptions, i)) {
        return i;
      }
    }

    return null;
  }
  function getRightEditablePosition(maskOptions, pos) {
    var mask = maskOptions.mask;

    for (var i = pos; i < mask.length; ++i) {
      if (!isPermanentCharacter(maskOptions, i)) {
        return i;
      }
    }

    return null;
  }
  function getStringValue(value) {
    return !value && value !== 0 ? '' : value + '';
  }

  function processChange(maskOptions, value, selection, previousValue, previousSelection) {
    var mask = maskOptions.mask,
        prefix = maskOptions.prefix,
        lastEditablePosition = maskOptions.lastEditablePosition;
    var newValue = value;
    var enteredString = '';
    var formattedEnteredStringLength = 0;
    var removedLength = 0;
    var cursorPosition = Math.min(previousSelection.start, selection.start);

    if (selection.end > previousSelection.start) {
      enteredString = newValue.slice(previousSelection.start, selection.end);
      formattedEnteredStringLength = getInsertStringLength(maskOptions, previousValue, enteredString, cursorPosition);

      if (!formattedEnteredStringLength) {
        removedLength = 0;
      } else {
        removedLength = previousSelection.length;
      }
    } else if (newValue.length < previousValue.length) {
      removedLength = previousValue.length - newValue.length;
    }

    newValue = previousValue;

    if (removedLength) {
      if (removedLength === 1 && !previousSelection.length) {
        var deleteFromRight = previousSelection.start === selection.start;
        cursorPosition = deleteFromRight ? getRightEditablePosition(maskOptions, selection.start) : getLeftEditablePosition(maskOptions, selection.start);
      }

      newValue = clearRange(maskOptions, newValue, cursorPosition, removedLength);
    }

    newValue = insertString(maskOptions, newValue, enteredString, cursorPosition);
    cursorPosition = cursorPosition + formattedEnteredStringLength;

    if (cursorPosition >= mask.length) {
      cursorPosition = mask.length;
    } else if (cursorPosition < prefix.length && !formattedEnteredStringLength) {
      cursorPosition = prefix.length;
    } else if (cursorPosition >= prefix.length && cursorPosition < lastEditablePosition && formattedEnteredStringLength) {
      cursorPosition = getRightEditablePosition(maskOptions, cursorPosition);
    }

    newValue = formatValue(maskOptions, newValue);

    if (!enteredString) {
      enteredString = null;
    }

    return {
      value: newValue,
      enteredString: enteredString,
      selection: {
        start: cursorPosition,
        end: cursorPosition
      }
    };
  }

  function isWindowsPhoneBrowser() {
    var windows = new RegExp('windows', 'i');
    var phone = new RegExp('phone', 'i');
    var ua = navigator.userAgent;
    return windows.test(ua) && phone.test(ua);
  }

  function isFunction(value) {
    return typeof value === 'function';
  }

  function getRequestAnimationFrame() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
  }

  function getCancelAnimationFrame() {
    return window.cancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame;
  }

  function defer(fn) {
    var hasCancelAnimationFrame = !!getCancelAnimationFrame();
    var deferFn;

    if (hasCancelAnimationFrame) {
      deferFn = getRequestAnimationFrame();
    } else {
      deferFn = function deferFn() {
        return setTimeout(fn, 1000 / 60);
      };
    }

    return deferFn(fn);
  }
  function cancelDefer(deferId) {
    var cancelFn = getCancelAnimationFrame() || clearTimeout;
    cancelFn(deferId);
  }

  var InputElement =
  /*#__PURE__*/
  function (_React$Component) {
    function InputElement(props) {
      var _this;

      _this = _React$Component.call(this, props) || this;
      _this.focused = false;
      _this.mounted = false;
      _this.previousSelection = null;
      _this.selectionDeferId = null;
      _this.saveSelectionLoopDeferId = null;

      _this.saveSelectionLoop = function () {
        _this.previousSelection = _this.getSelection();
        _this.saveSelectionLoopDeferId = defer(_this.saveSelectionLoop);
      };

      _this.runSaveSelectionLoop = function () {
        if (_this.saveSelectionLoopDeferId === null) {
          _this.saveSelectionLoop();
        }
      };

      _this.stopSaveSelectionLoop = function () {
        if (_this.saveSelectionLoopDeferId !== null) {
          cancelDefer(_this.saveSelectionLoopDeferId);
          _this.saveSelectionLoopDeferId = null;
          _this.previousSelection = null;
        }
      };

      _this.getInputDOMNode = function () {
        if (!_this.mounted) {
          return null;
        }

        var input = reactDom.findDOMNode(_assertThisInitialized(_assertThisInitialized(_this)));
        var isDOMNode = typeof window !== 'undefined' && input instanceof window.HTMLElement; // workaround for react-test-renderer
        // https://github.com/sanniassin/react-input-mask/issues/147

        if (input && !isDOMNode) {
          return null;
        }

        if (input.nodeName !== 'INPUT') {
          input = input.querySelector('input');
        }

        if (!input) {
          throw new Error('react-input-mask: inputComponent doesn\'t contain input node');
        }

        return input;
      };

      _this.getInputValue = function () {
        var input = _this.getInputDOMNode();

        if (!input) {
          return null;
        }

        return input.value;
      };

      _this.setInputValue = function (value) {
        var input = _this.getInputDOMNode();

        if (!input) {
          return;
        }

        _this.value = value;
        input.value = value;
      };

      _this.setCursorToEnd = function () {
        var filledLength = getFilledLength(_this.maskOptions, _this.value);
        var pos = getRightEditablePosition(_this.maskOptions, filledLength);

        if (pos !== null) {
          _this.setCursorPosition(pos);
        }
      };

      _this.setSelection = function (start, end, options) {
        if (options === void 0) {
          options = {};
        }

        var input = _this.getInputDOMNode();

        var isFocused = _this.isFocused();

        if (!input || !isFocused) {
          return;
        }

        var _options = options,
            deferred = _options.deferred;

        if (!deferred) {
          setInputSelection(input, start, end);
        }

        if (_this.selectionDeferId !== null) {
          cancelDefer(_this.selectionDeferId);
        } // deferred selection update is required for pre-Lollipop Android browser,
        // but for consistent behavior we do it for all browsers


        _this.selectionDeferId = defer(function () {
          _this.selectionDeferId = null;
          setInputSelection(input, start, end);
        });
        _this.previousSelection = {
          start: start,
          end: end,
          length: Math.abs(end - start)
        };
      };

      _this.getSelection = function () {
        var input = _this.getInputDOMNode();

        return getInputSelection(input);
      };

      _this.getCursorPosition = function () {
        return _this.getSelection().start;
      };

      _this.setCursorPosition = function (pos) {
        _this.setSelection(pos, pos);
      };

      _this.isFocused = function () {
        return _this.focused;
      };

      _this.getBeforeMaskedValueChangeConfig = function () {
        var _this$maskOptions = _this.maskOptions,
            mask = _this$maskOptions.mask,
            maskChar = _this$maskOptions.maskChar,
            permanents = _this$maskOptions.permanents,
            formatChars = _this$maskOptions.formatChars;
        var alwaysShowMask = _this.props.alwaysShowMask;
        return {
          mask: mask,
          maskChar: maskChar,
          permanents: permanents,
          alwaysShowMask: !!alwaysShowMask,
          formatChars: formatChars
        };
      };

      _this.isInputAutofilled = function (value, selection, previousValue, previousSelection) {
        var input = _this.getInputDOMNode(); // only check for positive match because it will be false negative
        // in case of autofill simulation in tests
        //
        // input.matches throws an exception if selector isn't supported


        try {
          if (input.matches(':-webkit-autofill')) {
            return true;
          }
        } catch (e) {} // if input isn't focused then change event must have been triggered
        // either by autofill or event simulation in tests


        if (!_this.focused) {
          return true;
        } // if cursor has moved to the end while previousSelection forbids it
        // then it must be autofill


        return previousSelection.end < previousValue.length && selection.end === value.length;
      };

      _this.onChange = function (event) {
        var _assertThisInitialize = _assertThisInitialized(_assertThisInitialized(_this)),
            beforePasteState = _assertThisInitialize.beforePasteState;

        var _assertThisInitialize2 = _assertThisInitialized(_assertThisInitialized(_this)),
            previousSelection = _assertThisInitialize2.previousSelection;

        var beforeMaskedValueChange = _this.props.beforeMaskedValueChange;

        var value = _this.getInputValue();

        var previousValue = _this.value;

        var selection = _this.getSelection(); // autofill replaces entire value, ignore old one
        // https://github.com/sanniassin/react-input-mask/issues/113


        if (_this.isInputAutofilled(value, selection, previousValue, previousSelection)) {
          previousValue = formatValue(_this.maskOptions, '');
          previousSelection = {
            start: 0,
            end: 0,
            length: 0
          };
        } // set value and selection as if we haven't
        // cleared input in onPaste handler


        if (beforePasteState) {
          previousSelection = beforePasteState.selection;
          previousValue = beforePasteState.value;
          selection = {
            start: previousSelection.start + value.length,
            end: previousSelection.start + value.length,
            length: 0
          };
          value = previousValue.slice(0, previousSelection.start) + value + previousValue.slice(previousSelection.end);
          _this.beforePasteState = null;
        }

        var changedState = processChange(_this.maskOptions, value, selection, previousValue, previousSelection);
        var enteredString = changedState.enteredString;
        var newSelection = changedState.selection;
        var newValue = changedState.value;

        if (isFunction(beforeMaskedValueChange)) {
          var modifiedValue = beforeMaskedValueChange({
            value: newValue,
            selection: newSelection
          }, {
            value: previousValue,
            selection: previousSelection
          }, enteredString, _this.getBeforeMaskedValueChangeConfig());
          newValue = modifiedValue.value;
          newSelection = modifiedValue.selection;
        }

        _this.setInputValue(newValue);

        if (isFunction(_this.props.onChange)) {
          _this.props.onChange(event);
        }

        if (_this.isWindowsPhoneBrowser) {
          _this.setSelection(newSelection.start, newSelection.end, {
            deferred: true
          });
        } else {
          _this.setSelection(newSelection.start, newSelection.end);
        }
      };

      _this.onFocus = function (event) {
        var beforeMaskedValueChange = _this.props.beforeMaskedValueChange;
        var _this$maskOptions2 = _this.maskOptions,
            mask = _this$maskOptions2.mask,
            prefix = _this$maskOptions2.prefix;
        _this.focused = true; // if autoFocus is set, onFocus triggers before componentDidMount

        _this.mounted = true;

        if (mask) {
          if (!_this.value) {
            var emptyValue = formatValue(_this.maskOptions, prefix);
            var newValue = formatValue(_this.maskOptions, emptyValue);
            var filledLength = getFilledLength(_this.maskOptions, newValue);
            var cursorPosition = getRightEditablePosition(_this.maskOptions, filledLength);
            var newSelection = {
              start: cursorPosition,
              end: cursorPosition
            };

            if (isFunction(beforeMaskedValueChange)) {
              var modifiedValue = beforeMaskedValueChange({
                value: newValue,
                selection: newSelection
              }, {
                value: _this.value,
                selection: null
              }, null, _this.getBeforeMaskedValueChangeConfig());
              newValue = modifiedValue.value;
              newSelection = modifiedValue.selection;
            }

            var isInputValueChanged = newValue !== _this.getInputValue();

            if (isInputValueChanged) {
              _this.setInputValue(newValue);
            }

            if (isInputValueChanged && isFunction(_this.props.onChange)) {
              _this.props.onChange(event);
            }

            _this.setSelection(newSelection.start, newSelection.end);
          } else if (getFilledLength(_this.maskOptions, _this.value) < _this.maskOptions.mask.length) {
            _this.setCursorToEnd();
          }

          _this.runSaveSelectionLoop();
        }

        if (isFunction(_this.props.onFocus)) {
          _this.props.onFocus(event);
        }
      };

      _this.onBlur = function (event) {
        var beforeMaskedValueChange = _this.props.beforeMaskedValueChange;
        var mask = _this.maskOptions.mask;

        _this.stopSaveSelectionLoop();

        _this.focused = false;

        if (mask && !_this.props.alwaysShowMask && isEmpty(_this.maskOptions, _this.value)) {
          var newValue = '';

          if (isFunction(beforeMaskedValueChange)) {
            var modifiedValue = beforeMaskedValueChange({
              value: newValue,
              selection: null
            }, {
              value: _this.value,
              selection: _this.previousSelection
            }, null, _this.getBeforeMaskedValueChangeConfig());
            newValue = modifiedValue.value;
          }

          var isInputValueChanged = newValue !== _this.getInputValue();

          if (isInputValueChanged) {
            _this.setInputValue(newValue);
          }

          if (isInputValueChanged && isFunction(_this.props.onChange)) {
            _this.props.onChange(event);
          }
        }

        if (isFunction(_this.props.onBlur)) {
          _this.props.onBlur(event);
        }
      };

      _this.onMouseDown = function (event) {
        // tiny unintentional mouse movements can break cursor
        // position on focus, so we have to restore it in that case
        //
        // https://github.com/sanniassin/react-input-mask/issues/108
        if (!_this.focused && document.addEventListener) {
          _this.mouseDownX = event.clientX;
          _this.mouseDownY = event.clientY;
          _this.mouseDownTime = new Date().getTime();

          var mouseUpHandler = function mouseUpHandler(mouseUpEvent) {
            document.removeEventListener('mouseup', mouseUpHandler);

            if (!_this.focused) {
              return;
            }

            var deltaX = Math.abs(mouseUpEvent.clientX - _this.mouseDownX);
            var deltaY = Math.abs(mouseUpEvent.clientY - _this.mouseDownY);
            var axisDelta = Math.max(deltaX, deltaY);

            var timeDelta = new Date().getTime() - _this.mouseDownTime;

            if (axisDelta <= 10 && timeDelta <= 200 || axisDelta <= 5 && timeDelta <= 300) {
              _this.setCursorToEnd();
            }
          };

          document.addEventListener('mouseup', mouseUpHandler);
        }

        if (isFunction(_this.props.onMouseDown)) {
          _this.props.onMouseDown(event);
        }
      };

      _this.onPaste = function (event) {
        if (isFunction(_this.props.onPaste)) {
          _this.props.onPaste(event);
        } // event.clipboardData might not work in Android browser
        // cleaning input to get raw text inside onChange handler


        if (!event.defaultPrevented) {
          _this.beforePasteState = {
            value: _this.getInputValue(),
            selection: _this.getSelection()
          };

          _this.setInputValue('');
        }
      };

      _this.handleRef = function (ref) {
        if (_this.props.children == null && isFunction(_this.props.inputRef)) {
          _this.props.inputRef(ref);
        }
      };

      var _mask = props.mask,
          _maskChar = props.maskChar,
          _formatChars = props.formatChars,
          _alwaysShowMask = props.alwaysShowMask,
          _beforeMaskedValueChange = props.beforeMaskedValueChange;
      var defaultValue = props.defaultValue,
          _value = props.value;
      _this.maskOptions = parseMask(_mask, _maskChar, _formatChars);

      if (defaultValue == null) {
        defaultValue = '';
      }

      if (_value == null) {
        _value = defaultValue;
      }

      var _newValue = getStringValue(_value);

      if (_this.maskOptions.mask && (_alwaysShowMask || _newValue)) {
        _newValue = formatValue(_this.maskOptions, _newValue);

        if (isFunction(_beforeMaskedValueChange)) {
          var oldValue = props.value;

          if (props.value == null) {
            oldValue = defaultValue;
          }

          oldValue = getStringValue(oldValue);

          var modifiedValue = _beforeMaskedValueChange({
            value: _newValue,
            selection: null
          }, {
            value: oldValue,
            selection: null
          }, null, _this.getBeforeMaskedValueChangeConfig());

          _newValue = modifiedValue.value;
        }
      }

      _this.value = _newValue;
      return _this;
    }

    var _proto = InputElement.prototype;

    _proto.componentDidMount = function componentDidMount() {
      this.mounted = true; // workaround for react-test-renderer
      // https://github.com/sanniassin/react-input-mask/issues/147

      if (!this.getInputDOMNode()) {
        return;
      }

      this.isWindowsPhoneBrowser = isWindowsPhoneBrowser();

      if (this.maskOptions.mask && this.getInputValue() !== this.value) {
        this.setInputValue(this.value);
      }
    };

    _proto.componentDidUpdate = function componentDidUpdate() {
      var previousSelection = this.previousSelection;
      var _this$props = this.props,
          beforeMaskedValueChange = _this$props.beforeMaskedValueChange,
          alwaysShowMask = _this$props.alwaysShowMask,
          mask = _this$props.mask,
          maskChar = _this$props.maskChar,
          formatChars = _this$props.formatChars;
      var previousMaskOptions = this.maskOptions;
      var showEmpty = alwaysShowMask || this.isFocused();
      var hasValue = this.props.value != null;
      var newValue = hasValue ? getStringValue(this.props.value) : this.value;
      var cursorPosition = previousSelection ? previousSelection.start : null;
      this.maskOptions = parseMask(mask, maskChar, formatChars);

      if (!this.maskOptions.mask) {
        if (previousMaskOptions.mask) {
          this.stopSaveSelectionLoop(); // render depends on this.maskOptions and this.value,
          // call forceUpdate to keep it in sync

          this.forceUpdate();
        }

        return;
      } else if (!previousMaskOptions.mask && this.isFocused()) {
        this.runSaveSelectionLoop();
      }

      var isMaskChanged = this.maskOptions.mask && this.maskOptions.mask !== previousMaskOptions.mask;

      if (!previousMaskOptions.mask && !hasValue) {
        newValue = this.getInputValue();
      }

      if (isMaskChanged || this.maskOptions.mask && (newValue || showEmpty)) {
        newValue = formatValue(this.maskOptions, newValue);
      }

      if (isMaskChanged) {
        var filledLength = getFilledLength(this.maskOptions, newValue);

        if (cursorPosition === null || filledLength < cursorPosition) {
          if (isFilled(this.maskOptions, newValue)) {
            cursorPosition = filledLength;
          } else {
            cursorPosition = getRightEditablePosition(this.maskOptions, filledLength);
          }
        }
      }

      if (this.maskOptions.mask && isEmpty(this.maskOptions, newValue) && !showEmpty && (!hasValue || !this.props.value)) {
        newValue = '';
      }

      var newSelection = {
        start: cursorPosition,
        end: cursorPosition
      };

      if (isFunction(beforeMaskedValueChange)) {
        var modifiedValue = beforeMaskedValueChange({
          value: newValue,
          selection: newSelection
        }, {
          value: this.value,
          selection: this.previousSelection
        }, null, this.getBeforeMaskedValueChangeConfig());
        newValue = modifiedValue.value;
        newSelection = modifiedValue.selection;
      }

      this.value = newValue; // render depends on this.maskOptions and this.value,
      // call forceUpdate to keep it in sync

      if (this.getInputValue() !== this.value) {
        this.setInputValue(this.value);
        this.forceUpdate();
      } else if (isMaskChanged) {
        this.forceUpdate();
      }

      var isSelectionChanged = false;

      if (newSelection.start != null && newSelection.end != null) {
        isSelectionChanged = !previousSelection || previousSelection.start !== newSelection.start || previousSelection.end !== newSelection.end;
      }

      if (isSelectionChanged) {
        this.setSelection(newSelection.start, newSelection.end);
      }
    };

    _proto.componentWillUnmount = function componentWillUnmount() {
      this.mounted = false;

      if (this.selectionDeferId !== null) {
        cancelDefer(this.selectionDeferId);
      }

      this.stopSaveSelectionLoop();
    };

    _proto.render = function render() {
      var _this$props2 = this.props,
          mask = _this$props2.mask,
          alwaysShowMask = _this$props2.alwaysShowMask,
          maskChar = _this$props2.maskChar,
          formatChars = _this$props2.formatChars,
          inputRef = _this$props2.inputRef,
          beforeMaskedValueChange = _this$props2.beforeMaskedValueChange,
          children = _this$props2.children,
          restProps = _objectWithoutProperties(_this$props2, ["mask", "alwaysShowMask", "maskChar", "formatChars", "inputRef", "beforeMaskedValueChange", "children"]);

      var inputElement;
      warning_1( // parse mask to test against actual mask prop as this.maskOptions
      // will be updated later in componentDidUpdate
      !restProps.maxLength || !parseMask(mask, maskChar, formatChars).mask, 'react-input-mask: maxLength property shouldn\'t be passed to the masked input. It breaks masking and unnecessary because length is limited by the mask length.');

      if (children) {
        !isFunction(children) ? invariant_1(false, 'react-input-mask: children must be a function') : void 0;
        var controlledProps = ['onChange', 'onPaste', 'onMouseDown', 'onFocus', 'onBlur', 'value', 'disabled', 'readOnly'];

        var childrenProps = _extends({}, restProps);

        controlledProps.forEach(function (propId) {
          return delete childrenProps[propId];
        });
        inputElement = children(childrenProps);
        var conflictProps = controlledProps.filter(function (propId) {
          return inputElement.props[propId] != null && inputElement.props[propId] !== restProps[propId];
        });
        !!conflictProps.length ? invariant_1(false, "react-input-mask: the following props should be passed to the react-input-mask's component and should not be altered in children's function: " + conflictProps.join(', ')) : void 0;
        warning_1(!inputRef, 'react-input-mask: inputRef is ignored when children is passed, attach ref to the children instead');
      } else {
        inputElement = React.createElement("input", _extends({
          ref: this.handleRef
        }, restProps));
      }

      var changedProps = {
        onFocus: this.onFocus,
        onBlur: this.onBlur
      };

      if (this.maskOptions.mask) {
        if (!restProps.disabled && !restProps.readOnly) {
          changedProps.onChange = this.onChange;
          changedProps.onPaste = this.onPaste;
          changedProps.onMouseDown = this.onMouseDown;
        }

        if (restProps.value != null) {
          changedProps.value = this.value;
        }
      }

      inputElement = React.cloneElement(inputElement, changedProps);
      return inputElement;
    };

    _inheritsLoose(InputElement, _React$Component);

    return InputElement;
  }(React.Component);

  return InputElement;

})));
