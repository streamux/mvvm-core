
/**
 *
 * 설명 
 * 사용자 정의 컴포넌트에 이벤트 수신부 등록하기
 * js 모듈맵에 등록된 컴포넌트 목록과 대조해서 이벤트 관련 처리를 한다.
 * 
 * 1. 사용자 정의 컴포넌트에 이벤트 핸들러 등록하기
 *
 * 2. js 모듈맵에 등록된 컴포넌트를 순회해서 key 값과 일치하는 문자열 태그를 컴포넌트 내 템플릿으로 치환한다.
 *
 * 3. 문자열 태그 속성으로 처리된 이벤트 핸들러가 있는 경우 이벤트 리스너에 등록한다.
 *
 * 4. 컴포넌트에 수신된 값 전달하고 재렌더링하기
 *
 * 5. 부모 컴포넌트에서 등록된 이벤트 메서드가 작동하는지 확인 한다.
 *
 **/


// add module
const addModule = (component) => {
  return {
    getComponent: () => component,
    addEvent: (eventType, listener) => {
      component.addEvent(eventType, listener);
    },
    addParams: (params = {}) => {
      params.entries().forEach(([key, value]) => {
        component[key] = value;
      });
    },
    render: () => component.render()
  };
};

// component to templates
const componentParser = (temp, modules, scope) => {
  let parsedComponent = '';
 
  modules.forEach((value, key) => {
    parsedComponent = temp.replace(new RegExp('(?:<'+key+'([^>]*)?>(.*)?<\/'+key+'[^>]*>)', 'gim'), (origin, attributes, slot) => {
      const component = modules.get(key);
      attributes.replace(/@([^=]*)*="([^"]*)*"/g, (origin, eventType, eventTandler) => {
        component.addEvent(eventType, scope[eventTandler]);
      });
      
      return component.render();
    });
  });
  
  return parsedComponent;
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
        componentId = containerId.replace(/.*id="([^"]*)".*/i, '$1');
        return '';
      })
      .replace(/<\/[^>]*>$/i, '');
  
  return {templates, children, events, componentId};
};

class App {

  mount(rootId) {
    this.rootId = rootId;
    this.render();
  }
  
  increaseHandler(e) {
    const buttonEvent = jsModule.get('button-event').getComponent();
    buttonEvent.setState(e.detail.count);
  }
  
  render() {
    const app = document.querySelector(this.rootId);
    app.innerHTML = componentParser(this.template(), jsModule, this);
  }
  
  template() {
    return (
      `<div id="container">
        <button-event @increase="increaseHandler" @decrease="decreaseHandler">slot contents</button-event>
      </div>`
    );
  }
}


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


// import
const jsModule = new Map();
jsModule.set('button-event', addModule(new ButtonEvent()));

// Create App
export const app = new App().mount('#app');