import { getUniqKey } from '../utils/string-util';
import { argumentParser } from './argument-parser';

export const templateParser = (template: string, target: any) => {
  const eventMap: { [key: string]: any } = {};
  let containerId = '';
  let idIndex = 0;

  // Search 'id' in container node
  template = template.replace(/^(?:\s+)?(<)([^>]*)(>)/gi, (origin, prefix, attributes, suffix) => {
    attributes = attributes || '';

    // Extract conatiner's id
    const hasAttributeId = /id=/gi.test(attributes);

    if (hasAttributeId) {
      containerId = attributes.replace(/.*?id="([^"]*)"(?:[^>]*)?/gi, '$1');
      return prefix + attributes + suffix;
    }

    containerId = `item_container_${getUniqKey(target.$uid, idIndex++)}`;

    // 백틱 다음 id 앞쪽 공백 한칸 필요
    const attrId = ` id="${containerId}"`;
    return prefix + attributes + attrId + suffix;
  });

  // Convert a custom event into a system event
  template = template.replace(
    /(?:@|on:)([^=]*)="([^"(]*)(?:\(([^)]*)?\))?"/gim,
    (origin, eventType, methodName, arg) => {
      target.addEvent(eventType, target.listener);

      // A structure that may refer to event information is stored as a map.
      const eventId = `${methodName}_${getUniqKey(target.$uid, idIndex++)}`;
      const params = argumentParser(arg);

      eventMap[eventId] = {
        eventType,
        methodName,
        params
      };

      return 'data-event-id="' + eventId + '"';
    }
  );

  // add a conditional statement identifier info dataset
  template = template.replace(/\s(v-else-if|v-if)\s?=\s?"([^"]*)"/gim, (origin, prop, value) => {
    return ` data-${prop}="${value}"`;
  });

  template = template.replace(/\sv-else/gim, origin => {
    return ` data-v-else`;
  });

  return { template, eventMap, containerId };
};
