require.config({
	baseUrl: 'js',

	// lib dependencies
	paths: {
		"jquery": "lib/jquery-3.1.1.min",
		"WeekPlanModule": "./WeekPlan"
	}
});

require(["jquery", "WeekPlanModule"], function ($, WP) {
	$(document).ready(function onReady() {
		console.log("Weekly sticker is opened...");
		let week_plan = WP.WeekPlan.getInstance();
		week_plan.init();
		week_plan.removeOutdatePlan();
		week_plan.run();
	});
});