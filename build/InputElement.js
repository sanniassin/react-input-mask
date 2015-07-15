"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// https://github.com/sanniassin/react-input-mask

var React = require("react");

var InputElement = React.createClass({
    displayName: "InputElement",

    charsRules: {
        "9": "[0-9]",
        a: "[A-Za-z]",
        "*": "[A-Za-z0-9]"
    },
    defaultMaskChar: "_",
    getPrefix: function getPrefix() {
        var prefix = "";
        var mask = this.state.mask;
        for (var i = 0; i < mask.length && this.isPermanentChar(i); ++i) {
            prefix += mask[i];
        }
        return prefix;
    },
    getFilledLength: function getFilledLength() {
        var value = this.state.value;
        var maskChar = this.state.maskChar;

        for (var i = value.length - 1; i >= 0; --i) {
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
    isEmpty: function isEmpty(value) {
        var _this = this;

        return !value.split("").some(function (char, i) {
            return !_this.isPermanentChar(i) && _this.isAllowedChar(char, i);
        });
    },
    formatValue: function formatValue(value) {
        var _this2 = this;

        var maskChar = this.state.maskChar;
        var mask = this.state.mask;
        return value.split("").concat(Array.apply(null, Array(mask.length - value.length))).map(function (char, pos) {
            if (_this2.isAllowedChar(char, pos)) {
                return char;
            } else if (_this2.isPermanentChar(pos)) {
                return mask[pos];
            }
            return maskChar;
        }).join("");
    },
    clearRange: function clearRange(value, start, len) {
        var _this3 = this;

        var maskChar = this.state.maskChar;
        var mask = this.state.mask;
        var end = start + len;
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
    isAllowedChar: function isAllowedChar(char, pos) {
        var mask = this.state.mask;
        if (this.isPermanentChar(pos)) {
            return mask[pos] === char;
        }
        var ruleChar = mask[pos];
        var charRule = this.charsRules[ruleChar];
        return new RegExp(charRule).test(char);
    },
    isPermanentChar: function isPermanentChar(pos) {
        return this.state.permanents.indexOf(pos) !== -1;
    },
    setCaretToEnd: function setCaretToEnd() {
        var value = this.state.value;
        var maskChar = this.state.maskChar;
        var prefixLen = this.getPrefix().length;
        for (var i = value.length - 1; i >= 0; --i) {
            if (!this.isPermanentChar(i) && value[i] !== maskChar || i < prefixLen) {
                this.setCaretPos(i + 1);
                return;
            }
        }
        if (value.length && value[0] === maskChar) {
            this.setCaretPos(0);
        }
    },
    getSelection: function getSelection() {
        var input = this.getDOMNode();
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
        var input = this.getDOMNode();
        var pos = 0;

        if ("selectionStart" in input) {
            pos = input.selectionStart;
        } else {
            var range = document.selection.createRange();
            range.moveStart("character", -input.value.length);
            pos = range.text.length;
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
            input = this.getDOMNode();
            setPos();
            setTimeout(setPos, 0);
        }
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
    getInitialState: function getInitialState() {
        var mask = this.parseMask(this.props.mask);
        return {
            mask: mask.mask,
            permanents: mask.permanents,
            value: this.props.value,
            maskChar: typeof this.props.maskChar === "string" ? this.props.maskChar : this.defaultMaskChar
        };
    },
    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
        var mask = this.parseMask(nextProps.mask);
        var state = {
            mask: mask.mask,
            permanents: mask.permanents,
            maskChar: typeof this.props.maskChar === "string" ? nextProps.maskChar : this.defaultMaskChar
        };
        if (nextProps.value !== this.state.value) {
            state.value = nextProps.value;
        }
        this.setState(state);
    },
    onKeyDown: function onKeyDown(event) {
        var hasHandler = typeof this.props.onKeyPress === "function";
        if (event.ctrlKey || event.metaKey) {
            this.props.onKeyDown(event);
            return;
        }

        var caretPos = this.getCaretPos();
        var value = this.state.value;
        var key = event.key;
        var preventDefault = false;
        var maskChar = this.state.maskChar;
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
                        value = this.replaceSubstr(value, maskChar, editablePos);
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
        var value = this.state.value;
        var maskLen = this.state.mask.length;
        var mask = this.state.mask;
        var prefixLen = this.getPrefix().length;

        if (this.isPermanentChar(caretPos) && mask[caretPos] === key) {
            ++caretPos;
        } else {
            var editablePos = this.getRightEditablePos(caretPos);
            if (editablePos !== null && this.isAllowedChar(key, editablePos)) {
                value = this.replaceSubstr(value, key, editablePos);
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
        var maskLen = this.state.mask.length;
        var target = event.target;
        var value = target.value;
        if (value.length > maskLen) {
            value = value.substr(0, maskLen);
        }
        target.value = this.formatValue(value);
        this.setState({
            value: target.value
        });

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
        var text;
        if (window.clipboardData && window.clipboardData.getData) {
            // IE
            text = window.clipboardData.getData("Text");
        } else if (event.clipboardData && event.clipboardData.getData) {
            text = event.clipboardData.getData("text/plain");
        }
        if (text) {
            text = text.split("");
            var caretPos = this.getCaretPos();
            var value = this.state.value;
            var mask = this.state.mask;
            for (var i = caretPos; i < value.length && text.length;) {
                if (!this.isPermanentChar(i) || mask[i] === text[0]) {
                    var char = text.shift();
                    if (this.isAllowedChar(char, i)) {
                        value = this.replaceSubstr(value, char, i);
                        ++i;
                    }
                } else {
                    ++i;
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
            this.setCaretPos(i);
        }
        event.preventDefault();
    },
    render: function render() {
        var handlersContainer = this.state.mask ? this : this.props;
        var handlersKeys = ["onFocus", "onBlur", "onChange", "onKeyDown", "onKeyPress", "onPaste"];
        var handlers = {};
        handlersKeys.forEach(function (key) {
            handlers[key] = handlersContainer[key];
        });
        return React.createElement("input", _extends({}, this.props, handlers, { value: this.state.value }));
    }
});

module.exports = InputElement;