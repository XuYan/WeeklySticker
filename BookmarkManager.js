/// <reference path=".\typings\chrome.d.ts" />
define(["require", "exports"], function (require, exports) {
    "use strict";
    var BookmarkManager = (function () {
        function BookmarkManager() {
            this._createTempUrlBookmark();
            this._addShortcut();
        }
        BookmarkManager.getInstance = function () {
            if (!BookmarkManager._instance) {
                BookmarkManager._instance = new BookmarkManager();
            }
            return BookmarkManager._instance;
        };
        Object.defineProperty(BookmarkManager, "folderTitle", {
            get: function () {
                return "Temporary URLs";
            },
            enumerable: true,
            configurable: true
        });
        BookmarkManager.prototype._createTempUrlBookmark = function () {
            var _this = this;
            chrome.bookmarks.create({
                'title': BookmarkManager.folderTitle
            }, function (temporaryFolder) {
                _this._tempUrlFolder = temporaryFolder;
            });
        };
        BookmarkManager.prototype._addShortcut = function () {
            var _this = this;
            chrome.commands.onCommand.addListener(function (command) {
                if (command === "save-temp-urls") {
                    _this._saveTabs();
                }
                else if (command === "recover-temp-urls") {
                    _this._reloadTabs();
                }
            });
        };
        BookmarkManager.prototype._saveTabs = function () {
            var _this = this;
            var info = {
                populate: true
            };
            chrome.windows.getCurrent(info, function (window) {
                window.tabs.forEach(function (tab) {
                    chrome.bookmarks.create({
                        'parentId': _this._tempUrlFolder.id,
                        'title': tab.url,
                        'url': tab.url
                    });
                });
            });
        };
        BookmarkManager.prototype._reloadTabs = function () {
            chrome.bookmarks.search(BookmarkManager.folderTitle, function (bookmarks) {
                for (var i = 0; i < bookmarks.length; i++) {
                    chrome.bookmarks.getChildren(bookmarks[i].id, function (recoverURLs) {
                        for (var j = 0; j < recoverURLs.length; j++) {
                            chrome.tabs.create({
                                "url": recoverURLs[j].url
                            });
                            chrome.bookmarks.remove(recoverURLs[j].id);
                        }
                    });
                }
            });
        };
        BookmarkManager._instance = undefined;
        return BookmarkManager;
    }());
    exports.BookmarkManager = BookmarkManager;
});
