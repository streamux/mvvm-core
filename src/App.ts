import { BaseComponent } from "./components/BaseComponents";

import { ButtonEvent } from "./components/ButtonEvent";

import { MethodEvent } from "./components/MethodEvent";

export class App extends BaseComponent {
  components() {
    return {
      "button-event": ButtonEvent,
      "method-event": MethodEvent,
    };
  }

  setup() {
    this.count = 1;

    console.log("setup");
    document.addEventListener("DOMContentLoaded", () => {
      console.log("DOMContentLoaded");
      this.render();
    });
  }

  create(rootId) {
    console.log("create");
    this.containerId = rootId;
  }

  increaseHandler(e) {
    console.log("App:increaseHandler", e.detail.count);

    this.count = e.detail.count + 5;
    this.render();
  }

  decreaseHandler(e) {
    console.log("App:decreaseHandler", e.detail.count);

    this.count = e.detail.count - 5;
    this.render();
  }

  methodEventHandler(e) {
    console.log("App:methodEventHandler", e.detail.count, e.detail.message);
    this.count = e.detail.count;
    this.render();
  }

  appHandler() {
    console.log("appHandler");
  }

  template() {
    return `<div id="container" style="width:100%; border:2px solid #f0f">
            <p>${this.count}</p>
            <method-event v-if="${this.count === 0}" :count="${
      this.count
    }" :imageBorder="${this.count}" :backgroundColor="#f00"></method-event>
            <method-event v-else-if="${this.count === 1}" :count="${
      this.count
    }" :imageBorder="${this.count}" :backgroundColor="#0f0"></method-event>
            <method-event v-else-if="${this.count === 2}" :count="${
      this.count
    }" :imageBorder="${this.count}" :backgroundColor="#00f"></method-event>
            <method-event v-else-if="${this.count === 3}" :count="${
      this.count
    }" :imageBorder="${this.count}" :backgroundColor="#ff0"></method-event>
            <method-event v-else :count="${this.count}" :imageBorder="${
      this.count
    }" :backgroundColor="#f0f"></method-event>
            <method-event :count="${this.count}" :imageBorder="${
      this.count
    }" :image="https://upload.wikimedia.org/wikipedia/commons/1/10/Marvel_Studios_2016_logo.svg" @methodEvent="methodEventHandler"></method-event>
          </div>`;
  }
}
