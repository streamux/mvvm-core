export const argumentParser = (arg) => {
  if (!arg) return [];

  if (arg.indexOf(",") !== -1)
    return arg.split(",").map((data) => transformToDataType(data));

  const parsedData = transformToDataType(arg);
  return [parsedData];
};
