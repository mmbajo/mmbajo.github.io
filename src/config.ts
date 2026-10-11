export const site = {
  name: 'Mark Bajo',
  title: 'Mark Bajo / mmbajo',
  description: 'Notes and playable experiments in reinforcement learning by Mark Bajo.',
  github: 'https://github.com/mmbajo',
  repository: 'https://github.com/mmbajo/mmbajo.github.io',
  locale: 'en_US',
};

// TODO: replace REPLACE-ME with the address you want public, then rebuild.
// The page never contains a plain `mailto:`; the parts are joined in the browser,
// and readers without JavaScript still see "user at domain" in a readable form.
const email = { user: 'REPLACE-ME', domain: 'example.com' };

// TODO: fill in the profiles you want. Any entry still containing REPLACE-ME is
// skipped everywhere, so unfinished links never ship.
const profiles = [
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/REPLACE-ME/' },
  { label: 'X', url: 'https://x.com/REPLACE-ME' },
  { label: 'Google Scholar', url: 'https://scholar.google.com/citations?user=REPLACE-ME' },
];

const unset = (value: string) => value.includes('REPLACE-ME');

/** The address split into parts, or null until it is configured. */
export const contactEmail = unset(email.user) ? null : email;

/** Only the profiles that have a real URL. */
export const contactProfiles = profiles.filter((profile) => !unset(profile.url));

/** Everything a search engine can use to link this site to the same person. */
export const sameAs = [site.github, ...contactProfiles.map((profile) => profile.url)];
