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
        alert("NO VIDEO");
      });
  }
}

init_video();

var canvas = document.querySelector("#canvas");
var ctx = canvas.getContext("2d");
var time = 0;
function draw() {
  ctx.fillRect(0+time,0,10,10);
  ctx.drawImage(video, 0,0,300,300);
  requestAnimationFrame(draw);
  time += 1;
}

draw();
