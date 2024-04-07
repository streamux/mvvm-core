export const camelToKebab = (str) => {
  if (!str) return "";

  if (typeof str !== "string") return str.toString();

  return str.replace(/([A-Z])/g, (origin, word) => `-${word.toLowerCase()}`);
};

export const getUniqKey = (uid, eventNo) =>
  `${Date.now().toString(34)}${uid}${eventNo}`;

export const isNativeEvent = (type) => window["on" + type] === null;

export const hasEqualEvent = (events, type) =>
  !!events.find((e) => e.type === type);

export const checkNumber = (data) => /^[+%*-]?\d*(?:\.\d*)?$/.test(data);

export const checkObject = (data) => /^\[|\{.*\]|\}$/.test(data);

export const mergeToQueryString = (obj) => {
  let queryString = "";
  Object.entries(obj).forEach(([key, value]) => {
    queryString += value ? ` ${key}="${value}"` : ` ${key}`;
  });

  return queryString;
};
