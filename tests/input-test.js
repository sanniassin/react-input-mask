jest.dontMock('../build/InputElement');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const Input = require('../build/InputElement');

var selectionStart = 0;
var selectionEnd = 0;
var selectionMethods = {
    getCaretPos: () => selectionStart,
    setCaretPos: (pos) => {
        selectionStart = selectionEnd = pos;
    },
    getSelection: () => ({
        start: selectionStart,
        end: selectionEnd,
        length: selectionEnd - selectionStart
    }),
    setSelection: (start, len) => {
        selectionStart = start;
        selectionEnd = start + len;
    }
};

describe('Input', () => {
    it('Init format', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        expect('+7 (495) 315 64 54').toEqual(inputNode.value);
    });

    it('Format unacceptable string', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (9a9) 999 99 99" defaultValue="749531b6454" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        expect('+7 (4b6) 454 __ __').toEqual(inputNode.value);
    });

    it('Focus/blur', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (*a9) 999 99 99" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        expect('').toEqual(inputNode.value);

        input.onFocus({
            target: inputNode
        });
        expect('+7 (___) ___ __ __').toEqual(inputNode.value);

        input.onBlur({
            target: inputNode
        });
        expect('').toEqual(inputNode.value);

        input.setProps({ value: '+7 (___) ___ __ __' });
        expect('').toEqual(inputNode.value);

        input.setProps({ value: '+7 (1__) ___ __ __' });
        expect('+7 (1__) ___ __ __').toEqual(inputNode.value);
    });

    it('alwaysShowMask', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" alwaysShowMask />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        expect('+7 (___) ___ __ __').toEqual(inputNode.value);

        input.onFocus({
            target: inputNode
        });
        expect('+7 (___) ___ __ __').toEqual(inputNode.value);

        input.onBlur({
            target: inputNode
        });
        expect('+7 (___) ___ __ __').toEqual(inputNode.value);

        input.setProps({ alwaysShowMask: false });
        expect('').toEqual(inputNode.value);

        input.setProps({ alwaysShowMask: true });
        expect('+7 (___) ___ __ __').toEqual(inputNode.value);
    });

    it('Focus cursor position', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setCaretPos(2);
        input.onFocus({
            target: inputNode
        });
        expect(input.getCaretPos()).toEqual(4);

        input.onBlur({
            target: inputNode
        });

        input.setProps({ value: '+7 (___) ___ _1 __' });
        input.setCaretPos(2);
        input.onFocus({
            target: inputNode
        });
        expect(input.getCaretPos()).toEqual(16);

        input.onBlur({
            target: inputNode
        });

        input.setProps({ value: '+7 (___) ___ _1 _1' });
        input.setCaretPos(2);
        input.onFocus({
            target: inputNode
        });
        expect(input.getCaretPos()).toEqual(2);
    });

    it('Characters input', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (*a9) 999 99 99" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);
        input.onFocus({
            target: inputNode
        });

        input.setCaretPos(0);
        TestUtils.Simulate.keyPress(inputNode, { key: 'E' });
        expect('+7 (E__) ___ __ __').toEqual(inputNode.value);

        TestUtils.Simulate.keyPress(inputNode, { key: '6' });
        expect('+7 (E__) ___ __ __').toEqual(inputNode.value);

        TestUtils.Simulate.keyPress(inputNode, { key: 'x' });
        expect('+7 (Ex_) ___ __ __').toEqual(inputNode.value);
    });

    it('Characters input without maskChar', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" defaultValue={"+7 (111) 123 45 6"} maskChar={null} />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setCaretPos(4);
        TestUtils.Simulate.keyPress(inputNode, { key: 'E' });
        expect('+7 (111) 123 45 6').toEqual(inputNode.value);

        TestUtils.Simulate.keyPress(inputNode, { key: '6' });
        expect('+7 (611) 112 34 56').toEqual(inputNode.value);
    });

    it('Backspace single character', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setCaretPos(10);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect('+7 (495) _15 64 54').toEqual(inputNode.value);
        
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect('+7 (49_) _15 64 54').toEqual(inputNode.value);
    });

    it('Backspace single character without maskChar', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" maskChar={null} />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setCaretPos(10);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect('+7 (495) 156 45 4').toEqual(inputNode.value);
    });

    it('Backspace single character cursor position', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setCaretPos(10);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(9).toEqual(input.getCaretPos());

        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(6).toEqual(input.getCaretPos());

        input.setCaretPos(4);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(4).toEqual(input.getCaretPos());
    });

    it('Backspace range', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setSelection(1, 9);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect('+7 (___) _15 64 54').toEqual(inputNode.value);
    });

    it('Backspace range cursor position', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setSelection(1, 9);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Backspace' });
        expect(1).toEqual(input.getCaretPos());
    });

    it('Delete single character', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setCaretPos(0);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect('+7 (495) 315 64 54').toEqual(inputNode.value);

        input.setCaretPos(7);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect('+7 (495) _15 64 54').toEqual(inputNode.value);

        input.setCaretPos(11);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect('+7 (495) _1_ 64 54').toEqual(inputNode.value);
    });

    it('Delete single character cursor position', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setCaretPos(0);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect(4).toEqual(input.getCaretPos());

        input.setCaretPos(7);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect(9).toEqual(input.getCaretPos());

        input.setCaretPos(11);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect(11).toEqual(input.getCaretPos());
    });

    it('Delete range', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setSelection(1, 9);
        TestUtils.Simulate.keyDown(inputNode, { key: 'Delete' });
        expect('+7 (___) _15 64 54').toEqual(inputNode.value);
    });

    it('Mask change', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="9999-9999-9999-9999" defaultValue="34781226917" />
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setProps({ mask: "9999-999999-99999" });
        expect('3478-122691-7____').toEqual(inputNode.value);

        input.setProps({ mask: "9-9-9-9" });
        expect('3-4-7-8').toEqual(inputNode.value);

        input.setProps({ mask: null });
        expect('34781226917').toEqual(inputNode.value);
    });

    it('Paste string', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="9999-9999-9999-9999" defaultValue="____-____-____-6543"/>
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setSelection(3, 15);
        input.pasteText(inputNode.value, '34781226917', input.getSelection());
        expect('___3-4781-2269-17_3').toEqual(inputNode.value);

        input.setCaretPos(3);
        input.pasteText(inputNode.value, '3-__81-2_6917', input.getSelection());
        expect('___3-__81-2_69-17_3').toEqual(inputNode.value);
    });

    it('Paste string without maskChar', () => {
        var input = TestUtils.renderIntoDocument(
            <Input mask="9999-9999-9999-9999" defaultValue="9999-9999-9999-9999" maskChar={null}/>
        );
        input = Object.assign(input, selectionMethods);
        var inputNode = ReactDOM.findDOMNode(input);

        input.setSelection(0, 19);
        input.pasteText(inputNode.value, '34781226917', input.getSelection());
        expect('3478-1226-917').toEqual(inputNode.value);

        input.setCaretPos(1);
        input.pasteText(inputNode.value, '12345', input.getSelection());
        expect('3123-4547-8122-6917').toEqual(inputNode.value);

        input.setCaretPos(1);
        input.pasteText(inputNode.value, '4321', input.getSelection());
        expect('3432-1547-8122-6917').toEqual(inputNode.value);
    });
});
