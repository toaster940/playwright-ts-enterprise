const $ = (selector) => document.querySelector(selector);
const namespace = localStorage.getItem('namespace') || crypto.randomUUID();
localStorage.setItem('namespace', namespace);
const headers = { 'Content-Type': 'application/json', 'x-test-namespace': namespace };
async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) throw new Error((await response.json()).error);
  return response.status === 204 ? null : response.json();
}
const status = (text) => {
  $('#status').textContent = text;
};
async function render() {
  try {
    const tasks = await api('/api/tasks');
    $('#tasks').replaceChildren();
    for (const task of tasks) {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', async () => {
        await api(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: checkbox.checked }),
        });
        status('Task updated');
      });
      label.append(checkbox, document.createTextNode(task.title));
      const remove = document.createElement('button');
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', `Delete ${task.title}`);
      remove.onclick = async () => {
        await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
        await render();
        status('Task deleted');
      };
      li.append(label, remove);
      $('#tasks').append(li);
    }
  } catch (error) {
    status(error.message);
  }
}
$('#login').onsubmit = async (event) => {
  event.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(event.target));
    await api('/api/login', { method: 'POST', body: JSON.stringify(data) });
    $('#user').textContent = 'QA Engineer';
    await render();
    status('Signed in');
  } catch (error) {
    status(error.message);
  }
};
$('#task-form').onsubmit = async (event) => {
  event.preventDefault();
  try {
    await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: event.target.title.value }),
    });
    event.target.reset();
    await render();
    status('Task created');
  } catch (error) {
    status(error.message);
  }
};
api('/api/me')
  .then((user) => {
    $('#user').textContent = user.name;
    return render();
  })
  .catch(() => {});
$('#catalog').onclick = async () => {
  try {
    $('#catalog-result').textContent = (await api('/api/catalog')).map((x) => x.name).join(', ');
  } catch (error) {
    $('#catalog-result').textContent = error.message;
  }
};
$('#alert').onclick = () => alert('Playwright dialog');
$('#confirm').onclick = () => status(confirm('Continue?') ? 'Confirmed' : 'Cancelled');
$('#timer').onclick = () => {
  $('#timer-result').textContent = 'Waiting';
  setTimeout(() => {
    $('#timer-result').textContent = 'Timer complete';
  }, 30_000);
};
$('#clock').textContent = new Date().toISOString().slice(0, 10);
$('#upload').onchange = async (event) => {
  $('#uploaded').textContent = await event.target.files[0].text();
};
$('#source').ondragstart = (event) => event.dataTransfer.setData('text/plain', 'Quality delivered');
$('#target').ondragover = (event) => event.preventDefault();
$('#target').ondrop = (event) => {
  event.preventDefault();
  event.target.textContent = event.dataTransfer.getData('text/plain');
};
$('#socket').onclick = () => {
  const socket = new WebSocket(`ws://${location.host}/ws`);
  socket.onopen = () => socket.send('ping');
  socket.onmessage = (event) => {
    $('#socket-result').textContent = event.data;
    socket.close();
  };
};
$('#settings').onclick = () => $('#settings-dialog').showModal();
$('#save-settings').onclick = () => {
  $('#user').textContent = $('#display-name').value;
  $('#settings-dialog').close();
};
$('#cover').onclick = () => {
  $('#overlay').hidden = false;
};
$('#dismiss').onclick = () => {
  $('#overlay').hidden = true;
};
$('#clipboard').onclick = async () => {
  await navigator.clipboard.writeText('Hello QA');
  status('Copied');
};
$('#location').onclick = () =>
  navigator.geolocation.getCurrentPosition((position) => {
    $('#location-result').textContent = `${position.coords.latitude},${position.coords.longitude}`;
  });
customElements.define(
  'quality-badge',
  class extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: 'open' }).innerHTML = '<button>Shadow quality badge</button>';
    }
  },
);
const modelContext = document.modelContext ?? navigator.modelContext;
if (modelContext)
  modelContext.registerTool({
    name: 'quality_sum',
    description: 'Add two numbers for the Quality Lab WebMCP example',
    inputSchema: {
      type: 'object',
      properties: { a: { type: 'number' }, b: { type: 'number' } },
      required: ['a', 'b'],
      additionalProperties: false,
    },
    execute: async ({ a, b }) => ({ content: [{ type: 'text', text: String(a + b) }] }),
  });
