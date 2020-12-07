// if this passes, we are on a list that we can process
let t = document.querySelectorAll("ul.photo-cards > li").length;

if (t > 0) {
    // initial load
    app();
    
    // only update when the list changes
    var observer = new MutationObserver(mutations => {
        app();
    });
    
    var config = { childList: true };
    observer.observe(document.querySelector("ul.photo-cards"), config);
}

function app() {
  const thumbnails = document.querySelectorAll("ul.photo-cards > li");

  thumbnails.forEach(thumbnail => {
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
        removeHouseFromDOM(thumbnail);
      }
    });

    // add hidden button to visible houses
    if (thumbnail.id != "hideButton") {
      thumbnail.setAttribute("id", "hideButton");
      // add spacing on favorite button
      // this is the SPAN of the heart
      thumbnail.lastChild.lastChild.firstChild.setAttribute("style", "margin-right: 44px;");
      // add hide button
      thumbnail.lastChild.appendChild(createHideButton(houseId, thumbnail));
    }
  });
  
  // add a clear hidden results link
  var header = document.getElementsByClassName("search-page-list-header")[0];
  if (header.id != "clearButton") {
      header.setAttribute("id", "clearButton");
      clearButton = document.createElement("a");
      clearButton.setAttribute("id", "clearButtonA");
      clearButton.appendChild(document.createTextNode("Clear Hidden Results"));
      clearButton.onclick = () => { unhideHouses(); }
      header.appendChild(clearButton);
      updateHiddenCount();
  }
}

function unhideHouses() {
    chrome.storage.sync.clear();
    updateHiddenCount();
    
  const thumbnails = document.querySelectorAll("ul.photo-cards > li");

  thumbnails.forEach(thumbnail => {
    // it's an ad, skip it
    if (thumbnail.lastChild.id === "nav-ad-container")
        return;

    // unhide it
    if (thumbnail.style.display === "none") {
        thumbnail.removeAttribute("style");
    }
  });
}

/*
  Given the dom object of the actions bar for each house thumbnail,
  remove the entire thumbnail for that given house
*/
function removeHouseFromDOM(thumbnailDOM) {
    // turns out removing from DOM causes sidebar to disappear
    //const houseList = thumbnailDOM.parentNode;
    //houseList.removeChild(thumbnailDOM);
    
    // but we can hide it instead
    thumbnailDOM.setAttribute("style", "display:none;");
}

function updateHiddenCount(increase = false) {
    storageGet(result => {
        count = Object.keys(result).length;

        if (increase)
            count++;

        elem = document.getElementsByClassName("search-page-list-header")[0].children.clearButtonA;
        elem.textContent = "Clear Hidden Results (" + count + ")";
    });
}

/*
  Create a hide house button
*/
function createHideButton(houseId, thumbnailDOM) {
  hideButton = document.createElement("button");
  hideButton.setAttribute("class", "list-card-save");
  hideButton.setAttribute("type", "button");
  
  span = document.createElement("span");
  span.setAttribute("class", "list-card-save-content");
  span.setAttribute("style", "padding-top:12px;");
  hideButton.appendChild(span);
  
  link = document.createElement("a");
  link.appendChild(document.createTextNode("❌"));
  link.onclick = onClick(houseId, thumbnailDOM);
  span.appendChild(link);
  return hideButton;
}

function onClick(houseId, thumbnailDOM) {
  return function(e) {
    storageSet(houseId, true);
    removeHouseFromDOM(thumbnailDOM);
    updateHiddenCount(true);
  };
}

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
