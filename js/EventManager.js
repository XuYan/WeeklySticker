define(["require", "exports"], function (require, exports) {
    "use strict";
    var EventManager = (function () {
        function EventManager() {
        }
        EventManager.isValid = function (element) {
            return element.id !== undefined;
        };
        EventManager.register = function (element, event_type, event_handler) {
            if (!EventManager.isValid(element)) {
                throw new Error("ID is not assigned to event target");
            }
            if (!EventManager._id_event[element.id]) {
                EventManager._id_event[element.id] = [];
            }
            EventManager._id_event[element.id].push(event_type);
            if (!EventManager._event_id[event_type]) {
                EventManager._event_id[event_type] = [];
            }
            EventManager._event_id[event_type].push(element.id);
            element.addEventListener(event_type, event_handler);
        };
        EventManager.unregister = function (element, event_type, event_handler) {
            if (!EventManager.isValid(element)) {
                throw new Error("Element without an ID shouldn't be registered at all");
            }
            var event_type_index = EventManager._id_event[element.id].indexOf(event_type);
            if (event_type_index < 0) {
                throw new Error("Element is not listening to event type: " + event_type);
            }
            EventManager._id_event[element.id].splice(event_type_index, 1);
            var id_index = EventManager._event_id[event_type].indexOf(element.id);
            if (id_index < 0) {
                throw new Error("Element " + element + "is not listening to event type " + event_type);
            }
            EventManager._event_id[event_type].splice(id_index, 1);
            element.removeEventListener(event_type, event_handler);
        };
        EventManager._id_event = {};
        EventManager._event_id = {};
        return EventManager;
    }());
    exports.EventManager = EventManager;
});
