async function init_video(video) {
  var constrains = {
    video: {
      facingMode: "environment"
    },
    audio: false
  };
  navigator.mediaDevices
    .getUserMedia(constrains)
    .then(function(stream) {
      track = stream.getTracks()[0];
      video.srcObject = stream;
    }).catch(function(error) {
        no_video(video);
      });
}

function no_video(video) {
  alert("Unable to access camera :(");
  window.location.href = "fallback.html";
  // video.src = "data/test2.mov";
  // video.load();
}

function hide_loading() {
  document.querySelector("#loadscreen").style.visibility = "hidden";
}

function video_is_loaded(video) {
  if (video.videoWidth) {
    return true;
  } else {
    return false;
  }
}

function get_video_size(video) {
  return {w: video.videoWidth, h: video.videoHeight};
}

// // GUI SETUP ------------------------------------------------------------------
// var isSettings = false;
// var params;
// var settingsElm = document.getElementById("controls");
// var fpsElm = document.getElementById("fps");
// var insizeElm = document.getElementById("insize");
// var rensizeElm = document.getElementById("rensize");
// var psizeElm = document.getElementById("psize");
// var blobsElm = document.getElementById("blobs");
// function toggle_settings() {
//   isSettings = !isSettings;
//   if (isSettings) {
//     settingsElm.style.visibility = "visible";
//   } else {
//     settingsElm.style.visibility = "hidden";
//   }
// }
// var sliders = document.getElementsByClassName("slider");
// var slidertexts = document.getElementsByClassName("sliderspan");
// function update_sliders() {
//   for (var i = 0; i < sliders.length; i++) {
//     sliders[i].value = params[sliders[i].id];
//     slidertexts[i].innerHTML = sliders[i].value;
//   }
// }
// update_sliders();
// function slider_change(event) {
//   var me = event.target;
//   document.getElementById("t"+me.id).innerHTML = me.value;
//   params[me.id] = me.value;
// }
//
// var videoIsLoaded = false;
// var video;

//
// function gui_draw() {
//   if (isSettings) {
//     var newTime = new Date();
//     var fps = Math.round(10000 / (newTime - lastTime))/10;
//     fpsElm.innerHTML = fps;
//     lastTime = newTime;
//
//     insizeElm.innerHTML = video.videoWidth+" "+video.videoHeight;
//     rensizeElm.innerHTML = render_size.w + " " + render_size.h;
//     psizeElm.innerHTML = mask_size.w + " " + mask_size.h;
//   }
// }
