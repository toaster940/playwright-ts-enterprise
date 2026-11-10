const $ = (selector) => document.querySelector(selector);
const text = (id, value) => {
  $(id).textContent = value;
};
$('#environment').onchange = (event) =>
  text(
    '[data-testid="environment-result"]',
    `Environment: ${event.target.selectedOptions[0].textContent}`,
  );
$('#browser-selection').onchange = (event) =>
  text(
    '[data-testid="browser-result"]',
    [...event.target.selectedOptions].map((option) => option.textContent).join(', ') ||
      'No browsers selected',
  );
const regions = {
  IN: [
    ['KA', 'Karnataka'],
    ['MH', 'Maharashtra'],
  ],
  US: [
    ['CA', 'California'],
    ['TX', 'Texas'],
  ],
};
$('#country').onchange = (event) => {
  const select = $('#state');
  select.replaceChildren(
    new Option(event.target.value ? 'Choose a region' : 'Choose a country first', ''),
  );
  for (const [value, label] of regions[event.target.value] ?? [])
    select.add(new Option(label, value));
  select.disabled = !event.target.value;
  text('[data-testid="region-result"]', 'No region selected');
};
$('#state').onchange = (event) =>
  text(
    '[data-testid="region-result"]',
    event.target.value
      ? `Region: ${event.target.selectedOptions[0].textContent}`
      : 'No region selected',
  );

// Editable combobox: DOM focus stays on the input; aria-activedescendant tracks options.
const reviewers = [
  'Ada Lovelace',
  'Grace Hopper',
  'Ken Thompson',
  'Linus Torvalds',
  'Margaret Hamilton',
];
let suggestions = [];
let reviewerIndex = -1;
function closeReviewers() {
  $('#reviewer-list').hidden = true;
  $('#reviewer').setAttribute('aria-expanded', 'false');
  $('#reviewer').removeAttribute('aria-activedescendant');
}
function highlightReviewer() {
  $('#reviewer-list')
    .querySelectorAll('[role=option]')
    .forEach((option, index) =>
      option.setAttribute('aria-selected', String(index === reviewerIndex)),
    );
  if (reviewerIndex >= 0)
    $('#reviewer').setAttribute('aria-activedescendant', `reviewer-option-${reviewerIndex}`);
  else $('#reviewer').removeAttribute('aria-activedescendant');
}
function chooseReviewer(name) {
  $('#reviewer').value = name;
  text('[data-testid="reviewer-result"]', `Reviewer: ${name}`);
  closeReviewers();
  $('#reviewer').focus();
  closeReviewers();
}
function showReviewers() {
  suggestions = reviewers.filter((name) =>
    name.toLowerCase().includes($('#reviewer').value.toLowerCase()),
  );
  reviewerIndex = -1;
  const list = $('#reviewer-list');
  list.replaceChildren();
  suggestions.forEach((name, index) => {
    const option = document.createElement('li');
    option.id = `reviewer-option-${index}`;
    option.role = 'option';
    option.setAttribute('aria-selected', 'false');
    option.textContent = name;
    option.onmousedown = (event) => event.preventDefault();
    option.onclick = () => chooseReviewer(name);
    list.append(option);
  });
  list.hidden = !suggestions.length;
  $('#reviewer').setAttribute('aria-expanded', String(suggestions.length > 0));
  highlightReviewer();
  if (!suggestions.length) text('[data-testid="reviewer-result"]', 'No reviewers found');
}
$('#reviewer').onfocus = showReviewers;
$('#reviewer').oninput = showReviewers;
$('#reviewer').onkeydown = (event) => {
  if (event.key === 'Escape') {
    closeReviewers();
    return;
  }
  if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault();
    if ($('#reviewer-list').hidden) showReviewers();
    if (!suggestions.length) return;
    reviewerIndex =
      reviewerIndex < 0
        ? event.key === 'ArrowDown'
          ? 0
          : suggestions.length - 1
        : (reviewerIndex + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) %
          suggestions.length;
    highlightReviewer();
  }
  if (event.key === 'Enter' && reviewerIndex >= 0 && !$('#reviewer-list').hidden) {
    event.preventDefault();
    chooseReviewer(suggestions[reviewerIndex]);
  }
};
document.addEventListener('pointerdown', (event) => {
  if (!$('#reviewer-control').contains(event.target)) closeReviewers();
});

