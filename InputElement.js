// https://github.com/sanniassin/react-input-mask

var React = require("react");

var InputElement = React.createClass({
    charsRules: {
        "9": "[0-9]",
        "a": "[A-Za-z]",
        "*": "[A-Za-z0-9]"
    },
    defaultMaskChar: "_",
    lastCaretPos: null,
    ref: null,
    // getDOMNode is deprecated but we need it to be compatible with React 0.12
    findDOMNode: function() {
        if (React.findDOMNode) {
            return React.findDOMNode(this);
        }
        return this.getDOMNode();
    },
    setRef: function(ref) {
        this.ref = ref;
    },
    getInputDOMNode: function() {
        return React.version && React.version.substr(0, 4) === '0.14'
            ? this.ref
            : this.findDOMNode();
    },
    getPrefix: function() {
        var prefix = "";
        var mask = this.state.mask;
        for (var i = 0; i < mask.length && this.isPermanentChar(i); ++i) {
            prefix += mask[i];
        }
        return prefix;
    },
    getFilledLength: function() {
        var i;
        var value = this.state.value;
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
    getLeftEditablePos: function(pos) {
        for (var i = pos; i >= 0; --i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    },
    getRightEditablePos: function(pos) {
        var mask = this.state.mask;
        for (var i = pos; i < mask.length; ++i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    },
    isEmpty: function(value) {
        return !value.split("").some((char, i) =>
            !this.isPermanentChar(i) && this.isAllowedChar(char, i)
        );
    },
    formatValue: function(value, newState) {
        var { maskChar, mask } = newState || this.state;
        if (!maskChar) {
            var prefixLen = this.getPrefix().length;
            value = this.insertRawSubstr("", value, 0);
            while (value.length > prefixLen && this.isPermanentChar(value.length - 1)) {
                value = value.slice(0, value.length - 1);
            }
            return value;
        }
        return value.split("")
                    .concat(Array.apply(null, Array(mask.length - value.length)))
                    .map((char, pos) => {
                        if (this.isAllowedChar(char, pos, newState)) {
                            return char;
                        }
                        else if (this.isPermanentChar(pos, newState)) {
                            return mask[pos];
                        }
                        return maskChar;
                    })
                    .join("");
    },
    clearRange: function(value, start, len) {
        var end = start + len;
        var maskChar = this.state.maskChar;
        if (!maskChar) {
            var prefixLen = this.getPrefix().length;
            value = value.split("")
                         .filter((char, i) => i < prefixLen || i < start || i >= end)
                         .join("");
            return this.formatValue(value);
        }
        var mask = this.state.mask;
        return value.split("")
                    .map((char, i) => {
                        if (i < start || i >= end) {
                            return char;
                        }
                        if (this.isPermanentChar(i)) {
                            return mask[i];
                        }
                        return maskChar;
                    })
                    .join("");
    },
    replaceSubstr: function(value, newSubstr, pos) {
        return value.slice(0, pos) + newSubstr + value.slice(pos + newSubstr.length);
    },
    insertRawSubstr: function(value, substr, pos, newState) {
        var { mask, maskChar } = newState || this.state;
        substr = substr.split("");
        for (var i = pos; i < mask.length && substr.length; ) {
            if (!this.isPermanentChar(i, newState) || mask[i] === substr[0]) {
                var char = substr.shift();
                if (this.isAllowedChar(char, i, newState)) {
                    if (i < value.length) {
                        value = this.replaceSubstr(value, char, i);
                    }
                    else if (!maskChar) {
                        value += char;
                    }
                    ++i;
                }
            }
            else {
                if (!maskChar && i >= value.length) {
                    value += mask[i];
                }
                ++i;
            }
        }
        return value;
    },
    isAllowedChar: function(char, pos, newState) {
        var mask = newState ? newState.mask : this.state.mask;
        if (this.isPermanentChar(pos, newState)) {
            return mask[pos] === char;
        }
        var ruleChar = mask[pos];
        var charRule = this.charsRules[ruleChar];
        return (new RegExp(charRule)).test(char || "");
    },
    isPermanentChar: function(pos, newState) {
        var permanents = newState ? newState.permanents : this.state.permanents;
        return permanents.indexOf(pos) !== -1;
    },
    setCaretToEnd: function() {
        var filledLen = this.getFilledLength();
        var pos = this.getRightEditablePos(filledLen);
        if (pos !== null) {
            this.setCaretPos(pos);
        }
    },
    getSelection: function() {
        var input = this.getInputDOMNode();
        var start = 0;
        var end = 0;

        if ("selectionStart" in input && "selectionEnd" in input) {
            start = input.selectionStart;
            end = input.selectionEnd;
        }
        else {
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
    getCaretPos: function() {
        var input = this.getInputDOMNode();
        var pos = 0;

        if ("selectionStart" in input) {
            pos = input.selectionStart;
        }
        else {
            var range = document.selection.createRange();
            range.moveStart("character", -input.value.length);
            pos = range.text.length;
        }

        return pos;
    },
    setCaretPos: function(pos) {
        var input;
        var setPos = function() {
            if ("selectionStart" in input && "selectionEnd" in input) {
                input.selectionStart = input.selectionEnd = pos;
            }
            else if ("setSelectionRange" in input) {
                input.setSelectionRange(pos, pos);
            }
            else {
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
    isFocused: function() {
        return document.activeElement === this.getInputDOMNode();
    },
    parseMask: function(mask) {
        if (typeof mask !== "string") {
            return {
                mask: null,
                permanents: []
            };
        }
        var str = "";
        var permanents = [];
        var isPermanent = false;

        mask.split("").forEach((char) => {
            if (!isPermanent && char === "\\") {
                isPermanent = true;
            }
            else {
                if (isPermanent || !this.charsRules[char]) {
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
    getStringValue: function(value) {
        return !value && value !== 0 ? "" : value + "";
    },
    getInitialState: function() {
        var mask = this.parseMask(this.props.mask);
        var defaultValue = this.props.defaultValue != null
            ? this.props.defaultValue
            : null;
        var value = this.props.value != null
            ? this.props.value
            : defaultValue;

        return {
            mask: mask.mask,
            permanents: mask.permanents,
            value: this.getStringValue(value),
            maskChar: "maskChar" in this.props ? this.props.maskChar : this.defaultMaskChar
        };
    },
    componentWillMount: function() {
        if (this.state.mask && this.state.value) {
            this.setState({
                value: this.formatValue(this.state.value)
            });
        }
    },
    componentWillReceiveProps: function(nextProps) {
        var mask = this.parseMask(nextProps.mask);
        var maskChar = "maskChar" in nextProps ? nextProps.maskChar : this.defaultMaskChar;
        var state = {
            mask: mask.mask,
            permanents: mask.permanents,
            maskChar: maskChar
        };

        var newValue = nextProps.value !== undefined
            ? this.getStringValue(nextProps.value)
            : this.state.value;

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
    componentDidUpdate: function(prevProps, prevState) {
        var mask = this.state.mask;
        var isMaskChanged = mask && mask !== prevState.mask;
        var pos = this.lastCaretPos;
        var filledLen = this.getFilledLength();
        if (isMaskChanged && filledLen < pos) {
            this.setCaretPos(this.getRightEditablePos(filledLen));
        }
    },
    onKeyDown: function(event) {
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
                }
                else if (caretPos < prefixLen || (!deleteFromRight && caretPos === prefixLen)) {
                    caretPos = prefixLen;
                }
                else {
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
    onKeyPress: function(event) {
        var key = event.key;
        var hasHandler = typeof this.props.onKeyPress === "function";
        if (key === "Enter" || event.ctrlKey || event.metaKey) {
            if (hasHandler) {
                this.props.onKeyPress(event);
            }
            return;
        }

        var caretPos = this.getCaretPos();
        var { value, mask, maskChar } = this.state;
        var maskLen = mask.length;
        var prefixLen = this.getPrefix().length;

        if (this.isPermanentChar(caretPos) && mask[caretPos] === key) {
            value = this.insertRawSubstr(value, key, caretPos);
            ++caretPos;
        }
        else {
            var editablePos = this.getRightEditablePos(caretPos);
            if (editablePos !== null && this.isAllowedChar(key, editablePos)) {
                if (!maskChar && value.length < mask.length) {
                    value = value.slice(0, editablePos) + key + value.slice(editablePos);
                    value = this.insertRawSubstr("", value, 0);
                }
                else {
                    value = this.insertRawSubstr(value, key, caretPos);
                }
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
    onChange: function(event) {
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
    onFocus: function(event) {
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
        }
        else if (this.getFilledLength() < this.state.mask.length) {
            this.setCaretToEnd();
        }

        if (typeof this.props.onFocus === "function") {
            this.props.onFocus(event);
        }
    },
    onBlur: function(event) {
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
    onPaste: function(event) {
        var text;
        if (window.clipboardData && window.clipboardData.getData) { // IE
            text = window.clipboardData.getData("Text");
        }
        else if (event.clipboardData && event.clipboardData.getData) {
            text = event.clipboardData.getData("text/plain");
        }
        if (text) {
            var caretPos = this.getCaretPos();
            var value = this.insertRawSubstr(this.state.value, text, caretPos);
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
    render: function() {
        var ourProps = {};
        if (this.state.mask) {
            var handlersKeys = ["onFocus", "onBlur", "onChange", "onKeyDown", "onKeyPress", "onPaste"];
            handlersKeys.forEach((key) => {
                ourProps[key] = this[key];
            });
            ourProps.value = this.state.value;
        }
        const ref = React.version && React.version.substr(0, 4) === '0.14'
            ? this.setRef
            : 'input';
        return <input ref={this.setRef} {...this.props} {...ourProps}/>;
    }
});

module.exports = InputElement;
