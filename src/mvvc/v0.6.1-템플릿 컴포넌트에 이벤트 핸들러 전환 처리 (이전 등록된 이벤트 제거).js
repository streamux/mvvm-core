
/**
 *
 * 설명 
 * 이전 이벤트가 이미 등록된 경우 제거한다.
 *
 * 1. App 클래스 BaseComponent 상속 구조로 변경
 *
 **/


// add module
const addModule = (module) => {
  return () => {
    const component = new module();
    
    return {
      getComponent: component,
      addParams: (params = {}) => {
        params.entries().forEach(([key, value]) => {
          component[key] = value;
        });
      },
      render: () => component.render()
    };
  };
};

let oldEvents = [];

// component to templates
const componentParser = (temp, modules, scope) => {
  let templates = '';
  const components = [];
 
  modules.forEach((value, key) => {
    templates = temp.replace(new RegExp('(?:<'+key+'([^>]*)?>(.*)?<\/'+key+'[^>]*>)', 'gim'), (origin, attributes, slot) => {
      
      // console.log('compo', attributes, slot);
      const component = modules.get(key)();
      components.push(component);
      
      // convert component'tag to event
      attributes.replace(/@([^=]*)*="([^"]*)*"/g, (origin, eventType, eventHandler) => {
        eventHandler = scope && scope[eventHandler];
        const eventListener = eventHandler && eventHandler.bind(scope);
        
        if (eventType && eventListener) {
          oldEvents.forEach((e) => {
            e.scope.removeEvent(e.eventType, e.eventListener);
          });
          oldEvents = [];
          
          scope.addEvent(eventType, eventListener);
          oldEvents.push({scope, eventType, eventListener});
        }
      });
      
      return component.render();
    });
  });
  
  return {templates, components};
};


// Parser
const parseDataType = (data) => {
  
  switch (data) {
    case '':
      return '';
    case 'undefined':
      return undefined;
    case 'null':
      return null;
  }
  
  data = data.trim();
  
  if (/^\d*\.?\d$/.test(data)) {
    const parsedData = /\./.test(data) ?
          parseFloat(data) : parseInt(data);
    return parsedData;
  }
  
  if (/^\[|\{.*\]|\}$/.test(data)) {
    return JSON.parse(data);
  }

  return data;
}

const argumentParser = (arg) => {
  
  if (!arg)
    return [];
  
  if (arg.indexOf(',') !== -1)
    return arg.split(',').map((data) => parseDataType(data));
  
  const parsedData = parseDataType(arg);
  
  return [parsedData];
};

const templateParser = (temp) => {
  
  let componentId = '';
  const events = {};
  const templates = temp.replace(/on:([^=]*)="([^"(]*)(?:\(([^)]*)?\))?"/gim, (origin, eventType, methodName, arg) => {

    const eventId = methodName + '_' + Date.now();
    const params = argumentParser(arg);
    
    events[eventId] = {
      eventType,
      methodName,
      params
    };
    
    return `id="${eventId}"`;
  });
  
  const children = templates
      .replace(/^<([^>]*)>/i, (origin, containerId) => {
        componentId = containerId.replace(/.*id="([^'"]*)".*/i, '$1');
        return '';
      })
      .replace(/<\/[^>]*>$/i, '');
  
  return {templates, children, events, componentId};
};


class BaseComponent {
  
  constructor() {
    console.log('BaseComponent Init!!');
    
    this.events = {};
    this.componentId = '';
    
    this.setup();
  }
  
  setup() {}

  addEvent(eventType, listener) {
    if (eventType && listener) {
      document.addEventListener(eventType, listener);
    }
  }
  
  removeEvent(eventType, listener) {
    if (eventType && listener) {
      document.removeEventListener(eventType, listener);
    }
  }
  
  listener(e) {
    const id = e.target && e.target.id;
      
    if (!id) 
      return;
  
    const event = this.events[id];
    const methodName = event && event.methodName;
    const params = event && event.params;
    
    this[methodName] && this[methodName].apply(this, params);
  }
  
  setState(state) {
    this.render();
  }

  templates() {
    return '';
  }
  
  render() {
    const {events, templates, children, componentId} = templateParser(this.templates());
    
    this.events = events;
    this.componentId = `#${componentId}`;
    
    const element = document.querySelector(this.componentId);
    
    if (element) {
      element.innerHTML = children;
      return '';
    }
    
    return templates;
  }
}


// component declare
class ButtonMethod extends BaseComponent {

  setup() {
    this.setEvent();
  }
  
  setEvent() {
    this.addEvent('click', this.listener);
  }
  
  clickMethod(param) {
    console.log('Methods BUTTON!!', param);
  }
  
  clickMethod2(param) {
    console.log('Methods BUTTON2', param);
  }
  
  templates() {
    return (
      `<div id="methodContainer">
        <div on:click="clickMethod" style="border: 1px solid #f00">Methods BUTTON</div>
        <br />
        <button on:click="clickMethod2">Methods Button2</button>
        <br />
        <button on:click="clickMethod3">Methods Button3</button>
      </div>`
    );
  }
};


class ButtonEvent extends BaseComponent {
  
  setup() {
    this.count = 0;
    this.setEvent();
  }
    
  setEvent() {
     this.addEvent('click', this.listener.bind(this));
  }

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
    // console.log('Events Dispatch!!', typeof(num), num, '---–------');
    // this.count += num;

    document.dispatchEvent(new CustomEvent('increase', {
      detail: {
        count: this.count
      }
    }));
    // this.setState(this.count);
  }
  
  templates() {
    return (
      `<div id="eventContainer">
        <p style="padding: 2px;border: 1px solid #f00">
          ButtonEvent:count=${this.count}
        </p>
        <p>
          <button on:click="dispatchIncrease(7)">Events Dispatcher::increase</button>
        </p>
        <p>
          <button on:click="minus">Events Minus</button>
        </p>
        <p>
          <button on:click="plus">Events Plus</button>
        </p>
        <p>
          <button on:click="calc(2, 1, ["aa"], {"aa":"test"})">Events Calc</button>
        </p>
      </div>`
    );
  }
};


class App extends BaseComponent {

  mount(rootId) {
    this.count = 3;
    this.rootId = rootId;
    this.oldEvents = [];
    this.render();
  }
  
  increaseHandler(e) {
    // console.log('App:increaseHandler', e.detail.count);
    // const buttonEvent = jsModule.get('button-event').getComponent();
    // buttonEvent.setState(e.detail.count);
    this.count += e.detail.count;
    this.render();
  }
  
  render() {
    const app = document.querySelector(this.rootId);
    app.innerHTML = '';
    
    const {templates, components} = componentParser(this.template(), jsModule, this);
    app.innerHTML = templates;
   }
  
  template() {
    return (
      `<div id="container">
        <p style="border:1px solid #0ff">App:count = ${this.count}</p>
        <button-event @increase="increaseHandler" @decrease="decreaseHandler">slot contents</button-event>
      </div>`
    );
  }
}
    
    
// import
const jsModule = new Map();
jsModule.set('button-event', addModule(ButtonEvent));

// Create App
export const app = new App().mount('#app');