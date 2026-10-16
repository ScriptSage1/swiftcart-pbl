/*
 * SwiftCart prototype — application state.
 * A tiny observable store persisted to localStorage, so the cart and saved
 * address survive a refresh or a return visit (FR-04: persistent cart).
 * Card details are never written here.
 */
(function () {
  'use strict';

  const KEY = 'swiftcart:v1';
  const MAX_EVENTS = 200;
  let subscribers = [];

  function defaults() {
    return {
      cart: [],          // [{ id, qty }]
      promoCode: '',
      deliveryId: 'standard',
      contact: {},       // saved contact and address fields
      orders: {},        // placed orders keyed by order id
      events: []         // checkout-funnel analytics log
    };
  }

  function load() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(KEY));
      return Object.assign(defaults(), saved && typeof saved === 'object' ? saved : {});
    } catch (err) {
      return defaults();
    }
  }

  function save() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      /* storage unavailable (private mode): keep working in memory */
    }
  }

  let state = load();

  function set(patch, reason) {
    state = Object.assign({}, state, patch);
    save();
    subscribers.slice().forEach(function (fn) { fn(state, reason || ''); });
  }

  window.SC_STORE = {
    get: function () { return state; },
    set: set,
    subscribe: function (fn) {
      subscribers.push(fn);
      return function () { subscribers = subscribers.filter(function (s) { return s !== fn; }); };
    },
    // Records a funnel event (view_cart, begin_checkout, purchase ...) without notifying the UI.
    track: function (name, data) {
      const events = state.events.concat([{ name: name, at: Date.now(), data: data || {} }]);
      state = Object.assign({}, state, { events: events.slice(-MAX_EVENTS) });
      save();
    },
    reset: function () {
      state = defaults();
      save();
      subscribers.slice().forEach(function (fn) { fn(state, 'reset'); });
    }
  };
})();
