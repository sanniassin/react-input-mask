export function isPermanentChar(maskOptions, pos) {
  return maskOptions.permanents.indexOf(pos) !== -1;
}

export function isAllowedChar(maskOptions, pos, character, allowMaskChar = false) {
  var { mask, maskChar, charsRules } = maskOptions;

  if (!character) {
    return false;
  }

  if (isPermanentChar(maskOptions, pos)) {
    return mask[pos] === character;
  }

  var ruleChar = mask[pos];
  var charRule = charsRules[ruleChar];

  return (new RegExp(charRule)).test(character)
         ||
         (allowMaskChar && character === maskChar);
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
    value = insertRawSubstr(maskOptions, '', value, 0);
    value = value.slice(0, getFilledLength(maskOptions, value));

    if (value.length < prefix.length) {
      value = prefix;
    }

    return value;
  }

  if (value) {
    var emptyValue = formatValue(maskOptions, '');
    return insertRawSubstr(maskOptions, emptyValue, value, 0);
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

function replaceSubstr(value, newSubstr, pos) {
  return value.slice(0, pos) + newSubstr + value.slice(pos + newSubstr.length);
}

export function insertRawSubstr(maskOptions, value, substr, pos) {
  var { mask, maskChar, prefix } = maskOptions;
  var isInputFilled = isFilled(maskOptions, value);
  substr = substr.split('');

  if (!maskChar && pos > value.length) {
    value += mask.slice(value.length, pos);
  }

  for (var i = pos; i < mask.length && substr.length;) {
    var isPermanent = isPermanentChar(maskOptions, i);
    if (!isPermanent || mask[i] === substr[0]) {
      var character = substr.shift();
      if (isAllowedChar(maskOptions, i, character, true)) {
        if (i < value.length) {
          if (maskChar || isInputFilled || i < prefix.length) {
            value = replaceSubstr(value, character, i);
          } else {
            value = formatValue(maskOptions, value.substr(0, i) + character + value.substr(i));
          }
        } else if (!maskChar) {
          value += character;
        }
        ++i;
      }
    } else {
      if (!maskChar && i >= value.length) {
        value += mask[i];
      } else if (maskChar && isPermanent && substr[0] === maskChar) {
        substr.shift();
      }
      ++i;
    }
  }
  return value;
}

export function getRawSubstrLength(maskOptions, value, substr, pos) {
  var { mask } = maskOptions;
  var i = pos;
  substr = substr.split('');
  while (i < mask.length && substr.length) {
    if (!isPermanentChar(maskOptions, i) || mask[i] === substr[0]) {
      var character = substr.shift();
      if (isAllowedChar(maskOptions, i, character, true)) {
        ++i;
      }
    } else {
      ++i;
    }
  }
  return i - pos;
}
