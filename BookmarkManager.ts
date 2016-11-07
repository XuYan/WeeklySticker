/// <reference path=".\typings\chrome.d.ts" />

class BookmarkManager {
	private static _instance: BookmarkManager = undefined;
	private _tempUrlFolder: chrome.bookmarks.BookmarkTreeNode;

	private constructor() {
		this._createTempUrlBookmark();
		this._addShortcut();
	}

	static getInstance(): BookmarkManager {
		if (!BookmarkManager._instance) {
			BookmarkManager._instance = new BookmarkManager();
		}
		return BookmarkManager._instance;
	}

	static get folderTitle(): string {
		return "Temporary URLs";
	}

	private _createTempUrlBookmark(): void {
		chrome.bookmarks.search(BookmarkManager.folderTitle, (results: chrome.bookmarks.BookmarkTreeNode[]) => {
			if (results.length === 0) {
				chrome.bookmarks.create({
						'title': BookmarkManager.folderTitle
					}, (temporaryFolder: chrome.bookmarks.BookmarkTreeNode) => {
						this._tempUrlFolder = temporaryFolder;
					});
			}
		});
	}

	private _addShortcut(): void {
		chrome.commands.onCommand.addListener((command: string) => {
			if (command === "save-temp-urls") {
				this._saveTabs();
			} else if (command === "recover-temp-urls") {
				this._reloadTabs();
			}
		});
	}

	private _saveTabs(): void {
		let info: chrome.windows.GetInfo = {
			populate: true
		};
		chrome.windows.getCurrent(info, (window: chrome.windows.Window) => {
			window.tabs.forEach((tab: chrome.tabs.Tab) => {
				chrome.bookmarks.create(<chrome.bookmarks.BookmarkCreateArg> {
					'parentId': this._tempUrlFolder.id,
					'title': tab.url,
					'url': tab.url
				});
			});
		});
	}

	private _reloadTabs(): void {
		chrome.bookmarks.search(BookmarkManager.folderTitle, 
			(bookmarks: chrome.bookmarks.BookmarkTreeNode[]) => {
				for (let i = 0; i < bookmarks.length; i++) {
					chrome.bookmarks.getChildren(bookmarks[i].id, 
						(recoverURLs: chrome.bookmarks.BookmarkTreeNode[]) => {
							for (let j = 0; j < recoverURLs.length; j++) {
								chrome.tabs.create(<chrome.tabs.CreateProperties> {
									"url": recoverURLs[j].url
								});
								chrome.bookmarks.remove(recoverURLs[j].id);
							}
					});
				}
		});
	}
}

export{BookmarkManager};