function showReminderError() {
  $('#reminder-date').setAttribute('aria-invalid', 'true');
  $('#reminder-error').hidden = false;
  text('#reminder-error', 'Choose a date between 2026-01-01 and 2030-12-31.');
}
$('#reminder-date').oninvalid = (event) => {
  event.preventDefault();
  showReminderError();
};
$('#reminder-date').oninput = () => {
  $('#reminder-date').removeAttribute('aria-invalid');
  $('#reminder-error').hidden = true;
};
$('#reminder-form').onsubmit = (event) => {
  event.preventDefault();
  const field = $('#reminder-date');
  const date = new Date(`${field.value}T12:00:00Z`);
  // Keep range enforcement consistent when a browser does not apply date min/max.
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(field.value) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === field.value &&
    field.value >= field.min &&
    field.value <= field.max;
  if (!valid) {
    showReminderError();
    return;
  }
  field.removeAttribute('aria-invalid');
  $('#reminder-error').hidden = true;
  text('[data-testid="reminder-result"]', `Reminder: ${field.value}`);
};
$('#range-form').onsubmit = (event) => {
  event.preventDefault();
  const start = $('#start-date');
  const end = $('#end-date');
  const error = $('#range-error');
  const invalid = !start.value || !end.value || end.value < start.value;
  start.setAttribute('aria-invalid', String(!start.value));
  end.setAttribute('aria-invalid', String(invalid));
  error.hidden = !invalid;
  if (invalid)
    text('#range-error', 'Choose both dates; the end date must be on or after the start date.');
  else text('[data-testid="range-result"]', `${start.value} → ${end.value}`);
};

