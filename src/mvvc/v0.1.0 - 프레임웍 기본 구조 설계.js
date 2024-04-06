
/**
 *
 * 설명 
 * 컴포넌트 기반 프레임웍 기본 구조 설계
 *
 * 1. 컴포넌트에 공통적으로 사용되는 기능들을 분류해 BaseComponent에 정의한다.
 *
 * 2. BaseComponent에 정의된 핵심 기능
 *    - listener : 클릭 요소의 식별값으로 메서드를 찾아 호출한다.
 *    - template : 컴포넌트의 DOM 요소를 정의한다.
 *    - render : 최종 처리된 DOM 요소를 반환한다.
 *    - addEvent / removeEvent : 이벤트 등록 / 삭제
 *
 * 3. 각각의 UI 컴포넌트는 render 함수를 통해 부모 컴포넌트의 DOM 요소에 반영된다.
 *
 * 4. 부모 컴포넌트의 render 함수가 실행되면서 최종 DOM을 반환하고, 실제 DOM에 적용된다.
 *
 **/


// Dom Parser
const templateParser = (temp = '') => {
  
  const events = {};
  const templates = temp.replace(/on:([^=]*)=["']([^"'(]*)['"]/gi,
                                 (origin, eventType, methodName) => {
    
    const eventId = methodName + '_' + Date.now();
    events[eventId] = {
      eventType,
      methodName
    };
    
    return `id="${eventId}"`;
  });
  
  return {events, templates};
};


class BaseComponent {
  
  constructor() {
    console.log('BaseComponent Init!!')
    this.events = {};
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
    
    this[methodName] && this[methodName]();
  }
  
  templates() {
    return '';
  }

  render(dom = '') {
    const {events, templates} = templateParser(this.templates());
    this.events = events;
    
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
  
  clickMethod3(param) {
    console.log('Methods BUTTON3', param);
  }
  
  templates(dom = '') {
    return (
      `<div>
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
    this.setEvent();
  }
  
  setEvent() {
     this.addEvent('click', this.listener.bind(this));
  }

  clickEvents(param) {
    console.log('Events Button!!', param);
  }
  
  clickEvents2(param) {
    console.log('Events Button2!!', param);
  }
  
  clickEvents3(param) {
    console.log('Events Button3!!', param);
  }
  
  templates(dom = '') {
    return (
      `<div>
        <div on:click="clickEvents" style="border: 1px solid #f00">Events BUTTON</div>
        <br />
        <button on:click="clickEvents2">Events Button2</button>
        <br />
        <button on:click="clickEvents3">Events Button3</button>
      </div>`
    );
  }
};


// Create App
export const app = document.querySelector('#app');
app.innerHTML = (
  `<div>
    ${new Events().render()}
    <br /><br />
    ${new Methods().render()}
  </div>`
);