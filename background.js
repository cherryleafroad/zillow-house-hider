// initialization
chrome.storage.sync.get(["zillowHouseHide"], result => {
    // key not yet set
    if (Object.keys(result).length === 0) {
        setBadge("0");
        return;
    }
    
    setBadge(Object.keys(result.zillowHouseHide).length);
});


chrome.runtime.onMessage.addListener(function(request, sender) {
    setBadge(request.numHiddenHouses);
});

function setBadge(badgeText) {
    badgeText = badgeText.toString();

    chrome.browserAction.setBadgeText({ text: badgeText === "0" ? '' : badgeText });
    chrome.browserAction.setBadgeBackgroundColor({color: "#696969"});
}
