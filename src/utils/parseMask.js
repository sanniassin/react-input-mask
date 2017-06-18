import { defaultCharsRules, defaultMaskChar } from '../constants';

export default function(mask, maskChar, charsRules) {
  if (maskChar === undefined) {
    maskChar = defaultMaskChar;
  }
  if (charsRules == null) {
    charsRules = defaultCharsRules;
  }

  if (!mask || typeof mask !== 'string') {
    return {
      maskChar,
      charsRules,
      mask: null,
      prefix: null,
      lastEditablePos: null,
      permanents: []
    };
  }
  var str = '';
  var prefix = '';
  var permanents = [];
  var isPermanent = false;
  var lastEditablePos = null;

  mask.split('')
      .forEach((character, i) => {
        if (!isPermanent && character === '\\') {
          isPermanent = true;
        } else {
          if (isPermanent || !charsRules[character]) {
            permanents.push(str.length);
            if (prefix.length === i) {
              prefix += character;
            }
          } else {
            lastEditablePos = str.length + 1;
          }
          str += character;
          isPermanent = false;
        }
      });

  return {
    maskChar,
    charsRules,
    prefix,
    mask: str,
    lastEditablePos: lastEditablePos,
    permanents: permanents
  };
}
