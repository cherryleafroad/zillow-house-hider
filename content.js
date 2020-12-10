// check existence of house list
let l = document.querySelectorAll("ul.photo-cards > li") !== null;
let extensionLoaded = false;
let mapLoaded = false;
let listLoaded = false;

if (l) {
    extensionLoaded = true;

    mapLoaded = document.querySelector("div#search-page-map-container") !== null;
    listLoaded = document.querySelectorAll("ul.photo-cards") !== null;
    
    // initial load
    if (mapLoaded) {
        document.querySelector("div#search-page-map-container").arrive("div.BulkPropertyMapMarker:not(.high-zoom)", { onceOnly: true }, () => {
            app();
        });
    } else {
        app();
    }
    
    // keep track of map loaded states to ensure we ignore or hide markers
    document.querySelector("div.search-page-container").arrive("div#search-page-map-container", () => {
        mapLoaded = true;
        document.querySelector("div#search-page-map-container").arrive("div.BulkPropertyMapMarker:not(.high-zoom)", { onceOnly: true }, () => {
            // re-run app to hide markers
            app();
        });
    });
    document.querySelector("div.search-page-container").leave("div#search-page-map-container", () => {
        mapLoaded = false;
    });

    
    document.querySelector("div.search-page-container").arrive("div#grid-search-results", () => {
        listLoaded = true;
        // re-run app to ensure correct things hidden/showed
        app();
        
        // reconnect signal because it was lost
        document.querySelector("div#grid-search-results").leave("div.list-loading-message-cover", () => {
            app();
        });
    });

    document.querySelector("div.search-page-container").leave("div#grid-search-results", () => {
        listLoaded = false;
    });
    
    // connect original list loading finished signal
    document.querySelector("div#grid-search-results").leave("div.list-loading-message-cover", () => {
        app();
    });
}

function app() {
    // make sure array is empty first
    houseList = [];

    const thumbnails = document.querySelectorAll("ul.photo-cards > li");
    
    mapMarkers = mapLoaded ? getMapMarkers() : new Array(thumbnails.length);

    thumbnails.forEach((thumbnail, i) => {
        // it's an ad, skip it
        if (thumbnail.lastChild.id === "nav-ad-container") {
            // also hide it
            thumbnail.setAttribute("style", "display:none;");
            return;
        }

        const houseId = thumbnail.lastChild.id;

        // remove all hidden houses from DOM
        storageGet(houseIdObj => {
            if (Object.keys(houseIdObj).includes(houseId)) {
                console.log("Hid houseId " + houseId);
                removeHouseFromDOM(thumbnail, mapMarkers[i]);
            }
        });

        // add hidden button to visible houses
        if (thumbnail.id != "hideButton") {
            thumbnail.setAttribute("id", "hideButton");
            // add spacing on favorite button
            // this is the SPAN of the heart
            thumbnail.lastChild.lastChild.firstChild.setAttribute("style", "margin-right: 44px;");
            // add hide button
            thumbnail.lastChild.appendChild(createHideButton(houseId, thumbnail, mapMarkers[i]));
        }
        
        thumbnail.lastChild.onclick = () => {  onClickHouse(houseId, thumbnail, mapMarkers[i]); }
    });

    // add a clear hidden results link
    var header = document.getElementsByClassName("search-page-list-header")[0];
    if (header.id != "clearButton") {
        header.setAttribute("id", "clearButton");
        clearButton = document.createElement("a");
        clearButton.setAttribute("id", "clearButtonA");
        clearButton.appendChild(document.createTextNode("Clear Hidden Results"));
        clearButton.onclick = () => {
            unhideHouses();
        }
        header.appendChild(clearButton);
        updateHiddenCount();
    }
}

function unhideHouses() {
    chrome.storage.sync.clear();
    updateHiddenCount();

    const thumbnails = document.querySelectorAll("ul.photo-cards > li");
    if (mapLoaded) {
        const mapMarkers = getMapMarkers();
    }

    thumbnails.forEach((thumbnail, i) => {
        // it's an ad, skip it
        if (thumbnail.lastChild.id === "nav-ad-container")
            return;

        // unhide it
        if (thumbnail.style.display === "none") {
            thumbnail.style.display = "";
            if (mapLoaded)
                mapMarkers[i].style.display = "";
        }
    });
}

