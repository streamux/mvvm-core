/**
 * 2023.10.21
 *
 * Apply style to component tags : done
 *
 **/

// Util
const getUniqKey = (uid, eventNo) => `${Date.now().toString(34)}${uid}${eventNo}`;
const isNativeEvent = type => window['on' + type] === null;
const checkNumber = data => /^[+%*-]?\d*(?:\.\d*)?$/.test(data);
const checkObject = data => /^\[|\{.*\]|\}$/.test(data);
const parseNumber = data => (/\./.test(data) ? parseFloat(data) : parseInt(data));

const parseDOM = tagString => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(tagString, 'text/html');
  const element = doc.body.firstChild;
  return element;
};

const parseObject = data => {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

const parseInvalid = data => {
  switch (data) {
    case 'undefined':
      data = undefined;
      break;
    case 'null':
      data = null;
      break;
  }
  return data;
};

const mergeToQueryString = obj => {
  let queryString = '';
  Object.entries(obj).forEach(([key, value]) => {
    queryString += value ? ` ${key}="${value}"` : ` ${key}`;
  });
  return queryString;
};

// Transform to Data
const transformToDataType = data => {
  if (!data) return parseInvalid(data);

  data = data.trim();

  if (checkNumber(data)) return parseNumber(data);

  if (checkObject(data)) return parseObject(data);

  return data;
};

// Module
const addModule = module => {
  let uid = 0;

  return {
    createComponent: () => {
      uid++;
      const component = new module();
      component.$uid = uid;

      return component;
    }
  };
};

// Parser
const argumentParser = arg => {
  if (!arg) return [];

  if (arg.indexOf(',') !== -1) return arg.split(',').map(data => transformToDataType(data));

  const parsedData = transformToDataType(arg);

  return [parsedData];
};

const componentParser = (template, target) => {
  let components = template || '';

  // Remove previously registered events
  target.deleteRecordedEvents();

  // Look up modules registered in an instance
  target.modules.forEach((value, key) => {
    // Look up registered components against a module key
    components = components.replace(
      new RegExp('(?:<' + key + '([^>]*)?>(.*)?</' + key + '[^>]*>)', 'gim'),
      (origin, attributes, slot) => {
        attributes = (attributes && attributes.trim()) || '';

        // Convert a component event into a native event
        attributes = attributes.replace(
          /(?:\s+)?@([^=]*)(?:\s)?=(?:\s)?"([^"]*)"/g,
          (origin, eventType, eventHandler) => {
            const eventListener = target && target[eventHandler];

            if (eventType && eventListener) {
              target.addEvent(eventType, eventListener.bind(target));
            }

            return '';
          }
        );

        // Create a Component instant if a tag matches the module name
        const component = target.modules.get(key).createComponent();

        // Convert component tag's props into a class properties
        attributes = attributes.replace(/(?:\s+)?:([^=]*)="([^"]*)"/g, (origin, propName, propValue) => {
          component[propName] = transformToDataType(propValue);
          return '';
        });

        let renderedTemplate = component.render();

        // Add the style properties of the component tag to the template
        renderedTemplate = renderedTemplate.replace(
          /^(<[^\s]*)([^>]*)(>)/gi,
          (origin, tempPrefix, tempAttributes, tempSuffix) => {
            const tempAttrObj = {};

            // Template's Properties
            tempAttributes = tempAttributes
              .replace(/(?:([^\s]*)\s?=\s?"([^"]*)")/gi, (origin, attrKey, attrValue) => {
                tempAttrObj[attrKey] = attrValue;
                return '';
              })
              .replace(/\s+/, '');

            // Mix Component's Properties into Template's Properties
            attributes.replace(/(?:([^\s]*)\s?=\s?"([^"]*)")/gi, (origin, attrKey, attrValue) => {
              if (attrKey === 'id' || !tempAttrObj[attrKey]) {
                tempAttrObj[attrKey] = attrValue;
                return;
              }

              const addLastStringColon = str => (/;$/.test(tempAttrValue) ? ' ' : '; ');
              let tempAttrValue = tempAttrObj[attrKey];

              if (tempAttrValue) {
                tempAttrValue += addLastStringColon(tempAttrValue);
                tempAttrValue += attrValue + ';';
                tempAttrObj[attrKey] = tempAttrValue;
              }
            });

            attributes.replace(/(v-else)?/gi, (origin, attrKey) => {
              if (attrKey) {
                tempAttrObj[attrKey] = '';
              }
            });

            tempAttributes = mergeToQueryString(tempAttrObj);
            return tempPrefix + tempAttributes + tempSuffix;
          }
        );

        return renderedTemplate;
      }
    );
  });

  return { components };
};

