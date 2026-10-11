import { writeFile } from 'node:fs/promises';
import { palettes } from '../public/demos/gridworld/palette.js';
import { MAP, COLS, START, GOAL, isWall, trainCheckpoints, rollout } from '../public/demos/gridworld/model.js';

const variables = (colors) => Object.entries(colors).map(([key, value]) => `--${key}:${value}`).join(';');
const themeStyles = `<style>:root{${variables(palettes.light)}}@media(prefers-color-scheme:dark){:root{${variables(palettes.dark)}}}</style>`;
const size = 52, left = 216, top = 50;
const center = (s) => [left + (s % COLS + .5) * size, top + (Math.floor(s / COLS) + .5) * size];
const trace = rollout(trainCheckpoints().get(800));
const cells = MAP.flatMap((row, r) => [...row].map((_, c) => {
  const state = r * COLS + c;
  const x = left + c * size + 2, y = top + r * size + 2;
  return `<rect x="${x}" y="${y}" width="48" height="48" rx="5" fill="${isWall(state) ? 'var(--wall)' : state === GOAL ? 'var(--goal)' : 'var(--cell)'}"/>${isWall(state) ? `<rect x="${x + 8}" y="${y + 8}" width="32" height="32" rx="3" fill="var(--wallInner)"/>` : ''}`;
})).join('');
const path = [START, ...trace.map((step) => step.state)].map((s) => center(s).join(',')).join(' ');
const [sx, sy] = center(START), [gx, gy] = center(GOAL);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" width="900" height="420">${themeStyles}<rect width="900" height="420" fill="var(--background)"/><g>${cells}</g><polyline points="${path}" fill="none" stroke="var(--path)" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 8"/><text x="${gx}" y="${gy + 8}" text-anchor="middle" fill="var(--star)" font-family="Georgia,serif" font-size="29">★</text><circle cx="${sx}" cy="${sy}" r="15" fill="var(--agent)"/><g fill="var(--eyes)"><circle cx="${sx - 5}" cy="${sy - 2}" r="2.5"/><circle cx="${sx + 5}" cy="${sy - 2}" r="2.5"/></g><g fill="var(--label)" font-family="monospace" font-size="10" letter-spacing="1"><text x="193" y="${sy + 3}" text-anchor="end">START</text><text x="707" y="${gy + 3}">GOAL</text><text x="450" y="392" text-anchor="middle">A LITTLE EXPLORATION GOES A LONG WAY.</text></g></svg>`;
await writeFile(new URL('../public/images/gridworld.svg', import.meta.url), svg);
console.log(`Poster written. Learned path: ${trace.length} steps, goal reached: ${trace.at(-1).done}.`);
