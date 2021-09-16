/**
 * @jest-environment jsdom
 */
window.fetch = require('node-fetch');

import {defineElement} from '../src/plugins/jd-micro/element';

test('test web components', () => {
  defineElement('micro-app');
  expect(typeof window.customElements.get('micro-app')).toBe('function');
});
