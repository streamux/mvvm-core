import { ModuleManager } from "../modules/module-manager";
import { EventManager } from "../modules/event-manager";
import { componentParser } from "../modules/component-parser";
import { templateParser } from "../modules/template-parser";
import { parseDOM } from "../utils/parser-util";
import { conditionStatementParser } from "../modules/condition-statement-parser";

export class BaseComponent {
  protected containerId: string = "";
  protected uid: number = 0;
  protected moduleManager: ModuleManager = null;
  protected eventManager: EventManager = null;

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

  set modules(modules: any) {
    this.moduleManager.modules = modules;
  }

  components() {
    return {};
  }

  setup() {}

  addEvent(type: string, listener: Function) {
    this.eventManager.addEvent(type, listener);
  }

  deleteRecordedEvents() {
    this.eventManager.deleteRecordedEvents();
  }

  emit(type: string, data: any) {
    this.eventManager.expert.dispatchEvent(new CustomEvent(type, data));
  }

  listener(e: any) {
    const id = e.target?.dataset?.eventId;

    if (!id) return;

    const event = this.eventMap[id];
    const methodName = event && event.methodName;
    const params = event && event.params;
    const func = (this as any)[methodName];

    func && func.apply(this, params);
  }

  setState(state?: any) {
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
      let docTemplate = parseDOM(template) as HTMLElement;
      docTemplate = conditionStatementParser(docTemplate);
      element.parentNode.replaceChild(docTemplate, element);
      return "";
    }

    return template;
  }
}
