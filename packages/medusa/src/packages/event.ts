import EventEmitter from 'eventemitter3';

import {topWindow} from '../common';


type EventTypes = string|symbol

if (!topWindow.__tyEventEmitter) {
  topWindow.__tyEventEmitter = new EventEmitter;
}

const emitter = topWindow.__tyEventEmitter as EventEmitter;

export function emit<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    ...args: EventEmitter.EventArgs<EventTypes, T>
) {
  return emitter?.emit(event, ...args);
}


export function on<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    fn: EventEmitter.EventListener<EventTypes, T>,
    context?: any
) {
  return emitter?.on(event, fn, context);
}

export function off<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    fn?: EventEmitter.EventListener<EventTypes, T>,
    context?: any,
    once?: boolean
) {
  return emitter?.off(event, fn, context, once);
}

export function once<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    fn: EventEmitter.EventListener<EventTypes, T>,
    context?: any
) {
  return emitter?.once(event, fn, context);
}
