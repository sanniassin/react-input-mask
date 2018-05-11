export function isPermanentChar(maskOptions, pos) {
  return maskOptions.permanents.indexOf(pos) !== -1;
}

export function isAllowedChar(maskOptions, pos, character) {
  var { mask, formatChars } = maskOptions;

  if (!character) {
    return false;
  }

  if (isPermanentChar(maskOptions, pos)) {
    return mask[pos] === character;
  }

  var ruleChar = mask[pos];
  var charRule = formatChars[ruleChar];

  return (new RegExp(charRule)).test(character);
}

export function isEmpty(maskOptions, value) {
  return value
    .split('')
    .every((character, i) => {
      return isPermanentChar(maskOptions, i)
             ||
             !isAllowedChar(maskOptions, i, character);
    });
}

export function getFilledLength(maskOptions, value) {
  var { maskChar, prefix } = maskOptions;

  if (!maskChar) {
    while (value.length > prefix.length && isPermanentChar(maskOptions, value.length - 1)) {
      value = value.slice(0, value.length - 1);
    }
    return value.length;
  }

  var filledLength = prefix.length;
  for (var i = value.length; i >= prefix.length; i--) {
    var character = value[i];
    var isEnteredCharacter = !isPermanentChar(maskOptions, i)
                             &&
                             isAllowedChar(maskOptions, i, character);
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
  var { maskChar, mask, prefix } = maskOptions;

  if (!maskChar) {
    value = insertString(maskOptions, '', value, 0);

    if (value.length < prefix.length) {
      value = prefix;
    }

    while (value.length < mask.length && isPermanentChar(maskOptions, value.length)) {
      value += mask[value.length];
    }

    return value;
  }

  if (value) {
    var emptyValue = formatValue(maskOptions, '');
    return insertString(maskOptions, emptyValue, value, 0);
  }

  for (var i = 0; i < mask.length; i++) {
    if (isPermanentChar(maskOptions, i)) {
      value += mask[i];
    } else {
      value += maskChar;
    }
  }

  return value;
}

export function clearRange(maskOptions, value, start, len) {
  var end = start + len;
  var { maskChar, mask, prefix } = maskOptions;
  var arrayValue = value.split('');

  if (!maskChar) {
    // remove any permanent chars after clear range, they will be added back by formatValue
    for (var i = end; i < arrayValue.length; i++) {
      if (isPermanentChar(maskOptions, i)) {
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
      if (isPermanentChar(maskOptions, i)) {
        return mask[i];
      }
      return maskChar;
    })
    .join('');
}

export function insertString(maskOptions, value, insertStr, insertPosition) {
  var { mask, maskChar, prefix } = maskOptions;
  var arrayInsertStr = insertStr.split('');
  var isInputFilled = isFilled(maskOptions, value);

  var isUsablePosition = (pos, character) => {
    return !isPermanentChar(maskOptions, pos)
           ||
           character === mask[pos];
  };
  var isUsableCharacter = (character, pos) => {
    return !maskChar
           ||
           !isPermanentChar(maskOptions, pos)
           ||
           character !== maskChar;
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

    var isAllowed = isAllowedChar(maskOptions, insertPosition, insertCharacter)
                    ||
                    insertCharacter === maskChar;
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
  var { mask, maskChar } = maskOptions;
  var arrayInsertStr = insertStr.split('');
  var initialInsertPosition = insertPosition;

  var isUsablePosition = (pos, character) => {
    return !isPermanentChar(maskOptions, pos)
           ||
           character === mask[pos];
  };

  arrayInsertStr.every((insertCharacter) => {
    while (!isUsablePosition(insertPosition, insertCharacter)) {
      insertPosition++;

      // stop iteration if maximum value length reached
      if (insertPosition >= mask.length) {
        return false;
      }
    }

    var isAllowed = isAllowedChar(maskOptions, insertPosition, insertCharacter)
                    ||
                    insertCharacter === maskChar;

    if (isAllowed) {
      insertPosition++;
    }

    // stop iteration if maximum value length reached
    return insertPosition < mask.length;
  });

  return insertPosition - initialInsertPosition;
}

export function getLeftEditablePosition(maskOptions, pos) {
  for (var i = pos; i >= 0; --i) {
    if (!isPermanentChar(maskOptions, i)) {
      return i;
    }
  }
  return null;
}

export function getRightEditablePosition(maskOptions, pos) {
  var { mask } = maskOptions;
  for (var i = pos; i < mask.length; ++i) {
    if (!isPermanentChar(maskOptions, i)) {
      return i;
    }
  }
  return null;
}

export function getStringValue(value) {
  return !value && value !== 0 ? '' : value + '';
}
