import { hasEqualEvent, isNativeEvent } from "../utils/event-util";

export class EventManager {
  public static $expert = window || {};
  private events: Array<any> = null;
  private _eventMap: Object = null;

  static create() {
    return new EventManager();
  }

  constructor() {
    this.events = [];
    this._eventMap = {};
  }

  get expert(): any {
    return EventManager.$expert;
  }

  get eventMap(): any {
    return this._eventMap;
  }

  set eventMap(events) {
    Object.assign(this._eventMap, events);
  }

  recordEvent(e: any) {
    this.events.push(e);
  }

  deleteRecordedEvents() {
    // console.log('deleteRecordedEvents', JSON.stringify(this.events));
    this.events.forEach((e) => this.removeEvent(e.type, e.listener));
    this.events = [];
  }

  addEvent(type: string, listener: Function) {
    if (hasEqualEvent(this.events, type) && isNativeEvent(type)) return;

    if (type && listener) {
      // console.log('addEvent::', type,listener.name);
      this.expert.addEventListener(type, listener);
      this.recordEvent({ type, listener });
    }
  }

  removeEvent(type: string, listener: Function) {
    // console.log('removeEvent::', type, 'listener', listener);
    if (type && listener) {
      this.expert.removeEventListener(type, listener);
    }
  }
}
