export function isPermanentChar(maskOptions, pos) {
  return maskOptions.permanents.indexOf(pos) !== -1;
}

export function isAllowedChar(maskOptions, character, pos, allowMaskChar = false) {
  var { mask, maskChar, charsRules } = maskOptions;

  if (isPermanentChar(maskOptions, pos)) {
    return mask[pos] === character;
  }

  var ruleChar = mask[pos];
  var charRule = charsRules[ruleChar];

  return (new RegExp(charRule)).test(character || '')
         ||
         (allowMaskChar && character === maskChar);
}

export function isEmpty(maskOptions, value) {
  return !value.split('').some((character, i) =>
    !isPermanentChar(maskOptions, i) && isAllowedChar(maskOptions, character, i)
  );
}

export function getPrefix(maskOptions) {
  var prefix = '';
  var { mask } = maskOptions;
  for (var i = 0; i < mask.length && isPermanentChar(maskOptions, i); ++i) {
    prefix += mask[i];
  }
  return prefix;
}

export function getFilledLength(maskOptions, value) {
  var i;
  var { maskChar } = maskOptions;

  if (!maskChar) {
    return value.length;
  }

  for (i = value.length - 1; i >= 0; --i) {
    var character = value[i];
    if (!isPermanentChar(maskOptions, i) && isAllowedChar(maskOptions, character, i)) {
      break;
    }
  }

  return ++i || getPrefix(maskOptions).length;
}

export function isFilled(maskOptions, value) {
  return getFilledLength(maskOptions, value) === maskOptions.mask.length;
}

function createNullFilledArray(length) {
  var array = [];
  for (var i = 0; i < length; i++) {
    array[i] = null;
  }
  return array;
}

export function formatValue(maskOptions, value) {
  var { maskChar, mask } = maskOptions;

  if (!maskChar) {
    var prefix = getPrefix(maskOptions);
    var prefixLen = prefix.length;
    value = insertRawSubstr(maskOptions, '', value, 0);
    while (value.length > prefixLen && isPermanentChar(maskOptions, value.length - 1)) {
      value = value.slice(0, value.length - 1);
    }

    if (value.length < prefixLen) {
      value = prefix;
    }

    return value;
  }

  if (value) {
    var emptyValue = formatValue(maskOptions, '');
    return insertRawSubstr(maskOptions, emptyValue, value, 0);
  }

  return value
    .split('')
    .concat(createNullFilledArray(mask.length - value.length))
    .map((character, pos) => {
      if (isAllowedChar(maskOptions, character, pos)) {
        return character;
      } else if (isPermanentChar(maskOptions, pos)) {
        return mask[pos];
      }
      return maskChar;
    })
    .join('');
}

export function clearRange(maskOptions, value, start, len) {
  var end = start + len;
  var { maskChar, mask } = maskOptions;

  if (!maskChar) {
    var prefixLen = getPrefix(maskOptions).length;
    value = value.split('')
                 .filter((character, i) => i < prefixLen || i < start || i >= end)
                 .join('');

    return formatValue(maskOptions, value);
  }

  return value
    .split('')
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
  var { mask, maskChar } = maskOptions;
  var isInputFilled = isFilled(maskOptions, value);
  var prefixLen = getPrefix(maskOptions).length;
  substr = substr.split('');

  if (!maskChar && pos > value.length) {
    value += mask.slice(value.length, pos);
  }

  for (var i = pos; i < mask.length && substr.length;) {
    var isPermanent = isPermanentChar(maskOptions, i);
    if (!isPermanent || mask[i] === substr[0]) {
      var character = substr.shift();
      if (isAllowedChar(maskOptions, character, i, true)) {
        if (i < value.length) {
          if (maskChar || isInputFilled || i < prefixLen) {
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
      if (isAllowedChar(maskOptions, character, i, true)) {
        ++i;
      }
    } else {
      ++i;
    }
  }
  return i - pos;
}
