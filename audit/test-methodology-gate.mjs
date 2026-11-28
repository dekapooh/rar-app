import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const index = fs.readFileSync('index.html', 'utf8');
const script = index.match(/<!-- RAR methodology acknowledgement[\s\S]*?<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'methodology acknowledgement script exists');

function openApp(storage) {
  const elements = new Map();
  const document = { body: { style: {} }, activeElement: null, getElementById: element };

  function element(id) {
    if (!elements.has(id)) {
      const listeners = new Map();
      elements.set(id, {
        hidden: id === 'rarGateClose',
        disabled: id === 'rarGateAccept',
        checked: false,
        scrollTop: 100,
        addEventListener(type, callback) { listeners.set(type, callback); },
        dispatch(type) { listeners.get(type)(); },
        focus() { document.activeElement = this; },
        querySelector: element,
      });
    }
    return elements.get(id);
  }

  vm.runInNewContext(script, { document, localStorage: storage });
  return {
    document,
    app: element('app'),
    gate: element('rarMethodGate'),
    content: element('.rar-gate-content'),
    acknowledgement: element('rarGateAcknowledgement'),
    check: element('rarGateCheck'),
    accept: element('rarGateAccept'),
    close: element('rarGateClose'),
    review: element('rarMethodReviewBtn'),
  };
}

const saved = new Map();
const storage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
const first = openApp(storage);
assert.equal(first.gate.hidden, false);
assert.equal(first.app.inert, true);
assert.equal(first.document.activeElement, first.content);
assert.equal(first.accept.disabled, true);
first.accept.dispatch('click');
assert.equal(saved.size, 0);
first.check.checked = true;
first.check.dispatch('change');
assert.equal(first.accept.disabled, false);
first.accept.dispatch('click');
assert.equal(first.gate.hidden, true);
assert.equal(first.app.inert, false);

first.review.dispatch('click');
assert.equal(first.gate.hidden, false, 'review works in the same page after initial acceptance');
assert.equal(first.acknowledgement.hidden, true);
assert.equal(first.close.hidden, false);
assert.equal(first.content.scrollTop, 0);
first.close.dispatch('click');
assert.equal(first.gate.hidden, true);
assert.equal(first.document.activeElement, first.review);
assert.equal(openApp(storage).gate.hidden, true, 'reload retains acceptance');

const unavailable = () => { throw new Error('storage unavailable'); };
const privateSession = openApp({ getItem: unavailable, setItem: unavailable });
privateSession.check.checked = true;
privateSession.check.dispatch('change');
privateSession.accept.dispatch('click');
privateSession.review.dispatch('click');
assert.equal(privateSession.gate.hidden, false, 'review works even when storage fails');

console.log('METHODOLOGY_GATE_STARTUP_SAME_PAGE_REVIEW_AND_PERSISTENCE_PASS');
