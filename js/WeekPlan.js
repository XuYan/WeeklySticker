/// <reference path=".\typings\chrome.d.ts" />
/// <reference path=".\typings\globals\jquery\index.d.ts" />
define(["require", "exports", './EventManager'], function (require, exports, EventManager_1) {
    "use strict";
    var WeekPlan = (function () {
        function WeekPlan() {
        }
        WeekPlan.getInstance = function () {
            if (!WeekPlan._instance) {
                WeekPlan._instance = new WeekPlan();
            }
            return WeekPlan._instance;
        };
        WeekPlan.prototype.init = function () {
            this._elements = this._initHTMLElement();
            this._initAppState();
        };
        WeekPlan.prototype._initHTMLElement = function () {
            return {
                "prev_date_btn": document.getElementById('prev'),
                "next_date_btn": document.getElementById('next'),
                "date_field": document.getElementById('date'),
                "content": document.getElementById('content'),
                "app": document.getElementById('app')
            };
        };
        WeekPlan.prototype._initAppState = function () {
            this._current_date = new Date(); // TODO: This should be read from db
            this._elements["date_field"].innerHTML = this._current_date.toDateString();
            this._initEventListener();
        };
        WeekPlan.prototype._initShortcut = function () {
            var _this = this;
            chrome.commands.onCommand.addListener(function (command) {
                if (command === "add-plan-today") {
                    chrome.tabs.executeScript({
                        code: "window.getSelection().toString();"
                    }, function (result) {
                        var key = new Date().toDateString();
                        chrome.storage.sync.get(key, function (items) {
                            if (result[0] !== "") {
                                var selection = result[0];
                                var content = "";
                                if (typeof items[key] === 'undefined') {
                                    content = selection;
                                }
                                else {
                                    content = items[key] + "\n" + selection;
                                }
                                _this.save(key, content);
                            }
                        });
                    });
                }
            });
        };
        WeekPlan.prototype._initEventListener = function () {
            var _this = this;
            var onDateChanged = function (event) {
                if (event.target === _this._elements["next_date_btn"]) {
                    _this._forwardDate();
                }
                else {
                    _this._backwardDate();
                }
                _this.load(new Date(_this._elements["date_field"].innerHTML).toDateString(), _this._show.bind(_this));
            };
            var onKeyDown = function (event) {
                if (event.altKey) {
                    if (event.which === 37) {
                        _this._backwardDate();
                    }
                    else if (event.which === 39) {
                        _this._forwardDate();
                    }
                }
            };
            var onBlur = function (event) {
                _this.save();
            };
            EventManager_1.EventManager.register(this._elements["prev_date_btn"], "click", onDateChanged);
            EventManager_1.EventManager.register(this._elements["next_date_btn"], "click", onDateChanged);
            EventManager_1.EventManager.register(this._elements["app"], "keydown", onKeyDown);
            EventManager_1.EventManager.register(this._elements["content"], "blur", onBlur);
        };
        WeekPlan.prototype._forwardDate = function () {
            this._current_date.setDate(this._current_date.getDate() + 1);
            this._elements["date_field"].innerHTML = this._current_date.toDateString();
            this._updateDateChangeButtonState();
        };
        WeekPlan.prototype._backwardDate = function () {
            this._current_date.setDate(this._current_date.getDate() - 1);
            this._elements["date_field"].innerHTML = this._current_date.toDateString();
            this._updateDateChangeButtonState();
        };
        WeekPlan.prototype._updateDateChangeButtonState = function () {
            var current_day_str = this._current_date.toDateString();
            var today = new Date();
            var six_days_later = new Date();
            six_days_later.setDate(today.getDate() + 6);
            var today_str = today.toDateString();
            var six_days_later_str = six_days_later.toDateString();
            if (current_day_str === today_str) {
                this._elements["prev_date_btn"].disabled = true;
            }
            else if (current_day_str === six_days_later_str) {
                this._elements["next_date_btn"].disabled = true;
            }
            else {
                this._elements["prev_date_btn"].disabled = false;
                this._elements["next_date_btn"].disabled = false;
            }
        };
        WeekPlan.prototype.run = function () {
            // // Method returns a Port object, which will be disconnected when popup unloads
            // chrome.runtime.connect(<chrome.runtime.ConnectInfo> {
            // 	name: "popup_port"
            // });
            this.load(new Date().toDateString(), this._show.bind(this));
            this._updateDateChangeButtonState();
            this._updateIcon();
        };
        WeekPlan.prototype.removeOutdatePlan = function () {
            var today = new Date().getTime();
            chrome.storage.sync.get(null, function (items) {
                for (var date_str in items) {
                    var day = new Date(date_str).getTime();
                    var time_diff = day - today;
                    if (time_diff < 0) {
                        delete items[date_str];
                    }
                }
            });
        };
        WeekPlan.prototype._updateIcon = function () {
            var today_str = new Date().toDateString();
            chrome.storage.sync.get(today_str, function (items) {
                if (typeof items[today_str] === 'undefined' || items[today_str] === "") {
                    chrome.browserAction.setBadgeText({
                        text: ""
                    });
                }
                else {
                    chrome.browserAction.setBadgeBackgroundColor({
                        color: "#F00"
                    });
                    chrome.browserAction.setBadgeText({
                        text: "!"
                    });
                }
            });
        };
        WeekPlan.prototype._onMenuItemClicked = function (info, tab) {
            var _this = this;
            var day_str = info.menuItemId;
            chrome.storage.sync.get(day_str, function (items) {
                if (!chrome.runtime.lastError) {
                    var content = items[day_str];
                    if (!content) {
                        content = "";
                    }
                    var add_content = "";
                    if (info.selectionText) {
                        add_content = "\n" + info.selectionText;
                    }
                    else if (info.linkUrl) {
                        add_content = "\n" + info.linkUrl;
                    }
                    _this.save(day_str, content + add_content);
                }
            });
        };
        WeekPlan.prototype.load = function (date_str, callback) {
            chrome.storage.sync.get(date_str, function (items) {
                if (!chrome.runtime.lastError) {
                    var daily_plan = items[date_str];
                    callback(daily_plan);
                }
            });
        };
        WeekPlan.prototype._show = function (content) {
            var content_area = $(this._elements["content"]);
            content_area.val(content);
            content_area.focus();
        };
        WeekPlan.prototype.save = function (date, content) {
            var _this = this;
            if (date === void 0) { date = this._current_date.toDateString(); }
            if (content === void 0) { content = $(this._elements["content"]).val(); }
            var entry = {};
            entry[date] = content;
            chrome.storage.sync.set(entry, function () {
                if (chrome.runtime.lastError) {
                    console.log("Runtime error when saving content");
                }
                _this._updateIcon();
            });
        };
        WeekPlan._instance = undefined;
        return WeekPlan;
    }());
    exports.WeekPlan = WeekPlan;
});
