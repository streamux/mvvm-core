/**
 * 2023.10.06
 *
 * Description
 * componentParser & templateParser to need to refactoring : done
 *
 **/

// util
const isNativeEvent = type => window['on' + type] === null;

const parseDataType = data => {
  switch (data) {
    case '':
      return '';
    case 'undefined':
      return undefined;
    case 'null':
      return null;
  }

  data = data.trim();

  if (/^[+%*-]?\d*(?:\.\d*)?$/.test(data)) {
    const parsedData = /\./.test(data) ? parseFloat(data) : parseInt(data);

    return parsedData;
  }

  if (/^\[|\{.*\]|\}$/.test(data)) return JSON.parse(data);

  return data;
};

// add module
const addModule = module => {
  return {
    create: () => {
      const component = new module();

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

// component to templates
const componentParser = (temp, modules, scope) => {
  const events = {};
  let components = '';

  modules.forEach((value, key) => {
    components = temp.replace(
      new RegExp('(?:<' + key + '([^>]*)?>(.*)?</' + key + '[^>]*>)', 'gim'),
      (origin, attributes, slot) => {
        // initialize old event
        scope.deleteRecordedEvents();
        const module = modules.get(key).create();

        // convert component'tag to event
        attributes.replace(/\s+@([^=]*)="([^"]*)"/g, (origin, eventType, eventHandler) => {
          eventHandler = scope && scope[eventHandler];
          const eventListener = eventHandler && eventHandler.bind(scope);

          if (eventType && eventListener) scope.addEvent(eventType, eventListener);

          return '';
        });

        // convert component'tag to props
        attributes.replace(/\s+:([^=]*)="([^"]*)"/g, (origin, propName, propValue) => {
          module.addProp(propName, parseDataType(propValue));
          return '';
        });

        return module.render();
      }
    );
  });

  return { components, emitEvent: events };
};

// parse argument
const argumentParser = arg => {
  if (!arg) return [];

  if (arg.indexOf(',') !== -1) return arg.split(',').map(data => parseDataType(data));

  const parsedData = parseDataType(arg);
  return [parsedData];
};

// parse Template
const templateParser = (temp, scope) => {
  const events = {};
  let componentId = '';
  let template = temp.replace(/on:([^=]*)="([^"(]*)(?:\(([^)]*)?\))?"/gim, (origin, eventType, methodName, arg) => {
    const eventId = methodName + '_' + Date.now().toString(34);
    const params = argumentParser(arg);

    scope.addEvent(eventType, scope.listener);
    events[eventId] = {
      eventType,
      methodName,
      params
    };

    return `id="${eventId}"`;
  });

  template = template.replace(/^(<)([^>]*)(>)/i, (origin, prefix, attributes, suffix) => {
    attributes = attributes.replace(/(.*)?(?:id="([^'"]*)")?(.*)?/i, (attrOrigin, attrPrefix, attrId, attrSuffix) => {
      if (!attrId) {
        componentId = 'container_' + Date.now().toString(34);

        // 백틱 다음 id 앞쪽 공백 한칸 필요
        attrId = ` id="${componentId}"`;
      }

      return attrPrefix + attrId + (attrSuffix || '');
    });

    return prefix + attributes + suffix;
  });

  const childTemplate = template.replace(/^<([^>]*)>/i, '').replace(/<\/[^>]*>$/i, '');

  return { template, childTemplate, events, componentId };
};

class EventManager {
  static instance = new EventManager();

  static getInstance() {
    return EventManager.instance;
  }

  constructor() {
    this.events = [];
    this.expert = window;
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
    if (this.events.find(e => e.type === type) && isNativeEvent(type)) return;

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

class BaseComponent {
  constructor() {
    console.log('BaseComponent Init!!');

    this.eventManager = EventManager.getInstance();
    this.listener = this.listener.bind(this);
    this.events = {};
    this.componentId = '';

    this.deleteRecordedEvents();
    this.setup();
  }

  setup() {}

  addEvent(type, listener) {
    this.eventManager.addEvent(type, listener);
  }

  deleteRecordedEvents() {
    this.eventManager.deleteRecordedEvents();
  }

  listener(e) {
    const id = e.target && e.target.id;

    if (!id) return;

    const event = this.events[id];
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
    const { components, emitEvent } = componentParser(this.template(), jsModule, this);
    const { events, template, childTemplate, componentId } = templateParser(components, this);
    const element = this.componentId && document.querySelector('#' + this.componentId);
    this.events = Object.assign(events, emitEvent);

    if (element) {
      element.innerHTML = childTemplate;
      return '';
    }

    this.componentId = componentId;

    return template;
  }
}

// component declare
class ButtonMethod extends BaseComponent {
  setup() {}

  clickMethod(param) {
    console.log('Methods BUTTON!!', param);
  }

  clickMethod2(param) {
    console.log('Methods BUTTON2', param);
  }

  template() {
    return `<div id="methodContainer">
        <div on:click="clickMethod" style="border: 1px solid #f00">Methods BUTTON</div>
        <br />
        <button on:click="clickMethod2">Methods Button2</button>
        <br />
        <button on:click="clickMethod3">Methods Button3</button>
      </div>`;
  }
}

class ButtonEvent extends BaseComponent {
  setup() {
    this.count = 0;
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
    // console.log('Events Dispatch::increase!!', typeof(num), num, '-----');
    // this.count += num;

    window.dispatchEvent(
      new CustomEvent('increase', {
        detail: {
          count: this.count
        }
      })
    );
    // this.setState(this.count);
  }

  dispatchDecrease(num) {
    // console.log('Events Dispatch::decrease!!', typeof(num), num, '-----');
    // this.count += num;

    window.dispatchEvent(
      new CustomEvent('decrease', {
        detail: {
          count: this.count
        }
      })
    );
    // this.setState(this.count);
  }

  loadHandler() {
    console.log('loadHandler');
  }

  unloadHandler() {
    console.log('unloadHandler');
  }

  template() {
    return `
      <div style="border: 1px solid #f00">
        <p style="padding: 2px;border: 1px solid #f00">ButtonEvent:count=${this.count}</p>
        <p>
          <button on:click="dispatchIncrease">Events Dispatcher::increase</button>
          <button on:click="dispatchDecrease">Events Dispatcher::decrease</button>
        </p>
        <p><button on:click="minus">Events Minus</button></p>
        <p><button on:click="plus">Events Plus</button></p>
        <p><button on:click="calc(2, 1, ["aa"], {"aa":"test"})">Events Calc</button></p>
      </div>`;
  }
}

class App extends BaseComponent {
  mount(rootId) {
    this.count = 3;
    this.rootId = rootId;
    this.oldEvents = [];

    document.addEventListener('DOMContentLoaded', () => {
      this.render();
    });
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

  appHandler() {
    console.log('appHandler');
  }

  render() {
    const app = document.querySelector(this.rootId);
    app.innerHTML = '';

    const { components, emitEvent } = componentParser(this.template(), jsModule, this);
    const { template, events } = templateParser(components, this);

    this.events = Object.assign(events, emitEvent);
    app.innerHTML = template;
  }

  template() {
    return `
      <div id="container" style="border:2px solid #f0f">
        <button on:click="appHandler">app button</button>
        <p style="border:1px solid #0ff">App:count = ${this.count}</p>
        <button-event :count="${this.count}" @increase="increaseHandler" @decrease="decreaseHandler">slot contents</button-event>
      </div>`;
  }
}

// import
const jsModule = new Map([['button-event', addModule(ButtonEvent)]]);

// Create App
export const app = new App().mount('#app');
