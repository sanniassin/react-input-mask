"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// https://github.com/sanniassin/react-input-mask

var React = require("react");

var InputElement = function (_React$Component) {
    _inherits(InputElement, _React$Component);

    function InputElement(props) {
        _classCallCheck(this, InputElement);

        var _this = _possibleConstructorReturn(this, (InputElement.__proto__ || Object.getPrototypeOf(InputElement)).call(this, props));

        _initialiseProps.call(_this);

        _this.hasValue = props.value != null;
        _this.charsRules = props.formatChars != null ? props.formatChars : _this.defaultCharsRules;

        var mask = _this.parseMask(props.mask);
        var defaultValue = props.defaultValue != null ? props.defaultValue : '';
        var value = props.value != null ? props.value : defaultValue;

        value = _this.getStringValue(value);

        _this.mask = mask.mask;
        _this.permanents = mask.permanents;
        _this.lastEditablePos = mask.lastEditablePos;
        _this.maskChar = "maskChar" in props ? props.maskChar : _this.defaultMaskChar;

        if (_this.mask && (props.alwaysShowMask || value)) {
            value = _this.formatValue(value);
        }

        _this.state = { value: value };
        return _this;
    }

    return InputElement;
}(React.Component);

var _initialiseProps = function _initialiseProps() {
    var _this2 = this;

    this.defaultCharsRules = {
        "9": "[0-9]",
        "a": "[A-Za-z]",
        "*": "[A-Za-z0-9]"
    };
    this.defaultMaskChar = "_";
    this.lastCursorPos = null;

    this.isAndroidBrowser = function () {
        var windows = new RegExp("windows", "i");
        var firefox = new RegExp("firefox", "i");
        var android = new RegExp("android", "i");
        var ua = navigator.userAgent;
        return !windows.test(ua) && !firefox.test(ua) && android.test(ua);
    };

    this.isWindowsPhoneBrowser = function () {
        var windows = new RegExp("windows", "i");
        var phone = new RegExp("phone", "i");
        var ua = navigator.userAgent;
        return windows.test(ua) && phone.test(ua);
    };

    this.isAndroidFirefox = function () {
        var windows = new RegExp("windows", "i");
        var firefox = new RegExp("firefox", "i");
        var android = new RegExp("android", "i");
        var ua = navigator.userAgent;
        return !windows.test(ua) && firefox.test(ua) && android.test(ua);
    };

    this.isDOMElement = function (element) {
        return (typeof HTMLElement === "undefined" ? "undefined" : _typeof(HTMLElement)) === "object" ? element instanceof HTMLElement // DOM2
        : element.nodeType === 1 && typeof element.nodeName === "string";
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
                set: function set(val) {
                    _this2.value = val;
                    _this2.valueDescriptor.set.call(input, val);
                }
            });
        }
    };

    this.disableValueAccessors = function () {
        var valueDescriptor = _this2.valueDescriptor;

        if (!valueDescriptor) {
            return;
        }
        _this2.valueDescriptor = null;
        var input = _this2.getInputDOMNode();
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

    this.setInputValue = function (val) {
        var input = _this2.getInputDOMNode();
        _this2.value = val;
        input.value = val;
    };

    this.getPrefix = function () {
        var prefix = "";
        var mask = _this2.mask;

        for (var i = 0; i < mask.length && _this2.isPermanentChar(i); ++i) {
            prefix += mask[i];
        }
        return prefix;
    };

    this.getFilledLength = function () {
        var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this2.state.value;

        var i;
        var maskChar = _this2.maskChar;


        if (!maskChar) {
            return value.length;
        }

        for (i = value.length - 1; i >= 0; --i) {
            var character = value[i];
            if (!_this2.isPermanentChar(i) && _this2.isAllowedChar(character, i)) {
                break;
            }
        }

        return ++i || _this2.getPrefix().length;
    };

    this.getLeftEditablePos = function (pos) {
        for (var i = pos; i >= 0; --i) {
            if (!_this2.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    };

    this.getRightEditablePos = function (pos) {
        var mask = _this2.mask;

        for (var i = pos; i < mask.length; ++i) {
            if (!_this2.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    };

    this.isEmpty = function () {
        var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this2.state.value;

        return !value.split("").some(function (character, i) {
            return !_this2.isPermanentChar(i) && _this2.isAllowedChar(character, i);
        });
    };

    this.isFilled = function () {
        var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this2.state.value;

        return _this2.getFilledLength(value) === _this2.mask.length;
    };

    this.createFilledArray = function (length, val) {
        var array = [];
        for (var i = 0; i < length; i++) {
            array[i] = val;
        }
        return array;
    };

    this.formatValue = function (value) {
        var maskChar = _this2.maskChar,
            mask = _this2.mask;

        if (!maskChar) {
            var prefix = _this2.getPrefix();
            var prefixLen = prefix.length;
            value = _this2.insertRawSubstr("", value, 0);
            while (value.length > prefixLen && _this2.isPermanentChar(value.length - 1)) {
                value = value.slice(0, value.length - 1);
            }

            if (value.length < prefixLen) {
                value = prefix;
            }

            return value;
        }
        if (value) {
            var emptyValue = _this2.formatValue("");
            return _this2.insertRawSubstr(emptyValue, value, 0);
        }
        return value.split("").concat(_this2.createFilledArray(mask.length - value.length, null)).map(function (character, pos) {
            if (_this2.isAllowedChar(character, pos)) {
                return character;
            } else if (_this2.isPermanentChar(pos)) {
                return mask[pos];
            }
            return maskChar;
        }).join("");
    };

    this.clearRange = function (value, start, len) {
        var end = start + len;
        var maskChar = _this2.maskChar,
            mask = _this2.mask;

        if (!maskChar) {
            var prefixLen = _this2.getPrefix().length;
            value = value.split("").filter(function (character, i) {
                return i < prefixLen || i < start || i >= end;
            }).join("");
            return _this2.formatValue(value);
        }
        return value.split("").map(function (character, i) {
            if (i < start || i >= end) {
                return character;
            }
            if (_this2.isPermanentChar(i)) {
                return mask[i];
            }
            return maskChar;
        }).join("");
    };

    this.replaceSubstr = function (value, newSubstr, pos) {
        return value.slice(0, pos) + newSubstr + value.slice(pos + newSubstr.length);
    };

    this.insertRawSubstr = function (value, substr, pos) {
        var mask = _this2.mask,
            maskChar = _this2.maskChar;

        var isFilled = _this2.isFilled(value);
        var prefixLen = _this2.getPrefix().length;
        substr = substr.split("");

        if (!maskChar && pos > value.length) {
            value += mask.slice(value.length, pos);
        }

        for (var i = pos; i < mask.length && substr.length;) {
            var isPermanent = _this2.isPermanentChar(i);
            if (!isPermanent || mask[i] === substr[0]) {
                var character = substr.shift();
                if (_this2.isAllowedChar(character, i, true)) {
                    if (i < value.length) {
                        if (maskChar || isFilled || i < prefixLen) {
                            value = _this2.replaceSubstr(value, character, i);
                        } else {
                            value = _this2.formatValue(value.substr(0, i) + character + value.substr(i));
                        }
                    } else if (!maskChar) {
                        value += character;
                    }
                    ++i;
                }
            } else {
                if (!maskChar && i >= value.length) {
                    value += mask[i];
                } else if (maskChar && isPermanent && substr[0] === maskChar) {
                    substr.shift();
                }
                ++i;
            }
        }
        return value;
    };

    this.getRawSubstrLength = function (value, substr, pos) {
        var mask = _this2.mask,
            maskChar = _this2.maskChar;

        substr = substr.split("");
        for (var i = pos; i < mask.length && substr.length;) {
            if (!_this2.isPermanentChar(i) || mask[i] === substr[0]) {
                var character = substr.shift();
                if (_this2.isAllowedChar(character, i, true)) {
                    ++i;
                }
            } else {
                ++i;
            }
        }
        return i - pos;
    };

    this.isAllowedChar = function (character, pos) {
        var allowMaskChar = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var mask = _this2.mask,
            maskChar = _this2.maskChar;

        if (_this2.isPermanentChar(pos)) {
            return mask[pos] === character;
        }
        var ruleChar = mask[pos];
        var charRule = _this2.charsRules[ruleChar];
        return new RegExp(charRule).test(character || "") || allowMaskChar && character === maskChar;
    };

    this.isPermanentChar = function (pos) {
        return _this2.permanents.indexOf(pos) !== -1;
    };

    this.setCursorToEnd = function () {
        var filledLen = _this2.getFilledLength();
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
        if ("selectionStart" in input && "selectionEnd" in input) {
            input.selectionStart = start;
            input.selectionEnd = end;
        } else {
            var range = input.createTextRange();
            range.collapse(true);
            range.moveStart("character", start);
            range.moveEnd("character", end - start);
            range.select();
        }
    };

    this.getSelection = function () {
        var input = _this2.getInputDOMNode();
        var start = 0;
        var end = 0;

        if ("selectionStart" in input && "selectionEnd" in input) {
            start = input.selectionStart;
            end = input.selectionEnd;
        } else {
            var range = document.selection.createRange();
            if (range.parentElement() === input) {
                start = -range.moveStart("character", -input.value.length);
                end = -range.moveEnd("character", -input.value.length);
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

        var setPos = _this2.setSelection.bind(_this2, pos, 0);

        setPos();
        raf(setPos);

        _this2.lastCursorPos = pos;
    };

    this.isFocused = function () {
        return document.activeElement === _this2.getInputDOMNode();
    };

    this.parseMask = function (mask) {
        if (!mask || typeof mask !== "string") {
            return {
                mask: null,
                lastEditablePos: null,
                permanents: []
            };
        }
        var str = "";
        var permanents = [];
        var isPermanent = false;
        var lastEditablePos = null;

        mask.split("").forEach(function (character) {
            if (!isPermanent && character === "\\") {
                isPermanent = true;
            } else {
                if (isPermanent || !_this2.charsRules[character]) {
                    permanents.push(str.length);
                } else {
                    lastEditablePos = str.length + 1;
                }
                str += character;
                isPermanent = false;
            }
        });

        return {
            mask: str,
            lastEditablePos: lastEditablePos,
            permanents: permanents
        };
    };

    this.getStringValue = function (value) {
        return !value && value !== 0 ? "" : value + "";
    };

    this.componentWillMount = function () {
        var mask = _this2.mask;
        var value = _this2.state.value;

        if (mask && value) {
            _this2.setState({ value: value });
        }
    };

    this.componentWillReceiveProps = function (nextProps) {
        _this2.hasValue = _this2.props.value != null;
        _this2.charsRules = nextProps.formatChars != null ? nextProps.formatChars : _this2.defaultCharsRules;

        var oldMask = _this2.mask;
        var mask = _this2.parseMask(nextProps.mask);
        var isMaskChanged = mask.mask && mask.mask !== _this2.mask;

        _this2.mask = mask.mask;
        _this2.permanents = mask.permanents;
        _this2.lastEditablePos = mask.lastEditablePos;
        _this2.maskChar = "maskChar" in nextProps ? nextProps.maskChar : _this2.defaultMaskChar;

        if (!_this2.mask) {
            _this2.lastCursorPos = null;
            return;
        }

        var newValue = nextProps.value != null ? _this2.getStringValue(nextProps.value) : _this2.state.value;

        if (!oldMask && nextProps.value == null) {
            newValue = _this2.getInputDOMNode().value;
        }

        var showEmpty = nextProps.alwaysShowMask || _this2.isFocused();
        if (isMaskChanged || mask.mask && (newValue || showEmpty)) {
            newValue = _this2.formatValue(newValue);

            if (isMaskChanged) {
                var pos = _this2.lastCursorPos;
                var filledLen = _this2.getFilledLength(newValue);
                if (pos === null || filledLen < pos) {
                    if (_this2.isFilled(newValue)) {
                        pos = filledLen;
                    } else {
                        pos = _this2.getRightEditablePos(filledLen);
                    }
                    _this2.setCursorPos(pos);
                }
            }
        }
        if (mask.mask && _this2.isEmpty(newValue) && !showEmpty && (!_this2.hasValue || !nextProps.value)) {
            newValue = "";
        }
        _this2.value = newValue;
        if (_this2.state.value !== newValue) {
            _this2.setState({ value: newValue });
        }
    };

    this.componentDidUpdate = function (prevProps, prevState) {
        if ((_this2.mask || prevProps.mask) && _this2.props.value == null) {
            _this2.updateUncontrolledInput();
        }
        if (_this2.valueDescriptor && _this2.getInputValue() !== _this2.state.value) {
            _this2.setInputValue(_this2.state.value);
        }
    };

    this.updateUncontrolledInput = function () {
        if (_this2.getInputValue() !== _this2.state.value) {
            _this2.setInputValue(_this2.state.value);
        }
    };

    this.onKeyDown = function (event) {
        var hasHandler = typeof _this2.props.onKeyDown === "function";
        if (event.ctrlKey || event.metaKey) {
            if (hasHandler) {
                _this2.props.onKeyDown(event);
            }
            return;
        }

        var cursorPos = _this2.getCursorPos();
        var value = _this2.state.value;
        var key = event.key;
        var preventDefault = false;
        switch (key) {
            case "Backspace":
            case "Delete":
                var prefixLen = _this2.getPrefix().length;
                var deleteFromRight = key === "Delete";
                var selectionRange = _this2.getSelection();
                if (selectionRange.length) {
                    value = _this2.clearRange(value, selectionRange.start, selectionRange.length);
                } else if (cursorPos < prefixLen || !deleteFromRight && cursorPos === prefixLen) {
                    cursorPos = prefixLen;
                } else {
                    var editablePos = deleteFromRight ? _this2.getRightEditablePos(cursorPos) : _this2.getLeftEditablePos(cursorPos - 1);
                    if (editablePos !== null) {
                        value = _this2.clearRange(value, editablePos, 1);
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
            _this2.setInputValue(value);
            _this2.setState({
                value: _this2.hasValue ? _this2.state.value : value
            });
            preventDefault = true;
            if (typeof _this2.props.onChange === "function") {
                _this2.props.onChange(event);
            }
        }
        if (preventDefault) {
            event.preventDefault();
            _this2.setCursorPos(cursorPos);
        }
    };

    this.onKeyPress = function (event) {
        var key = event.key;
        var hasHandler = typeof _this2.props.onKeyPress === "function";
        if (key === "Enter" || event.ctrlKey || event.metaKey) {
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
        var mask = _this2.mask,
            maskChar = _this2.maskChar,
            lastEditablePos = _this2.lastEditablePos;

        var maskLen = mask.length;
        var prefixLen = _this2.getPrefix().length;

        if (_this2.isPermanentChar(cursorPos) && mask[cursorPos] === key) {
            value = _this2.insertRawSubstr(value, key, cursorPos);
            ++cursorPos;
        } else {
            var editablePos = _this2.getRightEditablePos(cursorPos);
            if (editablePos !== null && _this2.isAllowedChar(key, editablePos)) {
                value = _this2.clearRange(value, selection.start, selection.length);
                value = _this2.insertRawSubstr(value, key, editablePos);
                cursorPos = editablePos + 1;
            }
        }

        if (value !== _this2.state.value) {
            _this2.setInputValue(value);
            _this2.setState({
                value: _this2.hasValue ? _this2.state.value : value
            });
            if (typeof _this2.props.onChange === "function") {
                _this2.props.onChange(event);
            }
        }
        event.preventDefault();
        if (cursorPos < lastEditablePos && cursorPos > prefixLen) {
            cursorPos = _this2.getRightEditablePos(cursorPos);
        }
        _this2.setCursorPos(cursorPos);
    };

    this.onChange = function (event) {
        var pasteSelection = _this2.pasteSelection,
            mask = _this2.mask,
            maskChar = _this2.maskChar,
            lastEditablePos = _this2.lastEditablePos,
            preventEmptyChange = _this2.preventEmptyChange;

        var target = event.target;
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
        var prefixLen = _this2.getPrefix().length;
        var clearedValue;

        if (valueLen > oldValueLen) {
            var substrLen = valueLen - oldValueLen;
            var startPos = selection.end - substrLen;
            var enteredSubstr = value.substr(startPos, substrLen);

            if (startPos < lastEditablePos && (substrLen !== 1 || enteredSubstr !== mask[startPos])) {
                cursorPos = _this2.getRightEditablePos(startPos);
            } else {
                cursorPos = startPos;
            }

            value = value.substr(0, startPos) + value.substr(startPos + substrLen);

            clearedValue = _this2.clearRange(value, startPos, maskLen - startPos);
            clearedValue = _this2.insertRawSubstr(clearedValue, enteredSubstr, cursorPos);

            value = _this2.insertRawSubstr(oldValue, enteredSubstr, cursorPos);

            if (substrLen !== 1 || cursorPos >= prefixLen && cursorPos < lastEditablePos) {
                cursorPos = _this2.getFilledLength(clearedValue);
            } else if (cursorPos < lastEditablePos) {
                cursorPos++;
            }
        } else if (valueLen < oldValueLen) {
            var removedLen = maskLen - valueLen;
            clearedValue = _this2.clearRange(oldValue, selection.end, removedLen);
            var substr = value.substr(0, selection.end);
            var clearOnly = substr === oldValue.substr(0, selection.end);

            if (maskChar) {
                value = _this2.insertRawSubstr(clearedValue, substr, 0);
            }

            clearedValue = _this2.clearRange(clearedValue, selection.end, maskLen - selection.end);
            clearedValue = _this2.insertRawSubstr(clearedValue, substr, 0);

            if (!clearOnly) {
                cursorPos = _this2.getFilledLength(clearedValue);
            } else if (cursorPos < prefixLen) {
                cursorPos = prefixLen;
            }
        }
        value = _this2.formatValue(value);

        if (_this2.isWindowsPhoneBrowser) {
            event.persist();
            setTimeout(function () {
                _this2.setInputValue(value);

                if (!_this2.hasValue) {
                    _this2.setState({
                        value: value
                    });
                }

                if (typeof _this2.props.onChange === "function") {
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

            if (typeof _this2.props.onChange === "function") {
                _this2.props.onChange(event);
            }

            _this2.setCursorPos(cursorPos);
        }
    };

    this.onFocus = function (event) {
        if (!_this2.state.value) {
            var prefix = _this2.getPrefix();
            var value = _this2.formatValue(prefix);
            var inputValue = _this2.formatValue(value);

            // do not use this.getInputValue and this.setInputValue as this.input
            // can be undefined at this moment if autoFocus attribute is set
            var isInputValueChanged = inputValue !== event.target.value;

            if (isInputValueChanged) {
                event.target.value = inputValue;
            }

            _this2.setState({
                value: _this2.hasValue ? _this2.state.value : inputValue
            }, _this2.setCursorToEnd);

            if (isInputValueChanged && typeof _this2.props.onChange === "function") {
                _this2.props.onChange(event);
            }
        } else if (_this2.getFilledLength() < _this2.mask.length) {
            _this2.setCursorToEnd();
        }

        if (typeof _this2.props.onFocus === "function") {
            _this2.props.onFocus(event);
        }
    };

    this.onBlur = function (event) {
        if (!_this2.props.alwaysShowMask && _this2.isEmpty(_this2.state.value)) {
            var inputValue = "";
            var isInputValueChanged = inputValue !== _this2.getInputValue();
            if (isInputValueChanged) {
                _this2.setInputValue(inputValue);
            }
            _this2.setState({
                value: _this2.hasValue ? _this2.state.value : ""
            });
            if (isInputValueChanged && typeof _this2.props.onChange === "function") {
                _this2.props.onChange(event);
            }
        }

        if (typeof _this2.props.onBlur === "function") {
            _this2.props.onBlur(event);
        }
    };

    this.onPaste = function (event) {
        if (_this2.isAndroidBrowser) {
            _this2.pasteSelection = _this2.getSelection();
            _this2.setInputValue("");
            return;
        }
        var text;
        if (window.clipboardData && window.clipboardData.getData) {
            // IE
            text = window.clipboardData.getData("Text");
        } else if (event.clipboardData && event.clipboardData.getData) {
            text = event.clipboardData.getData("text/plain");
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
            value = _this2.clearRange(value, cursorPos, selection.length);
        }
        var textLen = _this2.getRawSubstrLength(value, text, cursorPos);
        value = _this2.insertRawSubstr(value, text, cursorPos);
        cursorPos += textLen;
        cursorPos = _this2.getRightEditablePos(cursorPos) || cursorPos;
        if (value !== _this2.getInputValue()) {
            if (event) {
                _this2.setInputValue(value);
            }
            _this2.setState({
                value: _this2.hasValue ? _this2.state.value : value
            });
            if (event && typeof _this2.props.onChange === "function") {
                _this2.props.onChange(event);
            }
        }
        _this2.setCursorPos(cursorPos);
    };

    this.componentDidMount = function () {
        _this2.isAndroidBrowser = _this2.isAndroidBrowser();
        _this2.isWindowsPhoneBrowser = _this2.isWindowsPhoneBrowser();
        _this2.isAndroidFirefox = _this2.isAndroidFirefox();

        var input = _this2.getInputDOMNode();

        // workaround for Jest
        // it doesn't mount a real node so input will be null
        if (input && Object.getOwnPropertyDescriptor && Object.getPrototypeOf && Object.defineProperty) {
            var valueDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
            _this2.canUseAccessors = !!(valueDescriptor && valueDescriptor.get && valueDescriptor.set);
        }

        if (_this2.mask && _this2.props.value == null) {
            _this2.updateUncontrolledInput();
        }
    };

    this.render = function () {
        var _props = _this2.props,
            mask = _props.mask,
            alwaysShowMask = _props.alwaysShowMask,
            maskChar = _props.maskChar,
            formatChars = _props.formatChars,
            props = _objectWithoutProperties(_props, ["mask", "alwaysShowMask", "maskChar", "formatChars"]);

        if (_this2.mask) {
            if (!props.disabled && !props.readOnly) {
                var handlersKeys = ["onFocus", "onBlur", "onChange", "onKeyDown", "onKeyPress", "onPaste"];
                handlersKeys.forEach(function (key) {
                    props[key] = _this2[key];
                });
            }

            if (props.value != null) {
                props.value = _this2.state.value;
            }
        }
        return React.createElement("input", _extends({ ref: function ref(_ref) {
                return _this2.input = _ref;
            } }, props));
    };
};

module.exports = InputElement;