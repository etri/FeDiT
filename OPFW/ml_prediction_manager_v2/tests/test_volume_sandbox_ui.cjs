const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Element {
    constructor() { this.children = []; this.events = {}; this.value = ''; this.textContent = ''; }
    append(...items) { this.children.push(...items); }
    replaceChildren() { this.children = []; }
    addEventListener(name, callback) { this.events[name] = callback; }
    set innerHTML(_) { throw new Error('User volume data must not be inserted as HTML'); }
}

async function exercise(canManage) {
    const elements = Object.fromEntries(['message', 'submit', 'scope', 'rows', 'create', 'name', 'size', 'refresh'].map(id => [id, new Element()]));
    const requests = [];
    const namespace = 'kubeflow-alice-example-com';
    const name = 'pm-user-training';
    const context = {
        URL, URLSearchParams,
        window: { location: { href: `http://localhost:18000/volumes/?ns=${namespace}`, search: `?ns=${namespace}` }, prompt: () => name },
        document: { getElementById: id => elements[id], createElement: () => new Element() },
        fetch: async (url, options) => {
            requests.push({ url: new URL(url), ...options });
            assert.equal(url.pathname, options.method === 'DELETE' ? `/volumes/api/${name}` : '/volumes/api');
            assert.equal(url.searchParams.get('ns'), namespace);
            assert.equal(options.credentials, 'same-origin');
            if (options.method === 'DELETE') return { ok: false, status: 409, json: async () => ({ detail: 'volume is in use' }) };
            if (options.method === 'POST') return { ok: true, json: async () => ({ name }) };
            return { ok: true, json: async () => ({ namespace, can_manage: canManage, volumes: [{ name, namespace, size: '10Gi', status: '<unsafe>', storage_class: 'local-path' }] }) };
        },
    };
    const source = fs.readFileSync(path.join(__dirname, '../static/js/volumes-sandbox.js'), 'utf8');
    await vm.runInNewContext(source, context);
    assert.ok(elements.rows.children[0], elements.message.textContent);
    assert.equal(elements.rows.children[0].children[2].textContent, '<unsafe>');
    assert.equal(elements.submit.disabled, !canManage);
    elements.name.value = 'training'; elements.size.value = '10';
    await elements.create.events.submit({ preventDefault() {} });
    const post = requests.find(r => r.method === 'POST');
    if (canManage) {
        assert.deepEqual(JSON.parse(post.body), { name: 'training', size_gib: 10 });
        const button = elements.rows.children[0].children[4].children[0];
        await button.events.click();
        assert.match(elements.message.textContent, /volume is in use.*409/);
        assert.equal(elements.message.className, 'error');
    } else {
        assert.equal(post, undefined);
        const button = elements.rows.children[0].children[4].children[0];
        assert.equal(button.disabled, true);
        await button.events.click();
        assert.equal(requests.some(r => r.method === 'DELETE'), false);
    }
}

(async () => {
    await exercise(true);
    await exercise(false);
    console.log('PASS volume UI: scoped URLs, create payload, safe text rendering, in-use error and readonly actions');
})().catch(error => { console.error(error); process.exitCode = 1; });
