var videoIsLoaded = false;
var video;

async function init_video() {
  video = document.querySelector("#video");
  window.onload = function() {
    var constrains = {
      video: {
        facingMode: "environment"
      }
    };
    navigator.mediaDevices
      .getUserMedia(constrains)
      .then(function(stream) {
        track = stream.getTracks()[0];
        video.srcObject = stream;
        video.oncanplay = ()=>{videoIsLoaded=true;};
      }).catch(function(error) {
        no_video();
      });
  }
}
function no_video() {
  video = new Image;
  video.src = "data/3.png";
  video.onload = ()=>{videoIsLoaded=true;};
}
init_video();
