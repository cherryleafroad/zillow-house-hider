let lastHash = "";

window.setInterval(function() {
  let newHash = location.href;
  // trigger dom update when new url (url changes based on lat/long)
  if (newHash !== lastHash) {
    app();
    lastHash = newHash;
  }
}, 2000);

function app() {
  const thumbnails = document.querySelectorAll("ul.photo-cards > li");

  thumbnails.forEach(thumbnail => {
    // it's an ad, skip it
    if (thumbnail.lastChild.id === "nav-ad-container")
        return;

    const houseId = thumbnail.lastChild.id;

    // remove all hidden houses from DOM
    storageGet(houseIdObj => {
      console.log(Object.keys(houseIdObj));
      if (Object.keys(houseIdObj).includes(houseId)) {
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
      const clearButton = document.createElement("a");
      clearButton.appendChild(document.createTextNode("Clear Hidden Results"));
      clearButton.onclick = () => { chrome.storage.sync.clear(); }
      header.appendChild(clearButton);
  }
}

/*
  Given the dom object of the actions bar for each house thumbnail,
  remove the entire thumbnail for that given house
*/
function removeHouseFromDOM(thumbnailDOM) {
  const houseList = thumbnailDOM.parentNode;
  houseList.removeChild(thumbnailDOM);
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
  };
}

/*
  Fetch data from chrome storage
*/
function storageGet(callback) {
  chrome.storage.sync.get(["zillowHouseHide"], result => {
    // key not yet set
    if (Object.keys(result).length === 0)
        return;

    console.log(result);
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
