/**
 * 2023.10.21
 * 
 * convert into conditional statements : done
 *
 **/

//----- Util
const camelToKebab = (str) => {
  if (!str)
    return '';
  
  if (typeof(str) !== 'string')
    return str.toString();
  
  return str.replace(/([A-Z])/g, (origin, word) => `-${word.toLowerCase()}`)
};

const getUniqKey = (uid, eventNo) => `${Date.now().toString(34)}${uid}${eventNo}`;
const isNativeEvent = (type) => window['on' + type] === null;
const hasEqualEvent = (events, type) => !!events.find(e => e.type === type);
const checkNumber = (data) => /^[+%*-]?\d*(?:\.\d*)?$/.test(data);
const checkObject = (data) => /^\[|\{.*\]|\}$/.test(data);
const parseNumber = (data) => /\./.test(data) ?
          parseFloat(data) : parseInt(data);

const parseDOM = (tagString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(tagString, 'text/html');
  const element = doc.body.firstChild;
  
  return element;
};

const parseObject = (data) => {
  try {
    return JSON.parse(data);
  } catch(e) {
    return null;
  };
};

const parseInvalid = (data) => {
  switch (data) {
    case 'undefined':
      data = undefined;
      break;
    case 'null':
      data = null;
      break;
  }
  return data;
}

const mergeToQueryString = (obj) => {
  let queryString = '';
  Object.entries(obj).forEach(([key, value]) => {
    queryString += value ? ` ${key}="${value}"` : ` ${key}`;
  });
  
  return queryString;
};


// Transform to Data
const transformToDataType = (data) => {
  
  if (!data)
    return parseInvalid(data);
  
  data = data.trim();
  
  // console.log(typeof(data), data);
  // console.log('parsedNumber', parseNumber(data));
  // console.log('parsedNumber', parseNumber(data));
  
  if (checkNumber(data))
    return parseNumber(data);
  
  if (checkObject(data))
    return parseObject(data);

  return data;
};

// Module
const addModule = (module) => {
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


//----- Argument Parser
const argumentParser = (arg) => {
  
  if (!arg)
    return [];
  
  if (arg.indexOf(',') !== -1)
    return arg.split(',').map((data) => transformToDataType(data));
  
  const parsedData = transformToDataType(arg);
  return [parsedData];
}; 


//----- Component Parser
const componentParser = (template, target) => {
  
  let components = template || '';
  
  // Remove previously registered events
  target.deleteRecordedEvents();
  
  // Look up modules registered in an instance
  target.modules.forEach((value, key) => {
    
    // Look up registered components against a module key
    components = components.replace(new RegExp('(?:<'+key+'([^>]*)?>(.*)?<\/'+key+'[^>]*>)', 'gim'), (origin, attributes, slot) => {
      
      attributes = attributes && attributes.trim() || ''
      
      // Convert a component event into a native event
      attributes = attributes.replace(/(?:\s+)?@([^=]*)(?:\s)?=(?:\s)?"([^"]*)"/g, (origin, eventType, eventHandler) => {
        
        const eventListener = target && target[eventHandler];
        
        if (eventType && eventListener) {
          target.addEvent(eventType, eventListener.bind(target));
        }
        
        return '';
      });
     
      // Create a Component instant if a tag matches the module name
      const component = target.modules.get(key).createComponent();
      
      // Convert component tag's props into a class properties
      attributes = attributes.replace(/(?:\s+)?:([^=]*)="([^"]*)"/g, (origin, propName, propValue) => { 
        // console.log('propName::', propName, propValue);
        component[propName] = transformToDataType(propValue);
        
        return '';
      });
      
      //-- return component's template
      let renderedTemplate = component.render();
      
      // Add the style properties of the component tag to the template's root tag
      renderedTemplate = renderedTemplate.replace(/^(<[^\s]*)([^>]*)(>)/gi, (origin, tempPrefix, tempAttributes, tempSuffix) => {
        
        const tempAttrObj = {};
        
        // extract component properties
        tempAttributes = tempAttributes.replace(/(?:([^\s]*)\s?=\s?"([^"]*)")/gi, (origin, attrKey, attrValue) => {
          tempAttrObj[attrKey] = attrValue;
          return '';
        }).replace(/\s+/, '');
        
        // Mix Component's Properties into Template's Properties
        attributes.replace(/(?:([^\s]*)\s?=\s?"([^"]*)")/gi, (origin, compoAttrKey, compoAttrValue) => {
          
          if (!tempAttrObj[compoAttrKey]) {
            tempAttrObj[compoAttrKey] = compoAttrValue;
          }

          // add a comma at the end of the style attribute
          let tempAttrValue = tempAttrObj[compoAttrKey];
          
          if (/style/i.test(compoAttrKey) && tempAttrValue) {
            tempAttrValue += /;$/.test(tempAttrValue) ? ' ' : '; ';
            tempAttrObj[compoAttrKey] = tempAttrValue.trim();
          }
        });
        
        attributes.replace(/(?:(v-else)[^-])?/gi, (origin, compoAttrKey) => {
          if (compoAttrKey) {
            tempAttrObj[compoAttrKey] = '';
          }
        });
        
        tempAttributes = mergeToQueryString(tempAttrObj);
        
        // console.log('tempAttributes', tempPrefix, '-',  tempAttributes, '-', tempSuffix);
        return tempPrefix + tempAttributes + tempSuffix;
      });
      
      return renderedTemplate;
    });
  });
  
  // console.log('components', components);
  return {components};
};


