export default class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(eventName, listener) {
        const listeners = this.listeners.get(eventName) || new Set();
        listeners.add(listener);
        this.listeners.set(eventName, listeners);
        return this;
    }

    off(eventName, listener) {
        this.listeners.get(eventName)?.delete(listener);
        return this;
    }

    emit(eventName, ...args) {
        this.listeners.get(eventName)?.forEach(listener => listener(...args));
        return this;
    }

    addListener(eventName, listener) {
        return this.on(eventName, listener);
    }

    removeListener(eventName, listener) {
        return this.off(eventName, listener);
    }
}
