/**
 * DOM Utility Helpers
 */

export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

export const on = (element, event, handler, options = {}) => {
  if (!element) return;
  element.addEventListener(event, handler, options);
};

export const addClass = (element, className) => {
  if (element) element.classList.add(className);
};

export const removeClass = (element, className) => {
  if (element) element.classList.remove(className);
};

export const toggleClass = (element, className) => {
  if (element) return element.classList.toggle(className);
};
