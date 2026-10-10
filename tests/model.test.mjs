import test from 'node:test';
import assert from 'node:assert/strict';
import { ROWS, COLS, START, GOAL, ACTIONS, isWall, transition, trainCheckpoints, rollout, chooseAction, seededRandom } from '../public/demos/gridworld/model.js';

test('all legal states and actions stay in bounds and cannot enter walls', () => {
  for (let state = 0; state < ROWS * COLS; state++) {
    if (isWall(state)) continue;
    for (let action = 0; action < ACTIONS.length; action++) {
      const result = transition(state, action);
      assert.ok(result.state >= 0 && result.state < ROWS * COLS);
      assert.equal(isWall(result.state), false);
      assert.equal(result.done, result.state === GOAL);
    }
  }
  assert.equal(transition(START, 0).state, START);
  assert.equal(transition(START, 3).state, START);
  assert.equal(transition(1, 2).state, 1);
});

test('goal reward is terminal and cannot be collected twice', () => {
  assert.deepEqual(transition(GOAL - 1, 1), { state: GOAL, reward: 20, done: true });
  assert.deepEqual(transition(GOAL, 0), { state: GOAL, reward: 0, done: true });
});

test('seeded training yields a reproducible policy that solves the maze', () => {
  const first = trainCheckpoints();
  const second = trainCheckpoints();
  assert.deepEqual(first.get(800), second.get(800));
  assert.ok(first.get(0).every((value) => value === 0));
  assert.ok(first.get(50).some((value) => value !== 0));
  for (let seed = 1; seed <= 10; seed++) {
    const trace = rollout(first.get(800), { seed });
    assert.equal(trace.at(-1).done, true);
    assert.ok(trace.length <= ROWS * COLS);
    assert.equal(trace.reduce((sum, step) => sum + step.reward, 0), 20 - (trace.length - 1));
  }
});

test('full exploration samples every action even with a strongly preferred policy', () => {
  const q = new Float64Array(ROWS * COLS * 4);
  q[1] = 100;
  const random = seededRandom(7);
  const actions = new Set(Array.from({ length: 100 }, () => chooseAction(q, START, 1, random)));
  assert.equal(actions.size, 4);
  assert.equal(chooseAction(q, START, 0, random), 1);
});
