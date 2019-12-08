//user inputted parameters
var OUTPUT_DIR = "";
var MAX_DEPTH = 0;

//url collection
var WEBPAGE_QUEUE = null;
var WQ_HEAD = 0;

//current tab informatin
var TAB_ID = null;
var TAB_URL = null;

//this tells the load-complete listener what process called on it
var CURRENT_PROCESS = null;

function b_main(request){
  if(request.from === "extension_start") {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs){
      b_main_extension_start(request,tabs[0]);
    });
  }
  else if(request.from === "fill_webpage_queue" & request.status === "incomplete"){
    //done collecting webpages
    if(WEBPAGE_QUEUE[WQ_HEAD][1] >= MAX_DEPTH){
      //send message back to main
      chrome.tabs.sendMessage(TAB_ID, {
        'msg' : 'main',
        'from' : "fill_webpage_queue",
        'status' : "complete"
      });

      return;
    }

    var urls = request.urls;

    //wrap each url in a node with depth value
    //add each node to webpage_queue
    for(var x = 0; x < urls.length; x++){
      var url = urls[x];
      var node = [urls[x], WEBPAGE_QUEUE[WQ_HEAD][1] + 1];

      if(b_FindURLInQueue(url) == false){
        console.log("duplicate found: "+url);
        WEBPAGE_QUEUE.push(node);
      }

      console.log(node);
    }

    //increment WQ_HEAD
    WQ_HEAD = WQ_HEAD + 1;

    //tell load-complete listener what process this is
    CURRENT_PROCESS = "fill_webpage_queue";

    //set tab to next page and send msg
    chrome.tabs.update(TAB_ID,{url: WEBPAGE_QUEUE[WQ_HEAD][0]});

    //next iteration of loop (next url) - this happens in loading-complete listeners
  }
  else if(request.from === "fill_webpage_queue" & request.status === "complete"){

    //notify the user
    alert("Phase One Is Complete\n"+
          "Do not interact with chrome while extension is running.");

    //set head to 0 for capture Phase
    WQ_HEAD = 0;

    //set current process to capture_image
    CURRENT_PROCESS = "capture_image";

    //set tab to first page and send msg
    chrome.tabs.update(TAB_ID,{url: WEBPAGE_QUEUE[WQ_HEAD][0]});

  }
  else if(request.from === "capture_image" & request.status === "incomplete"){
    //process is done when WQ_HEAD == WEBPAGE_QUEUE.length
    if(WQ_HEAD >= WEBPAGE_QUEUE.length - 1){
      b_resetGlobals();
      alert("General Webpage Capturer Has Finished Running.");
      return;
    }

    //increment WQ_HEAD
    WQ_HEAD = WQ_HEAD + 1;

    //set current process to capture_image
    CURRENT_PROCESS = 'capture_image';

    //set tab to next page and send msg
    chrome.tabs.update(TAB_ID,{url: WEBPAGE_QUEUE[WQ_HEAD][0]});
  }
}

function b_main_extension_start(request,tab){
  TAB_ID = tab.id;
  TAB_URL = tab.url;

  OUTPUT_DIR = request.output_dir;
  MAX_DEPTH = request.depth;

  if(WEBPAGE_QUEUE == null){
    WEBPAGE_QUEUE = [[TAB_URL,0]];
  }

  //notify the user
  alert("Phase One: Collecting URLs\n"+
        "Do not interact with chrome while extension is running.");

  //add update listeners (this prevents using timers)
  b_setup_update_listeners();

  //request content script to give you all links on paage
  chrome.tabs.sendMessage(TAB_ID, {
    "msg" : "fill_webpage_queue",
    "from" : "main",
    "url" : WEBPAGE_QUEUE[WQ_HEAD][0]
  });
}

function b_setup_update_listeners(){
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if(changeInfo.status == "complete"){
      if(CURRENT_PROCESS == "fill_webpage_queue"){
        //tell content-script to move to next page in queue
        chrome.tabs.sendMessage(TAB_ID, {
          "msg" : "fill_webpage_queue",
          "from" : "main",
          "url" : WEBPAGE_QUEUE[WQ_HEAD][0]
        });
      }
      else if(CURRENT_PROCESS == "capture_image"){
        //tell content-script to start screen capture
        chrome.tabs.sendMessage(TAB_ID, {
  				"msg": "getPageDetails"
  			});
      }
    }
  });
}

//save screen capture to file and downlaod
function b_saveCaptureToFile(img_url){
  var filename = "webpage_capture_" + WQ_HEAD + ".png";
  chrome.downloads.download({
    url : img_url,
    filename : OUTPUT_DIR + "/" + filename,
    saveAs : false
  });
}


//reset global variables (return to intial state)
function b_resetGlobals(){
  //user inputted parameters
  var OUTPUT_DIR = "";
  var MAX_DEPTH = 0;

  //url collection
  var WEBPAGE_QUEUE = null;
  var WQ_HEAD = 0;

  //current tab informatin
  var TAB_ID = null;
  var TAB_URL = null;

  //this tells the load-complete listener what process called on it
  var CURRENT_PROCESS = null;
}

//check queue for URL
function b_FindURLInQueue(url){
  for(var x = 0; x < WEBPAGE_QUEUE.length; x++){
    var node = WEBPAGE_QUEUE[x];
    if(node[0] == url){
      return true;
    }
  }
  return false;
}
