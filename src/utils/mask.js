/* eslint no-use-before-define: ["error", { functions: false }] */
import { findLastIndex, repeat } from "./helpers";
import parseMask from "./parse-mask";

export default class MaskUtils {
  constructor(options) {
    this.maskOptions = parseMask(options);
  }

  isCharacterAllowedAtPosition = (character, position) => {
    const { maskPlaceholder } = this.maskOptions;

    if (this.isCharacterFillingPosition(character, position)) {
      return true;
    }

    if (!maskPlaceholder) {
      return false;
    }

    return maskPlaceholder[position] === character;
  };

  isCharacterFillingPosition = (character, position) => {
    const { mask } = this.maskOptions;

    if (!character || position >= mask.length) {
      return false;
    }

    if (!this.isPositionEditable(position)) {
      return mask[position] === character;
    }

    const charRule = mask[position];
    return new RegExp(charRule).test(character);
  };

  isPositionEditable = position => {
    const { mask, permanents } = this.maskOptions;
    return position < mask.length && permanents.indexOf(position) === -1;
  };

  isValueEmpty = value => {
    return value.split("").every((character, position) => {
      return (
        !this.isPositionEditable(position) ||
        !this.isCharacterFillingPosition(character, position)
      );
    });
  };

  isValueFilled = value => {
    return (
      this.getFilledLength(value) === this.maskOptions.lastEditablePosition + 1
    );
  };

  getDefaultSelectionForValue = value => {
    const filledLength = this.getFilledLength(value);
    const cursorPosition = this.getRightEditablePosition(filledLength);
    return { start: cursorPosition, end: cursorPosition };
  };

  getFilledLength = value => {
    const characters = value.split("");
    const lastFilledIndex = findLastIndex(characters, (character, position) => {
      return (
        this.isPositionEditable(position) &&
        this.isCharacterFillingPosition(character, position)
      );
    });
    return lastFilledIndex + 1;
  };

  getStringFillingLengthAtPosition = (string, position) => {
    const characters = string.split("");
    const insertedValue = characters.reduce((value, character) => {
      return this.insertCharacterAtPosition(value, character, value.length);
    }, repeat(" ", position));

    return insertedValue.length - position;
  };

  getLeftEditablePosition = position => {
    for (let i = position; i >= 0; i--) {
      if (this.isPositionEditable(i)) {
        return i;
      }
    }
    return null;
  };

  getRightEditablePosition = position => {
    const { mask } = this.maskOptions;
    for (let i = position; i < mask.length; i++) {
      if (this.isPositionEditable(i)) {
        return i;
      }
    }
    return null;
  };

  formatValue = value => {
    const { maskPlaceholder, mask } = this.maskOptions;

    if (!maskPlaceholder) {
      value = this.insertStringAtPosition("", value, 0);

      while (
        value.length < mask.length &&
        !this.isPositionEditable(value.length)
      ) {
        value += mask[value.length];
      }

      return value;
    }

    return this.insertStringAtPosition(maskPlaceholder, value, 0);
  };

  clearRange = (value, start, len) => {
    if (!len) {
      return value;
    }

    const end = start + len;
    const { maskPlaceholder, mask } = this.maskOptions;

    const clearedValue = value
      .split("")
      .map((character, i) => {
        const isEditable = this.isPositionEditable(i);

        if (!maskPlaceholder && i >= end && !isEditable) {
          return "";
        }
        if (i < start || i >= end) {
          return character;
        }
        if (!isEditable) {
          return mask[i];
        }
        if (maskPlaceholder) {
          return maskPlaceholder[i];
        }
        return "";
      })
      .join("");

    return this.formatValue(clearedValue);
  };

  insertCharacterAtPosition = (value, character, position) => {
    const { mask, maskPlaceholder } = this.maskOptions;
    if (position >= mask.length) {
      return value;
    }

    const isAllowed = this.isCharacterAllowedAtPosition(character, position);
    const isEditable = this.isPositionEditable(position);
    const nextEditablePosition = this.getRightEditablePosition(position);
    const isNextPlaceholder =
      maskPlaceholder && nextEditablePosition
        ? character === maskPlaceholder[nextEditablePosition]
        : null;
    const valueBefore = value.slice(0, position);

    if (isAllowed || !isEditable) {
      const insertedCharacter = isAllowed ? character : mask[position];
      value = valueBefore + insertedCharacter;
    }

    if (!isAllowed && !isEditable && !isNextPlaceholder) {
      value = this.insertCharacterAtPosition(value, character, position + 1);
    }

    return value;
  };

