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

function main() {
  // SETUP GL -----------------------------------------------------------------
  var canvas = document.querySelector("#canvas");
  // var cv_canvas = document.querySelector("#cv");
  // var ctx = cv_canvas.getContext("2d");
  var gl = canvas.getContext("webgl");
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
  var arrays = {
    a_pos: {
      numComponents: 2,
      data: [-1,-1,  -1, 1,   1,-1,  -1, 1,  1,-1,   1, 1]
    },
    a_texCoord: {
      numComponents: 2,
      data: [0,0, 0,1, 1,0, 0,1, 1,0, 1,1]
    }
  }
  var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

  // CREATE TEXTURES ----------------------------------------------------------
  var tex_main = twgl.createTexture(gl, {width: 300, height: 300});

  // DRAWING FUNCTIONS --------------------------------------------------------
  var time = 0;
  function capture() {
    var video_size;
    if (video.videoWidth) {
      video_size = {
        w: video.videoWidth,
        h: video.videoHeight
      };
    } else {
      video_size = {w: 300, h:300};
    }
    twgl.setTextureFromElement(gl, tex_main, video, {level:0});
    twgl.bindFramebufferInfo(gl);
    twgl.setUniforms(programInfo, {
      u_resolution: [300,300],
      tex_resolution: [300,300],
      u_fill: 1,
      u_tex: tex_main,
      u_flip: -1,
      u_mode: NORMAL,
      u_angle: 0
    });
    twgl.drawBufferInfo(gl, bufferInfo);
    
  }
  // DRAW LOOP ----------------------------------------------------------------
  function draw() {

    fboIndex = 0;

    capture();
    // for (var i = 0; i < params.b; i++) { applyFilter(BLUR); }
    // applyFilter(HSV_CLIP);
    // for (var i = 0; i < params.e; i++) {
    //   applyFilter(ERODE);
    //   applyFilter(DILATE);
    // }

    requestAnimationFrame(draw);
  }
  draw();
};
main();