//----- Template Parser
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
  template = template.replace(/(?:@|on:)([^=]*)="([^"(]*)(?:\(([^)]*)?\))?"/gim, (origin, eventType, methodName, arg) => {

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
  
  // add a conditional statement identifier info dataset
  template = template.replace(/\s(v-else-if|v-if)\s?=\s?"([^"]*)"/gim, (origin, prop, value) => ` data-${prop}="${value}"`);
  
  template = template.replace(/\sv-else/gim, (origin) => {
    return ` data-v-else`;
  });
  
  return {template, eventMap, containerId};
};


//----- Condition Statement Parser
// remove condition's element
const removeConditionElement = (elList) => {
  
  let isNextStepRemoved = false;
  if (!elList)
    return;

  elList.forEach((el) => {
    const ifElseIfCondition = el.dataset['vIf'||'vElseIf'];

    if (ifElseIfCondition === 'false' || isNextStepRemoved === true) {
      el.remove();

    } else {

      // remove dummy prop not to need
      const datasets = el.dataset;
      const conditionPattern = /^vif|velseif|velse/i;

      Object.entries(datasets).forEach(([key, value]) => {
        if (conditionPattern.test(key))
          el.removeAttribute('data-' + camelToKebab(key));
      });
    }

    if (ifElseIfCondition === 'true') {
      isNextStepRemoved = true;
    }
  });

  // console.log('----------------------');
};

// search element
const handleElement = (el) => {
  
  let nextEl = el;
  let elList = [nextEl];

  do {
    nextEl =  nextEl.nextElementSibling;
    if (nextEl) {
      elList.push(nextEl)
    }

  } while(nextEl && nextEl.dataset['vElseIf'||'vElse']);

  removeConditionElement(elList);
  elList = null;
};

