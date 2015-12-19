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
    isAndroidBrowser: function() {
        var windows = new RegExp("windows", "i");
        var firefox = new RegExp("firefox", "i");
        var android = new RegExp("android", "i");
        var ua = navigator.userAgent;
        return !windows.test(ua)
               &&
               !firefox.test(ua)
               &&
               android.test(ua);
    },
    isDOMElement: function(element) {
        return typeof HTMLElement === "object"
               ? element instanceof HTMLElement // DOM2
               : element.nodeType === 1 && typeof element.nodeName === "string";
    },
    // getDOMNode is deprecated but we need it to stay compatible with React 0.12
    getInputDOMNode: function() {
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
    getPrefix: function() {
        var prefix = "";
        var { mask } = this;
        for (var i = 0; i < mask.length && this.isPermanentChar(i); ++i) {
            prefix += mask[i];
        }
        return prefix;
    },
    getFilledLength: function(value = this.state.value) {
        var i;
        var { maskChar } = this;

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
        var { mask } = this;
        for (var i = pos; i < mask.length; ++i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    },
    isEmpty: function(value = this.state.value) {
        return !value.split("").some((char, i) =>
            !this.isPermanentChar(i) && this.isAllowedChar(char, i)
        );
    },
    isFilled: function(value = this.state.value) {
        return this.getFilledLength(value) === this.mask.length;
    },
    createFilledArray: function(length, val) {
        var array = [];
        for (var i = 0; i < length; i++) {
            array[i] = val;
        }
        return array;
    },
    formatValue: function(value) {
        var { maskChar, mask } = this;
        if (!maskChar) {
            var prefix = this.getPrefix();
            var prefixLen = prefix.length;
            value = this.insertRawSubstr("", value, 0);
            while (value.length > prefixLen && this.isPermanentChar(value.length - 1)) {
                value = value.slice(0, value.length - 1);
            }

            if (value.length < prefixLen) {
                value = prefix;
            }

            return value;
        }
        if (value) {
            var emptyValue = this.formatValue("");
            return this.insertRawSubstr(emptyValue, value, 0);
        }
        return value.split("")
                    .concat(this.createFilledArray(mask.length - value.length, null))
                    .map((char, pos) => {
                        if (this.isAllowedChar(char, pos)) {
                            return char;
                        }
                        else if (this.isPermanentChar(pos)) {
                            return mask[pos];
                        }
                        return maskChar;
                    })
                    .join("");
    },
    clearRange: function(value, start, len) {
        var end = start + len;
        var { maskChar, mask } = this;
        if (!maskChar) {
            var prefixLen = this.getPrefix().length;
            value = value.split("")
                         .filter((char, i) => i < prefixLen || i < start || i >= end)
                         .join("");
            return this.formatValue(value);
        }
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
    insertRawSubstr: function(value, substr, pos) {
        var { mask, maskChar } = this;
        var isFilled = this.isFilled(value);
        var prefixLen = this.getPrefix().length;
        substr = substr.split("");

        if (!maskChar && pos > value.length) {
            value += mask.slice(value.length, pos);
        }

        for (var i = pos; i < mask.length && substr.length; ) {
            if (!this.isPermanentChar(i) || mask[i] === substr[0]) {
                var char = substr.shift();
                if (this.isAllowedChar(char, i, true)) {
                    if (i < value.length) {
                        if (maskChar || isFilled || i < prefixLen) {
                            value = this.replaceSubstr(value, char, i);
                        }
                        else {
                            value = this.formatValue(value.substr(0, i) + char + value.substr(i));
                        }
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
    getRawSubstrLength: function(value, substr, pos) {
        var { mask, maskChar } = this;
        substr = substr.split("");
        for (var i = pos; i < mask.length && substr.length; ) {
            if (!this.isPermanentChar(i) || mask[i] === substr[0]) {
                var char = substr.shift();
                if (this.isAllowedChar(char, i, true)) {
                    ++i;
                }
            }
            else {
                ++i;
            }
        }
        return i - pos;
    },
    isAllowedChar: function(char, pos, allowMaskChar = false) {
        var { mask, maskChar } = this;
        if (this.isPermanentChar(pos)) {
            return mask[pos] === char;
        }
        var ruleChar = mask[pos];
        var charRule = this.charsRules[ruleChar];
        return (new RegExp(charRule)).test(char || "") || (allowMaskChar && char === maskChar);
    },
    isPermanentChar: function(pos) {
        return this.permanents.indexOf(pos) !== -1;
    },
    setCaretToEnd: function() {
        var filledLen = this.getFilledLength();
        var pos = this.getRightEditablePos(filledLen);
        if (pos !== null) {
            this.setCaretPos(pos);
        }
    },
    setSelection: function(start, len = 0) {
        var input = this.getInputDOMNode();
        if (!input) {
            return;
        }

        var end = start + len;
        if ("selectionStart" in input && "selectionEnd" in input) {
            input.selectionStart = start;
            input.selectionEnd = end;
        }
        else {
            var range = input.createTextRange();
            range.collapse(true);
            range.moveStart("character", start);
            range.moveEnd("character", end - start);
            range.select();
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
    getCaretPos: function() {
        return this.getSelection().start;
    },
    setCaretPos: function(pos) {
        var raf = window.requestAnimationFrame
                  ||
                  window.webkitRequestAnimationFrame
                  ||
                  window.mozRequestAnimationFrame
                  ||
                  function(fn) { setTimeout(fn, 0); };

        var setPos = this.setSelection.bind(this, pos, 0);
        
        setPos();
        raf(setPos);

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

        value = this.getStringValue(value);

        this.mask = mask.mask;
        this.permanents = mask.permanents,
        this.maskChar = "maskChar" in this.props ? this.props.maskChar : this.defaultMaskChar;

        if (this.props.alwaysShowMask || value) {
            value = this.formatValue(value);
        }

        return { value };
    },
    componentWillMount: function() {
        var { mask } = this;
        var { value } = this.state;
        if (mask && value) {
            this.setState({ value });
        }
    },
    componentWillReceiveProps: function(nextProps) {
        var mask = this.parseMask(nextProps.mask);
        var isMaskChanged = mask.mask && mask.mask !== this.mask;

        this.mask = mask.mask;
        this.permanents = mask.permanents,
        this.maskChar = "maskChar" in nextProps ? nextProps.maskChar : this.defaultMaskChar;

        var newValue = nextProps.value !== undefined
            ? this.getStringValue(nextProps.value)
            : this.state.value;

        var showEmpty = nextProps.alwaysShowMask || this.isFocused();
        if (isMaskChanged || (mask.mask && (newValue || showEmpty))) {
            newValue = this.formatValue(newValue);

            if (isMaskChanged) {
                var pos = this.lastCaretPos;
                var filledLen = this.getFilledLength(newValue);
                if (filledLen < pos) {
                    this.setCaretPos(this.getRightEditablePos(filledLen));
                }
            }
        }
        if (mask.mask && this.isEmpty(newValue) && !showEmpty) {
            newValue = "";
        }
        if (this.state.value !== newValue) {
            this.setState({ value: newValue });
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
        var selection = this.getSelection();
        var { value } = this.state;
        var { mask, maskChar } = this;
        var maskLen = mask.length;
        var prefixLen = this.getPrefix().length;

        if (this.isPermanentChar(caretPos) && mask[caretPos] === key) {
            value = this.insertRawSubstr(value, key, caretPos);
            ++caretPos;
        }
        else {
            var editablePos = this.getRightEditablePos(caretPos);
            if (editablePos !== null && this.isAllowedChar(key, editablePos)) {
                value = this.clearRange(value, selection.start, selection.length);
                value = this.insertRawSubstr(value, key, editablePos);
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
        if (caretPos < maskLen && caretPos > prefixLen) {
            caretPos = this.getRightEditablePos(caretPos);
        }
        this.setCaretPos(caretPos);
    },
    onChange: function(event) {
        var { pasteSelection, mask, maskChar } = this;
        var target = event.target;
        var value = target.value;
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
        var oldValueLen = oldValue.length
        var prefixLen = this.getPrefix().length;

        if (valueLen > oldValueLen) {
            var substrLen = valueLen - oldValueLen;
            var startPos = selection.end - substrLen;
            var enteredSubstr = value.substr(startPos, substrLen);

            if (startPos < maskLen && (substrLen !== 1 || enteredSubstr !== mask[startPos])) {
                caretPos = this.getRightEditablePos(startPos);
            }
            else {
                caretPos = startPos;
            }

            value = value.substr(0, startPos) + value.substr(startPos + substrLen);

            var clearedValue = this.clearRange(value, startPos, maskLen - startPos);
            clearedValue = this.insertRawSubstr(clearedValue, enteredSubstr, caretPos);

            value = this.insertRawSubstr(oldValue, enteredSubstr, caretPos);

            if (substrLen !== 1 || caretPos >= prefixLen && caretPos < maskLen) {
                caretPos = this.getFilledLength(clearedValue);
            }
            else if (caretPos < maskLen) {
                caretPos++;
            }
        }
        else if (valueLen < oldValueLen) {
            var removedLen = maskLen - valueLen;
            var clearedValue = this.clearRange(oldValue, selection.end, removedLen);
            var substr = value.substr(0, selection.end);
            var clearOnly = substr === oldValue.substr(0, selection.end);

            if (maskChar) {
                value = this.insertRawSubstr(clearedValue, substr, 0);
            }

            clearedValue = this.clearRange(clearedValue, selection.end, maskLen - selection.end);
            clearedValue = this.insertRawSubstr(clearedValue, substr, 0);

            if (!clearOnly) {
                caretPos = this.getFilledLength(clearedValue);
            }
            else if (caretPos < prefixLen) {
                caretPos = prefixLen;
            }
        }
        var value = this.formatValue(value);

        // prevent android autocomplete insertion on backspace
        if (!this.isAndroidBrowser()) {
            target.value = value;
        }

        this.setState({
            value: value
        });
      
        this.setCaretPos(caretPos);

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
        else if (this.getFilledLength() < this.mask.length) {
            this.setCaretToEnd();
        }

        if (typeof this.props.onFocus === "function") {
            this.props.onFocus(event);
        }
    },
    onBlur: function(event) {
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
    onPaste: function(event) {
        if (this.isAndroidBrowser()) {
            this.pasteSelection = this.getSelection();
            event.target.value = "";
            return;
        }
        var text;
        if (window.clipboardData && window.clipboardData.getData) { // IE
            text = window.clipboardData.getData("Text");
        }
        else if (event.clipboardData && event.clipboardData.getData) {
            text = event.clipboardData.getData("text/plain");
        }
        if (text) {
            var value = this.state.value;
            var selection = this.getSelection();
            this.pasteText(value, text, selection, event);
        }
        event.preventDefault();
    },
    pasteText: function(value, text, selection, event) {
        var caretPos = selection.start;
        if (selection.length) {
            value = this.clearRange(value, caretPos, selection.length);
        }
        var textLen = this.getRawSubstrLength(value, text, caretPos);
        var value = this.insertRawSubstr(value, text, caretPos);
        caretPos += textLen;
        caretPos = this.getRightEditablePos(caretPos) || caretPos;
        if (value !== this.getInputDOMNode().value) {
            if (event) {
                event.target.value = value;
            }
            this.setState({
                value: value
            });
            if (event && typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }
        this.setCaretPos(caretPos);
    },
    render: function() {
        var ourProps = {};
        if (this.mask) {
            var handlersKeys = ["onFocus", "onBlur", "onChange", "onKeyDown", "onKeyPress", "onPaste"];
            handlersKeys.forEach((key) => {
                ourProps[key] = this[key];
            });
            ourProps.value = this.state.value;
        }
        return <input ref="input" {...this.props} {...ourProps}/>;
    }
});

module.exports = InputElement;
