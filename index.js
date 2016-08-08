const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('mz/fs');
const Snoocore = require('snoocore');
const escapeStringRegexp = require('escape-string-regexp');

const outDir = path.join(__dirname, 'css');

const r = new Snoocore({
	userAgent: process.env.REDDIT_USER_AGENT,
	oauth: {
		type: 'script',
		key: process.env.REDDIT_KEY,
		secret: process.env.REDDIT_SECRET,
		username: process.env.REDDIT_USER,
		password: process.env.REDDIT_PASS,
	},
	throttle: 0,
	decodeHtmlEntities: true,
});

r('/subreddits/popular').get({ limit: 100 }).then(({ data: { children: subreddits } }) => {
	const count = subreddits.length;
	let complete = 0;

	mkdirp.sync(outDir);

	for (const subreddit of subreddits.map(s => s.data.display_name)) {
		r('/r/$subreddit/about/stylesheet').get({ $subreddit: subreddit }).then(({ data: { stylesheet, images } }) => {
			stylesheet = images.reduce(
				(s, { link, url }) => s.replace(new RegExp(escapeStringRegexp(link), 'gi'), `url(${url})`),
				stylesheet
			);

			fs.writeFile(path.join(outDir, `${subreddit}.css`), stylesheet).then(
				() => { console.log(`[${++complete}/${count}] ${subreddit} complete.`); },
				e => {
					console.error(e);
					process.exitCode = 1;
				}
			);
		});
	}
});
