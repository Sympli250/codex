const { JSDOM } = require('jsdom');
const fs = require('fs');
const htmlTemplate = '<!doctype html><html><body><div id="chatMessages"></div></body></html>';
const dom = new JSDOM(htmlTemplate, { runScripts: 'dangerously' });
const { window } = dom;
window.SYMPLISSIME_CONFIG = {};
window.marked = { setOptions() {}, parse: (s) => s };
window.DOMPurify = { sanitize: (s) => s };
window.hljs = { highlightElement() {} };
const script = fs.readFileSync('./symplissimeai.js', 'utf8');
window.eval(script);
const app = new window.SymplissimeAIApp();
const content = '<p>Hello <strong>world</strong></p>';
app.streamMessage(content);
setTimeout(() => {
  const rendered = window.document.querySelector('#chatMessages .message').innerHTML.trim();
  const expected = app.generateHTML(content).trim();
  if (rendered === expected) {
    console.log('Streaming output matches expected HTML.');
    process.exit(0);
  } else {
    console.error('Streaming output mismatch.');
    console.error('Rendered:', rendered);
    console.error('Expected:', expected);
    process.exit(1);
  }
}, 50);
