import { checkObject, checkNumber } from "./validation-util";

export const parseNumber = (data: any) =>
  /\./.test(data) ? parseFloat(data) : parseInt(data);

export const parseDOM = (
  tagString: string,
  type: DOMParserSupportedType = "text/html"
) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(tagString, type);
  const element = doc.body.firstChild;

  return element;
};

export const parseObject = (data: any) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export const parseInvalid = (data: any) => {
  data = data && data.trim();

  switch (data) {
    case "undefined":
      data = undefined;
      break;
    case "null":
      data = null;
      break;
  }
  return data;
};

export const transformToDataType = (data: any) => {
  data = parseInvalid(data);

  if (!data) return data;

  if (checkNumber(data)) return parseNumber(data);

  if (checkObject(data)) return parseObject(data);

  return data;
};
