"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// https://github.com/sanniassin/react-input-mask

var InputElement = React.createClass({
    displayName: "InputElement",

    charsRules: {
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
    isDOMElement: function (element) {
        return typeof HTMLElement === "object" ? element instanceof HTMLElement // DOM2
        : element.nodeType === 1 && typeof element.nodeName === "string";
    },
    // getDOMNode is deprecated but we need it to stay compatible with React 0.12
    getInputDOMNode: function () {
        var input = this.refs.input;

        // React 0.14
        if (this.isDOMElement(input)) {
            return input;
        }

        return input.getDOMNode();
    },
    getPrefix: function () {
        var state = arguments.length <= 0 || arguments[0] === undefined ? this.state : arguments[0];

        var prefix = "";
        var mask = state.mask;

        for (var i = 0; i < mask.length && this.isPermanentChar(i, state); ++i) {
            prefix += mask[i];
        }
        return prefix;
    },
    getFilledLength: function (value) {
        var state = arguments.length <= 1 || arguments[1] === undefined ? this.state : arguments[1];

        var i;
        if (value == null) {
            value = state.value;
        }
        var maskChar = state.maskChar;

        if (!maskChar) {
            return value.length;
        }

        for (i = value.length - 1; i >= 0; --i) {
            var char = value[i];
            if (!this.isPermanentChar(i, state) && this.isAllowedChar(char, i, state)) {
                break;
            }
        }

        return ++i || this.getPrefix(state).length;
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
        var mask = this.state.mask;
        for (var i = pos; i < mask.length; ++i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    },
    isEmpty: function () {
        var _this = this;

        var value = arguments.length <= 0 || arguments[0] === undefined ? this.state.value : arguments[0];
        var state = arguments.length <= 1 || arguments[1] === undefined ? this.state : arguments[1];

        return !value.split("").some(function (char, i) {
            return !_this.isPermanentChar(i, state) && _this.isAllowedChar(char, i, state);
        });
    },
    isFilled: function () {
        var value = arguments.length <= 0 || arguments[0] === undefined ? this.state.value : arguments[0];
        var state = arguments.length <= 1 || arguments[1] === undefined ? this.state : arguments[1];

        return this.getFilledLength(value, state) === state.mask.length;
    },
    createFilledArray: function (length, val) {
        var array = [];
        for (var i = 0; i < length; i++) {
            array[i] = val;
        }
        return array;
    },
    formatValue: function (value) {
        var _this2 = this;

        var state = arguments.length <= 1 || arguments[1] === undefined ? this.state : arguments[1];
        var maskChar = state.maskChar;
        var mask = state.mask;

        if (!maskChar) {
            var prefixLen = this.getPrefix(state).length;
            value = this.insertRawSubstr("", value, 0, state);
            while (value.length > prefixLen && this.isPermanentChar(value.length - 1, state)) {
                value = value.slice(0, value.length - 1);
            }
            return value;
        }
        if (value) {
            var emptyValue = this.formatValue("", state);
            return this.insertRawSubstr(emptyValue, value, 0, state);
        }
        return value.split("").concat(this.createFilledArray(mask.length - value.length, null)).map(function (char, pos) {
            if (_this2.isAllowedChar(char, pos, state)) {
                return char;
            } else if (_this2.isPermanentChar(pos, state)) {
                return mask[pos];
            }
            return maskChar;
        }).join("");
    },
    clearRange: function (value, start, len) {
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
    replaceSubstr: function (value, newSubstr, pos) {
        return value.slice(0, pos) + newSubstr + value.slice(pos + newSubstr.length);
    },
    insertRawSubstr: function (value, substr, pos) {
        var state = arguments.length <= 3 || arguments[3] === undefined ? this.state : arguments[3];
        var mask = state.mask;
        var maskChar = state.maskChar;

        var isFilled = this.isFilled(value, state);
        substr = substr.split("");
        for (var i = pos; i < mask.length && substr.length;) {
            if (!this.isPermanentChar(i, state) || mask[i] === substr[0]) {
                var char = substr.shift();
                if (this.isAllowedChar(char, i, state, true)) {
                    if (i < value.length) {
                        if (maskChar || isFilled) {
                            value = this.replaceSubstr(value, char, i);
                        } else {
                            value = this.formatValue(value.substr(0, i) + char + value.substr(i), state);
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
    getRawSubstrLength: function (value, substr, pos) {
        var state = arguments.length <= 3 || arguments[3] === undefined ? this.state : arguments[3];
        var mask = state.mask;
        var maskChar = state.maskChar;

        substr = substr.split("");
        for (var i = pos; i < mask.length && substr.length;) {
            if (!this.isPermanentChar(i, state) || mask[i] === substr[0]) {
                var char = substr.shift();
                if (this.isAllowedChar(char, i, state)) {
                    ++i;
                }
            } else {
                ++i;
            }
        }
        return i - pos;
    },
    isAllowedChar: function (char, pos) {
        var state = arguments.length <= 2 || arguments[2] === undefined ? this.state : arguments[2];
        var allowMaskChar = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];
        var mask = state.mask;
        var maskChar = state.maskChar;

        if (this.isPermanentChar(pos, state)) {
            return mask[pos] === char;
        }
        var ruleChar = mask[pos];
        var charRule = this.charsRules[ruleChar];
        return new RegExp(charRule).test(char || "") || allowMaskChar && char === maskChar;
    },
    isPermanentChar: function (pos) {
        var state = arguments.length <= 1 || arguments[1] === undefined ? this.state : arguments[1];

        return state.permanents.indexOf(pos) !== -1;
    },
    setCaretToEnd: function () {
        var filledLen = this.getFilledLength();
        var pos = this.getRightEditablePos(filledLen);
        if (pos !== null) {
            this.setCaretPos(pos);
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
    getCaretPos: function () {
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
    setCaretPos: function (pos) {
        var input;
        var setPos = function () {
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
    isFocused: function () {
        return document.activeElement === this.getInputDOMNode();
    },
    parseMask: function (mask) {
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
    getStringValue: function (value) {
        return !value && value !== 0 ? "" : value + "";
    },
    getInitialState: function () {
        var mask = this.parseMask(this.props.mask);
        var defaultValue = this.props.defaultValue != null ? this.props.defaultValue : null;
        var value = this.props.value != null ? this.props.value : defaultValue;

        value = this.getStringValue(value);

        var state = {
            mask: mask.mask,
            permanents: mask.permanents,
            maskChar: "maskChar" in this.props ? this.props.maskChar : this.defaultMaskChar
        };
        if (this.props.alwaysShowMask || value) {
            value = this.formatValue(value, state);
        }
        state.value = value;

        return state;
    },
    componentWillMount: function () {
        var _state = this.state;
        var mask = _state.mask;
        var value = _state.value;

        if (mask && value) {
            this.setState({ value: value });
        }
    },
    componentWillReceiveProps: function (nextProps) {
        var mask = this.parseMask(nextProps.mask);
        var maskChar = "maskChar" in nextProps ? nextProps.maskChar : this.defaultMaskChar;
        var state = {
            mask: mask.mask,
            permanents: mask.permanents,
            maskChar: maskChar
        };

        var newValue = nextProps.value !== undefined ? this.getStringValue(nextProps.value) : this.state.value;

        var isMaskChanged = mask.mask && mask.mask !== this.state.mask;
        var showEmpty = nextProps.alwaysShowMask || this.isFocused();
        if (isMaskChanged || mask.mask && (newValue || showEmpty)) {
            newValue = this.formatValue(newValue, state);
        }
        if (mask.mask && this.isEmpty(newValue, state) && !showEmpty) {
            newValue = "";
        }
        if (this.state.value !== newValue) {
            state.value = newValue;
        }
        this.setState(state);
    },
    componentDidUpdate: function (prevProps, prevState) {
        var mask = this.state.mask;
        if (!mask) {
            return;
        }
        var isMaskChanged = mask && mask !== prevState.mask;
        var pos = this.lastCaretPos;
        var filledLen = this.getFilledLength();
        if (isMaskChanged && filledLen < pos) {
            this.setCaretPos(this.getRightEditablePos(filledLen));
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
    onKeyPress: function (event) {
        var key = event.key;
        var hasHandler = typeof this.props.onKeyPress === "function";
        if (key === "Enter" || event.ctrlKey || event.metaKey) {
            if (hasHandler) {
                this.props.onKeyPress(event);
            }
            return;
        }

        var caretPos = this.getCaretPos();
        var _state2 = this.state;
        var value = _state2.value;
        var mask = _state2.mask;
        var maskChar = _state2.maskChar;

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
    onChange: function (event) {
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
    onFocus: function (event) {
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
    onBlur: function (event) {
        if (!this.props.alwaysShowMask && this.isEmpty(this.state.value)) {
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
    onPaste: function (event) {
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
    pasteText: function (value, text, selection) {
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
    render: function () {
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
