
class App {
  
  mount(rootId) {
    const app = document.querySelector(rootId);
    app.innerHTML = this.template();
  }
  
  template() {
    return (
      `<div id="container">
        <div>${new Events().render()}<div/>
      </div>`
    );
  }
}

// Parser
const templateParser = (temp = '') => {
  
  let componentId = '';
  const events = {};
  const templates = temp.replace(/on:([^=]*)="([^"(]*)(?:\(([^)]*)?\))?"/gi, (origin, eventType, methodName, arg) => {
    
    const eventId = methodName + '_' + Date.now();
    const params = arg && arg.split(',') || [];
    
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
    console.log('BaseComponent Init!!')
    this.events = {};
    this.componentId = '';
    
    this.setup();
    this.render();
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
    this.rerender();
  }

  templates() {
    return '';
  }
  
  rerender() {
    const {events, children, componentId} = templateParser(this.templates());
    
    this.events = events;
    this.componentId = `#${componentId}`;
    
    const container = document.querySelector(this.componentId);
    
    if (container) {
      container.innerHTML = children;
    }
  }

  render() {
    const {events, templates, componentId} = templateParser(this.templates());
    
    this.events = events;
    this.componentId = componentId;
    
    return templates;
  };
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


class Events extends Methods {
  
  setup() {
    this.count = 0;
    this.setEvent();
  }
    
  setEvent() {
     this.addEvent('click', this.listener.bind(this));
  }

  minus(param) {
    this.setState(this.count--);
  }
  
  plus(param) {
    this.setState(this.count++);
  }
  
  calc(param) {
    const num = param && parseInt(param) || 0;
    this.count *= num;
    this.setState(this.count);
  }
  
  templates() {
    return (
      `<div id="eventContainer">
        <p style="padding: 2px;border: 1px solid #f00">
          ${this.count}
        </p>
        <p>
          <button on:click="minus">Events Minus</button>
        </p>
        <p>
          <button on:click="plus">Events Plus</button>
        </p>
        <p>
          <button on:click="calc(2)">Events Calc</button>
        </p>
      </div>`
    );
  }
};


// Create App
export const app = new App().mount('#app');