const conditionStatementParser = (doc) => {
  
  const container = doc;
  const elements = doc.querySelectorAll('[data-v-if]');
  elements.forEach((el) => handleElement(el));
  
  return container;
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
  
  get hasSamdEvent() {
    return this.events.find(e => e.type === type);
  }
  
  recordEvent(e) {
    this.events.push(e);
  }
  
  deleteRecordedEvents() {
    // console.log('deleteRecordedEvents', JSON.stringify(this.events));
    this.events.forEach((e) => this.removeEvent(e.type, e.listener));
    this.events = [];  
  }
  
  addEvent(type, listener) {
    if (hasEqualEvent(this.events, type) && isNativeEvent(type))
      return;
    
    if (type, listener) {
      // console.log('addEvent::', type,listener.name);
      this.expert.addEventListener(type, listener);
      this.recordEvent({type, listener});
    }
  }

  removeEvent(type, listener) {
    // console.log('removeEvent::', type, 'listener', listener);
    if (type, listener) {
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
      if (!module)
        return;
      
      this.modulesMap.set(key, addModule(module));
    });
  }
}


class BaseComponent {
  
  constructor() {
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
      
    if (!id) 
      return;
  
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
    const {components} = componentParser(this.template(), this);
    const {eventMap, template, containerId} = templateParser(components, this);
    
    this.eventMap = eventMap;
    this.containerId = containerId && '#' + containerId;
    
    if (element) {
      let docTemplate = parseDOM(template);
      docTemplate = conditionStatementParser(docTemplate);
      element.parentNode.replaceChild(docTemplate, element);
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
    this.count = 0;
    this.image = '';
    this.imageBorder = 0;
  }
  
  clickMethod(param) {
    // console.log('Methods BUTTON++!!', param);
    
    this._imageBorder++;
    this.count++
    
    this.setState();
    
    this.emit('methodEvent', {
      detail: {
        message: 'Method Event Handler++',
        count: this.count
      }
    });
  }
  
  clickMethod2(param) {
    // console.log('Methods BUTTON2--', param);
    
    this._imageBorder--
    this.count--;
    
    if (this.count < 0)
      this.count = 0;
    
    this.setState();
    
    this.emit('methodEvent', {
      detail: {
        message: 'Method Event Handler--',
        count: this.count
      }
    });
  }
  
  template() {
    return (
      `<div style="padding: 15px 0; border: 1px solid #f00">
        <button on:click="clickMethod">Image Line ++</button>
        <button on:click="clickMethod2">Image Line --</button>
        <p v-if="${this.count === 7}">
           ${this.count}
        </p>
        <p v-else><img src="${this.image}" style="border: ${this.imageBorder}px solid #0f0"/></p>
      </div>`
    );
  }
};


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
    return (
      `<div style="border: 1px solid #f00">
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
      </div>`
    );
  }
};


class App extends BaseComponent {

  components() {
    return {
      'button-event': ButtonEvent,
      'method-event' : MethodEvent
    };
  }
  
  setup() {
    this.count = 7;
    
    console.log('setup');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOMContentLoaded');
      this.render();
    });
  }

  create(rootId) {
    console.log('create');
    this.containerId = rootId;
    // this.render();
  }
  
  increaseHandler(e) {
    // console.log('App:increaseHandler', e.detail.count);
    
    this.count = e.detail.count + 5;
    this.render();
  }
  
  decreaseHandler(e) {
    // console.log('App:decreaseHandler', e.detail.count);
    
    this.count = e.detail.count - 5;
    this.render();
  }
  
  methodEventHandler(e) {
    // console.log('App:methodEventHandler', e.detail.count, e.detail.message);
    this.count = e.detail.count;
    this.render();
  }
  
  appHandler() {
    console.log('appHandler');
  }
  
  template() {
    return (
      `<div id="container" style="border:2px solid #f0f">
        <p>${this.count}</p>
        <method-event v-if="${this.count > 0}" :count="${this.count}" style="background-color: #00f"></method-event>
        <method-event v-else-if="${this.count > 1}" :count="${this.count}" style="background-color: #00b"></method-event>
        <method-event v-else :count="${this.count}" style="background-color: #00c"></method-event>
        <method-event :count="${this.count}" :image="https://upload.wikimedia.org/wikipedia/commons/1/10/Marvel_Studios_2016_logo.svg" @methodEvent="methodEventHandler"></method-event>
      </div>`
    );
  }
}

// Create App
export const app = new App().create('#app');