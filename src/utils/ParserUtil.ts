import { checkObject, checkNumber } from "./CommonUtil";

export const parseNumber = (data) =>
  /\./.test(data) ? parseFloat(data) : parseInt(data);

export const parseDOM = (tagString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(tagString, "text/html");
  const element = doc.body.firstChild;

  return element;
};

export const parseObject = (data) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export const parseInvalid = (data) => {
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

const transformToDataType = (data) => {
  const data = parseInvalid(data);

  if (!data) return data;

  if (checkNumber(data)) return parseNumber(data);

  if (checkObject(data)) return parseObject(data);

  return data;
};
