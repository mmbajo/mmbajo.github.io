// Single source of truth for the maze colors: the live canvas reads these
// directly, and scripts/generate-demo-poster.mjs turns them into the inline
// SVG preview plus src/styles/maze.css. Keys map to --maze-<key> variables.
// The tones belong to the site's warm paper/ink/gold family so the experiment
// reads as part of the page rather than a transplant from another palette.
export const palettes = {
  light: {
    background: '#f2f0e9', cell: '#e7e3d7', wall: '#d3ccb9', wallInner: '#c3bba6', goal: '#ecd9ac',
    path: '#a98442', star: '#8a5e20', agent: '#3a352c', eyes: '#f7f4ec', label: '#807c73',
  },
  dark: {
    background: '#1c1a16', cell: '#262219', wall: '#38332a', wallInner: '#2c2820', goal: '#4a3c20',
    path: '#bb9a5f', star: '#d9b674', agent: '#d6d0c2', eyes: '#1c1a16', label: '#8b867b',
  },
};
