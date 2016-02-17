'use strict';

var config = {
	divider: '\n---'
};

function onLinkedInLoad() {
	IN.Event.on(IN, "auth", getProfileData);
}

// Handle the successful return from the API call
function onSuccess(data) {
	console.log(data);
}

// Handle an error response from the API call
function onError(error) {
	console.log(error);
}

// Use the API call wrapper to request the member's basic profile data
function getProfileData() {
	IN.API.Raw("/people/~").result(onSuccess).error(onError);
}

var reducers = [[function avatar(u) {
	return u.avatar ? ' ![avatar][]' : '';
}, function fullName(u) {
	return u.fullName ? ' ' + u.fullName : '';
}, function heading(u, _ref) {
	var avatar = _ref[0];
	var fullName = _ref[1];

	return avatar || fullName ? '\n#' + avatar + fullName + '\n' + config.divider : '';
}], [function title(u) {
	return u.title ? '\n> #### ' + u.title : '';
}, [function location(u) {
	return u.location ? ' ' + u.location : '';
}, function homepage(u) {
	return u.homepage ? ' &emsp; [' + utils.prettyUrl(u.homepage) + '][homepage]' : '';
}, function twitter(u) {
	return u.twitter ? ' &emsp; [@' + u.twitter.replace(/^@/, '') + '][twitter] ![twit][]' : '';
}, function shortDetails(u, _ref2) {
	var location = _ref2[0];
	var homepage = _ref2[1];
	var twitter = _ref2[2];

	return location || homepage || twitter ? '\n> ##### ' + location + homepage + twitter : '';
}], function tech(u) {
	var tech = utils.techList(u.tech);
	return tech ? '\n> ' + tech : '';
}, function introBox(u, _ref3) {
	var title = _ref3[0];
	var shortDetails = _ref3[1];
	var tech = _ref3[2];

	return title || shortDetails || tech ? '\n' + title + shortDetails + tech + '\n' + config.divider : '';
}], function about(u) {
	if (!u.about) return '';
	var about = utils.blockQuote(u.about, '**"**');
	return '\n' + about + '\n\n' + config.divider;
}, function experience(u) {
	var experienceList = utils.mapExpOrEdToMD(u.experience);
	return experienceList ? '\n## Experience' + experienceList : '';
}, function education(u) {
	var educationList = utils.mapExpOrEdToMD(u.education);
	return educationList ? '\n## Education' + educationList : '';
}, function oss(u) {
	var ossList = u.projects && u.projects.map(function (p) {
		var url = utils.formatUrl(p.url);
		var title = p.title ? url ? ' [' + p.title + '](' + url + ')' : ' ' + p.title : '';
		var info = {};
		if (!p.desc || !popularity) {
			info = utils.getProjectInfo(p);
		}
		var popularity = p.popularity || info.popularity;
		popularity = popularity ? ' &emsp; *<small>' + popularity + '</small>*' : '';

		var heading = title || popularity ? '####' + title + popularity : '';

		var desc = p.desc || info.desc;
		desc = desc ? '\n' + desc + '\n' + config.divider : '';

		return heading || desc ? '\n' + heading + desc : '';
	}).join('');

	return ossList ? '\n## Open Source' + ossList : '';
}, [function writingHabits(u) {
	return u.writingHabits ? '\n> ' + u.writingHabits : '';
}, function writingsList(u) {
	return u.writing && Array.isArray(u.writing) ? u.writing.map(function (w) {
		var url = utils.formatUrl(w.url);
		var title = w.title ? w.url ? ' [' + w.title + '](' + url + ') *<small>@' + utils.prettyUrl(url) + '</small>*' : ' ' + w.title 
: '';
		return title ? '\n####' + title : '';
	}).join('') : '';
}, function writings(u, _ref4) {
	var writingHabits = _ref4[0];
	var writingsList = _ref4[1];

	return writingHabits || writingsList ? '\n## Writing\n' + writingHabits + writingsList + '\n' + config.divider : '';
}], function favorites(u) {
	var favHeading = '## Favorites';
	var editor = u.editor ? '\n#### Editor\n' + u.editor : '';
	var os = u.os ? '\n#### Operating System\n' + u.os : '';
	var term = u.terminal ? '\n#### Terminal\n' + u.terminal : '';
	return editor || os || term ? '\n' + favHeading + editor + os + term + '\n' + config.divider : '';
}, function args(u) {
	var avatarArg = u.avatar ? '[avatar]: ' + utils.formatUrl(u.avatar) : '';
	var twitIco = '\n[twit]: http://cdn-careers.sstatic.net/careers/Img/icon-twitter.png?v=b1bd58ad2034';
	var homepageArg = u.homepage ? '\n[homepage]: ' + utils.formatUrl(u.homepage) : '';
	var twitterArg = u.twitter ? '\n[twitter]: https://twitter.com/' + u.twitter.replace(/^@/, '') + twitIco : '';
	return '\n' + avatarArg + homepageArg + twitterArg;
}, function finish(u, everythingTillNow) {
	return everythingTillNow.join('');
}];

