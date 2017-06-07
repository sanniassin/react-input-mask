import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import Input from '../InputElement';

document.body.innerHTML = '<div id="container"></div>';
const container = document.getElementById('container');;

function createInput(component, cb) {
    return (done) => {
        ReactDOM.unmountComponentAtNode(container);
        var input = ReactDOM.render(component, container);

        // IE can fail if executed synchronously
        setImmediate(() => {
            cb(input);
            done();
        });
    };
};

function setInputProps(input, props) {
    ReactDOM.render(React.createElement(Input, { ...input.props, ...props }), container);
};

describe('Input', () => {
    it('Init format', createInput(
        <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        expect(inputNode.value).toEqual('+7 (495) 315 64 54');
    }));

    it('Format unacceptable string', createInput(
        <Input mask="+7 (9a9) 999 99 99" defaultValue="749531b6454" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        expect(inputNode.value).toEqual('+7 (4b6) 454 __ __');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Focus/blur', createInput(
        <Input mask="+7 (*a9) 999 99 99" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        expect(inputNode.value).toEqual('');

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        expect(inputNode.value).toEqual('+7 (___) ___ __ __');

        inputNode.blur();
        TestUtils.Simulate.blur(inputNode);
        expect(inputNode.value).toEqual('');

        setInputProps(input, { value: '+7 (___) ___ __ __' });
        expect(inputNode.value).toEqual('');

        setInputProps(input, { value: '+7 (1__) ___ __ __' });
        expect(inputNode.value).toEqual('+7 (1__) ___ __ __');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('alwaysShowMask', createInput(
        <Input mask="+7 (999) 999 99 99" alwaysShowMask />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        expect(inputNode.value).toEqual('+7 (___) ___ __ __');

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        expect(inputNode.value).toEqual('+7 (___) ___ __ __');

        inputNode.blur();
        TestUtils.Simulate.blur(inputNode);
        expect(inputNode.value).toEqual('+7 (___) ___ __ __');

        setInputProps(input, { alwaysShowMask: false });
        expect(inputNode.value).toEqual('');

        setInputProps(input, { alwaysShowMask: true });
        expect(inputNode.value).toEqual('+7 (___) ___ __ __');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Focus cursor position', createInput(
        <Input mask="+7 (999) 999 99 99" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        expect(input.getCursorPos()).toEqual(4);

        inputNode.blur();
        TestUtils.Simulate.blur(inputNode);

        setInputProps(input, { value: '+7 (___) ___ _1 __' });
        input.setCursorPos(2);
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        expect(input.getCursorPos()).toEqual(16);

        inputNode.blur();
        TestUtils.Simulate.blur(inputNode);

        setInputProps(input, { value: '+7 (___) ___ _1 _1' });
        input.setCursorPos(2);
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        expect(input.getCursorPos()).toEqual(2);

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('onChange input', createInput(
        <Input mask="**** **** **** ****" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setCursorPos(0);
        inputNode.value = 'a' + inputNode.value;
        input.setCursorPos(1);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('a___ ____ ____ ____');
        expect(input.getCursorPos()).toEqual(1);

        input.setSelection(0, 19);
        inputNode.value = 'a';
        input.setCursorPos(1);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('a___ ____ ____ ____');
        expect(input.getCursorPos()).toEqual(1);

        inputNode.value = 'aaaaa___ ____ ____ ____';
        input.setSelection(1, 4);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('aaaa a___ ____ ____');
        expect(input.getCursorPos()).toEqual(6);

        inputNode.value = 'aaa a___ ____ ____';
        input.setCursorPos(3);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('aaa_ a___ ____ ____');

        inputNode.value = 'aaaaaa___ ____ ____';
        input.setCursorPos(6);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('aaaa aa__ ____ ____');

        inputNode.value = 'aaaaxa__ ____ ____';
        input.setCursorPos(5);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('aaaa xa__ ____ ____');
        expect(input.getCursorPos()).toEqual(6);

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('onChange input without mask', createInput(
        <Input mask="**** **** **** ****" maskChar={null} />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setCursorPos(0);
        inputNode.value = 'aaaa';
        input.setCursorPos(4);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('aaaa');
        expect(input.getCursorPos()).toEqual(4);

        inputNode.value = 'aaaaa';
        input.setCursorPos(5);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('aaaa a');
        expect(input.getCursorPos()).toEqual(6);

        inputNode.value = 'aaaa afgh ijkl mnop';
        input.setCursorPos(19);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('aaaa afgh ijkl mnop');
        expect(input.getCursorPos()).toEqual(19);

        inputNode.value = 'aaaa afgh ijkl mnopq';
        input.setCursorPos(20);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('aaaa afgh ijkl mnop');
        expect(input.getCursorPos()).toEqual(19);

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Characters input', createInput(
        <Input mask="+7 (*a9) 999 99 99" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setCursorPos(0);
        TestUtils.Simulate.keyPress(inputNode, { key: '+' });
        expect(inputNode.value).toEqual('+7 (___) ___ __ __');

        input.setCursorPos(0);
        TestUtils.Simulate.keyPress(inputNode, { key: '7' });
        expect(inputNode.value).toEqual('+7 (7__) ___ __ __');

        input.setCursorPos(0);
        TestUtils.Simulate.keyPress(inputNode, { key: 'E' });
        expect(inputNode.value).toEqual('+7 (E__) ___ __ __');

        TestUtils.Simulate.keyPress(inputNode, { key: '6' });
        expect(inputNode.value).toEqual('+7 (E__) ___ __ __');

        TestUtils.Simulate.keyPress(inputNode, { key: 'x' });
        expect(inputNode.value).toEqual('+7 (Ex_) ___ __ __');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Characters input without maskChar', createInput(
        <Input mask="+7 (999) 999 99 99" defaultValue={"+7 (111) 123 45 6"} maskChar={null} />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setCursorPos(4);
        TestUtils.Simulate.keyPress(inputNode, { key: 'E' });
        expect(inputNode.value).toEqual('+7 (111) 123 45 6');

        input.setSelection(4, 3);
        TestUtils.Simulate.keyPress(inputNode, { key: '0' });
        expect(inputNode.value).toEqual('+7 (012) 345 6');

        input.setCursorPos(14)
        TestUtils.Simulate.keyPress(inputNode, { key: '7' });
        TestUtils.Simulate.keyPress(inputNode, { key: '8' });
        TestUtils.Simulate.keyPress(inputNode, { key: '9' });
        TestUtils.Simulate.keyPress(inputNode, { key: '4' });
        expect(inputNode.value).toEqual('+7 (012) 345 67 89');

        inputNode.value = '+7 (';
        input.setCursorPos(4);
        TestUtils.Simulate.change(inputNode);
        input.setCursorPos(0);
        TestUtils.Simulate.keyPress(inputNode, { key: '+' });
        expect(inputNode.value).toEqual('+7 (');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Characters input cursor position', createInput(
        <Input mask="(999)" defaultValue={"11"} />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setCursorPos(3);
        TestUtils.Simulate.keyPress(inputNode, { key: '1' });
        expect(inputNode.value).toEqual('(111)');
        expect(input.getCursorPos()).toEqual(4);

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Backspace single character', createInput(
        <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setCursorPos(10);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(inputNode.value).toEqual('+7 (495) _15 64 54');
        
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(inputNode.value).toEqual('+7 (49_) _15 64 54');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Backspace single character without maskChar', createInput(
        <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" maskChar={null} />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setCursorPos(10);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(inputNode.value).toEqual('+7 (495) 156 45 4');

        inputNode.value = '+7 (';
        input.setCursorPos(4);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('+7 (');

        inputNode.value = '+7 ';
        input.setCursorPos(3);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).toEqual('+7 (');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Backspace single character cursor position', createInput(
        <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setCursorPos(10);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(input.getCursorPos()).toEqual(9);

        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(input.getCursorPos()).toEqual(6);

        input.setCursorPos(4);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(input.getCursorPos()).toEqual(4);

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Backspace range', createInput(
        <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setSelection(1, 9);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(inputNode.value).toEqual('+7 (___) _15 64 54');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Backspace range cursor position', createInput(
        <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setSelection(1, 9);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(input.getCursorPos()).toEqual(1);

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Delete single character', createInput(
        <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setCursorPos(0);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect(inputNode.value).toEqual('+7 (495) 315 64 54');

        input.setCursorPos(7);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect(inputNode.value).toEqual('+7 (495) _15 64 54');

        input.setCursorPos(11);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect(inputNode.value).toEqual('+7 (495) _1_ 64 54');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Delete single character cursor position', createInput(
        <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setCursorPos(0);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect(input.getCursorPos()).toEqual(4);

        input.setCursorPos(7);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect(input.getCursorPos()).toEqual(9);

        input.setCursorPos(11);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect(input.getCursorPos()).toEqual(11);

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Delete range', createInput(
        <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setSelection(1, 9);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect(inputNode.value).toEqual('+7 (___) _15 64 54');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Mask change', createInput(
        <Input mask="9999-9999-9999-9999" defaultValue="34781226917" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        setInputProps(input, { mask: '9999-999999-99999' });
        expect(inputNode.value).toEqual('3478-122691-7____');

        setInputProps(input, { mask: '9-9-9-9' });
        expect(inputNode.value).toEqual('3-4-7-8');

        setInputProps(input, { mask: null });
        expect(inputNode.value).toEqual('3-4-7-8');

        inputNode.value = '0-1-2-3';

        setInputProps(input, { mask: '9999' });
        expect(inputNode.value).toEqual('0123');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Paste string', createInput(
        <Input mask="9999-9999-9999-9999" defaultValue="____-____-____-6543" />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setSelection(3, 15);
        input.pasteText(inputNode.value, '34781226917', input.getSelection());
        expect(inputNode.value).toEqual('___3-4781-2269-17_3');

        input.setCursorPos(3);
        input.pasteText(inputNode.value, '3-__81-2_6917', input.getSelection());
        expect(inputNode.value).toEqual('___3-__81-2_69-17_3');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Paste string without maskChar', createInput(
        <Input mask="9999-9999-9999-9999" defaultValue="9999-9999-9999-9999" maskChar={null} />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.setSelection(0, 19);
        input.pasteText(inputNode.value, '34781226917', input.getSelection());
        expect(inputNode.value).toEqual('3478-1226-917');

        input.setCursorPos(1);
        input.pasteText(inputNode.value, '12345', input.getSelection());
        expect(inputNode.value).toEqual('3123-4547-8122-6917');

        input.setCursorPos(1);
        input.pasteText(inputNode.value, '4321', input.getSelection());
        expect(inputNode.value).toEqual('3432-1547-8122-6917');

        ReactDOM.unmountComponentAtNode(container);
    }));

    it('Paste string with maskChar at place of permanent char', createInput(
        <Input mask="9999-9999-9999" maskChar=" " />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);

        input.pasteText(inputNode.value, '1111 1111 1111', input.getSelection());
        expect(inputNode.value).toEqual('1111-1111-1111');
    }));

    it('Custom rules', createInput(
        <Input mask="11-11" defaultValue="1234" formatChars={{'1': '[1-3]'}} />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        expect(inputNode.value).toEqual('12-3_');
    }));

    it('Rerender alwaysShowMask with empty value', createInput(
        <Input mask="99-99" value="" alwaysShowMask />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);
        setInputProps(input, { value: '' });

        expect(inputNode.value).toEqual('__-__');
    }));

    it('Null as formatChars', createInput(
        <Input mask="99-99" formatChars={null} alwaysShowMask />, (input) => {
        var inputNode = ReactDOM.findDOMNode(input);

        expect(inputNode.value).toEqual('__-__');
    }));
});
