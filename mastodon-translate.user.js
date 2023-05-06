// ==UserScript==
// @name     Mastodon Translations
// @version  1
// @include  http*
// @grant    GM.getValue
// @grant    GM.setValue
// @grant    GM.deleteValue
// @grant    GM.xmlHttpRequest
// @run-at   document-end
// ==/UserScript==

const TAG = "__mastodon_translation_enabled";
const CONTAINER_TAG = "__mastodon_translation_translator_container";
const KEY_API_KEY = "__mastodon_translation_translator_api_key";
const KEY_TARGET_LANGUAGE = "__mastodon_translation_translator_target_language";


const contextMenu = document.createElement('div');
contextMenu.style = `
	position:absolute;
	left:0;
	top:0;
	background: black;
	color: white;
	display: none;
`
contextMenu.innerHTML = `
	DeepL Key<br>
  <input type="text" name="KEY"><br>
  Prefered Language<br>
	<select name="LANG">
    <option value="DE">German</option>
    <option value="EN">English</option>
    <option value="ES">Spanish</option>
    <option value="FR">French</option>
    <option value="IT">Italian</option>
    <option value="JA">Japanese</option>
    <option value="NL">Dutch</option>
    <option value="PL">Polish</option>
	</select><br>
  <button name="OK">OK</button>
`;

const ok_button = contextMenu.querySelector("[name=OK]");
ok_button.onclick = (ev) => {
	contextMenu.style.display = "none";
}

document.body.appendChild(contextMenu);

function augment(e) {
  const actionbar = e.querySelector(".status__action-bar");
  if (actionbar === null) {
    return;
  }
  // status__action-bar__button star-icon icon-button
  const button = document.createElement("button");
  button.className = `icon-button ${TAG}`;
  button.innerHTML = '<i class="fa fa-language fa-fw" aria-hidden="true"></i>';
  button.title = "Translate";
  button.onclick = handle_click;
  //button.oncontextmenu = handle_contextmenu;
  actionbar.insertBefore(button, actionbar.querySelector('.status__action-bar__dropdown'))
  e.dataset[TAG] = "true";
}

async function translate(text) {
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
  //return {translations: [ { text: "123" }]};
  try {
	  const result = await new Promise((res, rej) => {

      GM.xmlHttpRequest({
        method: "POST",
        url: "https://api-free.deepl.com/v2/translate",
        data: `text=${encodeURIComponent(text)}&target_lang=${encodeURIComponent(targetLanguage)}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `DeepL-Auth-Key ${apiKey}`
        },
        onreadystatechange: function (r) {
          if (r.readyState != 4) return;
          if (r.status != 200) {
            return rej(r)
          }
          res(JSON.parse(r.responseText));
        }
      });

    });
    return result;
  } catch (e) {
  	console.log(e);
  }
}
function handle_contextmenu(ev) {
  ev.stopPropagation();
  ev.preventDefault();

  console.log(ev);
  contextMenu.style.display = "block";
  contextMenu.style.left = `${ev.pageX}px`;
  contextMenu.style.top = `${ev.pageY}px`;
  return false;
}
function handle_click(ev) {
  ev.stopPropagation();
  ev.preventDefault();
  
  let container = ev.target;
  while(container && !container.dataset[TAG]) {
    if (container.onclick == handle_click) {
    	container.style.display = "none";
    }
  	container = container.parentElement;
  }
  
  async function run() {
    for (const translatable of container.querySelectorAll(".translate")) {
      console.log(translatable);
  		const text = translatable.innerText;
  
  		const result = await translate(text);
    	const elem = document.createElement("div");
    	elem.style = "border: 1px solid white !important";
    	elem.innerText = result.translations[0].text;
    
    	translatable.appendChild(elem);
    }
  }
  run();
  
  return false
}

if (!document.getElementById("mastodon")) {
	return;
}

setInterval(() => {
	const translate_list = Array.from(document.querySelectorAll("#mastodon .status__wrapper"))
  	.filter(x=>x.getElementsByClassName(TAG).length === 0)
  for (const translate of translate_list) {
  	augment(translate);
  }
}, 1000);


