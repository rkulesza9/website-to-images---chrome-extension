function goto_main(){
  chrome.extension.sendMessage({
    "msg" : "main",
    "from" : "extension_start",
    "output_dir" : document.getElementById("dir_name").value,
    "depth" : document.getElementById("depth").value
  });
}

document.getElementById("submit").onclick = goto_main;
