/* global describe, it, afterEach */

import React from "react";
import ReactDOM from "react-dom";
import TestUtils from "react-dom/test-utils";
import { expect } from "chai"; // eslint-disable-line import/no-extraneous-dependencies
import * as deferUtils from "../../src/utils/defer";
import Input from "../../src";
import { getInputSelection } from "../../src/utils/input";
import { isDOMElement } from "../../src/utils/helpers";

document.body.innerHTML = '<div id="container"></div>';
const container = document.getElementById("container");

async function delay(duration) {
  await new Promise(resolve => setTimeout(resolve, duration));
}

async function defer() {
  await new Promise(resolve => deferUtils.defer(resolve));
}

async function setSelection(input, start, length) {
  input.setSelectionRange(start, start + length);
  await defer();
}

async function setCursorPosition(input, start) {
  await setSelection(input, start, 0);
}

async function waitForPendingSelection() {
  await defer();
}

function getInputDOMNode(input) {
  if (!isDOMElement(input)) {
    input = ReactDOM.findDOMNode(input);
  }

  if (input.nodeName !== "INPUT") {
    input = input.querySelector("input");
  }

  if (!input) {
    throw new Error("inputComponent doesn't contain input node");
  }

  return input;
}

function createInput(component) {
  const originalRef = component.ref;
  let { props } = component;
  let input;
  component = React.cloneElement(component, {
    ref: ref => {
      input = ref;

      if (typeof originalRef === "function") {
        originalRef(ref);
      } else if (originalRef !== null && typeof originalRef === "object") {
        originalRef.current = ref;
      }
    }
  });

  function setProps(newProps) {
    props = {
      ...props,
      ...newProps
    };

    ReactDOM.render(React.createElement(Input, props), container);
  }

  ReactDOM.render(component, container);

  return { input, setProps };
}

async function simulateFocus(input) {
  input.focus();
  TestUtils.Simulate.focus(input);
  await defer();
}

async function simulateBlur(input) {
  input.blur();
  TestUtils.Simulate.blur(input);
}

async function simulateInput(input, string) {
  const selection = getInputSelection(input);
  const { value } = input;
  const valueBefore = value.slice(0, selection.start);
  const valueAfter = value.slice(selection.end);

  input.value = valueBefore + string + valueAfter;

  setCursorPosition(input, selection.start + string.length);

  TestUtils.Simulate.change(input);
}

async function simulateInputPaste(input, string) {
  TestUtils.Simulate.paste(input);
  await simulateInput(input, string);
}

async function simulateBackspacePress(input) {
  const selection = getInputSelection(input);
  const { value } = input;

  if (selection.length) {
    input.value = value.slice(0, selection.start) + value.slice(selection.end);
    setSelection(input, selection.start, 0);
  } else if (selection.start) {
    input.value =
      value.slice(0, selection.start - 1) + value.slice(selection.end);
    setSelection(input, selection.start - 1, 0);
  }

  TestUtils.Simulate.change(input);
}

async function simulateDeletePress(input) {
  const selection = getInputSelection(input);
  const removedLength = selection.end - selection.start || 1;
  const { value } = input;
  const valueBefore = value.slice(0, selection.start);
  const valueAfter = value.slice(selection.start + removedLength);

  input.value = valueBefore + valueAfter;

  setCursorPosition(input, selection.start);

  TestUtils.Simulate.change(input);
}

// eslint-disable-next-line react/prefer-stateless-function
class ClassInputComponent extends React.Component {
  render() {
    return (
      <div>
        <input {...this.props} />
      </div>
    );
  }
}

const FunctionalInputComponent = React.forwardRef((props, ref) => {
  return (
    <div ref={ref}>
      <div>
        <input {...props} />
      </div>
    </div>
  );
});

