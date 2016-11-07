(function() {
	"use strict";

	window.addEventListener("contextmenu", (event) => {
		chrome.runtime.sendMessage("show_context_menu", (response) => {
			console.log(response);
		});
	});
})();