const months = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2026, index, 1)),
  ),
);
months.forEach((label, index) => $('#calendar-month').add(new Option(label, String(index))));
let calendarYear = 2026;
let calendarMonth = 9;
let activeDate = '2026-10-01';
const iso = (date) => date.toISOString().slice(0, 10);
const parseDate = (value) => new Date(`${value}T12:00:00Z`);
const weekend = (date) => [0, 6].includes(date.getUTCDay());
const longDate = (date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
function renderCalendar(focusDate) {
  $('#calendar-month').value = String(calendarMonth);
  $('#calendar-year').value = String(calendarYear);
  text('#calendar-caption', `${months[calendarMonth]} ${calendarYear}`);
  $('#previous-month').disabled = calendarYear === 2026 && calendarMonth === 0;
  $('#next-month').disabled = calendarYear === 2028 && calendarMonth === 11;
  const body = $('#calendar-days');
  body.replaceChildren();
  const first = new Date(Date.UTC(calendarYear, calendarMonth, 1, 12));
  const count = new Date(Date.UTC(calendarYear, calendarMonth + 1, 0, 12)).getUTCDate();
  if (!activeDate.startsWith(`${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`)) {
    const candidate = new Date(first);
    while (weekend(candidate)) candidate.setUTCDate(candidate.getUTCDate() + 1);
    activeDate = iso(candidate);
  }
  const cells = Math.ceil((first.getUTCDay() + count) / 7) * 7;
  for (let offset = 0; offset < cells; offset += 7) {
    const row = document.createElement('tr');
    for (let weekday = 0; weekday < 7; weekday++) {
      const cell = document.createElement('td');
      cell.role = 'gridcell';
      const day = offset + weekday - first.getUTCDay() + 1;
      if (day > 0 && day <= count) {
        const date = new Date(Date.UTC(calendarYear, calendarMonth, day, 12));
        const value = iso(date);
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(day);
        button.dataset.date = value;
        button.setAttribute('aria-label', longDate(date));
        button.disabled = weekend(date);
        button.tabIndex = value === activeDate ? 0 : -1;
        cell.setAttribute('aria-selected', String(value === $('#meeting-date').value));
        button.onclick = () => {
          $('#meeting-date').value = value;
          $('#calendar-dialog').close();
        };
        button.onkeydown = (event) => {
          const deltas = {
            ArrowRight: 1,
            ArrowLeft: -1,
            ArrowDown: 7,
            ArrowUp: -7,
            Home: -date.getUTCDay() + 1,
            End: 5 - date.getUTCDay(),
          };
          if (!(event.key in deltas)) return;
          event.preventDefault();
          const next = new Date(date);
          const delta = deltas[event.key];
          next.setUTCDate(next.getUTCDate() + delta);
          while (weekend(next)) next.setUTCDate(next.getUTCDate() + (delta < 0 ? -1 : 1));
          if (next.getUTCFullYear() < 2026 || next.getUTCFullYear() > 2028) return;
          calendarYear = next.getUTCFullYear();
          calendarMonth = next.getUTCMonth();
          activeDate = iso(next);
          renderCalendar(activeDate);
        };
        cell.append(button);
      }
      row.append(cell);
    }
    body.append(row);
  }
  if (focusDate) body.querySelector(`[data-date="${focusDate}"]`)?.focus();
}
$('#open-calendar').onclick = () => {
  if ($('#meeting-date').value) {
    activeDate = $('#meeting-date').value;
    const date = parseDate(activeDate);
    calendarYear = date.getUTCFullYear();
    calendarMonth = date.getUTCMonth();
  }
  renderCalendar();
  $('#calendar-dialog').showModal();
  $('#calendar-days').querySelector('[tabindex="0"]')?.focus();
};
$('#calendar-month').onchange = (event) => {
  calendarMonth = Number(event.target.value);
  renderCalendar();
};
$('#calendar-year').onchange = (event) => {
  calendarYear = Number(event.target.value);
  renderCalendar();
};
for (const [selector, delta] of [
  ['#previous-month', -1],
  ['#next-month', 1],
])
  $(selector).onclick = () => {
    const next = new Date(Date.UTC(calendarYear, calendarMonth + delta, 1));
    calendarYear = next.getUTCFullYear();
    calendarMonth = next.getUTCMonth();
    renderCalendar();
  };
$('#cancel-calendar').onclick = () => $('#calendar-dialog').close();
$('#calendar-dialog').onclose = () => $('#open-calendar').focus();

$('#theme-switch').onclick = () => {
  const enabled = $('#theme-switch').getAttribute('aria-checked') !== 'true';
  $('#theme-switch').setAttribute('aria-checked', String(enabled));
  document.body.classList.toggle('lab-dark', enabled);
};
document
  .querySelectorAll('[name=delivery]')
  .forEach(
    (input) =>
      (input.onchange = () => text('[data-testid="delivery-result"]', `Delivery: ${input.value}`)),
  );
$('#priority').oninput = (event) =>
  text('[data-testid="priority-result"]', `Priority: ${event.target.value}`);
function updateSeats(value) {
  const count = Math.max(1, Math.min(10, Number(value) || 1));
  $('#seats').value = String(count);
  $('#decrease-seats').disabled = count === 1;
  $('#increase-seats').disabled = count === 10;
  text('[data-testid="seats-result"]', `Seats: ${count}`);
}
$('#seats').onchange = (event) => updateSeats(event.target.value);
$('#increase-seats').onclick = () => updateSeats(Number($('#seats').value) + 1);
$('#decrease-seats').onclick = () => updateSeats(Number($('#seats').value) - 1);
for (const event of ['focus', 'pointerenter'])
  $('#priority-help').addEventListener(event, () => {
    $('#priority-tooltip').hidden = false;
  });
for (const event of ['blur', 'pointerleave'])
  $('#priority-help').addEventListener(event, () => {
    $('#priority-tooltip').hidden = true;
  });
$('#priority-help').onkeydown = (event) => {
  if (event.key === 'Escape') $('#priority-tooltip').hidden = true;
};

const tabs = [...$('#project-tabs').querySelectorAll('[role=tab]')];
function activateTab(index, focus = false) {
  tabs.forEach((tab, position) => {
    const selected = position === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    $(`#${tab.getAttribute('aria-controls')}`).hidden = !selected;
  });
  if (focus) tabs[index].focus();
}
tabs.forEach((tab, index) => {
  tab.onclick = () => activateTab(index);
  tab.onkeydown = (event) => {
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft'
          ? (index + tabs.length - 1) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? tabs.length - 1
              : null;
    if (next !== null) {
      event.preventDefault();
      activateTab(next, true);
    }
  };
});
let toastTimer;
function dismissToast() {
  clearTimeout(toastTimer);
  $('#toast').hidden = true;
}
function showToast(message) {
  clearTimeout(toastTimer);
  text('#toast-message', message);
  $('#toast').hidden = false;
  toastTimer = setTimeout(dismissToast, 5000);
}
$('#save-preferences').onclick = () => showToast('Preferences saved');
$('#dismiss-toast').onclick = dismissToast;
const menuItems = [...$('#project-menu').querySelectorAll('[role=menuitem]')];
function closeMenu(restore = false) {
  $('#project-menu').hidden = true;
  $('#project-actions').setAttribute('aria-expanded', 'false');
  if (restore) $('#project-actions').focus();
}
function openMenu() {
  $('#project-menu').hidden = false;
  $('#project-actions').setAttribute('aria-expanded', 'true');
  menuItems[0].focus();
}
$('#project-actions').onclick = () => ($('#project-menu').hidden ? openMenu() : closeMenu(true));
$('#project-actions').onkeydown = (event) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    openMenu();
  }
};
menuItems.forEach((item, index) => {
  item.onkeydown = (event) => {
    if (event.key === 'Escape') {
      closeMenu(true);
      return;
    }
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      menuItems[
        (index + (event.key === 'ArrowDown' ? 1 : -1) + menuItems.length) % menuItems.length
      ].focus();
    }
  };
  item.onclick = () => {
    closeMenu();
    if (index === 1) $('#archive-dialog').showModal();
    else showToast('Rename action selected');
  };
});
document.addEventListener('pointerdown', (event) => {
  if (!$('.menu-wrapper').contains(event.target)) closeMenu();
});
$('#cancel-archive').onclick = () => $('#archive-dialog').close();
$('#confirm-archive').onclick = () => {
  text('[data-testid="project-state"]', 'Archived');
  $('#archive-dialog').close();
  showToast('Project archived');
};
$('#archive-dialog').onclose = () => $('#project-actions').focus();

