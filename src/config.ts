export const site = {
  name: 'Mark Bajo',
  title: 'Mark Bajo / mmbajo',
  description: 'Notes and playable experiments in reinforcement learning by Mark Bajo.',
  github: 'https://github.com/mmbajo',
  repository: 'https://github.com/mmbajo/mmbajo.github.io',
  locale: 'en_US',
};

// The page never contains a plain `mailto:`; the parts are joined in the browser,
// and readers without JavaScript still see "user at domain" in a readable form.
const email = { user: 'markarjaybajo', domain: 'gmail.com' };

// Extra profiles beyond GitHub, which every page already links on its own.
// Add entries as `{ label: 'LinkedIn', url: 'https://...' }`. Any entry still
// containing REPLACE-ME is skipped everywhere, so unfinished links never ship.
const profiles: { label: string; url: string }[] = [];

const unset = (value: string) => value.includes('REPLACE-ME');

/** The address split into parts, or null until it is configured. */
export const contactEmail = unset(email.user) ? null : email;

/** Only the profiles that have a real URL. */
export const contactProfiles = profiles.filter((profile) => !unset(profile.url));

/** Everything a search engine can use to link this site to the same person. */
export const sameAs = [site.github, ...contactProfiles.map((profile) => profile.url)];
