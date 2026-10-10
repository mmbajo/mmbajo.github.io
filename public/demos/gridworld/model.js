// A deliberately small, deterministic tabular Q-learning example.
export const MAP = [
  'S...#....',
  '.##.#.##.',
  '...#.....',
  '.#...##..',
  '.###...#.',
  '.....#..G',
];
export const ROWS = MAP.length;
export const COLS = MAP[0].length;
export const START = 0;
export const GOAL = ROWS * COLS - 1;
export const ACTIONS = [[-1, 0], [0, 1], [1, 0], [0, -1]];

export function seededRandom(seed = 42) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function isWall(state) {
  return MAP[Math.floor(state / COLS)][state % COLS] === '#';
}

export function transition(state, action) {
  if (state === GOAL) return { state, reward: 0, done: true };
  const [dr, dc] = ACTIONS[action];
  const row = Math.floor(state / COLS) + dr;
  const col = state % COLS + dc;
  const valid = row >= 0 && row < ROWS && col >= 0 && col < COLS && MAP[row][col] !== '#';
  const next = valid ? row * COLS + col : state;
  return { state: next, reward: next === GOAL ? 20 : -1, done: next === GOAL };
}

export function chooseAction(q, state, epsilon, random) {
  if (random() < epsilon) return Math.floor(random() * 4);
  const values = q.subarray(state * 4, state * 4 + 4);
  const best = Math.max(...values);
  const ties = [];
  for (let action = 0; action < 4; action++) if (values[action] === best) ties.push(action);
  return ties[Math.floor(random() * ties.length)];
}

export function trainCheckpoints({ seed = 42, episodes = 800, alpha = 0.25, gamma = 0.95, epsilon = 0.25 } = {}) {
  const random = seededRandom(seed);
  const q = new Float64Array(ROWS * COLS * 4);
  const checkpoints = new Map([[0, q.slice()]]);
  for (let episode = 1; episode <= episodes; episode++) {
    let state = START;
    for (let step = 0; step < 160; step++) {
      const action = chooseAction(q, state, epsilon, random);
      const result = transition(state, action);
      const future = result.done ? 0 : Math.max(...q.subarray(result.state * 4, result.state * 4 + 4));
      const index = state * 4 + action;
      q[index] += alpha * (result.reward + gamma * future - q[index]);
      state = result.state;
      if (result.done) break;
    }
    if (episode === 50 || episode === episodes) checkpoints.set(episode, q.slice());
  }
  return checkpoints;
}

export function rollout(q, { epsilon = 0, seed = 123, maxSteps = 120 } = {}) {
  const random = seededRandom(seed);
  const trace = [];
  let state = START;
  for (let step = 0; step < maxSteps; step++) {
    const action = chooseAction(q, state, epsilon, random);
    const result = transition(state, action);
    trace.push({ from: state, action, ...result });
    state = result.state;
    if (result.done) break;
  }
  return trace;
}
