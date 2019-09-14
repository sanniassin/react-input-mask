/* global describe, it */

import React from "react";
import ReactDOM from "react-dom";
import TestUtils from "react-dom/test-utils";
import { expect } from "chai"; // eslint-disable-line import/no-extraneous-dependencies
import { defer } from "../../src/utils/defer";
import Input from "../../src/index3";
import { getInputSelection } from "../../src/utils/input";
import { isDOMElement } from "../../src/utils/helpers";

document.body.innerHTML = '<div id="container"></div>';
const container = document.getElementById("container");

function setInputSelection(input, start, length) {
  input.setSelectionRange(start, start + length);
  return new Promise(resolve => defer(resolve));
}

async function setInputCursorPosition(input, start) {
  await setInputSelection(input, start, 0);
}

async function waitForPendingSelection() {
  return new Promise(resolve => defer(resolve));
}

const getInputDOMNode = input => {
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
};

const createInput = (component, cb) => {
  return () => {
    const originalRef = component.ref;
    let { props } = component;

    ReactDOM.unmountComponentAtNode(container);

    let input;
    component = React.cloneElement(component, {
      ref: ref => {
        input = ref;
        if (input) {
          input.REACT_INPUT_MASK_TEST_PROPS = component.props;
        }

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

    return new Promise((resolve, reject) => {
      ReactDOM.render(component, container, () => {
        // IE can fail if executed synchronously
        setImmediate(() => {
          const inputNode = getInputDOMNode(input);
          Promise.resolve(cb(input, inputNode, setProps))
            .then(() => {
              ReactDOM.unmountComponentAtNode(container);
              resolve();
            })
            .catch(err => {
              ReactDOM.unmountComponentAtNode(container);
              reject(err);
            });
        });
      });
    });
  };
};

const insertStringIntoInput = (input, str) => {
  const inputNode = getInputDOMNode(input);
  const selection = getInputSelection(inputNode);
  const { value } = inputNode;

  inputNode.value =
    value.slice(0, selection.start) + str + value.slice(selection.end);

  setInputSelection(inputNode, selection.start + str.length, 0);

  TestUtils.Simulate.change(inputNode);
};

const simulateInputKeyPress = insertStringIntoInput;

const simulateInputPaste = (input, str) => {
  const inputNode = getInputDOMNode(input);

  TestUtils.Simulate.paste(inputNode);

  insertStringIntoInput(input, str);
};

const simulateInputBackspacePress = input => {
  const inputNode = getInputDOMNode(input);
  const selection = getInputSelection(inputNode);
  const { value } = inputNode;

  if (selection.length) {
    inputNode.value =
      value.slice(0, selection.start) + value.slice(selection.end);
    setInputSelection(inputNode, selection.start, 0);
  } else if (selection.start) {
    inputNode.value =
      value.slice(0, selection.start - 1) + value.slice(selection.end);
    setInputSelection(inputNode, selection.start - 1, 0);
  }

  TestUtils.Simulate.change(inputNode);
};

const simulateInputDeletePress = input => {
  const inputNode = getInputDOMNode(input);
  const selection = getInputSelection(inputNode);
  let { value } = inputNode;

  if (selection.length) {
    value = value.slice(0, selection.start) + value.slice(selection.end);
  } else if (selection.start < value.length) {
    value = value.slice(0, selection.start) + value.slice(selection.end + 1);
  }
  inputNode.value = value;

  setInputSelection(inputNode, selection.start, 0);

  TestUtils.Simulate.change(inputNode);
};

// eslint-disable-next-line react/prefer-stateless-function
class TestInputComponent extends React.Component {
  render() {
    return (
      <div>
        <input {...this.props} />
      </div>
    );
  }
}

const TestFunctionalInputComponent = React.forwardRef((props, ref) => {
  return (
    <div ref={ref}>
      <div>
        <input {...props} />
      </div>
    </div>
  );
});

describe("react-input-mask", () => {
  it(
    "should format value on mount",
    createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />,
      async (input, inputNode) => {
        expect(inputNode.value).to.equal("+7 (495) 315 64 54");
      }
    )
  );

  it(
    "should format value with invalid characters on mount",
    createInput(
      <Input mask="+7 (9a9) 999 99 99" defaultValue="749531b6454" />,
      async (input, inputNode) => {
        expect(inputNode.value).to.equal("+7 (4b6) 454 __ __");
      }
    )
  );

  it(
    "should show placeholder on focus",
    createInput(
      <Input mask="+7 (*a9) 999 99 99" />,
      async (input, inputNode) => {
        expect(inputNode.value).to.equal("");

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        expect(inputNode.value).to.equal("+7 (___) ___ __ __");
      }
    )
  );

  it(
    "should clear input on blur",
    createInput(
      <Input mask="+7 (*a9) 999 99 99" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        expect(inputNode.value).to.equal("+7 (___) ___ __ __");

        inputNode.blur();
        TestUtils.Simulate.blur(inputNode);
        expect(inputNode.value).to.equal("");

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        simulateInputKeyPress(input, "1");
        expect(inputNode.value).to.equal("+7 (1__) ___ __ __");

        inputNode.blur();
        TestUtils.Simulate.blur(inputNode);
        expect(inputNode.value).to.equal("+7 (1__) ___ __ __");
      }
    )
  );

  it(
    "should handle escaped characters in mask",
    createInput(
      <Input mask="+4\9 99 9\99 99" maskChar={null} />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        inputNode.value = "+49 12 3";
        setInputSelection(inputNode, 8, 0);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("+49 12 39");
      }
    )
  );

  it(
    "should handle alwaysShowMask",
    createInput(
      <Input mask="+7 (999) 999 99 99" alwaysShowMask />,
      async (input, inputNode, setProps) => {
        expect(inputNode.value).to.equal("+7 (___) ___ __ __");

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        expect(inputNode.value).to.equal("+7 (___) ___ __ __");

        inputNode.blur();
        TestUtils.Simulate.blur(inputNode);
        expect(inputNode.value).to.equal("+7 (___) ___ __ __");

        setProps({ alwaysShowMask: false });
        expect(inputNode.value).to.equal("");

        setProps({ alwaysShowMask: true });
        expect(inputNode.value).to.equal("+7 (___) ___ __ __");
      }
    )
  );

  it(
    "should adjust cursor position on focus",
    createInput(
      <Input mask="+7 (999) 999 99 99" value="+7" />,
      async (input, inputNode, setProps) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);

        inputNode.blur();
        TestUtils.Simulate.blur(inputNode);

        setProps({ value: "+7 (___) ___ _1 __" });
        await setInputCursorPosition(inputNode, 2);
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        expect(getInputSelection(inputNode).start).to.equal(16);
        expect(getInputSelection(inputNode).end).to.equal(16);

        inputNode.blur();
        TestUtils.Simulate.blur(inputNode);

        setProps({ value: "+7 (___) ___ _1 _1" });
        await setInputCursorPosition(inputNode, 2);
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        expect(getInputSelection(inputNode).start).to.equal(2);
        expect(getInputSelection(inputNode).end).to.equal(2);
      }
    )
  );

  it(
    "should adjust cursor position on focus on input with autoFocus",
    createInput(
      <Input mask="+7 (999) 999 99 99" value="+7" autoFocus />,
      async (input, inputNode, setProps) => {
        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);

        inputNode.blur();
        TestUtils.Simulate.blur(inputNode);

        setProps({ value: "+7 (___) ___ _1 __" });
        await setInputCursorPosition(inputNode, 2);
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        expect(getInputSelection(inputNode).start).to.equal(16);
        expect(getInputSelection(inputNode).end).to.equal(16);

        inputNode.blur();
        TestUtils.Simulate.blur(inputNode);

        setProps({ value: "+7 (___) ___ _1 _1" });
        await setInputCursorPosition(inputNode, 2);
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        expect(getInputSelection(inputNode).start).to.equal(2);
        expect(getInputSelection(inputNode).end).to.equal(2);
      }
    )
  );

  it(
    "should handle changes on input with autoFocus",
    createInput(
      <Input mask="+7 (999) 999 99 99" autoFocus />,
      async (input, inputNode) => {
        await insertStringIntoInput(input, "222 222 22 22");

        return new Promise(resolve => {
          defer(() => {
            setInputSelection(inputNode, 5, 0);
            setTimeout(() => {
              simulateInputKeyPress(input, "3");
              expect(inputNode.value).to.equal("+7 (232) 222 22 22");
              resolve();
            }, 100);
          });
        });
      }
    )
  );

  it(
    "should format value in onChange (with maskChar)",
    createInput(
      <Input mask="**** **** **** ****" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 0);
        inputNode.value = `a${inputNode.value}`;
        setInputCursorPosition(inputNode, 1);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("a___ ____ ____ ____");
        expect(getInputSelection(inputNode).start).to.equal(1);
        expect(getInputSelection(inputNode).end).to.equal(1);

        await setInputSelection(inputNode, 0, 19);
        inputNode.value = "a";
        setInputCursorPosition(inputNode, 1);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("a___ ____ ____ ____");
        expect(getInputSelection(inputNode).start).to.equal(1);
        expect(getInputSelection(inputNode).end).to.equal(1);

        inputNode.value = "aaaaa___ ____ ____ ____";
        setInputSelection(inputNode, 1, 4);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("aaaa a___ ____ ____");
        expect(getInputSelection(inputNode).start).to.equal(6);
        expect(getInputSelection(inputNode).end).to.equal(6);

        await setInputCursorPosition(inputNode, 4);
        inputNode.value = "aaa a___ ____ ____";
        setInputCursorPosition(inputNode, 3);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("aaa_ a___ ____ ____");

        await setInputSelection(input, 3, 3);
        inputNode.value = "aaaaaa___ ____ ____";
        setInputCursorPosition(inputNode, 6);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("aaaa aa__ ____ ____");

        await setInputSelection(input, 3, 3);
        inputNode.value = "aaaaxa__ ____ ____";
        setInputCursorPosition(inputNode, 5);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("aaaa xa__ ____ ____");
        expect(getInputSelection(inputNode).start).to.equal(6);
        expect(getInputSelection(inputNode).end).to.equal(6);
      }
    )
  );

  it(
    "should format value in onChange (without maskChar)",
    createInput(
      <Input mask="**** **** **** ****" maskChar={null} />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        expect(inputNode.value).to.equal("");

        await setInputCursorPosition(inputNode, 0);
        inputNode.value = "aaa";
        setInputCursorPosition(inputNode, 3);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("aaa");
        expect(getInputSelection(inputNode).start).to.equal(3);
        expect(getInputSelection(inputNode).end).to.equal(3);

        inputNode.value = "aaaaa";
        setInputCursorPosition(inputNode, 5);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("aaaa a");
        expect(getInputSelection(inputNode).start).to.equal(6);
        expect(getInputSelection(inputNode).end).to.equal(6);

        inputNode.value = "aaaa afgh ijkl mnop";
        setInputCursorPosition(inputNode, 19);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("aaaa afgh ijkl mnop");
        expect(getInputSelection(inputNode).start).to.equal(19);
        expect(getInputSelection(inputNode).end).to.equal(19);

        inputNode.value = "aaaa afgh ijkl mnopq";
        setInputCursorPosition(inputNode, 20);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("aaaa afgh ijkl mnop");
        expect(getInputSelection(inputNode).start).to.equal(19);
        expect(getInputSelection(inputNode).end).to.equal(19);
      }
    )
  );

  it(
    "should handle entered characters (with maskChar)",
    createInput(
      <Input mask="+7 (*a9) 999 99 99" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 0);
        simulateInputKeyPress(input, "+");
        expect(inputNode.value).to.equal("+7 (___) ___ __ __");

        await setInputCursorPosition(inputNode, 0);
        simulateInputKeyPress(input, "7");
        expect(inputNode.value).to.equal("+7 (___) ___ __ __");

        await setInputCursorPosition(inputNode, 0);
        simulateInputKeyPress(input, "8");
        expect(inputNode.value).to.equal("+7 (8__) ___ __ __");

        await setInputCursorPosition(inputNode, 0);
        simulateInputKeyPress(input, "E");
        expect(inputNode.value).to.equal("+7 (E__) ___ __ __");

        simulateInputKeyPress(input, "6");
        expect(inputNode.value).to.equal("+7 (E__) ___ __ __");

        simulateInputKeyPress(input, "x");
        expect(inputNode.value).to.equal("+7 (Ex_) ___ __ __");
      }
    )
  );

  it(
    "should handle entered characters (without maskChar)",
    createInput(
      <Input
        mask="+7 (999) 999 99 99"
        defaultValue="+7 (111) 123 45 6"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 4);
        simulateInputKeyPress(input, "E");
        expect(inputNode.value).to.equal("+7 (111) 123 45 6");

        await setInputSelection(input, 4, 3);
        simulateInputKeyPress(input, "0");
        expect(inputNode.value).to.equal("+7 (012) 345 6");

        await setInputCursorPosition(inputNode, 14);
        simulateInputKeyPress(input, "7");
        simulateInputKeyPress(input, "8");
        simulateInputKeyPress(input, "9");
        simulateInputKeyPress(input, "4");
        expect(inputNode.value).to.equal("+7 (012) 345 67 89");

        inputNode.value = "+7 (";
        setInputCursorPosition(inputNode, 4);
        TestUtils.Simulate.change(inputNode);
        await setInputCursorPosition(inputNode, 0);
        simulateInputKeyPress(input, "+");
        expect(inputNode.value).to.equal("+7 (");
      }
    )
  );

  it(
    "should adjust cursor position on input (with maskChar)",
    createInput(
      <Input mask="(999)" defaultValue="11" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 3);
        simulateInputKeyPress(input, "x");
        expect(getInputSelection(inputNode).start).to.equal(3);
        expect(getInputSelection(inputNode).end).to.equal(3);

        simulateInputKeyPress(input, "1");
        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);

        await setInputSelection(inputNode, 0, 4);
        simulateInputBackspacePress(input);
        await setInputCursorPosition(inputNode, 2);
        simulateInputKeyPress(input, "x");
        expect(getInputSelection(inputNode).start).to.equal(2);
        expect(getInputSelection(inputNode).end).to.equal(2);
      }
    )
  );

  it(
    "should handle single character removal with Backspace (with maskChar)",
    createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 10);
        simulateInputBackspacePress(input);
        expect(inputNode.value).to.equal("+7 (495) _15 64 54");

        simulateInputBackspacePress(input);
        expect(inputNode.value).to.equal("+7 (49_) _15 64 54");
      }
    )
  );

  it(
    "should handle single character removal with Backspace (without maskChar)",
    createInput(
      <Input
        mask="+7 (999) 999 99 99"
        defaultValue="74953156454"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 10);
        simulateInputBackspacePress(input);
        expect(inputNode.value).to.equal("+7 (495) 156 45 4");

        inputNode.value = "+7 (";
        setInputCursorPosition(inputNode, 4);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("+7 (");

        inputNode.value = "+7 ";
        setInputCursorPosition(inputNode, 3);
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("+7 (");
      }
    )
  );

  it(
    "should adjust cursor position on single character removal with Backspace (with maskChar)",
    createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 10);
        simulateInputBackspacePress(input);
        expect(getInputSelection(inputNode).start).to.equal(9);
        expect(getInputSelection(inputNode).end).to.equal(9);

        simulateInputBackspacePress(input);
        expect(getInputSelection(inputNode).start).to.equal(6);
        expect(getInputSelection(inputNode).end).to.equal(6);

        await setInputCursorPosition(inputNode, 4);
        simulateInputBackspacePress(input);
        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);
      }
    )
  );

  it(
    "should adjust cursor position on single character removal with Backspace (without maskChar)",
    createInput(
      <Input
        mask="+7 (999) 999 99 99"
        defaultValue="749531564"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 16);
        simulateInputBackspacePress(input);
        expect(getInputSelection(inputNode).start).to.equal(14);
        expect(getInputSelection(inputNode).end).to.equal(14);
      }
    )
  );

  it(
    "should handle multiple characters removal with Backspace (with maskChar)",
    createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputSelection(input, 1, 9);
        simulateInputBackspacePress(input);
        expect(inputNode.value).to.equal("+7 (___) _15 64 54");
      }
    )
  );

  it(
    "should handle multiple characters removal with Backspace (without maskChar)",
    createInput(
      <Input
        mask="+7 (999) 999 99 99"
        defaultValue="74953156454"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputSelection(input, 1, 9);
        simulateInputBackspacePress(input);
        expect(inputNode.value).to.equal("+7 (156) 454 ");
      }
    )
  );

  it(
    "should adjust cursor position on multiple characters removal with Backspace (with maskChar)",
    createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputSelection(input, 1, 9);
        simulateInputBackspacePress(input);
        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);
      }
    )
  );

  it(
    "should handle single character removal with Backspace on mask with escaped characters (without maskChar)",
    createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 10);
        simulateInputBackspacePress(input);
        expect(inputNode.value).to.equal("+49 12 39");

        await setInputCursorPosition(inputNode, 9);
        simulateInputBackspacePress(input);
        expect(inputNode.value).to.equal("+49 12 ");

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        inputNode.value = "+49 12 39";
        TestUtils.Simulate.change(inputNode);
        await setInputCursorPosition(inputNode, 6);
        simulateInputBackspacePress(input);
        expect(inputNode.value).to.equal("+49 13 ");
      }
    )
  );

  it(
    "should adjust cursor position on single character removal with Backspace on mask with escaped characters (without maskChar)",
    createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 10);
        simulateInputBackspacePress(input);
        expect(getInputSelection(inputNode).start).to.equal(9);
        expect(getInputSelection(inputNode).end).to.equal(9);

        await setInputCursorPosition(inputNode, 9);
        simulateInputBackspacePress(input);
        expect(getInputSelection(inputNode).start).to.equal(7);
        expect(getInputSelection(inputNode).end).to.equal(7);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        inputNode.value = "+49 12 39";
        TestUtils.Simulate.change(inputNode);
        await setInputCursorPosition(inputNode, 6);
        simulateInputBackspacePress(input);
        expect(getInputSelection(inputNode).start).to.equal(5);
        expect(getInputSelection(inputNode).end).to.equal(5);
      }
    )
  );

  it(
    "should handle multiple characters removal with Backspace on mask with escaped characters (without maskChar)",
    createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputSelection(input, 4, 2);
        simulateInputBackspacePress(input);
        expect(inputNode.value).to.equal("+49 34 ");

        inputNode.value = "+49 12 394 5";
        TestUtils.Simulate.change(inputNode);
        await setInputSelection(input, 4, 2);
        simulateInputBackspacePress(input);
        expect(inputNode.value).to.equal("+49 34 59");
      }
    )
  );

  it(
    "should adjust cursor position on multiple characters removal with Backspace on mask with escaped characters (without maskChar)",
    createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputSelection(input, 4, 2);
        simulateInputBackspacePress(input);
        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);

        inputNode.value = "+49 12 394 5";
        TestUtils.Simulate.change(inputNode);
        await setInputSelection(input, 4, 2);
        simulateInputBackspacePress(input);
        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);
      }
    )
  );

  it(
    "should handle single character removal with Delete (with maskChar)",
    createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 0);
        simulateInputDeletePress(input);
        expect(inputNode.value).to.equal("+7 (_95) 315 64 54");

        await setInputCursorPosition(inputNode, 7);
        simulateInputDeletePress(input);
        expect(inputNode.value).to.equal("+7 (_95) _15 64 54");

        await setInputCursorPosition(inputNode, 11);
        simulateInputDeletePress(input);
        expect(inputNode.value).to.equal("+7 (_95) _1_ 64 54");
      }
    )
  );

  it(
    "should adjust cursor position on single character removal with Delete (with maskChar)",
    createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 0);
        simulateInputDeletePress(input);
        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);

        await setInputCursorPosition(inputNode, 7);
        simulateInputDeletePress(input);
        expect(getInputSelection(inputNode).start).to.equal(9);
        expect(getInputSelection(inputNode).end).to.equal(9);

        await setInputCursorPosition(inputNode, 11);
        simulateInputDeletePress(input);
        expect(getInputSelection(inputNode).start).to.equal(11);
        expect(getInputSelection(inputNode).end).to.equal(11);
      }
    )
  );

  it(
    "should handle multiple characters removal with Delete (with maskChar)",
    createInput(
      <Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputSelection(input, 1, 9);
        simulateInputDeletePress(input);
        expect(inputNode.value).to.equal("+7 (___) _15 64 54");
      }
    )
  );

  it(
    "should handle single character removal with Delete on mask with escaped characters (without maskChar)",
    createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 9);
        simulateInputDeletePress(input);
        expect(inputNode.value).to.equal("+49 12 39");

        await setInputCursorPosition(inputNode, 7);
        simulateInputDeletePress(input);
        expect(inputNode.value).to.equal("+49 12 ");

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        inputNode.value = "+49 12 39";
        TestUtils.Simulate.change(inputNode);
        await setInputCursorPosition(inputNode, 5);
        simulateInputDeletePress(input);
        expect(inputNode.value).to.equal("+49 13 ");
      }
    )
  );

  it(
    "should adjust cursor position on single character removal with Delete on mask with escaped characters (without maskChar)",
    createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 9);
        simulateInputDeletePress(input);
        expect(getInputSelection(inputNode).start).to.equal(9);
        expect(getInputSelection(inputNode).end).to.equal(9);

        await setInputCursorPosition(inputNode, 7);
        simulateInputDeletePress(input);
        expect(getInputSelection(inputNode).start).to.equal(7);
        expect(getInputSelection(inputNode).end).to.equal(7);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();
        inputNode.value = "+49 12 39";
        TestUtils.Simulate.change(inputNode);
        await setInputCursorPosition(inputNode, 5);
        simulateInputDeletePress(input);
        expect(getInputSelection(inputNode).start).to.equal(5);
        expect(getInputSelection(inputNode).end).to.equal(5);
      }
    )
  );

  it(
    "should handle multiple characters removal with Delete on mask with escaped characters (without maskChar)",
    createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputSelection(input, 4, 2);
        simulateInputDeletePress(input);
        expect(inputNode.value).to.equal("+49 34 ");

        inputNode.value = "+49 12 394 5";
        TestUtils.Simulate.change(inputNode);
        await setInputSelection(input, 4, 2);
        simulateInputDeletePress(input);
        expect(inputNode.value).to.equal("+49 34 59");
      }
    )
  );

  it(
    "should adjust cursor position on multiple characters removal with Delete on mask with escaped characters (without maskChar)",
    createInput(
      <Input
        mask="+4\9 99 9\99 99"
        defaultValue="+49 12 394"
        maskChar={null}
      />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputSelection(input, 4, 2);
        simulateInputDeletePress(input);
        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);

        inputNode.value = "+49 12 394 5";
        TestUtils.Simulate.change(inputNode);
        await setInputSelection(input, 4, 2);
        simulateInputDeletePress(input);
        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);
      }
    )
  );

  it(
    "should handle mask change",
    createInput(
      <Input mask="9999-9999-9999-9999" defaultValue="34781226917" />,
      async (input, inputNode, setProps) => {
        setProps({ mask: "9999-999999-99999" });
        expect(inputNode.value).to.equal("3478-122691-7____");

        setProps({ mask: "9-9-9-9" });
        expect(inputNode.value).to.equal("3-4-7-8");

        setProps({ mask: null });
        expect(inputNode.value).to.equal("3-4-7-8");

        inputNode.value = "0-1-2-3";

        setProps({ mask: "9999" });
        expect(inputNode.value).to.equal("0123");
      }
    )
  );

  it(
    "should handle mask change with on controlled input",
    createInput(
      <Input mask="9999-9999-9999-9999" value="38781226917" />,
      async (input, inputNode, setProps) => {
        setProps({
          onChange: () => {
            setProps({
              mask: "9999-999999-99999",
              value: "3478-1226-917_-____"
            });
          }
        });

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        expect(inputNode.value).to.equal("3878-1226-917_-____");

        await setInputCursorPosition(inputNode, 1);
        simulateInputKeyPress(input, "4");
        TestUtils.Simulate.change(inputNode);

        expect(inputNode.value).to.equal("3478-122691-7____");
      }
    )
  );

  it(
    "should handle string paste (with maskChar)",
    createInput(
      <Input mask="9999-9999-9999-9999" defaultValue="____-____-____-6543" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputSelection(inputNode, 3, 15);
        simulateInputPaste(input, "34781226917");
        expect(inputNode.value).to.equal("___3-4781-2269-17_3");

        await setInputCursorPosition(inputNode, 3);
        simulateInputPaste(input, "3-__81-2_6917");
        expect(inputNode.value).to.equal("___3-__81-2_69-17_3");

        await setInputSelection(inputNode, 0, 3);
        simulateInputPaste(input, " 333");
        expect(inputNode.value).to.equal("3333-__81-2_69-17_3");
      }
    )
  );

  it(
    "should adjust cursor position on string paste (with maskChar)",
    createInput(
      <Input mask="9999-9999-9999-9999" defaultValue="____-____-____-6543" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputSelection(inputNode, 3, 15);
        simulateInputPaste(input, "478122691");
        expect(getInputSelection(inputNode).start).to.equal(15);
        expect(getInputSelection(inputNode).end).to.equal(15);

        await setInputCursorPosition(inputNode, 3);
        simulateInputPaste(input, "3-__81-2_6917");
        expect(getInputSelection(inputNode).start).to.equal(17);
        expect(getInputSelection(inputNode).end).to.equal(17);
      }
    )
  );

  it(
    "should handle string paste (without maskChar)",
    createInput(
      <Input
        mask="9999-9999-9999-9999"
        defaultValue="9999-9999-9999-9999"
        maskChar={null}
      />,
      async (input, inputNode, setProps) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputSelection(inputNode, 0, 19);
        simulateInputPaste(input, "34781226917");
        expect(inputNode.value).to.equal("3478-1226-917");

        await setInputCursorPosition(inputNode, 1);
        simulateInputPaste(input, "12345");
        expect(inputNode.value).to.equal("3123-4547-8122-6917");

        await setInputCursorPosition(inputNode, 1);
        simulateInputPaste(input, "4321");
        expect(inputNode.value).to.equal("3432-1547-8122-6917");

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
        expect(inputNode.value).to.equal("123");
      }
    )
  );

  it(
    "should handle string paste at position of permanent character (with maskChar)",
    createInput(
      <Input mask="9999-9999-9999" maskChar=" " />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        simulateInputPaste(input, "1111 1111 1111");
        expect(inputNode.value).to.equal("1111-1111-1111");
      }
    )
  );

  it(
    "should handle formatChars property",
    createInput(
      <Input mask="11-11" defaultValue="1234" formatChars={{ "1": "[1-3]" }} />,
      async (input, inputNode) => {
        expect(inputNode.value).to.equal("12-3_");
      }
    )
  );

  it(
    "should keep placeholder on rerender on empty input with alwaysShowMask",
    createInput(
      <Input mask="99-99" value="" alwaysShowMask />,
      async (input, inputNode, setProps) => {
        setProps({ value: "" });

        expect(inputNode.value).to.equal("__-__");
      }
    )
  );

  it(
    "should ignore null formatChars",
    createInput(
      <Input mask="99-99" formatChars={null} alwaysShowMask />,
      async (input, inputNode) => {
        expect(inputNode.value).to.equal("__-__");
      }
    )
  );

  it(
    "should show empty value when input switches from uncontrolled to controlled",
    createInput(
      <Input mask="+7 (*a9) 999 99 99" />,
      async (input, inputNode, setProps) => {
        setProps({ value: "+7 (___) ___ __ __" });
        expect(inputNode.value).to.equal("+7 (___) ___ __ __");
      }
    )
  );

  it(
    "shouldn't affect value if mask is empty",
    createInput(<Input value="12345" />, async (input, inputNode, setProps) => {
      expect(inputNode.value).to.equal("12345");

      setProps({
        value: "54321"
      });
      expect(inputNode.value).to.equal("54321");
    })
  );

  it(
    "should show next permanent character when maskChar is null",
    createInput(
      <Input mask="99/99/9999" value="01" maskChar={null} />,
      async (input, inputNode) => {
        expect(inputNode.value).to.equal("01/");
      }
    )
  );

  it(
    "should show all next consecutive permanent characters when maskChar is null",
    createInput(
      <Input mask="99---99" value="01" maskChar={null} />,
      async (input, inputNode) => {
        expect(inputNode.value).to.equal("01---");
      }
    )
  );

  it(
    "should show trailing permanent character when maskChar is null",
    createInput(
      <Input mask="99%" value="10" maskChar={null} />,
      async (input, inputNode) => {
        expect(inputNode.value).to.equal("10%");
      }
    )
  );

  it("should pass input DOM node to ref", () => {
    let inputRef;
    return createInput(
      <Input
        ref={ref => {
          inputRef = ref;
        }}
      />,
      async (input, inputNode) => {
        expect(inputRef).to.equal(inputNode);
      }
    )();
  });

  it(
    "should allow to modify value with beforeMaskedStateChange",
    (() => {
      function beforeMaskedStateChange({ nextState }) {
        const placeholder = "DD/MM/YYYY";
        const maskChar = "_";
        const value = nextState.value
          .split("")
          .map((char, i) => {
            if (char === maskChar) {
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

      return createInput(
        <Input
          mask="99/99/9999"
          value=""
          beforeMaskedStateChange={beforeMaskedStateChange}
        />,
        async (input, inputNode, setProps) => {
          expect(inputNode.value).to.equal("");

          setProps({
            onChange: event => {
              setProps({
                value: event.target.value
              });
            }
          });

          inputNode.focus();
          TestUtils.Simulate.focus(inputNode);
          await waitForPendingSelection();

          expect(inputNode.value).to.equal("DD/MM/YYYY");

          setProps({ value: "12345" });
          expect(inputNode.value).to.equal("12/34/5YYY");

          await setInputCursorPosition(inputNode, 7);

          simulateInputKeyPress(input, "6");
          expect(inputNode.value).to.equal("12/34/56YY");
        }
      );
    })()
  );

  it(
    "shouldn't modify value on entering non-allowed character",
    createInput(
      <Input mask="9999" defaultValue="1234" />,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        await setInputCursorPosition(inputNode, 0);
        simulateInputKeyPress(input, "a");

        expect(inputNode.value).to.equal("1234");
        expect(getInputSelection(inputNode).start).to.equal(0);
        expect(getInputSelection(inputNode).end).to.equal(0);

        await setInputSelection(input, 0, 1);
        simulateInputKeyPress(input, "a");

        expect(inputNode.value).to.equal("1234");

        await setInputSelection(input, 1, 3);
        simulateInputKeyPress(input, "a");

        expect(inputNode.value).to.equal("1234");
      }
    )
  );

  it(
    "should handle autofill",
    createInput(
      <Input mask="9999-9999" defaultValue="123" maskChar={null} />,
      async (input, inputNode) => {
        input.isInputAutofilled = () => true;

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        inputNode.value = "12345678";
        setInputCursorPosition(inputNode, 8);
        TestUtils.Simulate.change(inputNode);

        expect(inputNode.value).to.equal("1234-5678");
      }
    )
  );

  it(
    "should handle transition between masked and non-masked state",
    createInput(<Input />, async (input, inputNode, setProps) => {
      setProps({
        value: "",
        onChange: event => {
          setProps({
            value: event.target.value,
            mask: event.target.value ? "+7 999 999 99 99" : null
          });
        }
      });

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      await waitForPendingSelection();

      expect(getInputSelection(inputNode).start).to.equal(0);
      expect(getInputSelection(inputNode).end).to.equal(0);

      simulateInputKeyPress(input, "1");
      expect(inputNode.value).to.equal("+7 1__ ___ __ __");
      expect(getInputSelection(inputNode).start).to.equal(4);
      expect(getInputSelection(inputNode).end).to.equal(4);

      simulateInputBackspacePress(input);
      inputNode.blur();
      TestUtils.Simulate.blur(inputNode);

      expect(inputNode.value).to.equal("");

      inputNode.focus();
      TestUtils.Simulate.focus(inputNode);
      await waitForPendingSelection();

      expect(getInputSelection(inputNode).start).to.equal(0);
      expect(getInputSelection(inputNode).end).to.equal(0);

      simulateInputKeyPress(input, "1");
      expect(inputNode.value).to.equal("+7 1__ ___ __ __");
      expect(getInputSelection(inputNode).start).to.equal(4);
      expect(getInputSelection(inputNode).end).to.equal(4);
    })
  );

  it(
    "should handle regular component as children",
    createInput(
      <Input mask="+7 (999) 999 99 99">
        {props => <TestInputComponent {...props} />}
      </Input>,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);

        simulateInputKeyPress(input, "1");
        expect(inputNode.value).to.equal("+7 (1__) ___ __ __");
        expect(getInputSelection(inputNode).start).to.equal(5);
        expect(getInputSelection(inputNode).end).to.equal(5);
      }
    )
  );

  it(
    "should handle functional component as children",
    createInput(
      <Input mask="+7 (999) 999 99 99">
        {props => <TestFunctionalInputComponent {...props} />}
      </Input>,
      async (input, inputNode) => {
        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);

        simulateInputKeyPress(input, "1");
        expect(inputNode.value).to.equal("+7 (1__) ___ __ __");
        expect(getInputSelection(inputNode).start).to.equal(5);
        expect(getInputSelection(inputNode).end).to.equal(5);
      }
    )
  );

  it("should handle children change", () => {
    return createInput(
      <Input mask="+7 (999) 999 99 99" />,
      async (input, inputNode, setProps) => {
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
          children: props => <TestInputComponent {...props} ref={handleRef} />
        });

        inputNode = getInputDOMNode(input);

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        expect(getInputSelection(inputNode).start).to.equal(4);
        expect(getInputSelection(inputNode).end).to.equal(4);

        simulateInputKeyPress(input, "1");
        expect(inputNode.value).to.equal("+7 (1__) ___ __ __");
        expect(getInputSelection(inputNode).start).to.equal(5);
        expect(getInputSelection(inputNode).end).to.equal(5);

        setProps({
          value: "22",
          mask: "+7 (999) 999 99 99",
          onChange: event => {
            setProps({
              value: event.target.value
            });
          },
          children: props => (
            <TestFunctionalInputComponent {...props} ref={handleRef} />
          )
        });
        inputNode = getInputDOMNode(input);

        expect(inputNode.value).to.equal("+7 (22_) ___ __ __");

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
        inputNode = getInputDOMNode(input);

        expect(inputNode.value).to.equal("+7 (22_) ___ __ __");
      }
    )();
  });

  it(
    "should handle change event without focus",
    createInput(
      <Input mask="+7 (999) 999 99 99" maskChar={null} />,
      async (input, inputNode) => {
        inputNode.value = "+71234567890";
        TestUtils.Simulate.change(inputNode);
        expect(inputNode.value).to.equal("+7 (123) 456 78 90");
      }
    )
  );

  it(
    "shouldn't move cursor on delayed value change",
    createInput(
      <Input mask="+7 (999) 999 99 99" maskChar={null} />,
      async (input, inputNode, setProps) => {
        setProps({
          value: "+7 (9",
          onChange: event => {
            setProps({
              value: event.target.value
            });
          }
        });

        inputNode.focus();
        TestUtils.Simulate.focus(inputNode);
        await waitForPendingSelection();

        expect(getInputSelection(inputNode).start).to.equal(5);
        expect(getInputSelection(inputNode).end).to.equal(5);

        await new Promise(resolve => setTimeout(resolve, 100));
        setProps({
          value: "+7 (99"
        });

        expect(getInputSelection(inputNode).start).to.equal(5);
        expect(getInputSelection(inputNode).end).to.equal(5);
      }
    )
  );
});
