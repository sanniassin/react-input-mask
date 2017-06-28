export function isPermanentChar(maskOptions, pos) {
  return maskOptions.permanents.indexOf(pos) !== -1;
}

export function isAllowedChar(maskOptions, pos, character) {
  var { mask, charsRules } = maskOptions;

  if (!character) {
    return false;
  }

  if (isPermanentChar(maskOptions, pos)) {
    return mask[pos] === character;
  }

  var ruleChar = mask[pos];
  var charRule = charsRules[ruleChar];

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
    value = value.slice(0, getFilledLength(maskOptions, value));

    if (value.length < prefix.length) {
      value = prefix;
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

export function insertString(maskOptions, value, insertStr, insertPos) {
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

  if (!maskChar && insertPos > value.length) {
    value += mask.slice(value.length, insertPos);
  }

  arrayInsertStr.every((insertCharacter) => {
    while (!isUsablePosition(insertPos, insertCharacter)) {
      if (insertPos >= value.length) {
        value += mask[insertPos];
      }

      if (!isUsableCharacter(insertCharacter, insertPos)) {
        return true;
      }

      insertPos++;

      // stop iteration if maximum value length reached
      if (insertPos >= mask.length) {
        return false;
      }
    }

    var isAllowed = isAllowedChar(maskOptions, insertPos, insertCharacter)
                    ||
                    insertCharacter === maskChar;
    if (!isAllowed) {
      return true;
    }

    if (insertPos < value.length) {
      if (maskChar || isInputFilled || insertPos < prefix.length) {
        value = value.slice(0, insertPos) + insertCharacter + value.slice(insertPos + 1);
      } else {
        value = value.slice(0, insertPos) + insertCharacter + value.slice(insertPos);
        value = formatValue(maskOptions, value);
      }
    } else if (!maskChar) {
      value += insertCharacter;
    }

    insertPos++;

    // stop iteration if maximum value length reached
    return insertPos < mask.length;
  });

  return value;
}

export function getInsertStringLength(maskOptions, value, insertStr, insertPos) {
  var { mask, maskChar } = maskOptions;
  var arrayInsertStr = insertStr.split('');
  var initialInsertPos = insertPos;

  var isUsablePosition = (pos, character) => {
    return !isPermanentChar(maskOptions, pos)
           ||
           character === mask[pos];
  };

  arrayInsertStr.every((insertCharacter) => {
    while (!isUsablePosition(insertPos, insertCharacter)) {
      insertPos++;

      // stop iteration if maximum value length reached
      if (insertPos >= mask.length) {
        return false;
      }
    }

    var isAllowed = isAllowedChar(maskOptions, insertPos, insertCharacter)
                    ||
                    insertCharacter === maskChar;

    if (isAllowed) {
      insertPos++;
    }

    // stop iteration if maximum value length reached
    return insertPos < mask.length;
  });

  return insertPos - initialInsertPos;
}
