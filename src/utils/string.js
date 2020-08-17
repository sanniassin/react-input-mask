/* eslint no-use-before-define: ["error", { functions: false }] */

export function isPermanentCharacter(maskOptions, pos) {
  return maskOptions.permanents.indexOf(pos) !== -1;
}

export function isAllowedCharacter(maskOptions, pos, character) {
  const { mask, formatChars } = maskOptions;

  if (!character) {
    return false;
  }

  if (isPermanentCharacter(maskOptions, pos)) {
    return mask[pos] === character;
  }

  const ruleChar = mask[pos];
  const charRule = formatChars[ruleChar];

  return (new RegExp(charRule)).test(character);
}

export function isEmpty(maskOptions, value) {
  return value
    .split('')
    .every((character, i) => {
      return isPermanentCharacter(maskOptions, i)
             || !isAllowedCharacter(maskOptions, i, character);
    });
}

export function getFilledLength(maskOptions, value) {
  const { maskChar, prefix } = maskOptions;

  if (!maskChar) {
    while (value.length > prefix.length && isPermanentCharacter(maskOptions, value.length - 1)) {
      value = value.slice(0, value.length - 1);
    }
    return value.length;
  }

  let filledLength = prefix.length;
  for (let i = value.length; i >= prefix.length; i--) {
    const character = value[i];
    const isEnteredCharacter = !isPermanentCharacter(maskOptions, i)
                               && isAllowedCharacter(maskOptions, i, character);
    if (isEnteredCharacter) {
      filledLength = i + 1;
      break;
    }
  }

  return filledLength;
}

export function isFilled(maskOptions, value) {
  return getFilledLength(maskOptions, value) === maskOptions.mask.length;
}

export function formatValue(maskOptions, value) {
  const { maskChar, mask, prefix } = maskOptions;

  if (!maskChar) {
    value = insertString(maskOptions, '', value, 0);

    if (value.length < prefix.length) {
      value = prefix;
    }

    while (value.length < mask.length && isPermanentCharacter(maskOptions, value.length)) {
      value += mask[value.length];
    }

    return value;
  }

  if (value) {
    const emptyValue = formatValue(maskOptions, '');
    return insertString(maskOptions, emptyValue, value, 0);
  }

  for (let i = 0; i < mask.length; i++) {
    if (isPermanentCharacter(maskOptions, i)) {
      value += mask[i];
    } else {
      value += maskChar;
    }
  }

  return value;
}

export function clearRange(maskOptions, value, start, len) {
  const end = start + len;
  const { maskChar, mask, prefix } = maskOptions;
  const arrayValue = value.split('');

  if (!maskChar) {
    // remove any permanent chars after clear range, they will be added back by formatValue
    for (let i = end; i < arrayValue.length; i++) {
      if (isPermanentCharacter(maskOptions, i)) {
        arrayValue[i] = '';
      }
    }

    start = Math.max(prefix.length, start);
    arrayValue.splice(start, end - start);
    value = arrayValue.join('');

    return formatValue(maskOptions, value);
  }

  return arrayValue
    .map((character, i) => {
      if (i < start || i >= end) {
        return character;
      }
      if (isPermanentCharacter(maskOptions, i)) {
        return mask[i];
      }
      return maskChar;
    })
    .join('');
}

export function insertString(maskOptions, value, insertStr, insertPosition) {
  const { mask, maskChar, prefix } = maskOptions;
  const arrayInsertStr = insertStr.split('');
  const isInputFilled = isFilled(maskOptions, value);

  const isUsablePosition = (pos, character) => {
    return !isPermanentCharacter(maskOptions, pos)
           || character === mask[pos];
  };
  const isUsableCharacter = (character, pos) => {
    return (
      !maskChar
      || maskChar != 0
      || !isPermanentCharacter(maskOptions, pos)
      || character !== maskChar
    );
  };

  if (!maskChar && insertPosition > value.length) {
    value += mask.slice(value.length, insertPosition);
  }

  arrayInsertStr.every((insertCharacter) => {
    while (!isUsablePosition(insertPosition, insertCharacter)) {
      if (insertPosition >= value.length) {
        value += mask[insertPosition];
      }

      if (!isUsableCharacter(insertCharacter, insertPosition)) {
        return true;
      }

      insertPosition++;

      // stop iteration if maximum value length reached
      if (insertPosition >= mask.length) {
        return false;
      }
    }

    const isAllowed = isAllowedCharacter(maskOptions, insertPosition, insertCharacter)
                      || insertCharacter === maskChar;
    if (!isAllowed) {
      return true;
    }

    if (insertPosition < value.length) {
      if (maskChar || isInputFilled || insertPosition < prefix.length) {
        value = value.slice(0, insertPosition) + insertCharacter + value.slice(insertPosition + 1);
      } else {
        value = value.slice(0, insertPosition) + insertCharacter + value.slice(insertPosition);
        value = formatValue(maskOptions, value);
      }
    } else if (!maskChar) {
      value += insertCharacter;
    }

    insertPosition++;

    // stop iteration if maximum value length reached
    return insertPosition < mask.length;
  });

  return value;
}

export function getInsertStringLength(maskOptions, value, insertStr, insertPosition) {
  const { mask, maskChar } = maskOptions;
  const arrayInsertStr = insertStr.split('');
  const initialInsertPosition = insertPosition;

  const isUsablePosition = (pos, character) => {
    return !isPermanentCharacter(maskOptions, pos)
           || character === mask[pos];
  };

  arrayInsertStr.every((insertCharacter) => {
    while (!isUsablePosition(insertPosition, insertCharacter)) {
      insertPosition++;

      // stop iteration if maximum value length reached
      if (insertPosition >= mask.length) {
        return false;
      }
    }

    const isAllowed = isAllowedCharacter(maskOptions, insertPosition, insertCharacter)
                      || insertCharacter === maskChar;

    if (isAllowed) {
      insertPosition++;
    }

    // stop iteration if maximum value length reached
    return insertPosition < mask.length;
  });

  return insertPosition - initialInsertPosition;
}

export function getLeftEditablePosition(maskOptions, pos) {
  for (let i = pos; i >= 0; --i) {
    if (!isPermanentCharacter(maskOptions, i)) {
      return i;
    }
  }
  return null;
}

export function getRightEditablePosition(maskOptions, pos) {
  const { mask } = maskOptions;
  for (let i = pos; i < mask.length; ++i) {
    if (!isPermanentCharacter(maskOptions, i)) {
      return i;
    }
  }
  return null;
}

export function getStringValue(value) {
  return !value && value !== 0 ? '' : value + '';
}
