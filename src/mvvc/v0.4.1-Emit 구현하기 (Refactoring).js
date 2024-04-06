// move class's instance to global 

// import
let eventsComponent = null;

class App {

  mount(rootId) {
    this.setEvent();
    this.render(rootId);
  }
  
  setEvent() {
    eventsComponent = new Events();
    eventsComponent.addEvent('increase', (e) => {
      eventsComponent.setState(e.detail.count)
    });
  }
  
  render(rootId) {
    const app = document.querySelector(rootId);
    app.innerHTML = this.template();
  }
  
  template() {
    return (
      `<div id="container">${eventsComponent.render()}</div>`
    );
  }
}

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

const templateParser = (dom = '') => {
  
  let componentId = '';
  const events = {};
  const templates = dom.replace(/on:([^=]*)="([^"(]*)(?:\(([^)]*)?\))?"/gi, (origin, eventType, methodName, arg) => {

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
        componentId = containerId.replace(/.*id="([^"]*)".*/i, '$1');
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
    document.addEventListener(eventType, listener);
  }
  
  removeEvent(eventType, listener) {
    document.removeEventListener(eventType, listener);
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
class Methods extends BaseComponent {

  setup() {
    this.setEvent();
  }
  
  setEvent() {
    this.addEvent('click', this.listener.bind(this));
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


class Events extends BaseComponent {
  
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
  
  dispatch(num) {
    // console.log('Events Dispatch!!', typeof(num), num);
    this.count += num;

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
          ${this.count}
        </p>
        <p>
          <button on:click="dispatch(7)">Events Dispatcher</button>
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

// Create App
export const app = new App().mount('#app');