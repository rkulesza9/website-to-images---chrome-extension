
function b_fill_webpage_queue(request){
  if(request.from === 'main'){
    var array_urls = [];

    //find all <a> elements and store their href in array_urls
    var dom_urls = document.getElementsByTagName("a");
    for(var x = 0; x < dom_urls.length; x++){
      array_urls.push(dom_urls[x].href);
    }

    //go back to main
    chrome.extension.sendMessage({
      "msg" : "main",
      "from" : "fill_webpage_queue",
      "urls" : array_urls,
      "status" : "incomplete"
    });
  }
}

//when image capture is finished for a page, it should tell main
function b_capture_image_iter(){
  chrome.extension.sendMessage({
    "msg" : "main",
    "from" : "capture_image",
    "status" : "incomplete"
  });
}
