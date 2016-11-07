require.config({
	baseUrl: './',

	// lib dependencies
	paths: {
		"BookmarkModule": "./BookmarkManager",
		"EventManager": "./js/EventManager",
		"WeekPlanModule": "./js/WeekPlan"
	}
});

// Set up one-time initialization (context menu and app shortcuts)
chrome.runtime.onInstalled.addListener((details) => {
    console.log("handling install event...");

    // TODO: Create BookmarkManager app
});

chrome.runtime.setUninstallURL(""/*Not open new tab*/, () => {
    console.log("handling uninstall event...");
    if (chrome.runtime.lastError) {
        console.log("Invalid URL is given when uninstall extension");
        return;
    }

    // Remove week plans
    chrome.storage.sync.clear(() => {
        let message = (chrome.runtime.lastError) ? "Clear Storage Error" : "Storage Cleared!!!";
        console.log(message);
    });
});

require(["BookmarkModule", "WeekPlanModule"], function (BM, WP) {
	BM.BookmarkManager.getInstance();

	let last_open_date_str = undefined;
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request === "show_context_menu") {
			console.log("contextmenu triggered by " + sender);

			let open_date = new Date();
			let open_date_str = open_date.toDateString();
			if (open_date_str === last_open_date_str) {
				return;
			}
			last_open_date_str = open_date_str;

			chrome.contextMenus.removeAll();

			// Create context menu items for the next 7 days respectively
			let menu = chrome.contextMenus.create({
					"id": "add_plan_main_menu",
					"title": "Add Plan",
					"contexts": ["selection", "link"]
				}, () => {
					for (let i = 0; i < 7; i++) {
						let millisec = new Date().setDate(open_date.getDate() + i);
						let date_str = new Date(millisec).toDateString();
						chrome.contextMenus.create({
							"id": date_str,
							"title": date_str,
							"parentId": menu,
							"contexts": ["selection", "link"]
						});
				}
			});

			// Add click handler to context menu items
			chrome.contextMenus.onClicked.addListener((info, tab) => {
				let week_plan = WP.WeekPlan.getInstance();
				week_plan.load(info.menuItemId, (note) => {
					if (!note) {
						note = "";
					}
					note += "\n" + info.selectionText;
					week_plan.save(info.menuItemId, note);
				});
			});
		}

		sendResponse("contextmenu handled in bg_script.js");
	});

	chrome.runtime.onConnect.addListener((port) => {
		console.log("onConnect...");
		// port.onDisconnect.addListener();
	});
});