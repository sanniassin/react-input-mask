import { defaultFormatChars } from "./constants";

export default function(mask, maskChar, formatChars) {
  let parsedMaskString = "";
  let prefix = "";
  let lastEditablePosition = null;
  const permanents = [];

  if (formatChars == null) {
    formatChars = defaultFormatChars;
  }

  if (!mask || typeof mask !== "string") {
    return {
      maskChar,
      formatChars,
      mask: null,
      prefix: null,
      lastEditablePosition: null,
      permanents: []
    };
  }

  let isPermanent = false;
  mask.split("").forEach(character => {
    if (!isPermanent && character === "\\") {
      isPermanent = true;
    } else {
      if (isPermanent || !formatChars[character]) {
        permanents.push(parsedMaskString.length);
        if (parsedMaskString.length === permanents.length - 1) {
          prefix += character;
        }
      } else {
        lastEditablePosition = parsedMaskString.length + 1;
      }
      parsedMaskString += character;
      isPermanent = false;
    }
  });

  return {
    maskChar,
    formatChars,
    prefix,
    mask: parsedMaskString,
    lastEditablePosition,
    permanents
  };
}
