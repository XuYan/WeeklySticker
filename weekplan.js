    var weekday = new Array(7);
    weekday[0] = "Sn";
    weekday[1] = "M";
    weekday[2] = "T";
    weekday[3] = "W";
    weekday[4] = "Th";
    weekday[5] = "F";
    weekday[6] = "S";

    var todayDate;
    var shownDate;
    var prevDayButton;
    var nextDayButton;
    var syncTimeout;
    var content;
    var cachedContent;
    var dateField;

    window.onload = function() {
        init();
    }

    function init() {
        todayDate = new Date();
        shownDate = new Date();
        prevDayButton = document.getElementById("prev");
        nextDayButton = document.getElementById("next");
        dateField = document.getElementById("date");
        content = document.getElementById("content");

        dateField.innerHTML = formatDate(todayDate);
        prevDayButton.addEventListener("click", onDateChange);
        nextDayButton.addEventListener("click", onDateChange);
        window.addEventListener("keydown", onKeyDown);

        connectEventPage();
        getReady();
    }

    // Method returns a Port object, which will be disconnected when popup unloads
    function connectEventPage() {
        chrome.runtime.connect(); 
    }

    function getReady() {
        loadPlan();
        setCursor();
        syncTextArea();
        checkDateRestraints();
    }

    function onDateChange() {
        clearTimeout(syncTimeout);
        var button = event.target;
        if (button.id == "next") {
            shownDate.setDate(shownDate.getDate() + 1);
        } else {
            shownDate.setDate(shownDate.getDate() - 1);
        }
        dateField.innerHTML = formatDate(shownDate);

        getReady();
    }

    function onKeyDown(event) {
        if (event.ctrlKey && event.altKey && (event.which == 37 || event.which == 39)) {
            simulateClick(event.which);
        }
    }

    function simulateClick(keyCode) {
        var simulateClickEvent = document.createEvent("MouseEvents");
        simulateClickEvent.initMouseEvent("click", true, true, window,
            0, 0, 0, 0, 0, false, false, false, false, 0, null);

        if (keyCode == 37) {
            prevDayButton.dispatchEvent(simulateClickEvent);
        } else {
            nextDayButton.dispatchEvent(simulateClickEvent);
        }
    }

    function loadPlan() {
        var date = dateField.innerHTML;
        chrome.storage.sync.get(date, function(plans) {
            if (!chrome.runtime.error) {
                var plan = plans[date];
                if (typeof plan === 'undefined' || plan === "") {
                    content.value = "";
                } else {
                    content.value = addPossibleSpace(plan);
                }
            }
        });
    }

    function addPossibleSpace(plan) {
        var lastChar = plan.slice(-1);
        if (lastChar === '.' || lastChar === '!' || lastChar === '?' || lastChar === ':') {
            return plan + "\n";
        } else if (lastChar !== ' ' && lastChar !== '\n') {
            return plan + " ";
        } else {
            return plan;
        }
    }

    function setCursor() {
        cachedContent = content.value;
        content.value = '';
        content.focus();
        content.value = cachedContent;
    }

    function syncTextArea() {
        if (cachedContent.valueOf() != content.value.valueOf()) {
            console.log("sync");
            save(dateField.innerHTML, content.value);
            cachedContent = content.value;
        }
        syncTimeout = setTimeout(syncTextArea, 300);
    }

    function checkDateRestraints() {
        var differenceInDay = parseInt((shownDate - todayDate) / (24 * 3600 * 1000));
        if (differenceInDay == 0) {
            prevDayButton.disabled = true;
        } else if (differenceInDay == 6) {
            nextDayButton.disabled = true;
        } else {
            prevDayButton.disabled = false;
            nextDayButton.disabled = false;
        }
    }

    function formatDate(date) {
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0!
        var yyyy = date.getFullYear();

        if (dd < 10) {
            dd = '0' + dd
        }

        if (mm < 10) {
            mm = '0' + mm
        }

        return weekday[date.getDay()] + ", " + dd + '/' + mm + '/' + yyyy;
    }

    function save(date, plan) {
        var entry = {};
        entry[date] = plan;
        chrome.storage.sync.set(entry, function() {
            if (chrome.runtime.error) {
                console.log("Save Plan Runtime error");
            }
        });
    }