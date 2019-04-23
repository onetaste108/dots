
var vs = `
precision mediump float;

attribute vec2 a_pos;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_pos,0.0,1.0);
}
`;

var fs = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_tex;
void main() {
  gl_FragColor = texture2D(u_tex,v_texCoord);
  // gl_FragColor = vec4(1,0,0,1);
}
`;

async function init_video() {
  video = document.querySelector("#video");
  window.onload = function() {
    var constrains = {
      video: {
        facingMode: "environment",
        // width: { ideal: 720 },
        // height: { ideal: 1024 }
      },
      audio: false
    };
    navigator.mediaDevices
      .getUserMedia(constrains)
      .then(function(stream) {
        track = stream.getTracks()[0];
        video.srcObject = stream;
        video.oncanplay = ()=>{videoIsLoaded=true;};
      }).catch(function(error) {
        alert("No video");
      });
  }
}
init_video();
var video = document.querySelector("#video");
var canvas2d = document.querySelector("#canvas2d");
var canvas = document.querySelector("#canvas");
var ctx = canvas2d.getContext("2d");
var gl = canvas.getContext("webgl");

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

var tex = twgl.createTexture(gl, {width: 300, height: 300});


function draw() {
  twgl.setUniforms(programInfo, {
    u_tex: tex
  });
  ctx.drawImage(video, 0,0,300,300);
  twgl.setTextureFromElement(gl, tex, canvas2d);
  twgl.drawBufferInfo(gl, bufferInfo);
  requestAnimationFrame(draw);
}

cv['onRuntimeInitialized'] = () => {draw();};
