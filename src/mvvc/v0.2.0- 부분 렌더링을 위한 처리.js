
/**
 *
 * 설명 
 * 최초 렌더링이 한번 되어 있는 상태에서 일부 정보가 바꼈을 때 부분 렌더링을 위한 처리
 *
 * 1. 재렌더링이 되기 위한 조건 만들기
 *    - 각 컴포넌트가 실제 DOM에 렌더링 될 때 컨테이너 식별 ID 값 추출하기
 *    - 데이터가 바뀐 컴포넌트의 갱신이 될 하위 엘리먼트 추출하기
 *      (이후 컨테이터 전체가 갱신되도록 개선 필요)
 *
 * 2. 데이터 변화가 있는 컴포넌트의 식별 ID 값으로 실제 DOM 엘리먼트를 조회해서
 *    엘리먼트가 있는 경우 하위 엘리먼트만 실제 DOM에 적용
 *
 * 3. 메서드에 파라메터 추가하기
 *    - 문자열 메서드 호출부 파람메터 값을 배열로 변환 후 apply 메서드를 활용해 실제 메서드 호출부 구조로 만든다.
 *
 **/


// Template Parser
const templateParser = (temp = '') => {
  
  let componentId = '';
  const events = {};
  const templates = temp.replace(/on:([^=]*)="([^"(]*)(\(([^)]*)?\))?"/gi, (origin, eventType, methodName, caller, arg) => {
    
    const eventId = methodName + '_' + Date.now();
    const params = arg && arg.split(',') || [];
    // console.log(eventId, methodName, params);
    events[eventId] = {
      eventType,
      methodName,
      params
    };
    
    return 'id="' + eventId + '"';
  });
  
  const children = templates
      .replace(/^<([^>]*)>/i, (origin, containerAttr) => {
        componentId = containerAttr.replace(/.*id="([^"]*)".*/i, '$1');
        return '';
      })
      .replace(/<\/[^>]*>$/i, '');
  
  return {templates, children, events, componentId};
};


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
    // console.log(id, e.target);
      
    if (!id) 
      return;
  
    const event = this.events[id];
    const methodName = event && event.methodName;
    const params = event && event.params;
    
    // console.log('params', params);
    this[methodName] && this[methodName].apply(this, params);
  }
  
  setState(state) {
    // console.log(state);
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
    // console.log(templates);
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
    // console.log('Methods BUTTON!!', param);
  }
  
  clickMethod2(param) {
    // console.log('Methods BUTTON2', param);
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
    // console.log('Events Minus!!', param);
    this.setState(this.count--);
  }
  
  plus(param) {
    // console.log('Events Plus!!', param);
    this.setState(this.count++);
  }
  
  calc(param) {
    const num = param && parseInt(param) || 0;
    // console.log('Events Calc!!', this.count, num);
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