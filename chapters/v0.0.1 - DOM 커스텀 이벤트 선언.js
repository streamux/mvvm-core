/**
 *
 * 설명
 * DOM 엘리먼트에 사용자 정의 이벤트를 정의한다.
 *
 * 1. 사용자 정의 이벤트를 추출해 이벤트 배열에 검색 가능하도록 식별 처리 후
 *    이벤트 타입과 메서드 이름을 객체 형태로 저장한다.
 *
 * 2. 버튼 클릭 시 해당 엘리먼트의 식별값을 가져와 이벤트 배열에 등록된 이벤트가 있는지 조회해서
 *    엘리먼트에 등록된 메서드 이름과 동일한 메서드가 정의된 객체와 바인딩해 준다.
 *
 * 3. 버튼 클릭 시 바인딩된 메서드가 호출되는지 확인한다.
 *
 **/

const template = `
<div>
    <div on:click="clickTest" style="border: 1px solid #f00">DIV BUTTON</div>
    <br />
    <button on:click="click2Test">Button</button>
  </div>`;

// Event Manager
const events = {};

// Render
const templateParser = temp =>
  temp.replace(/on:([^=]*)="([^"]*)"/gi, (origin, eventType, methodName) => {
    // console.log("eventType", eventType, methodName);

    const targetId = methodName + '_' + Date.now();
    events[targetId] = {
      eventType,
      methodName
    };

    return `id="${targetId}"`;
  });

// global event declare
const listener = function (e) {
  const id = e.target && e.target.id;

  if (!id) return;

  const event = events[id];
  const methodName = event && event.methodName;

  methodName && this[methodName]();
};

// declare component
class Methods {
  constructor() {
    document.addEventListener('click', listener.bind(this));
  }

  clickTest() {
    console.log('click test!!');
  }

  click2Test() {
    console.log('click test2');
  }
}

new Methods();

export const app = document.querySelector('#app');
app.innerHTML = templateParser(template);
