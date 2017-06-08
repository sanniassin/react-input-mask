// https://github.com/sanniassin/react-input-mask

var React = require("react");

class InputElement extends React.Component {
    defaultCharsRules = {
        "9": "[0-9]",
        "a": "[A-Za-z]",
        "*": "[A-Za-z0-9]"
    }
    defaultMaskChar = "_"
    lastCursorPos = null

    constructor(props) {
        super(props);

        this.hasValue = props.value != null;
        this.charsRules = props.formatChars != null 
            ? props.formatChars
            : this.defaultCharsRules;

        var mask = this.parseMask(props.mask);
        var defaultValue = props.defaultValue != null
            ? props.defaultValue
            : '';
        var value = props.value != null
            ? props.value
            : defaultValue;

        value = this.getStringValue(value);

        this.mask = mask.mask;
        this.permanents = mask.permanents;
        this.lastEditablePos = mask.lastEditablePos;
        this.maskChar = "maskChar" in props ? props.maskChar : this.defaultMaskChar;

        if (this.mask && (props.alwaysShowMask || value)) {
            value = this.formatValue(value);
        }

        this.state = { value };
    }

    isAndroidBrowser = () => {
        var windows = new RegExp("windows", "i");
        var firefox = new RegExp("firefox", "i");
        var android = new RegExp("android", "i");
        var ua = navigator.userAgent;
        return !windows.test(ua)
               &&
               !firefox.test(ua)
               &&
               android.test(ua);
    }

    isWindowsPhoneBrowser = () => {
        var windows = new RegExp("windows", "i");
        var phone = new RegExp("phone", "i");
        var ua = navigator.userAgent;
        return windows.test(ua) && phone.test(ua);
    }

    isAndroidFirefox = () => {
        var windows = new RegExp("windows", "i");
        var firefox = new RegExp("firefox", "i");
        var android = new RegExp("android", "i");
        var ua = navigator.userAgent;
        return !windows.test(ua)
               &&
               firefox.test(ua)
               &&
               android.test(ua);
    }

    isDOMElement = (element) => {
        return typeof HTMLElement === "object"
               ? element instanceof HTMLElement // DOM2
               : element.nodeType === 1 && typeof element.nodeName === "string";
    }

    getInputDOMNode = () => {
        var input = this.input;

        if (!input) {
            return null;
        }

        if (this.isDOMElement(input)) {
            return input;
        }

        // React 0.13
        return React.findDOMNode(input);
    }

    enableValueAccessors = () => {
        if (this.canUseAccessors) {
            var input = this.getInputDOMNode();
            this.valueDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
            Object.defineProperty(input, 'value', {
                configurable: true,
                enumerable: true,
                get: () => this.value,
                set: (val) => {
                    this.value = val;
                    this.valueDescriptor.set.call(input, val);
                }
            });
        }
    }

    disableValueAccessors = () => {
        var { valueDescriptor } = this;
        if (!valueDescriptor) {
            return;
        }
        this.valueDescriptor = null;
        var input = this.getInputDOMNode();
        Object.defineProperty(input, 'value', valueDescriptor);
    }

    getInputValue = () => {
        var input = this.getInputDOMNode();
        var { valueDescriptor } = this;

        var value;
        if (valueDescriptor) {
            value = valueDescriptor.get.call(input);
        }
        else {
            value = input.value;
        }

        return value;
    }

    setInputValue = (val) => {
        var input = this.getInputDOMNode();
        this.value = val;
        input.value = val;
    }

    getPrefix = () => {
        var prefix = "";
        var { mask } = this;
        for (var i = 0; i < mask.length && this.isPermanentChar(i); ++i) {
            prefix += mask[i];
        }
        return prefix;
    }

    getFilledLength = (value = this.state.value) => {
        var i;
        var { maskChar } = this;

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
    }

