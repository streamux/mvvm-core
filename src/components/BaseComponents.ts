import { ModuleManager } from "../modules/ModuleManager";
import { EventManager } from "../modules/EventManager";
import { componentParser } from "../modules/ComponentParser";
import { templateParser } from "../modules/TemplateParser";
import { parseDOM } from "../utils/ParserUtil";
import { conditionStatementParser } from "../modules/ConditionStatementParser";

export class BaseComponent {
  constructor() {
    console.log(`${this.constructor.name}::initialize!!`);

    // basic properties
    this.uid = 0;
    this.containerId = "";

    // initialize module
    this.moduleManager = ModuleManager.create();
    this.modules = this.components();

    // event properties
    this.eventManager = EventManager.create();
    this.listener = this.listener.bind(this);

    this.setup();
  }

  get $uid() {
    return this.uid;
  }

  set $uid(num) {
    this.uid = num;
  }

  get className() {
    return this.constructor.name;
  }

  get eventMap() {
    return this.eventManager.eventMap;
  }

  set eventMap(eventMap) {
    this.eventManager.eventMap = eventMap;
  }

  get modules() {
    return this.moduleManager.modules;
  }

  set modules(modules = {}) {
    this.moduleManager.modules = modules;
  }

  components() {
    return {};
  }

  setup() {}

  addEvent(type, listener) {
    this.eventManager.addEvent(type, listener);
  }

  deleteRecordedEvents() {
    this.eventManager.deleteRecordedEvents();
  }

  emit(type, data) {
    this.eventManager.expert.dispatchEvent(new CustomEvent(type, data));
  }

  listener(e) {
    const id = e.target?.dataset?.eventId;

    if (!id) return;

    const event = this.eventMap[id];
    const methodName = event && event.methodName;
    const params = event && event.params;

    this[methodName] && this[methodName].apply(this, params);
  }

  setState(state) {
    // console.log('setState', state);
    this.render();
  }

  template() {
    return "";
  }

  render() {
    const element =
      this.containerId && document.querySelector(this.containerId);
    const { components } = componentParser(this.template(), this);
    const { eventMap, template, containerId } = templateParser(
      components,
      this
    );

    this.eventMap = eventMap;
    this.containerId = containerId && "#" + containerId;

    if (element) {
      let docTemplate = parseDOM(template);
      docTemplate = conditionStatementParser(docTemplate);

      element.parentNode.replaceChild(docTemplate, element);

      return "";
    }

    return template;
  }
}
