class EventManager {
	private static _id_event: {[id: string] : string[]} = {};
	private static _event_id: {[type: string] : string[]} = {};

	private constructor() {	}

	private static isValid(element: HTMLElement): boolean {
		return element.id !== undefined;
	}

	static register(element: HTMLElement, event_type: string, event_handler: (event: Event) => void) {
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
	}

	static unregister(element: HTMLElement, event_type: string, event_handler: (event: Event) => void) {
		if (!EventManager.isValid(element)) {
			throw new Error("Element without an ID shouldn't be registered at all");
		}

		let event_type_index: number = EventManager._id_event[element.id].indexOf(event_type);
		if (event_type_index < 0) {
			throw new Error("Element is not listening to event type: " + event_type);
		}
		EventManager._id_event[element.id].splice(event_type_index, 1);

		let id_index: number = EventManager._event_id[event_type].indexOf(element.id);
		if (id_index < 0) {
			throw new Error("Element " + element + "is not listening to event type " + event_type);
		}
		EventManager._event_id[event_type].splice(id_index, 1);

		element.removeEventListener(event_type, event_handler);
	}
}

export {EventManager};