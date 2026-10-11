import { COLS, ROWS, START, GOAL, isWall, transition, chooseAction, trainCheckpoints, seededRandom } from './model.js';
import { palettes } from './palette.js';

const $ = (id) => document.getElementById(id);
const canvas = $('world');
const ctx = canvas.getContext('2d');
const checkpoints = trainCheckpoints();
let q = checkpoints.get(800);
let state = START;
let steps = 0;
let reward = 0;
let playing = false;
let human = false;
let visible = true;
let timer;
let random = seededRandom(123);
let path = [START];
const cell = 80;

function draw() {
  const colors = palettes[document.documentElement.dataset.theme] || palettes.light;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = COLS * cell * dpr;
  canvas.height = ROWS * cell * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, COLS * cell, ROWS * cell);
  for (let s = 0; s < ROWS * COLS; s++) {
    const x = s % COLS * cell;
    const y = Math.floor(s / COLS) * cell;
    ctx.fillStyle = isWall(s) ? colors.wall : s === GOAL ? colors.goal : colors.cell;
    ctx.beginPath(); ctx.roundRect(x + 3, y + 3, cell - 6, cell - 6, 7); ctx.fill();
    if (isWall(s)) {
      ctx.fillStyle = colors.wallInner;
      ctx.beginPath(); ctx.roundRect(x + 13, y + 13, cell - 26, cell - 26, 4); ctx.fill();
    }
  }
  ctx.lineWidth = 6; ctx.strokeStyle = colors.path; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.setLineDash([2, 11]); ctx.beginPath();
  path.forEach((s, i) => {
    const x = (s % COLS + .5) * cell;
    const y = (Math.floor(s / COLS) + .5) * cell;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke(); ctx.setLineDash([]);
  const gx = (GOAL % COLS + .5) * cell;
  const gy = (Math.floor(GOAL / COLS) + .5) * cell;
  ctx.fillStyle = colors.star; ctx.font = '32px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', gx, gy + 1);
  const x = (state % COLS + .5) * cell;
  const y = (Math.floor(state / COLS) + .5) * cell;
  ctx.fillStyle = colors.agent; ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors.eyes;
  ctx.beginPath(); ctx.arc(x - 7, y - 3, 3.5, 0, Math.PI * 2); ctx.arc(x + 7, y - 3, 3.5, 0, Math.PI * 2); ctx.fill();
  $('steps').textContent = String(steps);
  $('reward').textContent = String(reward);
  canvas.setAttribute('aria-label', `Maze. Agent at row ${Math.floor(state / COLS) + 1}, column ${state % COLS + 1}. Goal at row ${ROWS}, column ${COLS}. ${steps} steps. Return ${reward}.`);
}

function stop() {
  playing = false;
  clearTimeout(timer);
  $('watch').textContent = '▶ Watch agent';
}

function reset() {
  stop(); state = START; steps = 0; reward = 0; path = [START]; random = seededRandom(123);
  $('status').textContent = human ? 'Your turn. Use arrow keys, WASD, or the direction buttons.' : 'Ready. Watch the policy or find your own way through.';
  $('mode-label').textContent = human ? 'Your turn' : 'Agent ready';
  draw();
}

function step(action) {
  if (state === GOAL) return;
  const result = transition(state, action);
  state = result.state; steps++; reward += result.reward; path.push(state);
  draw();
  if (result.done) {
    stop();
    $('status').textContent = `Goal reached in ${steps} steps. Total return: ${reward}. Reset to try again.`;
    $('mode-label').textContent = 'Goal reached';
  } else if (!human && steps >= 120) {
    stop();
    $('status').textContent = 'Episode ended after 120 steps. Try a later checkpoint or less exploration.';
    $('mode-label').textContent = 'Step limit';
  }
}

function schedule() {
  clearTimeout(timer);
  if (!playing || document.hidden || !visible) return;
  timer = setTimeout(() => {
    step(chooseAction(q, state, Number($('epsilon').value), random));
    schedule();
  }, 170);
}

$('watch').addEventListener('click', () => {
  if (playing) { stop(); $('mode-label').textContent = 'Paused'; $('status').textContent = 'Paused. Press Watch agent to continue.'; return; }
  human = false; $('direction-pad').hidden = true; $('play').setAttribute('aria-pressed', 'false');
  if (state === GOAL || steps >= 120) reset();
  playing = true;
  $('watch').textContent = 'Ⅱ Pause'; $('mode-label').textContent = 'Agent playing';
  $('status').textContent = 'Following the selected policy. Adjust exploration to add random actions.';
  schedule();
});
$('play').addEventListener('click', () => {
  human = true; reset(); $('direction-pad').hidden = false; $('play').setAttribute('aria-pressed', 'true'); canvas.focus();
});
$('reset').addEventListener('click', reset);
$('checkpoint').addEventListener('change', () => {
  const count = Number($('checkpoint').value);
  q = checkpoints.get(count); $('episodes').textContent = String(count); reset();
});
$('epsilon').addEventListener('input', () => { $('epsilon-value').value = Number($('epsilon').value).toFixed(2); });
canvas.addEventListener('keydown', (event) => {
  if (!human) return;
  const keys = { ArrowUp: 0, w: 0, ArrowRight: 1, d: 1, ArrowDown: 2, s: 2, ArrowLeft: 3, a: 3 };
  const action = keys[event.key];
  if (action !== undefined) { event.preventDefault(); step(action); }
});
document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
  if (human) step(Number(button.dataset.action));
}));
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { $('status').textContent = 'Fullscreen is unavailable here. Use Open demo below for a larger view.'; }
});
if (!document.fullscreenEnabled) $('fullscreen').hidden = true;
document.addEventListener('visibilitychange', schedule);
window.addEventListener('message', (event) => {
  if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'demo:visibility') return;
  visible = event.data.visible === true; schedule();
});
window.addEventListener('pagehide', stop);
window.addEventListener('themechange', draw);
draw();
document.querySelectorAll('button, select, input').forEach((control) => { control.disabled = false; });
$('status').textContent = 'Ready. Watch the policy or find your own way through.';

// Keep the embed tall enough for its controls on desktop and mobile.
if (window.parent !== window) {
  new ResizeObserver(([entry]) => {
    const height = Math.ceil(entry.target.getBoundingClientRect().height);
    window.parent.postMessage({ type: 'demo:resize', height }, location.origin);
  }).observe(document.querySelector('.playground'));
}