function onClickHouse(houseId, thumbnail, marker) {
    var target = document.querySelector("div#home-detail-lightbox-container");

    target.arrive("button.sc-AxhCb.eSwYtm.hdp__sc-1tf5ijk-22.iMJDnd", { onceOnly: true }, () => {
        createDetailHideButton(houseId, thumbnail, marker);
    });
}

function createDetailHideButton(houseId, thumbnail, marker) {
    var ul = document.querySelector("ul.hdp__sc-1tf5ijk-9.fbBaJs");

    var li = document.createElement("li");
    li.setAttribute("class", "hdp__sc-1tf5ijk-3 eLjfA");

    var button = document.createElement("button");
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("class", "sc-AxhCb eSwYtm hdp__sc-1tf5ijk-22 iMJDnd");
    button.onclick = () => {
        onClick(houseId, thumbnail, marker);
        document.querySelector("button.ds-close-lightbox-icon.hc-back-to-list").click();
    };
    li.appendChild(button);

    var div = document.createElement("div");
    div.setAttribute("class", "hdp__sc-1tf5ijk-6 giBdlJ");
    button.appendChild(div);

    var div2 = document.createElement("div");
    div2.setAttribute("area-hidden", "true");
    div2.setAttribute("class", "hdp__sc-1tf5ijk-4 hdp__sc-1tf5ijk-15 hDhSkZ");
    div2.appendChild(document.createTextNode("❌"));
    div.appendChild(div2);

    ul.prepend(li);
}

/*
  Given the dom object of the actions bar for each house thumbnail,
  remove the entire thumbnail for that given house
*/
function removeHouseFromDOM(thumbnailDOM, markerDOM) {
    // turns out removing from DOM causes sidebar to disappear
    //const houseList = thumbnailDOM.parentNode;
    //houseList.removeChild(thumbnailDOM);

    // but we can hide it instead
    thumbnailDOM.style.display = "none";
    if (mapLoaded)
        markerDOM.style.display = "none";
}

function updateHiddenCount(increase = false) {
    storageGet(result => {
        count = Object.keys(result).length;

        if (increase)
            count++;

        // update badge
        chrome.runtime.sendMessage({
            numHiddenHouses: count
        });

        elem = document.getElementsByClassName("search-page-list-header")[0].children.clearButtonA;
        elem.textContent = "Clear Hidden Results (" + count + ")";
    });
}

function getMapMarkers() {
    // Map Markers are reversed in relation to the hosue list. So we append them in reverse order to get the same ordering
    const mapMarkersD = document.querySelector("div.BulkPropertyMapMarker:not(.high-zoom)");

    mapMarkers = [];
    var i = mapMarkersD.childNodes.length;
    while (i--)
        mapMarkers.push(mapMarkersD.childNodes[i]);
        
    return mapMarkers;
}

/*
  Create a hide house button
*/
function createHideButton(houseId, thumbnailDOM, markerDOM) {
    hideButton = document.createElement("button");
    hideButton.setAttribute("class", "list-card-save");
    hideButton.setAttribute("type", "button");

    span = document.createElement("span");
    span.setAttribute("class", "list-card-save-content");
    span.setAttribute("style", "padding-top:12px;");
    hideButton.appendChild(span);

    link = document.createElement("a");
    link.appendChild(document.createTextNode("❌"));
    link.onclick = (e) => {
        // don't double click element underneath
        e.stopPropagation();
        // don't double click element underneath
        onClick(houseId, thumbnailDOM, markerDOM);
    };
    span.appendChild(link);
    return hideButton;
}

function onClick(houseId, thumbnailDOM, markerDOM) {
    storageSet(houseId, true);
    removeHouseFromDOM(thumbnailDOM, markerDOM);
    updateHiddenCount(true);
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (extensionLoaded && request.message === "unhideHouses") {
            unhideHouses();
        }
    }
);

/*
  Fetch data from chrome storage
*/
function storageGet(callback) {
    chrome.storage.sync.get(["zillowHouseHide"], result => {
        // key not yet set
        if (Object.keys(result).length === 0) {
            callback({});
            return;
        }

        callback(result.zillowHouseHide);
    });
}

/*
  Update data in chrome storage
*/
function storageSet(key, value) {
    chrome.storage.sync.get(["zillowHouseHide"], result => {
        chrome.storage.sync.set({
            zillowHouseHide: {
                ...result.zillowHouseHide,
                [key]: value
            }
        });
    });
}