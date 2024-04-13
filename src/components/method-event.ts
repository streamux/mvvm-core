import { BaseComponent } from "./base-components";

export class MethodEvent extends BaseComponent {
  private _imageBorder: number = 0;
  private _backgroundColor: string = "";
  private count: number = 0;
  private image: string = "";

  get imageBorder() {
    return this._imageBorder;
  }

  set imageBorder(num) {
    this._imageBorder = num;
  }

  get backgroundColor() {
    return this._backgroundColor;
  }

  set backgroundColor(color) {
    this._backgroundColor = color;
  }

  setup() {
    this.count = 0;
    this.image = "";
    this.imageBorder = 0;
    this.backgroundColor = "fff";
  }

  clickMethod(param: any) {
    console.log("Methods BUTTON++!!", param);

    this._imageBorder++;
    this.count++;

    this.setState();

    this.emit("methodEvent", {
      detail: {
        message: "Method Event Handler++",
        count: this.count
      }
    });
  }

  clickMethod2(param: any) {
    console.log("Methods BUTTON2--", param);

    this._imageBorder--;
    this.count--;

    if (this.count < 0) this.count = 0;

    this.setState();

    this.emit("methodEvent", {
      detail: {
        message: "Method Event Handler--",
        count: this.count
      }
    });
  }

  template() {
    return `
      <div style="padding: 15px 0; border: 1px solid #f00; background-color: ${this.backgroundColor}">
        <button on:click="clickMethod">Image Line ++</button>
        <button on:click="clickMethod2">Image Line --</button>
        <p>backgroundColor: ${this.backgroundColor}</p>
        <p v-if="${this.count === 7}">
          ${this.count} => Hide image if count is 7
        </p>
        <p v-else style="width:100%; border: ${this.imageBorder}px solid #0f0">
          <img src="${this.image}" />
        </p>
      </div>`;
  }
}
