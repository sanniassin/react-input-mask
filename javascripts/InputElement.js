"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// https://github.com/sanniassin/react-input-mask

var InputElement = React.createClass({
    displayName: "InputElement",

    charsRules: {
        "9": "[0-9]",
        a: "[A-Za-z]",
        "*": "[A-Za-z0-9]"
    },
    defaultMaskChar: "_",
    lastCaretPos: null,
    isAndroidBrowser: function isAndroidBrowser() {
        var windows = new RegExp("windows", "i");
        var firefox = new RegExp("firefox", "i");
        var android = new RegExp("android", "i");
        var ua = navigator.userAgent;
        return !windows.test(ua) && !firefox.test(ua) && android.test(ua);
    },
    isDOMElement: function isDOMElement(element) {
        return typeof HTMLElement === "object" ? element instanceof HTMLElement // DOM2
        : element.nodeType === 1 && typeof element.nodeName === "string";
    },
    // getDOMNode is deprecated but we need it to stay compatible with React 0.12
    getInputDOMNode: function getInputDOMNode() {
        var input = this.refs.input;

        // React 0.14
        if (this.isDOMElement(input)) {
            return input;
        }

        return input.getDOMNode();
    },
    getPrefix: function getPrefix(newState) {
        var prefix = "";

        var _ref = newState || this.state;

        var mask = _ref.mask;

        for (var i = 0; i < mask.length && this.isPermanentChar(i, newState); ++i) {
            prefix += mask[i];
        }
        return prefix;
    },
    getFilledLength: function getFilledLength() {
        var value = arguments[0] === undefined ? this.state.value : arguments[0];

        var i;
        var maskChar = this.state.maskChar;

        if (!maskChar) {
            return value.length;
        }

        for (i = value.length - 1; i >= 0; --i) {
            var char = value[i];
            if (!this.isPermanentChar(i) && this.isAllowedChar(char, i)) {
                break;
            }
        }

        return ++i || this.getPrefix().length;
    },
    getLeftEditablePos: function getLeftEditablePos(pos) {
        for (var i = pos; i >= 0; --i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    },
    getRightEditablePos: function getRightEditablePos(pos) {
        var mask = this.state.mask;
        for (var i = pos; i < mask.length; ++i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    },
    isEmpty: function isEmpty() {
        var _this = this;

        var value = arguments[0] === undefined ? this.state.value : arguments[0];

        return !value.split("").some(function (char, i) {
            return !_this.isPermanentChar(i) && _this.isAllowedChar(char, i);
        });
    },
    isFilled: function isFilled() {
        var value = arguments[0] === undefined ? this.state.value : arguments[0];

        return this.getFilledLength(value) === this.state.mask.length;
    },
    createFilledArray: function createFilledArray(length, val) {
        var array = [];
        for (var i = 0; i < length; i++) {
            array[i] = val;
        }
        return array;
    },
    formatValue: function formatValue(value, newState) {
        var _this2 = this;

        var _ref2 = newState || this.state;

        var maskChar = _ref2.maskChar;
        var mask = _ref2.mask;

        if (!maskChar) {
            var prefixLen = this.getPrefix(newState).length;
            value = this.insertRawSubstr("", value, 0, newState);
            while (value.length > prefixLen && this.isPermanentChar(value.length - 1, newState)) {
                value = value.slice(0, value.length - 1);
            }
            return value;
        }
        return value.split("").concat(this.createFilledArray(mask.length - value.length, null)).map(function (char, pos) {
            if (_this2.isAllowedChar(char, pos, newState)) {
                return char;
            } else if (_this2.isPermanentChar(pos, newState)) {
                return mask[pos];
            }
            return maskChar;
        }).join("");
    },
    clearRange: function clearRange(value, start, len) {
        var _this3 = this;

        var end = start + len;
        var maskChar = this.state.maskChar;
        if (!maskChar) {
            var prefixLen = this.getPrefix().length;
            value = value.split("").filter(function (char, i) {
                return i < prefixLen || i < start || i >= end;
            }).join("");
            return this.formatValue(value);
        }
        var mask = this.state.mask;
        return value.split("").map(function (char, i) {
            if (i < start || i >= end) {
                return char;
            }
            if (_this3.isPermanentChar(i)) {
                return mask[i];
            }
            return maskChar;
        }).join("");
    },
    replaceSubstr: function replaceSubstr(value, newSubstr, pos) {
        return value.slice(0, pos) + newSubstr + value.slice(pos + newSubstr.length);
    },
    insertRawSubstr: function insertRawSubstr(value, substr, pos, newState) {
        var _ref3 = newState || this.state;

        var mask = _ref3.mask;
        var maskChar = _ref3.maskChar;

        var isFilled = this.isFilled(value);
        substr = substr.split("");
        for (var i = pos; i < mask.length && substr.length;) {
            if (!this.isPermanentChar(i, newState) || mask[i] === substr[0]) {
                var char = substr.shift();
                if (this.isAllowedChar(char, i, newState)) {
                    if (i < value.length) {
                        if (maskChar || isFilled) {
                            value = this.replaceSubstr(value, char, i);
                        } else {
                            value = this.formatValue(value.substr(0, i) + char + value.substr(i), newState);
                        }
                    } else if (!maskChar) {
                        value += char;
                    }
                    ++i;
                }
            } else {
                if (!maskChar && i >= value.length) {
                    value += mask[i];
                }
                ++i;
            }
        }
        return value;
    },
    getRawSubstrLength: function getRawSubstrLength(value, substr, pos, newState) {
        var _ref4 = newState || this.state;

        var mask = _ref4.mask;
        var maskChar = _ref4.maskChar;

        substr = substr.split("");
        for (var i = pos; i < mask.length && substr.length;) {
            if (!this.isPermanentChar(i, newState) || mask[i] === substr[0]) {
                var char = substr.shift();
                if (this.isAllowedChar(char, i, newState)) {
                    ++i;
                }
            } else {
                ++i;
            }
        }
        return i - pos;
    },
    isAllowedChar: function isAllowedChar(char, pos, newState) {
        var mask = newState ? newState.mask : this.state.mask;
        if (this.isPermanentChar(pos, newState)) {
            return mask[pos] === char;
        }
        var ruleChar = mask[pos];
        var charRule = this.charsRules[ruleChar];
        return new RegExp(charRule).test(char || "");
    },
    isPermanentChar: function isPermanentChar(pos, newState) {
        var permanents = newState ? newState.permanents : this.state.permanents;
        return permanents.indexOf(pos) !== -1;
    },
    setCaretToEnd: function setCaretToEnd() {
        var filledLen = this.getFilledLength();
        var pos = this.getRightEditablePos(filledLen);
        if (pos !== null) {
            this.setCaretPos(pos);
        }
    },
    getSelection: function getSelection() {
        var input = this.getInputDOMNode();
        var start = 0;
        var end = 0;

        if ("selectionStart" in input && "selectionEnd" in input) {
            start = input.selectionStart;
            end = input.selectionEnd;
        } else {
            var range = document.selection.createRange();
            var len = input.value.length;

            var inputRange = input.createTextRange();
            inputRange.moveToBookmark(range.getBookmark());

            start = -inputRange.moveStart("character", -len);
            end = -inputRange.moveEnd("character", -len);
        }

        return {
            start: start,
            end: end,
            length: end - start
        };
    },
    getCaretPos: function getCaretPos() {
        var input = this.getInputDOMNode();
        var pos = 0;

        if ("selectionStart" in input) {
            pos = input.selectionStart;
        } else {
            var range = document.selection.createRange();
            var len = range.text.length;
            range.moveStart("character", -input.value.length);
            pos = range.text.length - len;
        }

        return pos;
    },
    setCaretPos: function setCaretPos(pos) {
        var input;
        var setPos = function setPos() {
            if ("selectionStart" in input && "selectionEnd" in input) {
                input.selectionStart = input.selectionEnd = pos;
            } else if ("setSelectionRange" in input) {
                input.setSelectionRange(pos, pos);
            } else {
                var inputRange = input.createTextRange();
                inputRange.collapse(true);
                inputRange.moveStart("character", pos);
                inputRange.moveEnd("character", 0);
                inputRange.select();
            }
        };

        if (this.isMounted()) {
            input = this.getInputDOMNode();
            setPos();
            setTimeout(setPos, 0);
        }

        this.lastCaretPos = pos;
    },
    isFocused: function isFocused() {
        return document.activeElement === this.getInputDOMNode();
    },
    parseMask: function parseMask(mask) {
        var _this4 = this;

        if (typeof mask !== "string") {
            return {
                mask: null,
                permanents: []
            };
        }
        var str = "";
        var permanents = [];
        var isPermanent = false;

        mask.split("").forEach(function (char) {
            if (!isPermanent && char === "\\") {
                isPermanent = true;
            } else {
                if (isPermanent || !_this4.charsRules[char]) {
                    permanents.push(str.length);
                }
                str += char;
                isPermanent = false;
            }
        });

        return {
            mask: str,
            permanents: permanents
        };
    },
    getStringValue: function getStringValue(value) {
        return !value && value !== 0 ? "" : value + "";
    },
    getInitialState: function getInitialState() {
        var mask = this.parseMask(this.props.mask);
        var defaultValue = this.props.defaultValue != null ? this.props.defaultValue : null;
        var value = this.props.value != null ? this.props.value : defaultValue;

        return {
            mask: mask.mask,
            permanents: mask.permanents,
            value: this.getStringValue(value),
            maskChar: "maskChar" in this.props ? this.props.maskChar : this.defaultMaskChar
        };
    },
    componentWillMount: function componentWillMount() {
        if (this.state.mask && this.state.value) {
            this.setState({
                value: this.formatValue(this.state.value)
            });
        }
    },
    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
        var mask = this.parseMask(nextProps.mask);
        var maskChar = "maskChar" in nextProps ? nextProps.maskChar : this.defaultMaskChar;
        var state = {
            mask: mask.mask,
            permanents: mask.permanents,
            maskChar: maskChar
        };

        var newValue = nextProps.value !== undefined ? this.getStringValue(nextProps.value) : this.state.value;

        var isMaskChanged = mask.mask && mask.mask !== this.state.mask;
        if (isMaskChanged) {
            var emptyValue = this.formatValue("", state);
            newValue = this.insertRawSubstr(emptyValue, newValue, 0, state);
        }
        if (mask.mask && (newValue || this.isFocused())) {
            newValue = this.formatValue(newValue, state);
        }
        if (this.state.value !== newValue) {
            state.value = newValue;
        }
        this.setState(state);
    },
    componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
        var mask = this.state.mask;
        var isMaskChanged = mask && mask !== prevState.mask;
        var pos = this.lastCaretPos;
        var filledLen = this.getFilledLength();
        if (isMaskChanged && filledLen < pos) {
            this.setCaretPos(this.getRightEditablePos(filledLen));
        }
    },
    onKeyDown: function onKeyDown(event) {
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
            event.target.value = value;
            this.setState({
                value: value
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
    onKeyPress: function onKeyPress(event) {
        var key = event.key;
        var hasHandler = typeof this.props.onKeyPress === "function";
        if (key === "Enter" || event.ctrlKey || event.metaKey) {
            if (hasHandler) {
                this.props.onKeyPress(event);
            }
            return;
        }

        var caretPos = this.getCaretPos();
        var _state = this.state;
        var value = _state.value;
        var mask = _state.mask;
        var maskChar = _state.maskChar;

        var maskLen = mask.length;
        var prefixLen = this.getPrefix().length;

        if (this.isPermanentChar(caretPos) && mask[caretPos] === key) {
            value = this.insertRawSubstr(value, key, caretPos);
            ++caretPos;
        } else {
            var editablePos = this.getRightEditablePos(caretPos);
            if (editablePos !== null && this.isAllowedChar(key, editablePos)) {
                value = this.insertRawSubstr(value, key, caretPos);
                caretPos = editablePos + 1;
            }
        }

        if (value !== this.state.value) {
            event.target.value = value;
            this.setState({
                value: value
            });
            if (typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }
        event.preventDefault();
        while (caretPos > prefixLen && this.isPermanentChar(caretPos)) {
            ++caretPos;
        }
        this.setCaretPos(caretPos);
    },
    onChange: function onChange(event) {
        var pasteSelection = this.pasteSelection;
        if (pasteSelection) {
            this.pasteSelection = null;
            this.pasteText(this.state.value, event.target.value, pasteSelection);
            return;
        }
        var caretPos = this.getCaretPos();
        var maskLen = this.state.mask.length;
        var maskChar = this.state.maskChar;
        var target = event.target;
        var value = target.value;
        var valueLen = value.length;
        if (valueLen > maskLen) {
            value = value.substr(0, maskLen);
        } else if (maskChar && valueLen < maskLen) {
            var removedLen = maskLen - valueLen;
            value = this.clearRange(this.state.value, caretPos, removedLen);
        }
        target.value = this.formatValue(value);
        this.setState({
            value: target.value
        });

        this.setCaretPos(caretPos);

        if (typeof this.props.onChange === "function") {
            this.props.onChange(event);
        }
    },
    onFocus: function onFocus(event) {
        if (!this.state.value) {
            var prefix = this.getPrefix();
            var value = this.formatValue(prefix);
            event.target.value = this.formatValue(value);
            this.setState({
                value: value
            }, this.setCaretToEnd);

            if (typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        } else if (this.getFilledLength() < this.state.mask.length) {
            this.setCaretToEnd();
        }

        if (typeof this.props.onFocus === "function") {
            this.props.onFocus(event);
        }
    },
    onBlur: function onBlur(event) {
        if (this.isEmpty(this.state.value)) {
            event.target.value = "";
            this.setState({
                value: ""
            });
            if (typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }

        if (typeof this.props.onBlur === "function") {
            this.props.onBlur(event);
        }
    },
    onPaste: function onPaste(event) {
        if (this.isAndroidBrowser()) {
            this.pasteSelection = this.getSelection();
            event.target.value = "";
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
            this.pasteText(value, text, selection);
        }
        event.preventDefault();
    },
    pasteText: function pasteText(value, text, selection) {
        var caretPos = selection.start;
        if (selection.length) {
            value = this.clearRange(value, caretPos, selection.length);
        }
        var textLen = this.getRawSubstrLength(value, text, caretPos);
        var value = this.insertRawSubstr(value, text, caretPos);
        caretPos += textLen;
        caretPos = this.getRightEditablePos(caretPos) || caretPos;
        if (value !== this.getInputDOMNode().value) {
            event.target.value = value;
            this.setState({
                value: value
            });
            if (typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }
        this.setCaretPos(caretPos);
    },
    render: function render() {
        var _this5 = this;

        var ourProps = {};
        if (this.state.mask) {
            var handlersKeys = ["onFocus", "onBlur", "onChange", "onKeyDown", "onKeyPress", "onPaste"];
            handlersKeys.forEach(function (key) {
                ourProps[key] = _this5[key];
            });
            ourProps.value = this.state.value;
        }
        return React.createElement("input", _extends({ ref: "input" }, this.props, ourProps));
    }
});