describe("react-input-mask", () => {
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
  });

  it("should format value on mount", async () => {
    const { input } = createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
    );
    expect(input.value).to.equal("+7 (495) 315 64 54");
  });

  it("should format value with invalid characters on mount", async () => {
    const { input } = createInput(
      <Input mask="+7 (9a9) 999 99 99" defaultValue="749531b6454" />
    );
    expect(input.value).to.equal("+7 (4b6) 454 __ __");
  });

  it("should handle array mask", async () => {
    const letter = /[АВЕКМНОРСТУХ]/i;
    const digit = /[0-9]/;
    const mask = [letter, digit, digit, digit, letter, letter];
    const { input } = createInput(
      <Input mask={mask} defaultValue="А 784 КТ 77" />
    );
    expect(input.value).to.equal("А784КТ");

    await simulateFocus(input);
    await simulateBackspacePress(input);
    expect(input.value).to.equal("А784К_");

    await simulateInput(input, "Б");
    expect(getInputSelection(input).start).to.equal(5);
    expect(getInputSelection(input).end).to.equal(5);

    await simulateInput(input, "Х");
    expect(getInputSelection(input).start).to.equal(6);
    expect(getInputSelection(input).end).to.equal(6);
  });

  it("should handle full length maskPlaceholder", async () => {
    const { input } = createInput(
      <Input mask="99/99/9999" maskPlaceholder="dd/mm/yyyy" defaultValue="12" />
    );
    expect(input.value).to.equal("12/mm/yyyy");

    await simulateFocus(input);
    expect(getInputSelection(input).start).to.equal(3);
    expect(getInputSelection(input).end).to.equal(3);

    await simulateBackspacePress(input);
    expect(input.value).to.equal("1d/mm/yyyy");

    await simulateInput(input, "234");
    expect(input.value).to.equal("12/34/yyyy");
    expect(getInputSelection(input).start).to.equal(6);
    expect(getInputSelection(input).end).to.equal(6);

    await setCursorPosition(input, 8);
    await simulateInput(input, "7");
    expect(input.value).to.equal("12/34/yy7y");
  });

  it("should show placeholder on focus", async () => {
    const { input } = createInput(<Input mask="+7 (*a9) 999 99 99" />);
    expect(input.value).to.equal("");

    await simulateFocus(input);
    expect(input.value).to.equal("+7 (___) ___ __ __");
  });

  it("should clear input on blur", async () => {
    const { input } = createInput(<Input mask="+7 (*a9) 999 99 99" />);
    await simulateFocus(input);
    expect(input.value).to.equal("+7 (___) ___ __ __");

    await simulateBlur(input);
    expect(input.value).to.equal("");

    await simulateFocus(input);
    await simulateInput(input, "1");
    expect(input.value).to.equal("+7 (1__) ___ __ __");

    await simulateBlur(input);
    expect(input.value).to.equal("+7 (1__) ___ __ __");
  });

  it("should handle escaped characters in mask", async () => {
    const { input } = createInput(
      <Input mask="+4\9 99 9\99 99" maskPlaceholder={null} />
    );
    await simulateFocus(input);

    input.value = "+49 12 9";
    setSelection(input, 8, 0);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("+49 12 99");

    await setCursorPosition(input, 7);

    await simulateInput(input, "1");
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("+49 12 199 ");
    expect(getInputSelection(input).start).to.equal(9);
    expect(getInputSelection(input).end).to.equal(9);

    await setCursorPosition(input, 8);

    await simulateInput(input, "9");
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("+49 12 199 ");
    expect(getInputSelection(input).start).to.equal(9);
    expect(getInputSelection(input).end).to.equal(9);
  });

  it("should handle alwaysShowMask", async () => {
    const { input, setProps } = createInput(
      <Input mask="+7 (999) 999 99 99" alwaysShowMask />
    );
    expect(input.value).to.equal("+7 (___) ___ __ __");

    await simulateFocus(input);
    expect(input.value).to.equal("+7 (___) ___ __ __");

    await simulateBlur(input);
    expect(input.value).to.equal("+7 (___) ___ __ __");

    setProps({ alwaysShowMask: false });
    expect(input.value).to.equal("");

    setProps({ alwaysShowMask: true });
    expect(input.value).to.equal("+7 (___) ___ __ __");
  });

  it("should adjust cursor position on focus", async () => {
    const { input, setProps } = createInput(
      <Input mask="+7 (999) 999 99 99" value="+7" />
    );
    await simulateFocus(input);

    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);

    await simulateBlur(input);

    setProps({ value: "+7 (___) ___ _1 __" });
    await setCursorPosition(input, 2);
    await simulateFocus(input);
    expect(getInputSelection(input).start).to.equal(16);
    expect(getInputSelection(input).end).to.equal(16);

    await simulateBlur(input);

    setProps({ value: "+7 (___) ___ _1 _1" });
    await setCursorPosition(input, 2);
    await simulateFocus(input);
    expect(getInputSelection(input).start).to.equal(2);
    expect(getInputSelection(input).end).to.equal(2);

    await simulateBlur(input);

    setProps({
      value: "+7 (123)",
      mask: "+7 (999)",
      maskPlaceholder: null
    });
    await setCursorPosition(input, 2);
    await simulateFocus(input);
    expect(getInputSelection(input).start).to.equal(2);
    expect(getInputSelection(input).end).to.equal(2);
  });

  it("should adjust cursor position on focus on input with autoFocus", async () => {
    const { input, setProps } = createInput(
      <Input mask="+7 (999) 999 99 99" value="+7" autoFocus />
    );
    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);

    await simulateBlur(input);

    setProps({ value: "+7 (___) ___ _1 __" });
    await setCursorPosition(input, 2);
    await simulateFocus(input);
    expect(getInputSelection(input).start).to.equal(16);
    expect(getInputSelection(input).end).to.equal(16);

    await simulateBlur(input);

    setProps({ value: "+7 (___) ___ _1 _1" });
    await setCursorPosition(input, 2);
    await simulateFocus(input);
    expect(getInputSelection(input).start).to.equal(2);
    expect(getInputSelection(input).end).to.equal(2);
  });

  it("should handle changes on input with autoFocus", async () => {
    const { input } = createInput(
      <Input mask="+7 (999) 999 99 99" autoFocus />
    );
    await simulateInput(input, "222 222 22 22");

    await defer();
    setSelection(input, 5, 0);
    await delay(100);
    await simulateInput(input, "3");
    expect(input.value).to.equal("+7 (232) 222 22 22");
  });

  it("should format value in onChange (with maskPlaceholder)", async () => {
    const { input } = createInput(<Input mask="**** **** **** ****" />);
    await simulateFocus(input);

    await setCursorPosition(input, 0);
    input.value = `a${input.value}`;
    setCursorPosition(input, 1);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("a___ ____ ____ ____");
    expect(getInputSelection(input).start).to.equal(1);
    expect(getInputSelection(input).end).to.equal(1);

    await setSelection(input, 0, 19);
    input.value = "a";
    setCursorPosition(input, 1);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("a___ ____ ____ ____");
    expect(getInputSelection(input).start).to.equal(1);
    expect(getInputSelection(input).end).to.equal(1);

    input.value = "aaaaa___ ____ ____ ____";
    setSelection(input, 1, 4);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("aaaa a___ ____ ____");
    expect(getInputSelection(input).start).to.equal(6);
    expect(getInputSelection(input).end).to.equal(6);

    await setCursorPosition(input, 4);
    input.value = "aaa a___ ____ ____";
    setCursorPosition(input, 3);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("aaa_ a___ ____ ____");

    await setSelection(input, 3, 3);
    input.value = "aaaaaa___ ____ ____";
    setCursorPosition(input, 6);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("aaaa aa__ ____ ____");

    await setSelection(input, 3, 3);
    input.value = "aaaaxa__ ____ ____";
    setCursorPosition(input, 5);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("aaaa xa__ ____ ____");
    expect(getInputSelection(input).start).to.equal(6);
    expect(getInputSelection(input).end).to.equal(6);
  });

  it("should format value in onChange (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input mask="**** **** **** ****" maskPlaceholder={null} />
    );
    await simulateFocus(input);
    expect(input.value).to.equal("");

    await setCursorPosition(input, 0);
    input.value = "aaa";
    setCursorPosition(input, 3);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("aaa");
    expect(getInputSelection(input).start).to.equal(3);
    expect(getInputSelection(input).end).to.equal(3);

    input.value = "aaaaa";
    setCursorPosition(input, 5);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("aaaa a");
    expect(getInputSelection(input).start).to.equal(6);
    expect(getInputSelection(input).end).to.equal(6);

    input.value = "aaaa afgh ijkl mnop";
    setCursorPosition(input, 19);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("aaaa afgh ijkl mnop");
    expect(getInputSelection(input).start).to.equal(19);
    expect(getInputSelection(input).end).to.equal(19);

    input.value = "aaaa afgh ijkl mnopq";
    setCursorPosition(input, 20);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("aaaa afgh ijkl mnop");
    expect(getInputSelection(input).start).to.equal(19);
    expect(getInputSelection(input).end).to.equal(19);
  });

  it("should handle entered characters (with maskPlaceholder)", async () => {
    const { input } = createInput(<Input mask="+7 (*a9) 999 99 99" />);
    await simulateFocus(input);

    await setCursorPosition(input, 0);
    await simulateInput(input, "+");
    expect(input.value).to.equal("+7 (___) ___ __ __");

    await setCursorPosition(input, 0);
    await simulateInput(input, "7");
    expect(input.value).to.equal("+7 (___) ___ __ __");

    await setCursorPosition(input, 0);
    await simulateInput(input, "8");
    expect(input.value).to.equal("+7 (8__) ___ __ __");

    await setCursorPosition(input, 0);
    await simulateInput(input, "E");
    expect(input.value).to.equal("+7 (E__) ___ __ __");

    await simulateInput(input, "6");
    expect(input.value).to.equal("+7 (E__) ___ __ __");

    await simulateInput(input, "x");
    expect(input.value).to.equal("+7 (Ex_) ___ __ __");
  });

  it("should handle entered characters (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+7 (999) 999 99 99"
        defaultValue="+7 (111) 123 45 6"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setCursorPosition(input, 4);
    await simulateInput(input, "E");
    expect(input.value).to.equal("+7 (111) 123 45 6");

    await setSelection(input, 4, 3);
    await simulateInput(input, "0");
    expect(input.value).to.equal("+7 (012) 345 6");

    await setCursorPosition(input, 14);
    await simulateInput(input, "7");
    await simulateInput(input, "8");
    await simulateInput(input, "9");
    await simulateInput(input, "4");
    expect(input.value).to.equal("+7 (012) 345 67 89");

    input.value = "+7 (";
    setCursorPosition(input, 4);
    TestUtils.Simulate.change(input);
    await setCursorPosition(input, 0);
    await simulateInput(input, "+");
    expect(input.value).to.equal("+7 (");
  });

  it("should adjust cursor position on input (with maskPlaceholder)", async () => {
    const { input } = createInput(<Input mask="(999)" defaultValue="11" />);
    await simulateFocus(input);

    await setCursorPosition(input, 3);
    await simulateInput(input, "x");
    expect(getInputSelection(input).start).to.equal(3);
    expect(getInputSelection(input).end).to.equal(3);

    await simulateInput(input, "1");
    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);

    await setSelection(input, 0, 4);
    await simulateBackspacePress(input);
    await setCursorPosition(input, 2);
    await simulateInput(input, "x");
    expect(getInputSelection(input).start).to.equal(2);
    expect(getInputSelection(input).end).to.equal(2);
  });

  it("should handle single character removal with Backspace (with maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
    );
    await simulateFocus(input);

    await setCursorPosition(input, 10);
    await simulateBackspacePress(input);
    expect(input.value).to.equal("+7 (495) _15 64 54");

    await simulateBackspacePress(input);
    expect(input.value).to.equal("+7 (49_) _15 64 54");
  });

  it("should handle single character removal with Backspace (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+7 (999) 999 99 99"
        defaultValue="74953156454"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setCursorPosition(input, 10);
    await simulateBackspacePress(input);
    expect(input.value).to.equal("+7 (495) 156 45 4");

    await setCursorPosition(input, 17);

    input.value = "+7 (";
    setCursorPosition(input, 4);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("+7 (");

    input.value = "+7 ";
    setCursorPosition(input, 3);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("+7 (");
  });

  it("should adjust cursor position on single character removal with Backspace (with maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
    );
    await simulateFocus(input);

    await setCursorPosition(input, 10);
    await simulateBackspacePress(input);
    expect(getInputSelection(input).start).to.equal(9);
    expect(getInputSelection(input).end).to.equal(9);

    await simulateBackspacePress(input);
    expect(getInputSelection(input).start).to.equal(6);
    expect(getInputSelection(input).end).to.equal(6);

    await setCursorPosition(input, 4);
    await simulateBackspacePress(input);
    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);
  });

  it("should adjust cursor position on single character removal with Backspace (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+7 (999) 999 99 99"
        defaultValue="749531564"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setCursorPosition(input, 16);
    await simulateBackspacePress(input);
    expect(getInputSelection(input).start).to.equal(14);
    expect(getInputSelection(input).end).to.equal(14);
  });

  it("should handle multiple characters removal with Backspace (with maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
    );
    await simulateFocus(input);

    await setSelection(input, 1, 9);
    await simulateBackspacePress(input);
    expect(input.value).to.equal("+7 (___) _15 64 54");
  });

  it("should handle multiple characters removal with Backspace (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+7 (999) 999 99 99"
        defaultValue="74953156454"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setSelection(input, 1, 9);
    await simulateBackspacePress(input);
    expect(input.value).to.equal("+7 (156) 454 ");
  });

  it("should adjust cursor position on multiple characters removal with Backspace (with maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
    );
    await simulateFocus(input);

    await setSelection(input, 1, 9);
    await simulateBackspacePress(input);
    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);
  });

  it("should handle single character removal with Backspace on mask with escaped characters (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setCursorPosition(input, 10);
    await simulateBackspacePress(input);
    expect(input.value).to.equal("+49 12 39");

    await setCursorPosition(input, 9);
    await simulateBackspacePress(input);
    expect(input.value).to.equal("+49 12 ");

    await simulateFocus(input);
    input.value = "+49 12 39";
    TestUtils.Simulate.change(input);
    await setCursorPosition(input, 6);
    await simulateBackspacePress(input);
    expect(input.value).to.equal("+49 13 ");
  });

  it("should adjust cursor position on single character removal with Backspace on mask with escaped characters (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setCursorPosition(input, 10);
    await simulateBackspacePress(input);
    expect(getInputSelection(input).start).to.equal(9);
    expect(getInputSelection(input).end).to.equal(9);

    await setCursorPosition(input, 9);
    await simulateBackspacePress(input);
    expect(getInputSelection(input).start).to.equal(7);
    expect(getInputSelection(input).end).to.equal(7);

    await simulateFocus(input);
    input.value = "+49 12 39";
    TestUtils.Simulate.change(input);
    await setCursorPosition(input, 6);
    await simulateBackspacePress(input);
    expect(getInputSelection(input).start).to.equal(5);
    expect(getInputSelection(input).end).to.equal(5);
  });

  it("should handle multiple characters removal with Backspace on mask with escaped characters (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setSelection(input, 4, 2);
    await simulateBackspacePress(input);
    expect(input.value).to.equal("+49 34 ");

    await setSelection(input, 0, 7);
    input.value = "+49 12 394 5";
    TestUtils.Simulate.change(input);
    await setSelection(input, 4, 2);
    await simulateBackspacePress(input);
    expect(input.value).to.equal("+49 34 59");
  });

  it("should adjust cursor position on multiple characters removal with Backspace on mask with escaped characters (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setSelection(input, 4, 2);
    await simulateBackspacePress(input);
    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);

    input.value = "+49 12 394 5";
    TestUtils.Simulate.change(input);
    await setSelection(input, 4, 2);
    await simulateBackspacePress(input);
    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);
  });

  it("should handle single character removal with Delete (with maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
    );
    await simulateFocus(input);

    await setCursorPosition(input, 0);
    await simulateDeletePress(input);
    expect(input.value).to.equal("+7 (_95) 315 64 54");

    await setCursorPosition(input, 7);
    await simulateDeletePress(input);
    expect(input.value).to.equal("+7 (_95) _15 64 54");

    await setCursorPosition(input, 11);
    await simulateDeletePress(input);
    expect(input.value).to.equal("+7 (_95) _1_ 64 54");
  });

  it("should adjust cursor position on single character removal with Delete (with maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
    );
    await simulateFocus(input);

    await setCursorPosition(input, 0);
    await simulateDeletePress(input);
    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);

    await setCursorPosition(input, 7);
    await simulateDeletePress(input);
    expect(getInputSelection(input).start).to.equal(9);
    expect(getInputSelection(input).end).to.equal(9);

    await setCursorPosition(input, 11);
    await simulateDeletePress(input);
    expect(getInputSelection(input).start).to.equal(11);
    expect(getInputSelection(input).end).to.equal(11);
  });

  it("should handle multiple characters removal with Delete (with maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />
    );
    await simulateFocus(input);

    await setSelection(input, 1, 9);
    await simulateDeletePress(input);
    expect(input.value).to.equal("+7 (___) _15 64 54");
  });

  it("should handle single character removal with Delete on mask with escaped characters (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setCursorPosition(input, 9);
    await simulateDeletePress(input);
    expect(input.value).to.equal("+49 12 39");

    await setCursorPosition(input, 7);
    await simulateDeletePress(input);
    expect(input.value).to.equal("+49 12 ");

    await simulateFocus(input);
    input.value = "+49 12 39";
    TestUtils.Simulate.change(input);
    await setCursorPosition(input, 5);
    await simulateDeletePress(input);
    expect(input.value).to.equal("+49 13 ");
  });

  it("should adjust cursor position on single character removal with Delete on mask with escaped characters (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setCursorPosition(input, 9);
    await simulateDeletePress(input);
    expect(getInputSelection(input).start).to.equal(9);
    expect(getInputSelection(input).end).to.equal(9);

    await setCursorPosition(input, 7);
    await simulateDeletePress(input);
    expect(getInputSelection(input).start).to.equal(7);
    expect(getInputSelection(input).end).to.equal(7);

    await simulateFocus(input);
    input.value = "+49 12 39";
    TestUtils.Simulate.change(input);
    await setCursorPosition(input, 5);
    await simulateDeletePress(input);
    expect(getInputSelection(input).start).to.equal(5);
    expect(getInputSelection(input).end).to.equal(5);
  });

  it("should handle multiple characters removal with Delete on mask with escaped characters (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setSelection(input, 4, 2);
    await simulateDeletePress(input);
    expect(input.value).to.equal("+49 34 ");

    await setSelection(input, 0, 7);
    input.value = "+49 12 394 5";
    TestUtils.Simulate.change(input);
    await setSelection(input, 4, 2);
    await simulateDeletePress(input);
    expect(input.value).to.equal("+49 34 59");
  });

  it("should adjust cursor position on multiple characters removal with Delete on mask with escaped characters (without maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setSelection(input, 4, 2);
    await simulateDeletePress(input);
    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);

    input.value = "+49 12 394 5";
    TestUtils.Simulate.change(input);
    await setSelection(input, 4, 2);
    await simulateDeletePress(input);
    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);
  });

  it("should handle mask change", async () => {
    const { input, setProps } = createInput(
      <Input mask="9999-9999-9999-9999" defaultValue="34781226917" />
    );
    setProps({ mask: "9999-999999-99999" });
    expect(input.value).to.equal("3478-122691-7____");

    setProps({ mask: "9-9-9-9" });
    expect(input.value).to.equal("3-4-7-8");

    setProps({ mask: null });
    expect(input.value).to.equal("3-4-7-8");

    input.value = "0-1-2-3";

    setProps({ mask: "9999" });
    expect(input.value).to.equal("0123");
  });

  it("should handle mask change with on controlled input", async () => {
    const { input, setProps } = createInput(
      <Input mask="9999-9999-9999-9999" value="38781226917" />
    );
    setProps({
      onChange: () => {
        setProps({
          mask: "9999-999999-99999",
          value: "3478-1226-917_-____"
        });
      }
    });

    await simulateFocus(input);

    expect(input.value).to.equal("3878-1226-917_-____");

    await setCursorPosition(input, 1);
    await simulateInput(input, "4");
    TestUtils.Simulate.change(input);

    expect(input.value).to.equal("3478-122691-7____");
  });

  it("should handle string paste (with maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input mask="9999-9999-9999-9999" defaultValue="____-____-____-6543" />
    );
    await simulateFocus(input);

    await setSelection(input, 3, 15);
    simulateInputPaste(input, "34781226917");
    expect(input.value).to.equal("___3-4781-2269-17_3");

    await setCursorPosition(input, 3);
    simulateInputPaste(input, "3-__81-2_6917");
    expect(input.value).to.equal("___3-__81-2_69-17_3");

    await setSelection(input, 0, 3);
    simulateInputPaste(input, " 333");
    expect(input.value).to.equal("3333-__81-2_69-17_3");
  });

  it("should adjust cursor position on string paste (with maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input mask="9999-9999-9999-9999" defaultValue="____-____-____-6543" />
    );
    await simulateFocus(input);

    await setSelection(input, 3, 15);
    simulateInputPaste(input, "478122691");
    expect(getInputSelection(input).start).to.equal(15);
    expect(getInputSelection(input).end).to.equal(15);

    await setCursorPosition(input, 3);
    simulateInputPaste(input, "3-__81-2_6917");
    expect(getInputSelection(input).start).to.equal(17);
    expect(getInputSelection(input).end).to.equal(17);
  });

  it("should handle string paste (without maskPlaceholder)", async () => {
    const { input, setProps } = createInput(
      <Input
        mask="9999-9999-9999-9999"
        defaultValue="9999-9999-9999-9999"
        maskPlaceholder={null}
      />
    );
    await simulateFocus(input);

    await setSelection(input, 0, 19);
    simulateInputPaste(input, "34781226917");
    expect(input.value).to.equal("3478-1226-917");

    await setCursorPosition(input, 1);
    simulateInputPaste(input, "12345");
    expect(input.value).to.equal("3123-4547-8122-6917");

    await setCursorPosition(input, 1);
    simulateInputPaste(input, "4321");
    expect(input.value).to.equal("3432-1547-8122-6917");

    setProps({
      value: "",
      onChange: event => {
        setProps({
          value: event.target.value
        });
      }
    });

    await waitForPendingSelection();

    simulateInputPaste(input, "123");
    expect(input.value).to.equal("123");
  });

  it("should handle string paste at position of permanent character (with maskPlaceholder)", async () => {
    const { input } = createInput(
      <Input mask="9999-9999-9999" maskPlaceholder=" " />
    );
    await simulateFocus(input);

    simulateInputPaste(input, "1111 1111 1111");
    expect(input.value).to.equal("1111-1111-1111");
  });

  it("should keep placeholder on rerender on empty input with alwaysShowMask", async () => {
    const { input, setProps } = createInput(
      <Input mask="99-99" value="" alwaysShowMask />
    );
    setProps({ value: "" });

    expect(input.value).to.equal("__-__");
  });

  it("should show empty value when input switches from uncontrolled to controlled", async () => {
    const { input, setProps } = createInput(
      <Input mask="+7 (*a9) 999 99 99" />
    );
    setProps({ value: "+7 (___) ___ __ __" });
    expect(input.value).to.equal("+7 (___) ___ __ __");
  });

  it("shouldn't affect value if mask is empty", async () => {
    const { input, setProps } = createInput(<Input value="12345" />);
    expect(input.value).to.equal("12345");

    setProps({
      value: "54321"
    });
    expect(input.value).to.equal("54321");
  });

  it("should show next permanent character when maskPlaceholder is null", async () => {
    const { input } = createInput(
      <Input mask="99/99/9999" value="01" maskPlaceholder={null} />
    );
    expect(input.value).to.equal("01/");
  });

  it("should show all next consecutive permanent characters when maskPlaceholder is null", async () => {
    const { input } = createInput(
      <Input mask="99---99" value="01" maskPlaceholder={null} />
    );
    expect(input.value).to.equal("01---");
  });

  it("should show trailing permanent character when maskPlaceholder is null", async () => {
    const { input } = createInput(
      <Input mask="99%" value="10" maskPlaceholder={null} />
    );
    expect(input.value).to.equal("10%");
  });

  it("should pass input DOM node to ref", async () => {
    let inputRef;
    const { input } = createInput(
      <Input
        ref={ref => {
          inputRef = ref;
        }}
      />
    );
    expect(inputRef).to.equal(input);
  });

  it("should allow to modify value with beforeMaskedStateChange", async () => {
    function beforeMaskedStateChange({ nextState }) {
      const placeholder = "DD/MM/YYYY";
      const maskPlaceholder = "_";
      const value = nextState.value
        .split("")
        .map((char, i) => {
          if (char === maskPlaceholder) {
            return placeholder[i];
          }
          return char;
        })
        .join("");

      return {
        ...nextState,
        value
      };
    }

    const { input, setProps } = createInput(
      <Input
        mask="99/99/9999"
        value=""
        beforeMaskedStateChange={beforeMaskedStateChange}
      />
    );
    expect(input.value).to.equal("");

    setProps({
      onChange: event => {
        setProps({
          value: event.target.value
        });
      }
    });

    await simulateFocus(input);

    expect(input.value).to.equal("DD/MM/YYYY");

    setProps({ value: "12345" });
    expect(input.value).to.equal("12/34/5YYY");

    await setCursorPosition(input, 7);

    await simulateInput(input, "6");
    expect(input.value).to.equal("12/34/56YY");

    setProps({ value: null });
    expect(input.value).to.equal("12/34/56YY");
  });

  it("shouldn't modify value on entering non-allowed character", async () => {
    const { input } = createInput(<Input mask="9999" defaultValue="1234" />);
    await simulateFocus(input);

    await setCursorPosition(input, 0);
    await simulateInput(input, "a");

    expect(input.value).to.equal("1234");
    expect(getInputSelection(input).start).to.equal(0);
    expect(getInputSelection(input).end).to.equal(0);

    await setSelection(input, 0, 1);
    await simulateInput(input, "a");

    expect(input.value).to.equal("1234");

    await setSelection(input, 1, 3);
    await simulateInput(input, "a");

    expect(input.value).to.equal("1234");
  });

  it("should handle autofill with no maskPlaceholder", async () => {
    const { input } = createInput(
      <Input mask="9999-9999" defaultValue="123" maskPlaceholder={null} />
    );
    await simulateFocus(input);
    setCursorPosition(input, 3);
    TestUtils.Simulate.change(input);

    input.value = "12345678";
    setCursorPosition(input, 8);
    TestUtils.Simulate.change(input);

    expect(input.value).to.equal("1234-5678");
  });

  it("should handle autofill with default maskPlaceholder", async () => {
    const { input } = createInput(
      <Input mask="9999-9999" defaultValue="123" />
    );
    await simulateFocus(input);
    setCursorPosition(input, 9);
    TestUtils.Simulate.change(input);

    input.value = "12345678";
    setCursorPosition(input, 8);
    TestUtils.Simulate.change(input);

    expect(input.value).to.equal("1234-5678");
  });

  it("should handle autofill with full length maskPlaceholder", async () => {
    const { input } = createInput(
      <Input mask="9999-9999" defaultValue="123" maskPlaceholder="####-####" />
    );
    await simulateFocus(input);
    setCursorPosition(input, 9);
    TestUtils.Simulate.change(input);

    input.value = "12345678";
    setCursorPosition(input, 8);
    TestUtils.Simulate.change(input);

    expect(input.value).to.equal("1234-5678");
  });

  it("should handle autofill a fully masked value", async () => {
    // This handles a case where chrome will autofill this field then move to another auto fill field and then come back
    // and fill this field again.
    const { input } = createInput(
      <Input mask="9999-9999" defaultValue="____-____" />
    );
    await simulateFocus(input);
    setCursorPosition(input, 9);
    TestUtils.Simulate.change(input);

    input.value = "12345678";
    setCursorPosition(input, 8);
    TestUtils.Simulate.change(input);

    expect(input.value).to.equal("1234-5678");
  });

  it("should handle autofill an existing value", async () => {
    // This handles a case where chrome will autofill this field then move to another auto fill field and then come back
    // and fill this field again.
    const { input } = createInput(
      <Input mask="9999-9999" defaultValue="1234-5678" />
    );
    await simulateFocus(input);

    input.value = "12345678";
    setCursorPosition(input, 8);
    TestUtils.Simulate.change(input);

    expect(input.value).to.equal("1234-5678");
  });

  it("should handle autofill when there is a prefix and no mask placeholder", async () => {
    const { input } = createInput(
      <Input mask="(9999-9999)" defaultValue="(" maskPlaceholder={null} />
    );
    await simulateFocus(input);

    setCursorPosition(input, 1);
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("(");

    input.value = "12345678";
    setCursorPosition(input, 8);
    TestUtils.Simulate.change(input);

    expect(input.value).to.equal("(1234-5678)");
  });

  it("should handle transition between masked and non-masked state", async () => {
    const { input, setProps } = createInput(<Input />);
    setProps({
      value: "",
      onChange: event => {
        setProps({
          value: event.target.value,
          mask: event.target.value ? "+7 999 999 99 99" : null
        });
      }
    });

    await simulateFocus(input);

    expect(getInputSelection(input).start).to.equal(0);
    expect(getInputSelection(input).end).to.equal(0);

    await simulateInput(input, "1");
    expect(input.value).to.equal("+7 1__ ___ __ __");
    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);

    await simulateBackspacePress(input);
    await simulateBlur(input);

    expect(input.value).to.equal("");

    await simulateFocus(input);

    expect(getInputSelection(input).start).to.equal(0);
    expect(getInputSelection(input).end).to.equal(0);

    await simulateInput(input, "1");
    expect(input.value).to.equal("+7 1__ ___ __ __");
    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);
  });

  it("should handle regular component as children", async () => {
    let { input } = createInput(
      <Input mask="+7 (999) 999 99 99">
        <ClassInputComponent />
      </Input>
    );
    input = getInputDOMNode(input);

    await simulateFocus(input);

    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);

    await simulateInput(input, "1");
    expect(input.value).to.equal("+7 (1__) ___ __ __");
    expect(getInputSelection(input).start).to.equal(5);
    expect(getInputSelection(input).end).to.equal(5);
  });

  it("should handle functional component as children", async () => {
    let { input } = createInput(
      <Input mask="+7 (999) 999 99 99">
        <FunctionalInputComponent />
      </Input>
    );
    input = getInputDOMNode(input);

    await simulateFocus(input);

    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);

    await simulateInput(input, "1");
    expect(input.value).to.equal("+7 (1__) ___ __ __");
    expect(getInputSelection(input).start).to.equal(5);
    expect(getInputSelection(input).end).to.equal(5);
  });

  it("should handle children change", async () => {
    let { input, setProps } = createInput(<Input mask="+7 (999) 999 99 99" />);
    function handleRef(ref) {
      input = ref;
    }

    setProps({
      value: "",
      mask: "+7 (999) 999 99 99",
      onChange: event => {
        setProps({
          value: event.target.value
        });
      },
      children: <ClassInputComponent ref={handleRef} />
    });

    input = getInputDOMNode(input);

    await simulateFocus(input);

    expect(getInputSelection(input).start).to.equal(4);
    expect(getInputSelection(input).end).to.equal(4);

    await simulateInput(input, "1");
    expect(input.value).to.equal("+7 (1__) ___ __ __");
    expect(getInputSelection(input).start).to.equal(5);
    expect(getInputSelection(input).end).to.equal(5);

    setProps({
      value: "22",
      mask: "+7 (999) 999 99 99",
      onChange: event => {
        setProps({
          value: event.target.value
        });
      },
      children: <FunctionalInputComponent ref={handleRef} />
    });
    input = getInputDOMNode(input);

    expect(input.value).to.equal("+7 (22_) ___ __ __");

    setProps({
      value: "22",
      mask: "+7 (999) 999 99 99",
      onChange: event => {
        setProps({
          value: event.target.value
        });
      },
      children: null,
      ref: handleRef
    });
    input = getInputDOMNode(input);

    expect(input.value).to.equal("+7 (22_) ___ __ __");
  });

  it("should handle change event without focus", async () => {
    const { input } = createInput(
      <Input mask="+7 (999) 999 99 99" maskPlaceholder={null} />
    );
    input.value = "+71234567890";
    TestUtils.Simulate.change(input);
    expect(input.value).to.equal("+7 (123) 456 78 90");
  });

  it("shouldn't move cursor on delayed value change", async () => {
    const { input, setProps } = createInput(
      <Input mask="+7 (999) 999 99 99" maskPlaceholder={null} />
    );
    setProps({
      value: "+7 (9",
      onChange: event => {
        setProps({
          value: event.target.value
        });
      }
    });

    await simulateFocus(input);

    expect(getInputSelection(input).start).to.equal(5);
    expect(getInputSelection(input).end).to.equal(5);

    await delay(100);
    setProps({
      value: "+7 (99"
    });

    expect(getInputSelection(input).start).to.equal(5);
    expect(getInputSelection(input).end).to.equal(5);
  });
});
