// ==UserScript==
// @name     Mastodon Translations
// @version  1
// @include  http*
// @grant    GM.getValue
// @grant    GM.setValue
// @grant    GM.deleteValue
// @run-at   document-end
// ==/UserScript==

const TAG = "__mastodon_translation_enabled";
const BUTTON_TAG = "__mastodon_translation_translator_button";
const CONTAINER_TAG = "__mastodon_translation_translator_container";
const KEY_API_KEY = "__mastodon_translation_translator_api_key";
const KEY_TARGET_LANGUAGE = "__mastodon_translation_translator_target_language";

function augment(e) {
	const container = document.createElement("span");
	container.dataset[CONTAINER_TAG] = "true";
	container.style.whiteSpace = "pre-wrap";


	container.innerHTML = `
    <a href="javascript:void(0)" data-${BUTTON_TAG}="true">Translate</button>
  `.trim();
	container.onclick = handle_click;

	e.appendChild(container);
	e.dataset[TAG] = "true";
}

async function translate(text, cb) {
	console.log(GM);
	let apiKey = await GM.getValue(KEY_API_KEY, null);
	if (apiKey === null) {
		apiKey = prompt("DeepL API Key", "");
		await GM.setValue(KEY_API_KEY, apiKey);
	}
	let targetLanguage = await GM.getValue(KEY_TARGET_LANGUAGE, null);
	if (targetLanguage === null) {
		targetLanguage = prompt("Target Language", "EN");
		await GM.setValue(KEY_TARGET_LANGUAGE, targetLanguage);
	}

	try {
		const result = await new Promise((res, rej) => {
			const r = new XMLHttpRequest();
			r.open("POST", "https://api-free.deepl.com/v2/translate", true);
			r.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			r.setRequestHeader("Authorization", `DeepL-Auth-Key ${apiKey}`)
			r.onreadystatechange = function() {
				if (r.readyState != 4) return;
				if (r.status != 200) {
					return rej(r)
				}
				res(JSON.parse(r.responseText));
			};
			r.send(`text=${encodeURIComponent(text)}&target_lang=${encodeURIComponent(targetLanguage)}`);
		});
		cb(result);
	} catch (e) {
		console.log(e);
	}
}

function handle_click(ev) {
	if (!ev.target.dataset[BUTTON_TAG]) {
		return false;
	}
	console.log(ev);
	ev.stopPropagation();
	ev.preventDefault();

	let container = ev.target;
	console.log(container, container.dataset[CONTAINER_TAG]);
	while (container && !container.dataset[CONTAINER_TAG]) {
		container = container.parentElement;
	}
	const translatable = container.parentElement;
	const text = translatable.innerText;

	container.innerHTML = "";
	translate(text, (result) => {
		container.innerText = result.translations[0].text;
	});

	return false
}

if (!document.getElementById("mastodon")) {
	return;
}

setInterval(() => {
	const translate_list = Array.from(document.querySelectorAll("#mastodon .translate")).filter(x => x.dataset[TAG] === undefined)
	for (const translate of translate_list) {
		augment(translate);
	}
}, 1000);

const clearButton = document.createElement("button");

clearButton.innerHTML = "Clear Mastodon Translations Settings";
clearButton.onclick = () => {
	GM.deleteValue(KEY_API_KEY)
	GM.deleteValue(KEY_TARGET_LANGUAGE)
};
document.body.appendChild(clearButton);
