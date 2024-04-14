export const getUniqKey = (uid: number, eventNo: number) => `${Date.now().toString(34)}${uid}${eventNo}`;

export const camelToKebab = (str: any) => {
  if (!str) return '';

  if (typeof str !== 'string') return str.toString();

  return str.replace(/([A-Z])/g, (origin, word) => `-${word.toLowerCase()}`);
};

export const mergeToQueryString = (obj: any) => {
  let queryString = '';
  Object.entries(obj).forEach(([key, value]) => {
    queryString += value ? ` ${key}="${value}"` : ` ${key}`;
  });

  return queryString;
};
