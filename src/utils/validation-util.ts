export const checkNumber = (data: any) => /^[+%*-]?\d*(?:\.\d*)?$/.test(data);

export const checkObject = (data: any) => /^\[|\{.*\]|\}$/.test(data);
