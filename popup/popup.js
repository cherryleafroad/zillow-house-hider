function sendMessage(message) {
    chrome.tabs.query({url: "https://www.zillow.com/*"}, function (tabs) {
        tabs.forEach(tb => {
            chrome.tabs.sendMessage(tb.id, {"message": "unhideHouses"});
        });
    });
}

function clearStorage() {
  chrome.storage.sync.set({ zillowHouseHide: {} });
  sendMessage("unhideHouses");
}

document.addEventListener("DOMContentLoaded", function() {
  console.log("adding event listener");
  document.querySelector("button").addEventListener("click", clearStorage);
});