const releases = [
  ['Aster', 'Ada', 'Ready'],
  ['Birch', 'Grace', 'Blocked'],
  ['Cedar', 'Margaret', 'Ready'],
  ['Delta', 'Ken', 'Blocked'],
  ['Elm', 'Linus', 'Ready'],
  ['Fir', 'Ada', 'Blocked'],
];
const selectedReleases = new Set();
let tablePage = 0;
let descending = false;
let visibleReleases = [];
function updateSelection() {
  const selected = visibleReleases.filter((row) => selectedReleases.has(row[0])).length;
  $('#select-page').checked = visibleReleases.length > 0 && selected === visibleReleases.length;
  $('#select-page').indeterminate = selected > 0 && selected < visibleReleases.length;
  $('#select-page').disabled = !visibleReleases.length;
  text('[data-testid="selected-rows"]', `${selectedReleases.size} releases selected`);
}
function renderReleases() {
  const filtered = releases
    .filter((row) => row[0].toLowerCase().includes($('#release-filter').value.toLowerCase()))
    .sort((a, b) => a[0].localeCompare(b[0]) * (descending ? -1 : 1));
  const pages = Math.max(1, Math.ceil(filtered.length / 3));
  tablePage = Math.min(tablePage, pages - 1);
  visibleReleases = filtered.slice(tablePage * 3, tablePage * 3 + 3);
  const body = $('#release-rows');
  body.replaceChildren();
  for (const row of visibleReleases) {
    const tr = document.createElement('tr');
    const selectCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('aria-label', `Select ${row[0]}`);
    checkbox.checked = selectedReleases.has(row[0]);
    checkbox.onchange = () => {
      if (checkbox.checked) selectedReleases.add(row[0]);
      else selectedReleases.delete(row[0]);
      updateSelection();
    };
    selectCell.append(checkbox);
    tr.append(selectCell);
    for (const value of row) {
      const cell = document.createElement('td');
      cell.textContent = value;
      tr.append(cell);
    }
    body.append(tr);
  }
  if (!filtered.length) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 4;
    cell.textContent = 'No releases found';
  }
  $('#previous-page').disabled = tablePage === 0;
  $('#next-page').disabled = tablePage >= pages - 1;
  text('[data-testid="page-result"]', `Page ${tablePage + 1} of ${pages}`);
  $('#release-name-heading').setAttribute('aria-sort', descending ? 'descending' : 'ascending');
  updateSelection();
}
$('#release-filter').oninput = () => {
  tablePage = 0;
  renderReleases();
};
$('#sort-release').onclick = () => {
  descending = !descending;
  tablePage = 0;
  renderReleases();
};
$('#previous-page').onclick = () => {
  tablePage--;
  renderReleases();
};
$('#next-page').onclick = () => {
  tablePage++;
  renderReleases();
};
$('#select-page').onchange = (event) => {
  for (const row of visibleReleases) {
    if (event.target.checked) selectedReleases.add(row[0]);
    else selectedReleases.delete(row[0]);
  }
  renderReleases();
};
renderReleases();
$('#registration-form').onsubmit = (event) => {
  event.preventDefault();
  const name = $('#full-name');
  const email = $('#contact-email');
  const terms = $('#terms');
  const errors = [];
  const invalidName = !name.value.trim();
  const invalidEmail = !email.value || !email.validity.valid;
  if (invalidName) errors.push('Full name is required.');
  if (invalidEmail) errors.push('Enter a valid email address.');
  if (!terms.checked) errors.push('Accept the terms.');
  name.setAttribute('aria-invalid', String(invalidName));
  email.setAttribute('aria-invalid', String(invalidEmail));
  terms.setAttribute('aria-invalid', String(!terms.checked));
  $('#registration-errors').hidden = !errors.length;
  text('#registration-errors', errors.join(' '));
  if (!errors.length)
    text('[data-testid="registration-result"]', `Registration saved for ${name.value.trim()}`);
};
