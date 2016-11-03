/// <reference path=".\typings\chrome.d.ts" />
/// <reference path=".\typings\globals\jquery\index.d.ts" />
define(["require", "exports", './EventManager'], function (require, exports, EventManager_1) {
    "use strict";
    var Day;
    (function (Day) {
        Day[Day["Mo"] = 0] = "Mo";
        Day[Day["Tu"] = 1] = "Tu";
        Day[Day["We"] = 2] = "We";
        Day[Day["Th"] = 3] = "Th";
        Day[Day["Fr"] = 4] = "Fr";
        Day[Day["Sa"] = 5] = "Sa";
        Day[Day["Su"] = 6] = "Su";
    })(Day || (Day = {}));
    exports.Day = Day;
    var WeekPlan = (function () {
        function WeekPlan() {
            this._elements = this._initHTMLElement();
            this._initAppState();
        }
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
        WeekPlan.prototype._initEventListener = function () {
            var _this = this;
            var onDateChanged = function (event) {
                if (event.target === _this._elements["next_date_btn"]) {
                    _this._forwardDate();
                }
                else {
                    _this._backwardDate();
                }
                _this._loadContent();
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
                _this._save();
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
            var current_day = this._current_date.getDay();
            if (current_day === new Date().getDay()) {
                this._elements["prev_date_btn"].disabled = true;
            }
            else if (current_day === new Date().getDay() - 1) {
                this._elements["next_date_btn"].disabled = true;
            }
            else {
                this._elements["prev_date_btn"].disabled = false;
                this._elements["next_date_btn"].disabled = false;
            }
        };
        WeekPlan.prototype.run = function () {
            chrome.runtime.connect(); // Method returns a Port object, which will be disconnected when popup unloads
            this._loadContent();
            this._updateDateChangeButtonState();
        };
        WeekPlan.prototype._loadContent = function () {
            var _this = this;
            var day_str = new Date(this._elements["date_field"].innerHTML).getDay().toString();
            chrome.storage.sync.get(day_str, function (items) {
                if (!chrome.runtime.lastError) {
                    var content_area = $(_this._elements["content"]);
                    var daily_plan = items[day_str];
                    if (typeof daily_plan === 'undefined' || daily_plan === "") {
                        content_area.val("");
                    }
                    else {
                        content_area.val(daily_plan);
                    }
                    content_area.focus();
                }
            });
        };
        WeekPlan.prototype._save = function () {
            var entry = {};
            entry[this._current_date.getDay().toString()] = $(this._elements["content"]).val();
            chrome.storage.sync.set(entry, function () {
                if (chrome.runtime.lastError) {
                    console.log("Runtime error when saving content");
                }
            });
        };
        return WeekPlan;
    }());
    exports.WeekPlan = WeekPlan;
});
