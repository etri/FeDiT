'use strict';
const endpoint = new URL('./api', window.location.href);
const namespace = new URLSearchParams(window.location.search).get('ns');
if (namespace) endpoint.searchParams.set('ns', namespace);
const message = document.getElementById('message');
const submit = document.getElementById('submit');
let canManage = false;
let busy = false;

function notify(text, error = false) {
    message.textContent = text;
    message.className = error ? 'error' : '';
}

async function call(method = 'GET', name = '', payload = null) {
    const url = new URL(endpoint);
    if (name) url.pathname += '/' + encodeURIComponent(name);
    const response = await fetch(url, {
        method, credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        const detail = typeof result.detail === 'string' ? result.detail : '요청을 처리하지 못했습니다.';
        throw new Error(`${detail} (HTTP ${response.status})`);
    }
    return result;
}

async function refresh() {
    const result = await call();
    canManage = result.can_manage === true;
    submit.disabled = !canManage || busy;
    document.getElementById('scope').textContent = result.namespace + (canManage ? '' : ' · 읽기 전용');
    const rows = document.getElementById('rows');
    rows.replaceChildren();
    for (const volume of result.volumes) {
        const row = document.createElement('tr');
        for (const value of [volume.name, volume.size, volume.status, volume.storage_class]) {
            const cell = document.createElement('td');
            cell.textContent = value || '-';
            row.append(cell);
        }
        const action = document.createElement('td');
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'danger'; button.textContent = '삭제';
        button.disabled = !canManage || busy;
        button.addEventListener('click', async () => {
            if (busy || !canManage) return;
            if (window.prompt(`볼륨을 삭제하면 데이터가 삭제됩니다. 확인하려면 ${volume.name} 을 입력하세요.`) !== volume.name) return;
            busy = true; button.disabled = true; submit.disabled = true;
            try {
                await call('DELETE', volume.name);
                notify('볼륨 삭제를 요청했습니다.');
            } catch (error) { notify(error.message, true); }
            finally {
                busy = false;
                await refresh().catch(error => notify(error.message, true));
            }
        });
        action.append(button); row.append(action); rows.append(row);
    }
    if (!result.volumes.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td'); cell.colSpan = 5;
        cell.textContent = '등록된 사용자 볼륨이 없습니다.'; row.append(cell); rows.append(row);
    }
}

document.getElementById('create').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !canManage) return;
    busy = true; submit.disabled = true;
    try {
        const result = await call('POST', '', {
            name: document.getElementById('name').value.trim(),
            size_gib: Number(document.getElementById('size').value),
        });
        notify(`${result.name} 볼륨을 만들었습니다.`);
        document.getElementById('name').value = '';
    } catch (error) { notify(error.message, true); }
    finally { busy = false; await refresh().catch(error => notify(error.message, true)); }
});
document.getElementById('refresh').addEventListener('click', () => {
    refresh().catch(error => notify(error.message, true));
});
refresh().catch(error => notify(error.message, true));
