// planner-worker.js - runs buildPlan in a background thread (Web Worker)
importScripts('planner.js');

onmessage = function (e) {
  // e.data = [dest, pkg, attractions, startDate, days, travelers, budget]
  postMessage(buildPlan(...e.data));
};
