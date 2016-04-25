// Set up context menu and shortcuts at install time.
chrome.runtime.onInstalled.addListener(function(details) {
    clearCache();
    createRightClickContextMenu();
    createTempURLBookmark();
    addShortcutListener();
    addNewDayListener();
    addPopupShutdownListener();
});

var tempFolder;

var weekday = new Array(7);
weekday[0] = "Sn";
weekday[1] = "M";
weekday[2] = "T";
weekday[3] = "W";
weekday[4] = "Th";
weekday[5] = "F";
weekday[6] = "S";

var ba = chrome.browserAction;

// Clear local storage and temporary bookmark folder
function clearCache() {
    chrome.bookmarks.search("Temporary URLs", function(bookmarks) {
        if (bookmarks.length != 0) {
            for (var i = 0; i < bookmarks.length; i++) {
                chrome.bookmarks.removeTree(bookmarks[i].id);
            }
        }
        clearStorage();
    });
}

function createRightClickContextMenu() {
    var menu = chrome.contextMenus.create({
        "title": "Add Plan to ...",
        "contexts": ["selection", "link"]
    });
    addMenuOptions(menu);
}

function addMenuOptions(menu) {
    var days = [new Date(), new Date(), new Date(), new Date(), new Date(), new Date(), new Date()];
    for (i = 0; i < days.length; i++) {
        days[i].setDate(days[i].getDate() + i);
        var formatedDate = formatDate(days[i]);
        if (i == 0) {
            formatedDate += " (ctrl + y)"
        }
        chrome.contextMenus.create({
            "id": formatedDate,
            "title": formatedDate,
            "parentId": menu,
            "contexts": ["selection", "link"],
            "onclick": addPlanWithMenuHandler
        });
    }
}

function addPlanWithMenuHandler(info, tab) {
    var date = removeShortcutDescription(info.menuItemId);

    chrome.storage.sync.get(date, function(plans) {
        if (!chrome.runtime.error) {
            var historyContent = plans[date];
            if (typeof historyContent === 'undefined') {
                historyContent = "";
            }

            if (info.selectionText) {
                save(date, historyContent + "\n" + info.selectionText);
            } else if (info.linkUrl) {
                save(date, historyContent + "\n" + info.linkUrl);
            }
        }
    });
}

function removeShortcutDescription(menuEntry) {
    if (menuEntry.slice(-" (ctrl + y)".length) == " (ctrl + y)") {
        console.log(menuEntry.slice(0, -" (ctrl + y)".length));
        return menuEntry.slice(0, -" (ctrl + y)".length);
    }
    return menuEntry;
}

function formatDate(date) {
    var dd = date.getDate();
    var mm = date.getMonth() + 1; //January is 0!
    var yyyy = date.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    return weekday[date.getDay()] + ", " + dd + '/' + mm + '/' + yyyy;
}

function createTempURLBookmark() {
    chrome.bookmarks.create({
            'title': 'Temporary URLs'
        },
        function(temporaryFolder) {
            tempFolder = temporaryFolder;
        });
}

function addShortcutListener() {
    chrome.commands.onCommand.addListener(function(command) {
        if (command == "add-plan-today") {
            addPlansWithShortcut();
        } else if (command == "save-temp-urls") {
            saveTabs();
        } else if (command == "recover-temp-urls") {
            reloadTabs();
        }
    });
}

function addNewDayListener() {
    var today = new Date();
    setInterval(function() {
        var day = new Date();
        if (day.getDate() !== today.getDate()) {
            var yesterday = formatDate(today);
            chrome.storage.sync.remove(yesterday, function() {
                console.log("Plan for yesterday (" + yesterday + ") is erased");
            });
            today = day;
            changeIcon();
        }
    }, 60000);
}

function addPopupShutdownListener() {
    chrome.runtime.onConnect.addListener(function(port) {
        port.onDisconnect.addListener(changeIcon);
    });
}

function addPlansWithShortcut() {
    chrome.tabs.executeScript({
        code: "window.getSelection().toString();"
    }, function(selectionArray) {
        var key = formatDate(new Date());
        chrome.storage.sync.get(key, function(plans) {
            if (selectionArray[0] !== "") {
                var selection = addPossibleSpace(selectionArray[0]);
                if (typeof plans[key] === 'undefined') {
                    save(key, selection);
                } else {
                    save(key, plans[key] + selection);
                }
                changeIcon();
            }
        });
    });
}

// Change Extension Icon if there are pending things to be done TODAY
function changeIcon() {
    var today = formatDate(new Date());
    chrome.storage.sync.get(today, function(plans) {
        if (typeof plans[today] === 'undefined' || plans[today] === "") {
            ba.setBadgeText({
                text: ""
            });
        } else {
            ba.setBadgeBackgroundColor({
                color: "#F00"
            });
            ba.setBadgeText({
                text: "!"
            });
        }
    });
}

function saveTabs() {
    chrome.windows.getCurrent({
        populate: true
    }, function(win) {
        // Check if "Temporary URLs" folder exists (It should by default)
        chrome.bookmarks.search("Temporary URLs", function(bookmarks) {
            if (bookmarks.length != 0) {
                saveTabsHelper(win);
            } else {
                chrome.bookmarks.create({
                        'title': 'Temporary URLs'
                    },
                    function(temporaryFolder) {
                        tempFolder = temporaryFolder;
                        saveTabsHelper(win);
                    });
            }
        });
    });
}

function saveTabsHelper(win) {
    win.tabs.forEach(function(tab) {
        chrome.bookmarks.create({
            'parentId': tempFolder.id,
            'title': tab.url,
            'url': tab.url
        });
    });
}

function reloadTabs() {
    chrome.bookmarks.search("Temporary URLs", function(bookmarks) {
        for (var i = 0; i < bookmarks.length; i++) {
            chrome.bookmarks.getChildren(bookmarks[i].id, function(recoverURLs) {
                for (var j = 0; j < recoverURLs.length; j++) {
                    chrome.tabs.create({
                        "url": recoverURLs[j].url
                    });
                    chrome.bookmarks.remove(recoverURLs[j].id);
                }
            });
        }
    });
}

function addPossibleSpace(selectionText) {
    var lastChar = selectionText.slice(-1);
    if (lastChar === '.' || lastChar === '!' || lastChar === '?' || lastChar === ':') {
        return selectionText + "\n";
    } else if (lastChar !== ' ' && lastChar !== '\n') {
        return selectionText + " ";
    } else {
        return selectionText;
    }
}

function save(key, value) {
    var entry = {};
    entry[key] = value;
    chrome.storage.sync.set(entry, function() {
        if (chrome.runtime.error) {
            console.log("Save Plan Runtime error");
        }
    });
}

function clearStorage() {
    chrome.storage.sync.clear(function() {
        if (chrome.runtime.error) {
            console.log("Clear Storage Runtime error");
        } else {
            console.log("Storage Cleared Successful");
        }
    });
}