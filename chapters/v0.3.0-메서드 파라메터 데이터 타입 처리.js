
/**
 *
 * 설명 
 * 문자열 메서드 파라메터 변환 시 데이터 타입 변경 처리 및 재렌더링 메서드 하나로 통합
 * 
 * 1. 메서드 파라메터로 전달된 문자열 인자값을 각 실제 타입에 맞게 변환 처리
 *    - 공백, undefined, null 타입 변환
 *    - 숫자 타입 변환
 *    - 객체 타입 변환
 *
 * 2. 재렌더링, 렌더링 메서드를 render 메서드 하나로 통합 처리
 *
 **/


class App {
  
  mount(rootId) {
    const app = document.querySelector(rootId);
    app.innerHTML = this.template();
  }
  
  template() {
    const eventsComponent = new Events().render();
    
    return (
      `<div id="container">${eventsComponent}</div>`
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
  
  if (/^[0-9]*$/.test(data))
    return parseInt(data);
  
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
  
  return arg;
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
    console.log('BaseComponent Init!!')
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
    
    const container = document.querySelector(this.componentId);
    
    if (container) {
      container.innerHTML = children;
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
          <button on:click="calc(2, 1, ["aa"], {"aa":"test"})">Events Calc</button>
        </p>
      </div>`
    );
  }
};


// Create App
export const app = new App().mount('#app');