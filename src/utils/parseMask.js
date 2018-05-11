import { defaultFormatChars, defaultMaskChar } from '../constants/index';

export default function(mask, maskChar, formatChars) {
  if (maskChar === undefined) {
    maskChar = defaultMaskChar;
  }
  if (formatChars == null) {
    formatChars = defaultFormatChars;
  }

  if (!mask || typeof mask !== 'string') {
    return {
      maskChar,
      formatChars,
      mask: null,
      prefix: null,
      lastEditablePosition: null,
      permanents: []
    };
  }
  var str = '';
  var prefix = '';
  var permanents = [];
  var isPermanent = false;
  var lastEditablePosition = null;

  mask
    .split('')
    .forEach((character) => {
      if (!isPermanent && character === '\\') {
        isPermanent = true;
      } else {
        if (isPermanent || !formatChars[character]) {
          permanents.push(str.length);
          if (str.length === permanents.length - 1) {
            prefix += character;
          }
        } else {
          lastEditablePosition = str.length + 1;
        }
        str += character;
        isPermanent = false;
      }
    });

  return {
    maskChar,
    formatChars,
    prefix,
    mask: str,
    lastEditablePosition,
    permanents
  };
}
