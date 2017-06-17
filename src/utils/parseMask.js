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
      lastEditablePos: null,
      permanents: []
    };
  }
  var str = '';
  var permanents = [];
  var isPermanent = false;
  var lastEditablePos = null;

  mask.split('')
      .forEach((character) => {
        if (!isPermanent && character === '\\') {
          isPermanent = true;
        } else {
          if (isPermanent || !charsRules[character]) {
            permanents.push(str.length);
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
    mask: str,
    lastEditablePos: lastEditablePos,
    permanents: permanents
  };
}
