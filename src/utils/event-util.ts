export const isNativeEvent = (type: string) =>
  window[`on${type}` as any] === null;

export const hasEqualEvent = (events: Array<any>, type: string) =>
  !!events.find((e: { [key: string]: any }) => e.type === type);
