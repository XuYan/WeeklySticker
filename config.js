require.config({
    baseUrl: 'js',
 
    // lib dependencies
    paths: {
        "jquery": "lib/jquery-3.1.1.min",
        "App": "./WeekPlan"
    }
 
});

require(["jquery", "App"], function ($, App) {
	$(document).ready(function onReady() {
		console.log("App is opened...");
		let app = new App.WeekPlan();
		app.run();
	});
});