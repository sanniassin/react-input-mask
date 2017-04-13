// https://github.com/sanniassin/react-input-mask

"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var React = require("react");

var InputElement = React.createClass({
    displayName: "InputElement",

    defaultCharsRules: {
        "9": "[0-9]",
        "a": "[A-Za-z]",
        "*": "[A-Za-z0-9]"
    },
    defaultMaskChar: "_",
    lastCaretPos: null,
    isAndroidBrowser: function () {
        var windows = new RegExp("windows", "i");
        var firefox = new RegExp("firefox", "i");
        var android = new RegExp("android", "i");
        var ua = navigator.userAgent;
        return !windows.test(ua) && !firefox.test(ua) && android.test(ua);
    },
    isWindowsPhoneBrowser: function () {
        var windows = new RegExp("windows", "i");
        var phone = new RegExp("phone", "i");
        var ua = navigator.userAgent;
        return windows.test(ua) && phone.test(ua);
    },
    isAndroidFirefox: function () {
        var windows = new RegExp("windows", "i");
        var firefox = new RegExp("firefox", "i");
        var android = new RegExp("android", "i");
        var ua = navigator.userAgent;
        return !windows.test(ua) && firefox.test(ua) && android.test(ua);
    },
    isDOMElement: function (element) {
        return typeof HTMLElement === "object" ? element instanceof HTMLElement // DOM2
        : element.nodeType === 1 && typeof element.nodeName === "string";
    },
    // getDOMNode is deprecated but we need it to stay compatible with React 0.12
    getInputDOMNode: function () {
        var input = this.refs.input;

        if (!input) {
            return null;
        }

        // React 0.14
        if (this.isDOMElement(input)) {
            return input;
        }

        return input.getDOMNode();
    },
    enableValueAccessors: function () {
        var _this = this;

        if (this.canUseAccessors) {
            var input = this.getInputDOMNode();
            this.valueDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
            Object.defineProperty(input, 'value', {
                configurable: true,
                enumerable: true,
                get: function () {
                    return _this.value;
                },
                set: function (val) {
                    _this.value = val;
                    _this.valueDescriptor.set.call(input, val);
                }
            });
        }
    },
    disableValueAccessors: function () {
        var valueDescriptor = this.valueDescriptor;

        if (!valueDescriptor) {
            return;
        }
        this.valueDescriptor = null;
        var input = this.getInputDOMNode();
        Object.defineProperty(input, 'value', valueDescriptor);
    },
    getInputValue: function () {
        var input = this.getInputDOMNode();
        var valueDescriptor = this.valueDescriptor;

        var value;
        if (valueDescriptor) {
            value = valueDescriptor.get.call(input);
        } else {
            value = input.value;
        }

        return value;
    },
    setInputValue: function (val) {
        var input = this.getInputDOMNode();
        this.value = val;
        input.value = val;
    },
    getPrefix: function () {
        var prefix = "";
        var mask = this.mask;

        for (var i = 0; i < mask.length && this.isPermanentChar(i); ++i) {
            prefix += mask[i];
        }
        return prefix;
    },
    getFilledLength: function () {
        var value = arguments.length <= 0 || arguments[0] === undefined ? this.state.value : arguments[0];

        var i;
        var maskChar = this.maskChar;

        if (!maskChar) {
            return value.length;
        }

        for (i = value.length - 1; i >= 0; --i) {
            var character = value[i];
            if (!this.isPermanentChar(i) && this.isAllowedChar(character, i)) {
                break;
            }
        }

        return ++i || this.getPrefix().length;
    },
    getLeftEditablePos: function (pos) {
        for (var i = pos; i >= 0; --i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    },
    getRightEditablePos: function (pos) {
        var mask = this.mask;

        for (var i = pos; i < mask.length; ++i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    },
    isEmpty: function () {
        var _this2 = this;

        var value = arguments.length <= 0 || arguments[0] === undefined ? this.state.value : arguments[0];

        return !value.split("").some(function (character, i) {
            return !_this2.isPermanentChar(i) && _this2.isAllowedChar(character, i);
        });
    },
    isFilled: function () {
        var value = arguments.length <= 0 || arguments[0] === undefined ? this.state.value : arguments[0];

        return this.getFilledLength(value) === this.mask.length;
    },
    createFilledArray: function (length, val) {
        var array = [];
        for (var i = 0; i < length; i++) {
            array[i] = val;
        }
        return array;
    },
    formatValue: function (value) {
        var _this3 = this;

        var maskChar = this.maskChar;
        var mask = this.mask;

        if (!maskChar) {
            var prefix = this.getPrefix();
            var prefixLen = prefix.length;
            value = this.insertRawSubstr("", value, 0);

            if (value.length < prefixLen) {
                value = prefix;
            }

            var maskLen = mask.length;

            while (value.length < maskLen && this.isPermanentChar(value.length)) {
                value += mask[value.length];
            }

            return value;
        }
        if (value) {
            var emptyValue = this.formatValue("");
            return this.insertRawSubstr(emptyValue, value, 0);
        }
        return value.split("").concat(this.createFilledArray(mask.length - value.length, null)).map(function (character, pos) {
            if (_this3.isAllowedChar(character, pos)) {
                return character;
            } else if (_this3.isPermanentChar(pos)) {
                return mask[pos];
            }
            return maskChar;
        }).join("");
    },
    clearRange: function (value, start, len) {
        var _this4 = this;

        var end = start + len;
        var maskChar = this.maskChar;
        var mask = this.mask;

        if (!maskChar) {
            var prefixLen = this.getPrefix().length;
            value = value.split("").filter(function (character, i) {
                return i < prefixLen || i < start || i >= end;
            }).join("");
            return this.formatValue(value);
        }
        return value.split("").map(function (character, i) {
            if (i < start || i >= end) {
                return character;
            }
            if (_this4.isPermanentChar(i)) {
                return mask[i];
            }
            return maskChar;
        }).join("");
    },
    replaceSubstr: function (value, newSubstr, pos) {
        return value.slice(0, pos) + newSubstr + value.slice(pos + newSubstr.length);
    },
    insertRawSubstr: function (value, substr, pos) {
        var mask = this.mask;
        var maskChar = this.maskChar;

        var isFilled = this.isFilled(value);
        var prefixLen = this.getPrefix().length;
        substr = substr.split("");

        if (!maskChar && pos > value.length) {
            value += mask.slice(value.length, pos);
        }

        for (var i = pos; i < mask.length && substr.length;) {
            var isPermanent = this.isPermanentChar(i);
            if (!isPermanent || mask[i] === substr[0]) {
                var character = substr.shift();
                if (this.isAllowedChar(character, i, true)) {
                    if (i < value.length) {
                        if (maskChar || isFilled || i < prefixLen) {
                            value = this.replaceSubstr(value, character, i);
                        } else {
                            value = this.formatValue(value.substr(0, i) + character + value.substr(i));
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
    },
    getRawSubstrLength: function (value, substr, pos) {
        var mask = this.mask;
        var maskChar = this.maskChar;

        substr = substr.split("");
        for (var i = pos; i < mask.length && substr.length;) {
            if (!this.isPermanentChar(i) || mask[i] === substr[0]) {
                var character = substr.shift();
                if (this.isAllowedChar(character, i, true)) {
                    ++i;
                }
            } else {
                ++i;
            }
        }
        return i - pos;
    },
    isAllowedChar: function (character, pos) {
        var allowMaskChar = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];
        var mask = this.mask;
        var maskChar = this.maskChar;

        if (this.isPermanentChar(pos)) {
            return mask[pos] === character;
        }
        var ruleChar = mask[pos];
        var charRule = this.charsRules[ruleChar];
        return new RegExp(charRule).test(character || "") || allowMaskChar && character === maskChar;
    },
    isPermanentChar: function (pos) {
        return this.permanents.indexOf(pos) !== -1;
    },
    setCaretToEnd: function () {
        var filledLen = this.getFilledLength();
        var pos = this.getRightEditablePos(filledLen);
        if (pos !== null) {
            this.setCaretPos(pos);
        }
    },
    setSelection: function (start) {
        var len = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

        var input = this.getInputDOMNode();
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
    },
    getSelection: function () {
        var input = this.getInputDOMNode();
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
    },
    getCaretPos: function () {
        return this.getSelection().start;
    },
    setCaretPos: function (pos) {
        var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (fn) {
            return setTimeout(fn, 0);
        };

        var setPos = this.setSelection.bind(this, pos, 0);

        setPos();
        raf(setPos);

        this.lastCaretPos = pos;
    },
    isFocused: function () {
        return document.activeElement === this.getInputDOMNode();
    },
    parseMask: function (mask) {
        var _this5 = this;

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
                if (isPermanent || !_this5.charsRules[character]) {
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
    },
    getStringValue: function (value) {
        return !value && value !== 0 ? "" : value + "";
    },
    getInitialState: function () {
        this.hasValue = this.props.value != null;
        this.charsRules = "formatChars" in this.props ? this.props.formatChars : this.defaultCharsRules;

        var mask = this.parseMask(this.props.mask);
        var defaultValue = this.props.defaultValue != null ? this.props.defaultValue : '';
        var value = this.props.value != null ? this.props.value : defaultValue;

        value = this.getStringValue(value);

        this.mask = mask.mask;
        this.permanents = mask.permanents;
        this.lastEditablePos = mask.lastEditablePos;
        this.maskChar = "maskChar" in this.props ? this.props.maskChar : this.defaultMaskChar;

        if (this.mask && (this.props.alwaysShowMask || value)) {
            value = this.formatValue(value);
        }

        return { value: value };
    },
    componentWillMount: function () {
        var mask = this.mask;
        var value = this.state.value;

        if (mask && value) {
            this.setState({ value: value });
        }
    },
    componentWillReceiveProps: function (nextProps) {
        this.hasValue = this.props.value != null;
        this.charsRules = "formatChars" in nextProps ? nextProps.formatChars : this.defaultCharsRules;

        var oldMask = this.mask;
        var mask = this.parseMask(nextProps.mask);
        var isMaskChanged = mask.mask && mask.mask !== this.mask;

        this.mask = mask.mask;
        this.permanents = mask.permanents;
        this.lastEditablePos = mask.lastEditablePos;
        this.maskChar = "maskChar" in nextProps ? nextProps.maskChar : this.defaultMaskChar;

        if (!this.mask) {
            this.lastCaretPos = null;
            return;
        }

        var newValue = nextProps.value != null ? this.getStringValue(nextProps.value) : this.state.value;

        if (!oldMask && nextProps.value == null) {
            newValue = this.getInputDOMNode().value;
        }

        var showEmpty = nextProps.alwaysShowMask || this.isFocused();
        if (isMaskChanged || mask.mask && (newValue || showEmpty && !this.hasValue)) {
            newValue = this.formatValue(newValue);

            if (isMaskChanged) {
                var pos = this.lastCaretPos;
                var filledLen = this.getFilledLength(newValue);
                if (pos === null || filledLen < pos) {
                    if (this.isFilled(newValue)) {
                        pos = filledLen;
                    } else {
                        pos = this.getRightEditablePos(filledLen);
                    }
                    this.setCaretPos(pos);
                }
            }
        }
        if (mask.mask && this.isEmpty(newValue) && !showEmpty && (!this.hasValue || !nextProps.value)) {
            newValue = "";
        }
        this.value = newValue;
        if (this.state.value !== newValue) {
            this.setState({ value: newValue });
        }
    },
    componentDidUpdate: function (prevProps, prevState) {
        if ((this.mask || prevProps.mask) && this.props.value == null) {
            this.updateUncontrolledInput();
        }
        if (this.valueDescriptor && this.getInputValue() !== this.state.value) {
            this.setInputValue(this.state.value);
        }
    },
    updateUncontrolledInput: function () {
        if (this.getInputValue() !== this.state.value) {
            this.setInputValue(this.state.value);
        }
    },
    onKeyDown: function (event) {
        var hasHandler = typeof this.props.onKeyDown === "function";
        if (event.ctrlKey || event.metaKey) {
            if (hasHandler) {
                this.props.onKeyDown(event);
            }
            return;
        }

        var caretPos = this.getCaretPos();
        var value = this.state.value;
        var key = event.key;
        var preventDefault = false;
        switch (key) {
            case "Backspace":
            case "Delete":
                var prefixLen = this.getPrefix().length;
                var deleteFromRight = key === "Delete";
                var selectionRange = this.getSelection();
                if (selectionRange.length) {
                    value = this.clearRange(value, selectionRange.start, selectionRange.length);
                } else if (caretPos < prefixLen || !deleteFromRight && caretPos === prefixLen) {
                    caretPos = prefixLen;
                } else {
                    var editablePos = deleteFromRight ? this.getRightEditablePos(caretPos) : this.getLeftEditablePos(caretPos - 1);
                    if (editablePos !== null) {
                        value = this.clearRange(value, editablePos, 1);
                        caretPos = editablePos;
                    }
                }
                preventDefault = true;
                break;
            default:
                break;
        }

        if (hasHandler) {
            this.props.onKeyDown(event);
        }

        if (value !== this.state.value) {
            this.setInputValue(value);
            this.setState({
                value: this.hasValue ? this.state.value : value
            });
            preventDefault = true;
            if (typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }
        if (preventDefault) {
            event.preventDefault();
            this.setCaretPos(caretPos);
        }
    },
    onKeyPress: function (event) {
        var key = event.key;
        var hasHandler = typeof this.props.onKeyPress === "function";
        if (key === "Enter" || event.ctrlKey || event.metaKey) {
            if (hasHandler) {
                this.props.onKeyPress(event);
            }
            return;
        }

        if (this.isWindowsPhoneBrowser) {
            return;
        }

        var caretPos = this.getCaretPos();
        var selection = this.getSelection();
        var value = this.state.value;
        var mask = this.mask;
        var maskChar = this.maskChar;
        var lastEditablePos = this.lastEditablePos;

        var maskLen = mask.length;
        var prefixLen = this.getPrefix().length;

        if (this.isPermanentChar(caretPos) && mask[caretPos] === key) {
            value = this.insertRawSubstr(value, key, caretPos);
            ++caretPos;
        } else {
            var editablePos = this.getRightEditablePos(caretPos);
            if (editablePos !== null && this.isAllowedChar(key, editablePos)) {
                value = this.clearRange(value, selection.start, selection.length);
                value = this.insertRawSubstr(value, key, editablePos);
                caretPos = editablePos + 1;
            }
        }

        if (value !== this.state.value) {
            this.setInputValue(value);
            this.setState({
                value: this.hasValue ? this.state.value : value
            });
            if (typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }
        event.preventDefault();
        if (caretPos < lastEditablePos && caretPos > prefixLen) {
            caretPos = this.getRightEditablePos(caretPos);
        }
        this.setCaretPos(caretPos);
    },
    onChange: function (event) {
        var _this6 = this;

        var pasteSelection = this.pasteSelection;
        var mask = this.mask;
        var maskChar = this.maskChar;
        var lastEditablePos = this.lastEditablePos;
        var preventEmptyChange = this.preventEmptyChange;

        var target = event.target;
        var value = this.getInputValue();
        if (!value && this.preventEmptyChange) {
            this.disableValueAccessors();
            this.preventEmptyChange = false;
            this.setInputValue(this.state.value);
            return;
        }
        var oldValue = this.state.value;
        if (pasteSelection) {
            this.pasteSelection = null;
            this.pasteText(oldValue, value, pasteSelection, event);
            return;
        }
        var selection = this.getSelection();
        var caretPos = selection.end;
        var maskLen = mask.length;
        var valueLen = value.length;
        var oldValueLen = oldValue.length;
        var prefixLen = this.getPrefix().length;
        var clearedValue;

        if (valueLen >= oldValueLen) {
            var substrLen = valueLen - oldValueLen;
            var startPos = selection.end - substrLen;
            var enteredSubstr = value.substr(startPos, substrLen);

            if (startPos < lastEditablePos && (substrLen !== 1 || enteredSubstr !== mask[startPos])) {
                caretPos = this.getRightEditablePos(startPos);
            } else {
                caretPos = startPos;
            }

            value = value.substr(0, startPos) + value.substr(startPos + substrLen);

            clearedValue = this.clearRange(value, startPos, maskLen - startPos);
            clearedValue = this.insertRawSubstr(clearedValue, enteredSubstr, caretPos);

            value = enteredSubstr ? this.insertRawSubstr(oldValue, enteredSubstr, caretPos) : clearedValue;

            if (substrLen !== 1 || caretPos >= prefixLen && caretPos < lastEditablePos) {
                caretPos = this.getFilledLength(clearedValue);
            } else if (caretPos < lastEditablePos) {
                caretPos++;
            }
        } else if (valueLen < oldValueLen) {
            var removedLen = maskLen - valueLen;
            clearedValue = this.clearRange(oldValue, selection.end, removedLen);
            var substr = value.substr(0, selection.end);
            var clearOnly = substr === oldValue.substr(0, selection.end);

            if (maskChar) {
                value = this.insertRawSubstr(clearedValue, substr, 0);
            }

            clearedValue = this.clearRange(clearedValue, selection.end, maskLen - selection.end);
            clearedValue = this.insertRawSubstr(clearedValue, substr, 0);

            if (!clearOnly) {
                caretPos = this.getFilledLength(clearedValue);
            } else if (caretPos < prefixLen) {
                caretPos = prefixLen;
            }
        }
        value = this.formatValue(value);

        // prevent android autocomplete insertion on backspace
        // prevent hanging after first entered character on Windows 10 Mobile
        if (!this.canUseAccessors || !this.isAndroidBrowser && !this.isWindowsPhoneBrowser) {
            this.setInputValue(value);
        }

        if (this.canUseAccessors && (this.isAndroidFirefox && value && !this.getInputValue() || this.isAndroidBrowser || this.isWindowsPhoneBrowser)) {
            this.value = value;
            this.enableValueAccessors();
            if (this.isAndroidFirefox) {
                this.preventEmptyChange = true;
            }
            setTimeout(function () {
                _this6.preventEmptyChange = false;
                _this6.disableValueAccessors();
            }, 0);
        }

        this.setState({
            value: this.hasValue ? this.state.value : value
        });

        if (typeof this.props.onChange === "function") {
            this.props.onChange(event);
        }

        this.setCaretPos(caretPos);
    },
    onFocus: function (event) {
        if (!this.state.value) {
            var prefix = this.getPrefix();
            var value = this.formatValue(prefix);
            var inputValue = this.formatValue(value);

            // do not use this.getInputValue and this.setInputValue as this.refs.input
            // can be undefined at this moment if autoFocus attribute is set
            var isInputValueChanged = inputValue !== event.target.value;

            if (isInputValueChanged) {
                event.target.value = inputValue;
            }

            this.setState({
                value: this.hasValue ? this.state.value : inputValue
            }, this.setCaretToEnd);

            if (isInputValueChanged && typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        } else if (this.getFilledLength() < this.mask.length) {
            this.setCaretToEnd();
        }

        if (typeof this.props.onFocus === "function") {
            this.props.onFocus(event);
        }
    },
    onBlur: function (event) {
        if (!this.props.alwaysShowMask && this.isEmpty(this.state.value)) {
            var inputValue = "";
            var isInputValueChanged = inputValue !== this.getInputValue();
            if (isInputValueChanged) {
                this.setInputValue(inputValue);
            }
            this.setState({
                value: this.hasValue ? this.state.value : ""
            });
            if (isInputValueChanged && typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }

        if (typeof this.props.onBlur === "function") {
            this.props.onBlur(event);
        }
    },
    onPaste: function (event) {
        if (this.isAndroidBrowser) {
            this.pasteSelection = this.getSelection();
            this.setInputValue("");
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
            var value = this.state.value;
            var selection = this.getSelection();
            this.pasteText(value, text, selection, event);
        }
        event.preventDefault();
    },
    pasteText: function (value, text, selection, event) {
        var caretPos = selection.start;
        if (selection.length) {
            value = this.clearRange(value, caretPos, selection.length);
        }
        var textLen = this.getRawSubstrLength(value, text, caretPos);
        value = this.insertRawSubstr(value, text, caretPos);
        caretPos += textLen;
        caretPos = this.getRightEditablePos(caretPos) || caretPos;
        if (value !== this.getInputValue()) {
            if (event) {
                this.setInputValue(value);
            }
            this.setState({
                value: this.hasValue ? this.state.value : value
            });
            if (event && typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }
        this.setCaretPos(caretPos);
    },
    componentDidMount: function () {
        this.isAndroidBrowser = this.isAndroidBrowser();
        this.isWindowsPhoneBrowser = this.isWindowsPhoneBrowser();
        this.isAndroidFirefox = this.isAndroidFirefox();

        if (Object.getOwnPropertyDescriptor && Object.getPrototypeOf && Object.defineProperty) {
            var input = this.getInputDOMNode();
            var valueDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
            this.canUseAccessors = !!(valueDescriptor && valueDescriptor.get && valueDescriptor.set);
        }

        if (this.mask && this.props.value == null) {
            this.updateUncontrolledInput();
        }
    },
    render: function () {
        var _this7 = this;

        var _props = this.props;
        var mask = _props.mask;
        var alwaysShowMask = _props.alwaysShowMask;
        var maskChar = _props.maskChar;
        var formatChars = _props.formatChars;

        var props = _objectWithoutProperties(_props, ["mask", "alwaysShowMask", "maskChar", "formatChars"]);

        if (this.mask) {
            if (!props.disabled && !props.readOnly) {
                var handlersKeys = ["onFocus", "onBlur", "onChange", "onKeyDown", "onKeyPress", "onPaste"];
                handlersKeys.forEach(function (key) {
                    props[key] = _this7[key];
                });
            }

            if (props.value != null) {
                props.value = this.state.value;
            }
        }
        return React.createElement("input", _extends({ ref: "input" }, props));
    }
});

module.exports = InputElement;