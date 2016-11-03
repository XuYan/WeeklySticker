/// <reference path=".\typings\chrome.d.ts" />
/// <reference path=".\typings\globals\jquery\index.d.ts" />

import {EventManager} from './EventManager';

enum Day {
	Mo, Tu, We, Th, Fr, Sa, Su
}

class WeekPlan {
	private _current_date: Date;
	private _elements: {[name: string] : HTMLElement}

	constructor() {
		this._elements = this._initHTMLElement();
		this._initAppState();
	}

	private _initHTMLElement(): any {
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

	private _initEventListener(): void {
		let onDateChanged = (event: Event) => {
			if (event.target === this._elements["next_date_btn"]) {
				this._forwardDate();
			} else {
				this._backwardDate();
			}

			this._loadContent();
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
			this._save();
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
		let current_day = this._current_date.getDay();
		if (current_day === new Date().getDay()) {
			this._elements["prev_date_btn"].disabled = true;
		} else if (current_day === new Date().getDay() - 1) {
			this._elements["next_date_btn"].disabled = true;
		} else {
			this._elements["prev_date_btn"].disabled = false;
			this._elements["next_date_btn"].disabled = false;
		}
	}

	run(): void {
		chrome.runtime.connect(); // Method returns a Port object, which will be disconnected when popup unloads
		this._loadContent();
		this._updateDateChangeButtonState();
	}

	private _loadContent() {
		let day_str = new Date(this._elements["date_field"].innerHTML).getDay().toString();
		chrome.storage.sync.get(day_str, (items: {[key: string] : string}) => {
			if (!chrome.runtime.lastError) {
				let content_area = $(this._elements["content"]);
				let daily_plan = items[day_str];
				if (typeof daily_plan === 'undefined' || daily_plan === "") {
					content_area.val("");
				} else {
					content_area.val(daily_plan);
				}
				content_area.focus();
			}
		});
	}

	private _save(): void {
		let entry = {};
		entry[this._current_date.getDay().toString()] = $(this._elements["content"]).val();
		chrome.storage.sync.set(entry, () => {
			if (chrome.runtime.lastError) {
				console.log("Runtime error when saving content");
			}
		});
	}
}

export {WeekPlan, Day};