    getLeftEditablePos = (pos) => {
        for (var i = pos; i >= 0; --i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    }

    getRightEditablePos = (pos) => {
        var { mask } = this;
        for (var i = pos; i < mask.length; ++i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    }

    isEmpty = (value = this.state.value) => {
        return !value.split("").some((character, i) =>
            !this.isPermanentChar(i) && this.isAllowedChar(character, i)
        );
    }

    isFilled = (value = this.state.value) => {
        return this.getFilledLength(value) === this.mask.length;
    }

    createFilledArray = (length, val) => {
        var array = [];
        for (var i = 0; i < length; i++) {
            array[i] = val;
        }
        return array;
    }

    formatValue = (value) => {
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
                    .map((character, pos) => {
                        if (this.isAllowedChar(character, pos)) {
                            return character;
                        }
                        else if (this.isPermanentChar(pos)) {
                            return mask[pos];
                        }
                        return maskChar;
                    })
                    .join("");
    }

    clearRange = (value, start, len) => {
        var end = start + len;
        var { maskChar, mask } = this;
        if (!maskChar) {
            var prefixLen = this.getPrefix().length;
            value = value.split("")
                         .filter((character, i) => i < prefixLen || i < start || i >= end)
                         .join("");
            return this.formatValue(value);
        }
        return value.split("")
                    .map((character, i) => {
                        if (i < start || i >= end) {
                            return character;
                        }
                        if (this.isPermanentChar(i)) {
                            return mask[i];
                        }
                        return maskChar;
                    })
                    .join("");
    }

    replaceSubstr = (value, newSubstr, pos) => {
        return value.slice(0, pos) + newSubstr + value.slice(pos + newSubstr.length);
    }

    insertRawSubstr = (value, substr, pos) => {
        var { mask, maskChar } = this;
        var isFilled = this.isFilled(value);
        var prefixLen = this.getPrefix().length;
        substr = substr.split("");

        if (!maskChar && pos > value.length) {
            value += mask.slice(value.length, pos);
        }

        for (var i = pos; i < mask.length && substr.length; ) {
            var isPermanent = this.isPermanentChar(i);
            if (!isPermanent || mask[i] === substr[0]) {
                var character = substr.shift();
                if (this.isAllowedChar(character, i, true)) {
                    if (i < value.length) {
                        if (maskChar || isFilled || i < prefixLen) {
                            value = this.replaceSubstr(value, character, i);
                        }
                        else {
                            value = this.formatValue(value.substr(0, i) + character + value.substr(i));
                        }
                    }
                    else if (!maskChar) {
                        value += character;
                    }
                    ++i;
                }
            }
            else {
                if (!maskChar && i >= value.length) {
                    value += mask[i];
                }
                else if (maskChar && isPermanent && substr[0] === maskChar) {
                    substr.shift();
                }
                ++i;
            }
        }
        return value;
    }

    getRawSubstrLength = (value, substr, pos) => {
        var { mask, maskChar } = this;
        substr = substr.split("");
        for (var i = pos; i < mask.length && substr.length; ) {
            if (!this.isPermanentChar(i) || mask[i] === substr[0]) {
                var character = substr.shift();
                if (this.isAllowedChar(character, i, true)) {
                    ++i;
                }
            }
            else {
                ++i;
            }
        }
        return i - pos;
    }

    isAllowedChar = (character, pos, allowMaskChar = false) => {
        var { mask, maskChar } = this;
        if (this.isPermanentChar(pos)) {
            return mask[pos] === character;
        }
        var ruleChar = mask[pos];
        var charRule = this.charsRules[ruleChar];
        return (new RegExp(charRule)).test(character || "") || (allowMaskChar && character === maskChar);
    }

    isPermanentChar = (pos) => {
        return this.permanents.indexOf(pos) !== -1;
    }

    setCursorToEnd = () => {
        var filledLen = this.getFilledLength();
        var pos = this.getRightEditablePos(filledLen);
        if (pos !== null) {
            this.setCursorPos(pos);
        }
    }

    setSelection = (start, len = 0) => {
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
    }

    getSelection = () => {
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
    }

    getCursorPos = () => {
        return this.getSelection().start;
    }

    setCursorPos = (pos) => {
        var raf = window.requestAnimationFrame
                  ||
                  window.webkitRequestAnimationFrame
                  ||
                  window.mozRequestAnimationFrame
                  ||
                  ((fn) => setTimeout(fn, 0));

        var setPos = this.setSelection.bind(this, pos, 0);

        setPos();
        raf(setPos);

        this.lastCursorPos = pos;
    }

    isFocused = () => {
        return document.activeElement === this.getInputDOMNode();
    }

    parseMask = (mask) => {
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

        mask.split("").forEach((character) => {
            if (!isPermanent && character === "\\") {
                isPermanent = true;
            }
            else {
                if (isPermanent || !this.charsRules[character]) {
                    permanents.push(str.length);
                }
                else {
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
    }

    getStringValue = (value) => {
        return !value && value !== 0 ? "" : value + "";
    }

    componentWillMount = () => {
        var { mask } = this;
        var { value } = this.state;
        if (mask && value) {
            this.setState({ value });
        }
    }

    componentWillReceiveProps = (nextProps) => {
        this.hasValue = this.props.value != null;
        this.charsRules = nextProps.formatChars != null 
            ? nextProps.formatChars
            : this.defaultCharsRules;

        var oldMask = this.mask;
        var mask = this.parseMask(nextProps.mask);
        var isMaskChanged = mask.mask && mask.mask !== this.mask;

        this.mask = mask.mask;
        this.permanents = mask.permanents;
        this.lastEditablePos = mask.lastEditablePos;
        this.maskChar = "maskChar" in nextProps ? nextProps.maskChar : this.defaultMaskChar;

        if (!this.mask) {
            this.lastCursorPos = null;
            return;
        }

        var newValue = nextProps.value != null
            ? this.getStringValue(nextProps.value)
            : this.state.value;

        if (!oldMask && nextProps.value == null) {
            newValue = this.getInputDOMNode().value;
        }

        var showEmpty = nextProps.alwaysShowMask || this.isFocused();
        if (isMaskChanged || (mask.mask && (newValue || showEmpty))) {
            newValue = this.formatValue(newValue);

            if (isMaskChanged) {
                var pos = this.lastCursorPos;
                var filledLen = this.getFilledLength(newValue);
                if (pos === null || filledLen < pos) {
                    if (this.isFilled(newValue)) {
                        pos = filledLen;
                    }
                    else {
                        pos = this.getRightEditablePos(filledLen);
                    }
                    this.setCursorPos(pos);
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
    }

    componentDidUpdate = (prevProps, prevState) => {
        if ((this.mask || prevProps.mask) && this.props.value == null) {
            this.updateUncontrolledInput();
        }
        if (this.valueDescriptor && this.getInputValue() !== this.state.value) {
            this.setInputValue(this.state.value);
        }
    }

    updateUncontrolledInput = () => {
        if (this.getInputValue() !== this.state.value) {
            this.setInputValue(this.state.value);
        }
    }

    onKeyDown = (event) => {
        var hasHandler = typeof this.props.onKeyDown === "function";
        if (event.ctrlKey || event.metaKey) {
            if (hasHandler) {
                this.props.onKeyDown(event);
            }
            return;
        }

        var cursorPos = this.getCursorPos();
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
                else if (cursorPos < prefixLen || (!deleteFromRight && cursorPos === prefixLen)) {
                    cursorPos = prefixLen;
                }
                else {
                    var editablePos = deleteFromRight ? this.getRightEditablePos(cursorPos) : this.getLeftEditablePos(cursorPos - 1);
                    if (editablePos !== null) {
                        value = this.clearRange(value, editablePos, 1);
                        cursorPos = editablePos;
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
            this.setCursorPos(cursorPos);
        }
    }

    onKeyPress = (event) => {
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

        var cursorPos = this.getCursorPos();
        var selection = this.getSelection();
        var { value } = this.state;
        var { mask, maskChar, lastEditablePos } = this;
        var maskLen = mask.length;
        var prefixLen = this.getPrefix().length;

        if (this.isPermanentChar(cursorPos) && mask[cursorPos] === key) {
            value = this.insertRawSubstr(value, key, cursorPos);
            ++cursorPos;
        }
        else {
            var editablePos = this.getRightEditablePos(cursorPos);
            if (editablePos !== null && this.isAllowedChar(key, editablePos)) {
                value = this.clearRange(value, selection.start, selection.length);
                value = this.insertRawSubstr(value, key, editablePos);
                cursorPos = editablePos + 1;
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
        if (cursorPos < lastEditablePos && cursorPos > prefixLen) {
            cursorPos = this.getRightEditablePos(cursorPos);
        }
        this.setCursorPos(cursorPos);
    }

    onChange = (event) => {
        var { pasteSelection, mask, maskChar, lastEditablePos, preventEmptyChange } = this;
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
        var cursorPos = selection.end;
        var maskLen = mask.length;
        var valueLen = value.length;
        var oldValueLen = oldValue.length;
        var prefixLen = this.getPrefix().length;
        var clearedValue;

        if (valueLen > oldValueLen) {
            var substrLen = valueLen - oldValueLen;
            var startPos = selection.end - substrLen;
            var enteredSubstr = value.substr(startPos, substrLen);

            if (startPos < lastEditablePos && (substrLen !== 1 || enteredSubstr !== mask[startPos])) {
                cursorPos = this.getRightEditablePos(startPos);
            }
            else {
                cursorPos = startPos;
            }

            value = value.substr(0, startPos) + value.substr(startPos + substrLen);

            clearedValue = this.clearRange(value, startPos, maskLen - startPos);
            clearedValue = this.insertRawSubstr(clearedValue, enteredSubstr, cursorPos);

            value = this.insertRawSubstr(oldValue, enteredSubstr, cursorPos);

            if (substrLen !== 1 || (cursorPos >= prefixLen && cursorPos < lastEditablePos)) {
                cursorPos = this.getFilledLength(clearedValue);
            }
            else if (cursorPos < lastEditablePos) {
                cursorPos++;
            }
        }
        else if (valueLen < oldValueLen) {
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
                cursorPos = this.getFilledLength(clearedValue);
            }
            else if (cursorPos < prefixLen) {
                cursorPos = prefixLen;
            }
        }
        value = this.formatValue(value);

        if (this.isWindowsPhoneBrowser) {
            event.persist();
            setTimeout(() => {
                this.setInputValue(value);

                if (!this.hasValue) {
                    this.setState({
                        value: value
                    });
                }

                if (typeof this.props.onChange === "function") {
                    this.props.onChange(event);
                }

                this.setCursorPos(cursorPos);
            }, 0);
        }
        else {
            // prevent android autocomplete insertion on backspace
            if (!this.canUseAccessors || (!this.isAndroidBrowser)) {
                this.setInputValue(value);
            }

            if (this.canUseAccessors && ((this.isAndroidFirefox && value && !this.getInputValue()) || this.isAndroidBrowser)) {
                this.value = value;
                this.enableValueAccessors();
                if (this.isAndroidFirefox) {
                    this.preventEmptyChange = true;
                }
                setTimeout(() => {
                    this.preventEmptyChange = false;
                    this.disableValueAccessors();
                }, 0);
            }

            this.setState({
                value: this.hasValue ? this.state.value : value
            });

            if (typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }

            this.setCursorPos(cursorPos);
        }
    }

    onFocus = (event) => {
        if (!this.state.value) {
            var prefix = this.getPrefix();
            var value = this.formatValue(prefix);
            var inputValue = this.formatValue(value);

            // do not use this.getInputValue and this.setInputValue as this.input
            // can be undefined at this moment if autoFocus attribute is set
            var isInputValueChanged = inputValue !== event.target.value;

            if (isInputValueChanged) {
                event.target.value = inputValue;
            }

            this.setState({
                value: this.hasValue ? this.state.value : inputValue
            }, this.setCursorToEnd);

            if (isInputValueChanged && typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }
        else if (this.getFilledLength() < this.mask.length) {
            this.setCursorToEnd();
        }

        if (typeof this.props.onFocus === "function") {
            this.props.onFocus(event);
        }
    }

    onBlur = (event) => {
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
    }

    onPaste = (event) => {
        if (this.isAndroidBrowser) {
            this.pasteSelection = this.getSelection();
            this.setInputValue("");
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
    }

    pasteText = (value, text, selection, event) => {
        var cursorPos = selection.start;
        if (selection.length) {
            value = this.clearRange(value, cursorPos, selection.length);
        }
        var textLen = this.getRawSubstrLength(value, text, cursorPos);
        value = this.insertRawSubstr(value, text, cursorPos);
        cursorPos += textLen;
        cursorPos = this.getRightEditablePos(cursorPos) || cursorPos;
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
        this.setCursorPos(cursorPos);
    }

    componentDidMount = () => {
        this.isAndroidBrowser = this.isAndroidBrowser();
        this.isWindowsPhoneBrowser = this.isWindowsPhoneBrowser();
        this.isAndroidFirefox = this.isAndroidFirefox();

        var input = this.getInputDOMNode();

        // workaround for Jest
        // it doesn't mount a real node so input will be null
        if (input && Object.getOwnPropertyDescriptor && Object.getPrototypeOf && Object.defineProperty) {
            var valueDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
            this.canUseAccessors = !!(valueDescriptor && valueDescriptor.get && valueDescriptor.set);
        }

        if (this.mask && this.props.value == null) {
            this.updateUncontrolledInput();
        }
    }

    render = () => {
        var { mask, alwaysShowMask, maskChar, formatChars, ...props } = this.props;
        if (this.mask) {
            if (!props.disabled && !props.readOnly) {
                var handlersKeys = ["onFocus", "onBlur", "onChange", "onKeyDown", "onKeyPress", "onPaste"];
                handlersKeys.forEach((key) => {
                    props[key] = this[key];
                });
            }

            if (props.value != null) {
                props.value = this.state.value;
            }
        }
        return <input ref={ref => this.input = ref} {...props}/>;
    }
}

module.exports = InputElement;
