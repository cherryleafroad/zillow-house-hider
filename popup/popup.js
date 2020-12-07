function refreshPage() {
  chrome.tabs.reload();
}

function clearStorage() {
  chrome.storage.sync.set({ zillowHouseHide: {} }, function() {
    refreshPage();
  });
}

document.addEventListener("DOMContentLoaded", function() {
  console.log("adding event listener");
  document.querySelector("button").addEventListener("click", clearStorage);
});