function renderer(profile, reducers) {
	var stack = reducers.reduce(function (total, reducer) {
		var val = undefined;
		if (Array.isArray(reducer)) {
			val = renderer(profile, reducer);
		} else if (typeof reducer !== 'function') {
			throw new Error('invalid reducer type');
		} else {
			val = reducer(profile, total);
		}
		total.push(val);
		return total;
	}, []);
	return stack[stack.length - 1];
}

var utils = {
	mapExpOrEdToMD: function mapExpOrEdToMD(list) {
		if (!list || !list.map) return;
		return list.map(function (e) {
			// .n
			if (!e) return '';
			var title = e.title ? ' ' + e.title : ''; // .n.1.1
			var timeframe = e.since || e.till ? ' &emsp; <small>*' + utils.timeframe(e.since, e.till) + '*</small>' : ''; // .n.1.2
			var heading = title || timeframe ? '####' + title + timeframe : ''; // .n.1

			var techList = utils.techList(e.tech);
			techList = techList ? '\n' + techList : ''; // .n.2

			var about = utils.blockQuote(e.about);
			about = about ? '\n' + about : ''; // .n.3

			return heading || techList || about ? '\n' + heading + techList + about + '\n' + config.divider : ''; // .n
		}).join('');
	},
	formatUrl: function formatUrl(url) {
		// TODO: make this a bit more intelligent?
		if (!url) return '';
		if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
			return 'http://' + url;
		}
		return url;
	},
	blockQuote: function blockQuote(p, firstQuote) {
		return p ? p.split('\n').map(function (el, i) {
			if (i === 0 && firstQuote) {
				return '> ' + firstQuote + ' ' + el;
			}
			return '> ' + el;
		}).join('\n') : '';
	},
	prettyUrl: function prettyUrl(url) {
		// TODO: remove all trailing part and keep only domain
		return url ? url.replace(/^https?:\/\//, '') : '';
	},
	techList: function techList(p) {
		return p ? p.split(/,\s+/g).map(function (el) {
			return '`' + el + '`';
		}).join(', ') : '';
	},
	getProjectInfo: function getProjectInfo(wow) {
		return {
			desc: '',
			popularity: ''
		};
	},
	timeframe: function timeframe(since, till) {
		if (since || till) {
			if (since && !till) {
				return since + ' - current';
			}
			if (!since) {
				return 'current';
			}
			return since + ' - ' + till;
		}
		return '';
	},
	downloadFromData: function downloadFromData(data, type, filename) {
		var blob = new Blob([data], { type: type });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.download = filename;
		a.href = url;
		a.classList.add('hidden');
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		setTimeout(function () {
			return URL.revokeObjectURL(url);
		}, 0);
	}
};

way.watch('inputData', function (val) {
	var md = renderer(val, reducers);
	document.getElementById('previewer').textContent = md;
	document.getElementById('live-preview').innerHTML = marked(md);
});

document.getElementById('btnDownload').addEventListener('click', downloadRaw);
document.getElementById('btnExport').addEventListener('click', downloadJSON);

function downloadJSON() {
	utils.downloadFromData(JSON.stringify(way.get('inputData'), null, ' '), 'application/json', 'cv.json');
}

function downloadRaw() {
	utils.downloadFromData(renderer(way.get('inputData'), reducers), 'text/plain', 'cv.md');
}

document.getElementById('btnMd').addEventListener('click', function () {
	switchTab('md');
});
document.getElementById('btnLive').addEventListener('click', function () {
	switchTab('live');
});

function switchTab(to) {
	var prev = document.getElementById('previewer');
	var live = document.getElementById('live-preview');
	if (to === 'md') {
		prev.classList.remove('hidden');
		live.classList.add('hidden');
	} else {
		live.classList.remove('hidden');
		prev.classList.add('hidden');
	}
}

