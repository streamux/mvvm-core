import { transformToDataType } from '../utils/parser-util';

export const argumentParser = (arg: string) => {
  if (!arg) return [];

  if (arg.indexOf(',') !== -1) {
    return arg.split(',').map(data => transformToDataType(data));
  }

  const parsedData = transformToDataType(arg);
  return [parsedData];
};