const templateParser = (template, target) => {
  const eventMap = {};
  let containerId = '';
  let idIndex = 0;

  // Search 'id' in container node
  template = template.replace(/^(<)([^>]*)(>)/gi, (origin, prefix, attributes, suffix) => {
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
  template = template.replace(/on:([^=]*)="([^"(]*)(?:\(([^)]*)?\))?"/gim, (origin, eventType, methodName, arg) => {
    target.addEvent(eventType, target.listener);

    // A structure that may refer to event information is stored as a map.
    const eventId = `${methodName}_${getUniqKey(target.$uid, idIndex++)}`;
    const params = argumentParser(arg);

    eventMap[eventId] = {
      eventType,
      methodName,
      params
    };

    return `data-event-id="${eventId}"`;
  });

  return { template, eventMap, containerId };
};

class EventManager {
  static $expert = window || {};

  static create() {
    return new EventManager();
  }

  constructor() {
    this.events = [];
    this._eventMap = {};
  }

  get expert() {
    return EventManager.$expert;
  }

  get eventMap() {
    return this._eventMap;
  }

  set eventMap(events) {
    return Object.assign(this._eventMap, events);
  }

  recordEvent(e) {
    this.events.push(e);
  }

  deleteRecordedEvents() {
    this.events.forEach(e => {
      this.removeEvent(e.type, e.listener);
    });
    this.events = [];
  }

  addEvent(type, listener) {
    const hasSameEvent = this.events.find(e => e.type === type) && isNativeEvent(type);

    if (hasSameEvent) return;

    if ((type, listener)) {
      this.expert.addEventListener(type, listener);
      this.recordEvent({ type, listener });
    }
  }

  removeEvent(type, listener) {
    if ((type, listener)) {
      this.expert.removeEventListener(type, listener);
    }
  }
}

class ModuleManager {
  static create() {
    return new ModuleManager();
  }

  constructor() {
    this.modulesMap = new Map();
  }

  get modules() {
    return this.modulesMap;
  }

  set modules(modules = {}) {
    Object.entries(modules).forEach(([key, module]) => {
      if (!module) return;

      this.modulesMap.set(key, addModule(module));
    });
  }
}

class BaseComponent extends Object {
  constructor() {
    super();

    console.log(`${this.constructor.name}::initialize!!`);

    // basic properties
    this.uid = 0;
    this.containerId = '';

    // initialize module
    this.moduleManager = ModuleManager.create();
    this.modules = this.components();

    // event properties
    this.eventManager = EventManager.create();
    this.listener = this.listener.bind(this);

    this.setup();
  }

  get $uid() {
    return this.uid;
  }

  set $uid(num) {
    this.uid = num;
  }

  get className() {
    return this.constructor.name;
  }

  get eventMap() {
    return this.eventManager.eventMap;
  }

  set eventMap(eventMap) {
    this.eventManager.eventMap = eventMap;
  }

  get modules() {
    return this.moduleManager.modules;
  }

  set modules(modules = {}) {
    this.moduleManager.modules = modules;
  }

  components() {
    return {};
  }

  setup() {}

  addEvent(type, listener) {
    this.eventManager.addEvent(type, listener);
  }

  deleteRecordedEvents() {
    this.eventManager.deleteRecordedEvents();
  }

  emit(type, data) {
    this.eventManager.expert.dispatchEvent(new CustomEvent(type, data));
  }

  listener(e) {
    const id = e.target?.dataset?.eventId;

    if (!id) return;

    const event = this.eventMap[id];
    const methodName = event && event.methodName;
    const params = event && event.params;

    this[methodName] && this[methodName].apply(this, params);
  }

  setState(state) {
    this.render();
  }

  template() {
    return '';
  }

  render() {
    const element = this.containerId && document.querySelector(this.containerId);
    const { components } = componentParser(this.template(), this);
    const { eventMap, template, containerId } = templateParser(components, this);

    this.eventMap = eventMap;
    this.containerId = containerId && '#' + containerId;

    if (element) {
      const parsedTemplate = parseDOM(template);
      element.parentNode.replaceChild(parsedTemplate, element);
      return '';
    }

    return template;
  }
}

// component declare
class MethodEvent extends BaseComponent {
  get imageBorder() {
    return this._imageBorder;
  }

  set imageBorder(num) {
    this._imageBorder = num;
  }

  setup() {
    this.image = '';
    this.imageBorder = 0;
  }