  insertStringAtPosition = (value, string, position) => {
    const { mask, maskPlaceholder } = this.maskOptions;
    if (!string || position >= mask.length) {
      return value;
    }

    const characters = string.split("");
    const isFixedLength = this.isValueFilled(value) || !!maskPlaceholder;
    const valueAfter = value.slice(position);

    value = characters.reduce((value, character) => {
      return this.insertCharacterAtPosition(value, character, value.length);
    }, value.slice(0, position));

    if (isFixedLength) {
      value += valueAfter.slice(value.length - position);
    } else if (this.isValueFilled(value)) {
      value += mask.slice(value.length).join("");
    } else {
      const editableCharactersAfter = valueAfter
        .split("")
        .filter((character, i) => {
          return this.isPositionEditable(position + i);
        });
      value = editableCharactersAfter.reduce((value, character) => {
        const nextEditablePosition = this.getRightEditablePosition(
          value.length
        );
        if (nextEditablePosition === null) {
          return value;
        }

        if (!this.isPositionEditable(value.length)) {
          value += mask.slice(value.length, nextEditablePosition).join("");
        }

        return this.insertCharacterAtPosition(value, character, value.length);
      }, value);
    }

    return value;
  };

  isAutoFilled = (
    { value, selection },
    { value: previousValue, selection: previousSelection }
  ) => {
    const { maskPlaceholder } = this.maskOptions;
    if (
      // Autocomplete will set the previous selection to the length of the autocompleted value
      previousSelection.end < previousValue.length &&
      selection.end === value.length
    ) {
      return true;
    }

    if (
      selection.length === 0 &&
      previousSelection.length === 0 &&
      selection.start < previousSelection.start &&
      selection.start === value.length
    ) {
      // When both previous and current state have no selection length, the cursor index is less than it was before
      // and the cursor is at the end of the new value
      // Check each character to see if there are any changes which is only possible if the value was autocompleted.
      return value.split("").some((char, index) => {
        return char !== previousValue[index];
      });
    }

    if (
      !maskPlaceholder &&
      previousSelection.length === 0 &&
      previousValue.length < value.length
    ) {
      // If there is no mask placeholder, the selection is 0 and the new value is longer than the previous value
      // (characters have been added)
      return value.split("").some((char, index) => {
        // Check each character before the selection to see if they have changed
        if (index < previousSelection.start) {
          // Any character before the previous selection that changes will be changed because of autofill
          return char !== previousValue[index];
        }
        return false;
      });
    }

    return false;
  };

  processChange = (currentState, previousState) => {
    const { mask, prefix, lastEditablePosition } = this.maskOptions;
    const { value, selection } = currentState;
    let previousValue = previousState.value;
    let previousSelection = previousState.selection;
    let newValue = value;
    let enteredString = "";
    let formattedEnteredStringLength = 0;
    let removedLength = 0;
    let cursorPosition = Math.min(previousSelection.start, selection.start);

    if (this.isAutoFilled(currentState, previousState)) {
      // If the value is autocompleted treat it as if the input started empty.
      previousValue = prefix;
      previousSelection = {
        start: 0,
        end: 0,
        length: 0
      };
    }

    if (selection.end > previousSelection.start) {
      enteredString = newValue.slice(previousSelection.start, selection.end);
      formattedEnteredStringLength = this.getStringFillingLengthAtPosition(
        enteredString,
        cursorPosition
      );
      if (!formattedEnteredStringLength) {
        removedLength = 0;
      } else {
        removedLength = previousSelection.length;
      }
    } else if (newValue.length < previousValue.length) {
      removedLength = previousValue.length - newValue.length;
    }

    if (
      !(
        newValue.length === previousValue.length &&
        selection.end === previousSelection.start
      )
    ) {
      newValue = previousValue;
    }

    if (removedLength) {
      if (removedLength === 1 && !previousSelection.length) {
        const deleteFromRight = previousSelection.start === selection.start;
        cursorPosition = deleteFromRight
          ? this.getRightEditablePosition(selection.start)
          : this.getLeftEditablePosition(selection.start);
      }
      newValue = this.clearRange(newValue, cursorPosition, removedLength);
    }

    newValue = this.insertStringAtPosition(
      newValue,
      enteredString,
      cursorPosition
    );

    cursorPosition += formattedEnteredStringLength;
    if (cursorPosition >= mask.length) {
      cursorPosition = mask.length;
    } else if (
      cursorPosition < prefix.length &&
      !formattedEnteredStringLength
    ) {
      cursorPosition = prefix.length;
    } else if (
      cursorPosition >= prefix.length &&
      cursorPosition < lastEditablePosition &&
      formattedEnteredStringLength
    ) {
      cursorPosition = this.getRightEditablePosition(cursorPosition);
    }

    newValue = this.formatValue(newValue);

    return {
      value: newValue,
      enteredString,
      selection: { start: cursorPosition, end: cursorPosition }
    };
  };
}
