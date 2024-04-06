/**
 * 2023.10.09
 * 
 * Modify duplicate events : done
 * Change event's id to data propertie : done
 * Disconnecting Module : done
 *
 **/

// Util
const getUniqKey = (uid, eventNo) => `${Date.now().toString(34)}${uid}${eventNo}`;
const isNativeEvent = (type) => window['on' + type] === null;
const checkNumber = (data) => /^[+%*-]?\d*(?:\.\d*)?$/.test(data);
const checkObject = (data) => /^\[|\{.*\]|\}$/.test(data);
const parseNumber = (data) => /\./.test(data) ?
          parseFloat(data) : parseInt(data);

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

// Transform to Data
const transformToDataType = (data) => {
  
  if (!data)
    return parseInvalid(data);
  
  data = data.trim();
  
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
    create: () => {
      uid++;
      const component = new module();
      component.$uid = uid;
    
      return {
        getComponent: () => component,
        addProp: (key, value) => {
          component[key] = value;
        },
        render: () => component.render()
      };
    }
  };
};


// Parser
const argumentParser = (arg) => {
  
  if (!arg)
    return [];
  
  if (arg.indexOf(',') !== -1)
    return arg.split(',').map((data) => transformToDataType(data));
  
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
    components = components.replace(new RegExp('(?:<'+key+'([^>]*)?>(.*)?<\/'+key+'[^>]*>)', 'gim'), (origin, attributes, slot) => {
      
      attributes = attributes && attributes.trim() || ''
      
      // Create a module instant if a tag matches the module name
      const module = target.modules.get(key).create();
      
      // convert component'tag to event
      attributes = attributes.replace(/(?:\s+)?@([^=]*)(?:\s)?=(?:\s)?"([^"]*)"/g, (origin, eventType, eventHandler) => {
        
        eventHandler = target && target[eventHandler];
        
        if (eventType && eventHandler) {
          target.addEvent(eventType, eventHandler.bind(target));
        }
        
        return '';
      });
     
      // convert component'tag to props
      attributes = attributes.replace(/(?:\s+)?:([^=]*)="([^"]*)"/g, (origin, propName, propValue) => {
        module.addProp(propName, transformToDataType(propValue));
        return '';
      });
      
      const renderedTemplate = module.render();
      
      return renderedTemplate;
    });
    
  });
  
  return {components};
};


const templateParser = (template, target) => {
  
  const eventMap = {};
  let componentId = '';
  let idIndex = 0;
  
  // search 'id' in container node
  template = template.replace(/^(<)([^>]*)(>)/gi, (origin, prefix, attributes = '', suffix) => {
    
    // extract conatiner's id
    const hasAttributeId = /id=/gi.test(attributes);
    
    if (hasAttributeId) {
      attributes = attributes.replace(/(.*)id="([^"]*)"(.*)/gi, (orign, attrPrefix, attrId, attrSuffix) => {
        return attrPrefix + attrSuffix;
      });
    }
   
    componentId = `item_container_${getUniqKey(target.$uid, idIndex++)}`;
    
    // 백틱 다음 id 앞쪽 공백 한칸 필요
    const attrId = ` id="${componentId}"`;
    
    return prefix + attributes + attrId + suffix;
  });
  
  // event setting
  template = template.replace(/on:([^=]*)="([^"(]*)(?:\(([^)]*)?\))?"/gim, (origin, eventType, methodName, arg) => {

    const eventId = `${methodName}_${getUniqKey(target.$uid, idIndex++)}`;
    const params = argumentParser(arg);
    
    target.addEvent(eventType, target.listener);
    
    eventMap[eventId] = {
      eventType,
      methodName,
      params
    };
    
    return `data-event-id="${eventId}"`;
  }); 
  
  const childTemplate = template
      .replace(/^<([^>]*)>/i, '')
      .replace(/<\/[^>]*>$/i, '');
  
  return {template, childTemplate, eventMap, componentId};
};


class EventManager {
  
  static create() {
    return new EventManager();
  }
  
  constructor() {
    this.events = [];
    this._eventMap = {};
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
    this.events.forEach((e) => {
      this.removeEvent(e.type, e.listener);
    });
    this.events = [];  
  }
  
  addEvent(type, listener) {
    const hasSameEvent = this.events.find(e => e.type === type) && isNativeEvent(type);
    
    if (hasSameEvent)
      return;
    
    if (type, listener) {
      window.addEventListener(type, listener);
      this.recordEvent({type, listener});
    }
  }

  removeEvent(type, listener) {
    if (type, listener) {
      window.removeEventListener(type, listener);
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
    Object.entries(modules).forEach(([key, value]) => {
      this.modulesMap.set(key, addModule(value));
    });
  }
}


class BaseComponent extends Object {
  
  constructor() {
    super();
    
    console.log(`${this.constructor.name}::initialize!!`);
    
    // basic properties
    this.uid = 0;
    this.componentId = '';
    
    // event properties
    this.eventManager = EventManager.create();
    this.listener = this.listener.bind(this);
    
    this.moduleManager = ModuleManager.create();
    this.modules = this.components();
    
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
    window.dispatchEvent(new CustomEvent(type, data));
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

    const element = this.componentId && document.querySelector(this.componentId);
    const {components} = componentParser(this.template(), this);
    const {eventMap, template, childTemplate, componentId} = templateParser(components, this);
    
    this.eventMap = eventMap;
    
    if (element) {
      element.innerHTML = childTemplate;
      return '';
    }
    
    this.componentId = `#${componentId}`;
    
    return template; 
  }
}


// component declare
class MethodEvent extends BaseComponent {

  setup() {}
  
  clickMethod(param) {
    console.log('Methods BUTTON!!', param);
  }
  
  clickMethod2(param) {
    console.log('Methods BUTTON2', param);
    
    this.emit('methodEvent', {
      detail: {
        message: 'Method Event Handler'
      }
    });
  }
  
  template() {
    return (
      `<div style="padding: 15px 0; border: 1px solid #f00" id="methodContainer">
        <button on:click="clickMethod">Method Button</button>
        <button on:click="clickMethod2">Method Button2</button>
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
  
  calc(num, num2, arr, obj) {
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
        <p><button on:click="calc(2, 1, ["aa"], {"aa":"test"})">Events Calc</button></p>
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
  }

  mount(rootId) {
    this.componentId = rootId;
    this.render();
  }
  
  increaseHandler(e) {
    // console.log('App:increaseHandler', e.detail.count);
    
    this.count += e.detail.count;
    this.render();
  }
  
  decreaseHandler(e) {
    // console.log('App:decreaseHandler', e.detail.count);
    
    this.count -= e.detail.count;
    this.render();
  }
  
  methodEventHandler(e) {
    console.log('App:methodEventHandler', e.detail.message);
  }
  
  appHandler() {
    console.log('appHandler');
  }
  
  template() {
    return (
      `<div id="container" style="border:2px solid #f0f">
        <button on:click="appHandler">app button</button>
        <p style="border:1px solid #0ff">App:count = ${this.count}</p>
        
        <button-event :count="${this.count}" @increase="increaseHandler" @decrease="decreaseHandler">slot contents</button-event>
        <button-event :count="${this.count}" @increase="increaseHandler" @decrease="decreaseHandler">slot contents</button-event>
        <button-event :count="${this.count}" @increase="increaseHandler" @decrease="decreaseHandler">slot contents</button-event>
        
        <method-event></method-event>
        <method-event></method-event>
        <method-event></method-event>
        <method-event @methodEvent="methodEventHandler"></method-event>
      </div>`
    );
  }
}

// Create App
export const app = new App().mount('#app');