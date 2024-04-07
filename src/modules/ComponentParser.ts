export const componentParser = (template, target) => {
  let components = template || "";

  // Remove previously registered events
  target.deleteRecordedEvents();

  // Look up modules registered in an instance
  target.modules.forEach((value, key) => {
    // Look up registered components against a module key
    components = components.replace(
      new RegExp("(?:<" + key + "([^>]*)?>(.*)?</" + key + "[^>]*>)", "gim"),
      (origin, attributes, slot) => {
        attributes = (attributes && attributes.trim()) || "";

        // Convert a component event into a native event
        attributes = attributes.replace(
          /(?:\s+)?@([^=]*)(?:\s)?=(?:\s)?"([^"]*)"/g,
          (origin, eventType, eventHandler) => {
            const eventListener = target && target[eventHandler];

            if (eventType && eventListener) {
              target.addEvent(eventType, eventListener.bind(target));
            }

            return "";
          }
        );

        // Create a Component instant if a tag matches the module name
        const component = target.modules.get(key).createComponent();

        // Convert component tag's props into a class properties
        attributes = attributes.replace(
          /(?:\s+)?:([^=]*)="([^"]*)"/g,
          (origin, propName, propValue) => {
            // console.log('propName::', propName, propValue);
            component[propName] = transformToDataType(propValue);

            return "";
          }
        );

        //-- return component's template
        let renderedTemplate = component.render();

        // Add the style properties of the component tag to the template's root tag
        renderedTemplate = renderedTemplate.replace(
          /^(<[^\s]*)([^>]*)(>)/gi,
          (origin, tempPrefix, tempAttributes, tempSuffix) => {
            const tempAttrObj = {};

            // extract component properties
            tempAttributes = tempAttributes
              .replace(
                /(?:([^\s]*)\s?=\s?"([^"]*)")/gi,
                (origin, attrKey, attrValue) => {
                  tempAttrObj[attrKey] = attrValue;
                  return "";
                }
              )
              .replace(/\s+/, "");

            console.log("======", attributes);
            // Mix Component's Properties into Template's Properties
            attributes.replace(
              /(?:([^\s]*)\s?=\s?"([^"]*)")/gi,
              (origin, compoAttrKey, compoAttrValue) => {
                if (!tempAttrObj[compoAttrKey]) {
                  tempAttrObj[compoAttrKey] = compoAttrValue;
                }

                // add a comma at the end of the style attribute
                let tempAttrValue = tempAttrObj[compoAttrKey];

                if (/style/i.test(compoAttrKey) && tempAttrValue) {
                  tempAttrValue += /;$/.test(tempAttrValue) ? " " : "; ";
                  tempAttrObj[compoAttrKey] = tempAttrValue.trim();
                }
              }
            );

            attributes.replace(
              /(v-else)(-if)?/gi,
              (origin, compoAttrKey, subCompoAttrKey) => {
                if (!subCompoAttrKey) {
                  tempAttrObj[compoAttrKey] = "";
                }
              }
            );

            tempAttributes = mergeToQueryString(tempAttrObj);

            // console.log('tempAttributes', tempPrefix, '+++',  tempAttributes, '+++', tempSuffix);
            return tempPrefix + tempAttributes + tempSuffix;
          }
        );

        return renderedTemplate;
      }
    );
  });

  // console.log('components', components);
  return { components };
};
