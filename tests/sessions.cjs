// Run with `node tests/sessions.cjs` with Playwright installed.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const DB_KEY = 'form-training-v1';
(async () => {
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    try {
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': file.endsWith('.json') ? 'application/json' : 'text/html' });
      res.end(data);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    await context.route('https://exercise-dataset.com/**', route => route.fulfill({ json: { exercises: [] } }));
    await context.addInitScript(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (window.blockTrainingWrites && key === 'form-training-v1') throw new DOMException('Full', 'QuotaExceededError');
        return original.call(this, key, value);
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    const base = `http://127.0.0.1:${server.address().port}`;
    const data = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), DB_KEY);
    const exercise = name => page.locator('.exercise').filter({ has: page.locator('.name-text', { hasText: new RegExp('^' + name + '$') }) });
    const openHistory = async card => {
      await card.locator('summary').click();
      await card.getByRole('button', { name: 'History', exact: true }).click();
    };
    const switchWorkout = async (id, title) => {
      await page.getByRole('combobox', { name: 'Select workout' }).selectOption(id);
      await page.waitForFunction(t => document.getElementById('workout-title').textContent === t && !document.getElementById('workout-select').disabled, title);
    };
    await page.goto(base);
    await page.waitForSelector('.exercise');
    assert(await page.locator('.donebtn').first().isDisabled());
    await openHistory(exercise('Goblet squat'));
    assert.match(await page.locator('#history-content').textContent(), /No finished sessions/);
    await page.getByRole('button', { name: 'Close history' }).click();
    await page.getByRole('button', { name: 'Start workout', exact: true }).click();
    await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
    assert.match(await page.locator('#status').textContent(), /Complete at least one set/);
    const squat = exercise('Goblet squat');
    await squat.locator('input').nth(0).fill('12');
    await squat.locator('input').nth(1).fill('20');
    await squat.locator('.donebtn').nth(0).click();
    await squat.locator('input').nth(2).fill('8');
    await squat.locator('input').nth(3).fill('22.5');
    await squat.locator('.donebtn').nth(1).click();
    await squat.locator('.donebtn').nth(2).click();
    assert(await squat.evaluate(e => e.classList.contains('finished')));
    await squat.locator('.collapse-toggle').click();
    assert(await squat.locator('.sets').isHidden());
    await squat.locator('.collapse-toggle').click();
    await squat.locator('.donebtn').nth(2).click();
    assert(!await squat.evaluate(e => e.classList.contains('finished')));
    await page.reload();
    await page.waitForSelector('.exercise');
    assert.equal(await squat.locator('input').first().inputValue(), '12');
    assert.equal(await page.locator('#completed').textContent(), '2');
    assert.equal((await data()).history.length, 0);
    await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
    assert.equal((await data()).history.length, 1);
    await page.getByRole('button', { name: 'Start workout', exact: true }).click();
    assert.equal(await squat.locator('.set').count(), 2);
    assert.equal(await squat.locator('input').nth(3).inputValue(), '22.5');
    assert.equal(await page.locator('#completed').textContent(), '0');
    assert.match(await squat.locator('.session-hint').textContent(), /From /);
    await squat.locator('input').first().fill('7');
    await openHistory(squat);
    assert.match(await page.locator('.history-sets').textContent(), /12 × 20 kg/);
    assert.equal(await page.locator('.history-sets span').count(), 2);
    await page.getByRole('button', { name: 'Use these values', exact: true }).click();
    assert.equal(await squat.locator('input').first().inputValue(), '12');
    // Renaming retains history identity, and keyboard reordering retains draft values.
    await squat.locator('.name-btn').click();
    await page.getByRole('textbox', { name: 'Exercise name', exact: true }).fill('My squat');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const renamed = exercise('My squat');
    await openHistory(renamed);
    assert.equal(await page.locator('.history-entry').count(), 1);
    await page.getByRole('button', { name: 'Close history' }).click();
    await renamed.locator('.drag-handle').focus();
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('.name-text').nth(1).textContent(), 'My squat');
    // Same exercise shares history across workouts; an alternative has separate history.
    const glute = exercise('Glute bridge');
    await glute.locator('input').nth(1).fill('35');
    await glute.locator('.donebtn').first().click();
    await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
    await switchWorkout('lower', 'Lower');
    await page.getByRole('button', { name: 'Start workout', exact: true }).click();
    assert.equal(await exercise('Glute bridge').locator('.set').count(), 1);
    assert.equal(await exercise('Glute bridge').locator('input').nth(1).inputValue(), '35');
    await exercise('Glute bridge').locator('summary').click();
    await exercise('Glute bridge').getByRole('button', { name: 'Alternatives', exact: true }).click();
    const spacing = await exercise('Glute bridge').locator('.alternatives').evaluate(panel => {
      const label = panel.querySelector('label'), select = panel.querySelector('select');
      const range = document.createRange(); range.selectNodeContents(label.firstChild);
      return select.getBoundingClientRect().top - range.getBoundingClientRect().bottom;
    });
    assert(spacing >= 10, 'Alternative dropdown must clear its label');
    await exercise('Glute bridge').getByRole('combobox').selectOption('exercise-cable-kickbacks');
    assert.equal(await exercise('Cable kickbacks').locator('input').nth(1).inputValue(), '0');
    await openHistory(exercise('Cable kickbacks'));
    assert.equal(await page.locator('.history-entry').count(), 0);
    await page.getByRole('button', { name: 'Close history' }).click();
    // A failed persistence attempt must not report a finished/archived workout.
    await exercise('Cable kickbacks').locator('.donebtn').first().click();
    await page.evaluate(() => window.blockTrainingWrites = true);
    const historyCount = (await data()).history.length;
    await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
    assert.equal((await data()).history.length, historyCount);
    assert(await page.getByRole('button', { name: 'Finish workout', exact: true }).isVisible());
    assert.match(await page.locator('#status').textContent(), /Could not save/);
    await page.evaluate(() => window.blockTrainingWrites = false);
    // Backup round trip restores both history and active drafts.
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export backup', exact: true }).click();
    const download = await downloadPromise;
    const backup = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
    assert.equal(backup.data.history.length, historyCount);
    assert(backup.data.drafts.lower);
    const beforeInvalid = await data();
    await page.locator('#backup-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1}') });
    await page.waitForFunction(() => document.getElementById('status').textContent.includes('Invalid backup'));
    assert.deepEqual(await data(), beforeInvalid);
    await page.evaluate(() => localStorage.removeItem('form-training-v1'));
    await page.reload(); await page.waitForSelector('.exercise');
    await page.locator('#backup-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await page.waitForFunction(() => document.getElementById('status').textContent === 'Backup imported.');
    assert.equal((await data()).history.length, historyCount);
    assert(await page.getByRole('button', { name: 'Finish workout', exact: true }).isVisible());
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal page overflow');
    }
    // Migration keeps old undated values but never fabricates history or completion.
    await page.evaluate(async () => {
      localStorage.clear();
      const template = await (await fetch('workouts/full-body.json')).json();
      const old = template.exercises.map((e, i) => ({ id: 'full-body-' + i, name: e.name, sets: e.sets.map(s => ({ ...s, weight: 17.5, done: true })) }));
      localStorage.setItem('form-workout-full-body-v2', JSON.stringify(old));
    });
    await page.reload(); await page.waitForSelector('.exercise');
    assert.equal(await page.locator('.set input').nth(1).inputValue(), '17.5');
    await page.getByRole('button', { name: 'Start workout', exact: true }).click();
    assert.equal(await page.locator('.set input').nth(1).inputValue(), '17.5');
    assert.equal(await page.locator('#completed').textContent(), '0');
    assert.equal((await data()).history.length, 0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '/tmp/form-sessions-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: sessions, draft resume, completed-only prefill, history/use values, identity/rename/reorder, shared exercise and alternative isolation, dropdown spacing, failed storage, backup round trip/invalid import, responsive layout, legacy migration');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
