import { BaseComponent } from './base-component';

export class ButtonEvent extends BaseComponent {
  private _count: number = 0;

  get count() {
    return this._count;
  }

  set count(value) {
    this._count = value;
  }

  setup() {}

  minus(param: any) {
    console.log('Events Minus!!', param);
    this.setState(this.count--);
  }

  plus(param: any) {
    console.log('Events Plus!!', param);
    this.setState(this.count++);
  }

  multi(num: number, num2: number, arr: Array<any>, obj: Object) {
    console.log('Events Calc!!', num, num2, arr, obj);
    this.count *= num;
    this.setState(this.count);
  }

  dispatchIncrease(num: number) {
    // console.log('Dispatch::increase!!', typeof(num), num);
    // this.count += num;

    this.emit('increase', {
      detail: {
        count: this.count
      }
    });

    // this.setState(this.count);
  }

  dispatchDecrease(num: number) {
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
    return `
      <div style="border: 1px solid #f00">
        <p style="padding: 2px;border: 1px solid #f00">
          ButtonEvent:count = ${this.count}
        </p>
        <p>
          <button on:click="dispatchIncrease">Events Dispatcher::increase</button>
          <button on:click="dispatchDecrease">Events Dispatcher::decrease</button>
        </p>
        <p><button on:click="plus">Events Plus</button></p>
        <p><button on:click="minus">Events Minus</button></p>
        <p><button on:click="multi(2, 1, ["aa"], {"aa":"test"})">Events Multi</button></p>
      </div>`;
  }
}
