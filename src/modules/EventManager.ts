export class EventManager {
  static $expert = window || {};

  static create() {
    return new EventManager();
  }

  constructor() {
    this.events = [];
    this._eventMap = {};
  }

  get expert() {
    return EventManager.$expert;
  }

  get eventMap() {
    return this._eventMap;
  }

  set eventMap(events) {
    return Object.assign(this._eventMap, events);
  }

  get hasSamdEvent() {
    return this.events.find((e) => e.type === type);
  }

  recordEvent(e) {
    this.events.push(e);
  }

  deleteRecordedEvents() {
    // console.log('deleteRecordedEvents', JSON.stringify(this.events));
    this.events.forEach((e) => this.removeEvent(e.type, e.listener));
    this.events = [];
  }

  addEvent(type, listener) {
    if (hasEqualEvent(this.events, type) && isNativeEvent(type)) return;

    if ((type, listener)) {
      // console.log('addEvent::', type,listener.name);
      this.expert.addEventListener(type, listener);
      this.recordEvent({ type, listener });
    }
  }

  removeEvent(type, listener) {
    // console.log('removeEvent::', type, 'listener', listener);
    if ((type, listener)) {
      this.expert.removeEventListener(type, listener);
    }
  }
}
