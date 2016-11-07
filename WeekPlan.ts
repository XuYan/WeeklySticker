/// <reference path=".\typings\chrome.d.ts" />
/// <reference path=".\typings\globals\jquery\index.d.ts" />

import {EventManager} from './EventManager';

class WeekPlan {
	private static _instance: WeekPlan = undefined;

	private _current_date: Date;
	private _elements: {[name: string]: HTMLElement}

	private constructor() {	}

	static getInstance(): WeekPlan {
		if (!WeekPlan._instance) {
			WeekPlan._instance = new WeekPlan();
		}
		return WeekPlan._instance;
	}

	init(): void {
		this._elements = this._initHTMLElement();
		this._initAppState();
	}

	private _initHTMLElement(): {[name: string]: HTMLElement} {
		return {
			"prev_date_btn": document.getElementById('prev'),
			"next_date_btn": document.getElementById('next'),
			"date_field": document.getElementById('date'),
			"content": document.getElementById('content'),
			"app": document.getElementById('app')
		}
	}

	private _initAppState(): void {
		this._current_date = new Date(); // TODO: This should be read from db

		this._elements["date_field"].innerHTML = this._current_date.toDateString();
		this._initEventListener();
	}

	private _initShortcut(): void {
		chrome.commands.onCommand.addListener((command: string) => {
			if (command === "add-plan-today") {
				chrome.tabs.executeScript({
					code: "window.getSelection().toString();"
				}, (result: any[]) => {
					let key = new Date().toDateString();
					chrome.storage.sync.get(key, (items: {[key: string] : string}) => {
						if (result[0] !== "") {
							let selection = result[0];
							let content: string = "";
							if (typeof items[key] === 'undefined') {
								content = selection;
							} else {
								content = items[key] + "\n" + selection;
							}
							this.save(key, content);
						}
					});
				});
			}
		});
	}

	private _initEventListener(): void {
		let onDateChanged = (event: Event) => {
			if (event.target === this._elements["next_date_btn"]) {
				this._forwardDate();
			} else {
				this._backwardDate();
			}

			this.load(new Date(this._elements["date_field"].innerHTML).toDateString(), this._show.bind(this));
		};

		let onKeyDown = (event: KeyboardEvent) => {
			if (event.altKey) {
				if (event.which === 37) {
					this._backwardDate();
				} else if (event.which === 39) {
					this._forwardDate();
				}
			}
		};

		let onBlur = (event: Event) => {
			this.save();
		};

		EventManager.register(this._elements["prev_date_btn"], "click", onDateChanged);
		EventManager.register(this._elements["next_date_btn"], "click", onDateChanged);
		EventManager.register(this._elements["app"], "keydown", onKeyDown);
		EventManager.register(this._elements["content"], "blur", onBlur);
	}

	private _forwardDate(): void {
		this._current_date.setDate(this._current_date.getDate() + 1);
		this._elements["date_field"].innerHTML = this._current_date.toDateString();
		this._updateDateChangeButtonState();
	}

	private _backwardDate(): void {
		this._current_date.setDate(this._current_date.getDate() - 1);
		this._elements["date_field"].innerHTML = this._current_date.toDateString();
		this._updateDateChangeButtonState();
	}

	private _updateDateChangeButtonState() {
		let current_day_str: string = this._current_date.toDateString();
		let today: Date = new Date();
		let six_days_later: Date = new Date();
		six_days_later.setDate(today.getDate() + 6);

		let today_str: string = today.toDateString();
		let six_days_later_str: string = six_days_later.toDateString();
		
		if (current_day_str === today_str) {
			this._elements["prev_date_btn"].disabled = true;
		} else if (current_day_str === six_days_later_str) {
			this._elements["next_date_btn"].disabled = true;
		} else {
			this._elements["prev_date_btn"].disabled = false;
			this._elements["next_date_btn"].disabled = false;
		}
	}

	run(): void {
		// // Method returns a Port object, which will be disconnected when popup unloads
		// chrome.runtime.connect(<chrome.runtime.ConnectInfo> {
		// 	name: "popup_port"
		// });
		this.load(new Date().toDateString(), this._show.bind(this));
		this._updateDateChangeButtonState();
		this._updateIcon();
	}

	removeOutdatePlan(): void {
		let today: number = new Date().getTime();
		chrome.storage.sync.get(null, (items: {[key: string]: string}) => {
			for (let date_str in items) {
				let day: number = new Date(date_str).getTime();
				let time_diff: number = day - today;

				if (time_diff < 0) {
					delete items[date_str];
					// TODO: Double check if key is really removed 
				}
			}
		});
	}

	private _updateIcon(): void {
		let today_str: string = new Date().toDateString(); 
		chrome.storage.sync.get(today_str, (items: {[key: string] : string}) => {
			if (typeof items[today_str] === 'undefined' || items[today_str] === "") {
				chrome.browserAction.setBadgeText({
					text: ""
				});
			} else {
				chrome.browserAction.setBadgeBackgroundColor({
					color: "#F00"
				});
				chrome.browserAction.setBadgeText({
					text: "!"
				});
			}
		});
	}

	private _onMenuItemClicked(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) {
		let day_str: string = info.menuItemId;
		chrome.storage.sync.get(day_str, (items: {[key: string] : string}) => {
			if (!chrome.runtime.lastError) {
				let content = items[day_str];
				if (!content) {
					content = "";
				}
				let add_content = "";
				if (info.selectionText) {
					add_content = "\n" + info.selectionText;
				} else if (info.linkUrl) {
					add_content = "\n" + info.linkUrl;
				}
				this.save(day_str, content + add_content);
			}
		});
	}

	load(date_str: string, callback: (content: string) => void): void {
		chrome.storage.sync.get(date_str, (items: {[key: string] : string}) => {
			if (!chrome.runtime.lastError) {
				let daily_plan = items[date_str];
				callback(daily_plan);
			}
		});
	}

	private _show(content: string): void {
		let content_area = $(this._elements["content"]);
		content_area.val(content);
		content_area.focus();
	}

	save(date: string = this._current_date.toDateString(),
	  content: string = $(this._elements["content"]).val()): void {
		let entry = {};
		entry[date] = content;
		chrome.storage.sync.set(entry, () => {
			if (chrome.runtime.lastError) {
				console.log("Runtime error when saving content");
			}
			this._updateIcon();
		});
	}
}

export {WeekPlan};