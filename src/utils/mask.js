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
    if (!string || typeof string !== "string" || position >= mask.length) {
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

  processChange = (currentState, previousState) => {
    const { mask, prefix, lastEditablePosition } = this.maskOptions;
    const { value, selection } = currentState;
    const previousValue = previousState.value;
    const previousSelection = previousState.selection;
    let newValue = value;
    let enteredString = "";
    let formattedEnteredStringLength = 0;
    let removedLength = 0;
    let cursorPosition = Math.min(previousSelection.start, selection.start);

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

    newValue = previousValue;

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