  clickMethod(param) {
    // console.log('Methods BUTTON!!', param);
    this._imageBorder++;
    this.setState();
  }

  clickMethod2(param) {
    // console.log('Methods BUTTON2', param);
    this._imageBorder--;
    this.setState();

    this.emit('methodEvent', {
      detail: {
        message: 'Method Event Handler'
      }
    });
  }

  template() {
    return `<div style="padding: 15px 0; border: 1px solid #f00">
        <button on:click="clickMethod">Image Line ++</button>
        <button on:click="clickMethod2">Image Line --</button>
        <p><img src="${this.image}" style="width:100%; height:100%; border: ${this.imageBorder}px solid #0f0" /></p>
      </div>`;
  }
}

class ButtonEvent extends BaseComponent {
  get count() {
    return this._count;
  }

  set count(value) {
    this._count = value;
  }

  setup() {}

  minus(param) {
    // console.log('Events Minus!!', param);
    this.setState(this.count--);
  }

  plus(param) {
    // console.log('Events Plus!!', param);
    this.setState(this.count++);
  }

  multi(num, num2, arr, obj) {
    // console.log('Events Calc!!', num, num2, arr, obj);
    this.count *= num;
    this.setState(this.count);
  }

  dispatchIncrease(num) {
    // console.log('Dispatch::increase!!', typeof(num), num);
    // this.count += num;

    this.emit('increase', {
      detail: {
        count: this.count
      }
    });

    // this.setState(this.count);
  }

  dispatchDecrease(num) {
    // console.log('Dispatch::decrease!!', typeof(num), num);
    // this.count += num;

    this.emit('decrease', {
      detail: {
        count: this.count
      }
    });

    // this.setState(this.count);
  }

  loadHandler() {
    console.log('loadHandler');
  }

  unloadHandler() {
    console.log('unloadHandler');
  }

  template() {
    return `<div style="border: 1px solid #f00">
        <p style="padding: 2px;border: 1px solid #f00">
          ButtonEvent:count = ${this.count}
        </p>
        <p>
          <button on:click="dispatchIncrease">Events Dispatcher::increase</button>
          <button on:click="dispatchDecrease">Events Dispatcher::decrease</button>
        </p>
        <p><button on:click="plus">Events Plus</button></p>
        <p><button on:click="minus">Events Minus</button></p>
        <p><button on:click="multi(2, 1, ["aa"], {"aa":"test"})">Events Multi</button></p>
      </div>`;
  }
}

class App extends BaseComponent {
  components() {
    return {
      'button-event': ButtonEvent,
      'method-event': MethodEvent
    };
  }

  setup() {
    this.count = 7;
  }

  mount(rootId) {
    this.containerId = rootId;
    this.render();
  }

  increaseHandler(e) {
    console.log('App:increaseHandler', e.detail.count);

    this.count = e.detail.count + 5;
    this.render();
  }

  decreaseHandler(e) {
    console.log('App:decreaseHandler', e.detail.count);

    this.count = e.detail.count - 5;
    this.render();
  }

  methodEventHandler(e) {
    console.log('App:methodEventHandler', e.detail.message);
  }

  appHandler() {
    console.log('appHandler');
  }

  template() {
    return `
      <div id="container" style="border:2px solid #f0f">
        <button on:click="appHandler">app button</button>
        <p style="border:1px solid #0ff">App:count = ${this.count}</p>
        <ul>
        ${[1, 2, 3]
          .map((no, index) => {
            return `<li>list : ${no * this.count} - ${index}</li>`;
          })
          .join('')}
        </ul>
        <button-event 
          :count="${this.count}" 
          @increase="increaseHandler" 
          @decrease="decreaseHandler">
            slot contents
        </button-event>
        <button-event 
          :count="${this.count}" 
          @increase="increaseHandler" 
          @decrease="decreaseHandler">
            slot contents
        </button-event>
        <button-event 
          :count="${this.count}" 
          @increase="increaseHandler" 
          @decrease="decreaseHandler">
            slot contents
        </button-event>
        <method-event 
          v-if="${this.count === 0}" 
          style="background-color: #00f">
        </method-event>
        <method-event 
          v-esle-if="${this.count === 1}" 
          style="background-color: #00b">
        </method-event>
        <method-event 
          v-else 
          style="background-color: #00c">
        </method-event>
        <method-event 
          :image="https://upload.wikimedia.org/wikipedia/commons/1/10/Marvel_Studios_2016_logo.svg" 
          @methodEvent="methodEventHandler">
        </method-event>
      </div>`;
  }
}

// Create App
export const app = new App().mount('#app');
