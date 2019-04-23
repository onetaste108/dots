test_points = [];


var vs2 = `
precision mediump float;

attribute vec2 a_pos;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_pos,0.0,1.0);
}
`;

var fs2 = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_tex;
void main() {
  gl_FragColor = texture2D(u_tex,v_texCoord);
  // gl_FragColor = vec4(1,0,0,1);
}
`;

var params = {
  min_screen: 720,
  max_size: 512,
  hl: 0.0,
  hu: 0.6,
  sl: 0.5,
  su: 1,
  vl: 0.5,
  vu: 1,
  e: 1,
  b: 1,
  d: 0,
  mina: 0,
  maxa: 10000,
};

// GUI SETUP ------------------------------------------------------------------
// var isSettings = false;
//
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
var video;

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
        no_video();
      });
  }
}
function no_video() {
  // video = new Image;
  // video.src = "data/3.png";
  // video.onload = ()=>{videoIsLoaded=true;};
}
init_video();
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

// SETUP SCREEN SIZE --------------------------------------------------------
var screen_size, screen_size_ratio, max_size, mask_ratio;
function update_screen_size() {
  screen_size = {w: 300, h: 300};
  screen_size_ratio = Math.max( Math.max(screen_size.w, screen_size.h), params.min_screen ) / Math.max(screen_size.w, screen_size.h);
  screen_size.w = Math.round(screen_size.w*screen_size_ratio);
  screen_size.h = Math.round(screen_size.h*screen_size_ratio);
  canvas.width = screen_size.w;
  canvas.height = screen_size.h;
  // cv_canvas.width = screen_size.w;
  // cv_canvas.height = screen_size.h;
  mask_ratio = Math.min(params.max_size, Math.max(screen_size.w, screen_size.h)) / Math.max(screen_size.w, screen_size.h);
  mask_size = {w: Math.round(screen_size.w * mask_ratio), h: Math.round(screen_size.h * mask_ratio)};
}
update_screen_size();

var tex_main = twgl.createTexture(gl, {width: screen_size.w, height: screen_size.h});
var time = 0;
function capture() {
  var video_size;
  if (video.videoWidth) {
    video_size = {
      w: video.videoWidth,
      h: video.videoHeight
    };
  } else {
    video_size = screen_size;
  }
  // if (videoIsLoaded) twgl.setTextureFromElement(gl, tex_main, video);
  twgl.setTextureFromElement(gl, tex_main, video, {level:0});
  twgl.bindFramebufferInfo(gl);
  twgl.setUniforms(programInfo, {
    u_hsv_l: [params.hl, params.sl, params.vl],
    u_hsv_u: [params.hu, params.su, params.vu],
    u_resolution: [screen_size.w, screen_size.h],
    u_texResolution: [video_size.w, video_size.h],
    u_fill: 1,
    u_tex: tex_main,
    u_flip: -1,
    u_mode: NORMAL,
    u_angle: 0
  });
  twgl.drawBufferInfo(gl, bufferInfo);
}
var lastTime = new Date();
function draw() {
  // if (isSettings) {
  //   var newTime = new Date();
  //   var fps = Math.round(10000 / (newTime - lastTime))/10;
  //   fpsElm.innerHTML = fps;
  //   lastTime = newTime;
  //
  //   insizeElm.innerHTML = video.videoWidth+" "+video.videoHeight;
  //   rensizeElm.innerHTML = screen_size.w + " " + screen_size.h;
  //   psizeElm.innerHTML = mask_size.w + " " + mask_size.h;
  // }
  // fboIndex = 0;

  capture();
  // for (var i = 0; i < params.b; i++) { applyFilter(BLUR); }
  // if (params.d == 1) drawCurrent();
  // applyFilter(HSV_CLIP);
  // if (params.d == 2) drawCurrent();
  // for (var i = 0; i < params.e; i++) {
  //   applyFilter(ERODE);
  //   applyFilter(DILATE);
  // }
  // var pixels = grabPixels();
  // if (params.d == 3) drawCurrent();
  //
  // var blobs =  get_blobs(pixels, params);
  //
  // if (isSettings) blobsElm.innerHTML = blobs.length;
  // if (isSettings) drawBlobs(blobs,"yellow");
  //
  // ctx.clearRect(0,0, cv_canvas.width, cv_canvas.height);
  //
  // var pId = posterId(blobs);
  // if (pId > 0 && !isSettings) {
  //   var u_transformMat = get_matrix(blobs, pId);
  //   drawPoster(u_transformMat, posterTextures[pId-1]);
  // }
  //
  // time += 1/60;
  requestAnimationFrame(draw);
}
hide_loading();



// function get_matrix(blobs, pId) {
//   var corners = detectCorners(blobs, pId);
//   var origin = poster_data[pId-1].corners;
//   var trans = [corners[0].x, corners[0].y, corners[1].x, corners[1].y, corners[2].x, corners[2].y, corners[3].x, corners[3].y];
//   for (var i = 0; i < trans.length; i++) {
//     trans[i] = trans[i]*2-1;
//   }
//   test_points = trans;
//   var mat1 = cv.matFromArray(4, 2, cv.CV_32F, origin);
//   var mat2 = cv.matFromArray(4, 2, cv.CV_32F, trans);
//   var tmat = cv.getPerspectiveTransform(mat1, mat2);
//   cv.transpose(tmat, tmat);
//   var tmat_arr = new Float32Array(tmat.data64F);
//   mat1.delete()
//   mat2.delete();
//   tmat.delete();
//   return tmat_arr;
// }
//
// function get_blobs(pixels, par) {
//   var blobParams = {
//     thresholdStep: 1000,
//     minThreshold: 200,
//     maxThreshold: 256,
//     filterByColor: true,
//     blobColor: 255,
//     filterByArea: true,
//     minArea: par["mina"],
//     maxArea: par["maxa"],
//     filterByCircularity: false,
//     faster: true
//   };
//
//   var src = cv.matFromArray(mask_size.h, mask_size.w, cv.CV_8UC4, pixels);
//   var gray = new cv.Mat(src.rows, src.cols, cv.CV_8UC1);
//   cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
//   var blobs = findBlobs(gray, blobParams);
//
//   for (var i = 0; i < blobs.length; i++) {
//     blobs[i].x /= mask_size.w;
//     blobs[i].y /= mask_size.h;
//     blobs[i].w /= mask_size.w;
//     blobs[i].h /= mask_size.h;
//   }
//   src.delete()
//   gray.delete()
//   return blobs;
// }
//
// function detectCorners(blobs, pId) {
//   var [nb, nvals] = normblobs(blobs);
//   var corners = [];
//   if (pId == 2) {
//     // LL
//     var ll = Array.from(nb);
//     ll.sort((a,b)=>{return dist({x:-1,y:2},a)-dist({x:-1,y:2},b);});
//     ll = ll.slice(0,1);
//     corners.push(...ll);
//     // LU
//     var lu = Array.from(nb);
//     lu.sort((a,b)=>{return dist({x:-1,y:-1},a)-dist({x:-1,y:-1},b);});
//     lu = lu.slice(0,1);
//     corners.push(...lu);
//     // RU
//     var ru = Array.from(nb);
//     ru.sort((a,b)=>{return dist({x:2.5,y:-1},a)-dist({x:2.5,y:-1},b);});
//     ru = ru.slice(0,2);
//     ru.sort((a,b)=>{return a.y-b.y;});
//     ru = ru.slice(0,1);
//     corners.push(...ru);
//     // LU
//     var rl = Array.from(nb);
//     rl.sort((a,b)=>{return dist({x:2.5,y:2.5},a)-dist({x:2.5,y:2.5},b);});
//     rl = rl.slice(0,1);
//     corners.push(...rl);
//   }
//   if (pId == 3) {
//     // LL
//     var ll = Array.from(nb);
//     ll.sort((a,b)=>{return dist({x:-1,y:2},a)-dist({x:-1,y:2},b);});
//     ll = ll.slice(0,1);
//     corners.push(...ll);
//     // LU
//     var lu = Array.from(nb);
//     lu.sort((a,b)=>{return dist({x:-1,y:-1},a)-dist({x:-1,y:-1},b);});
//     lu = lu.slice(0,1);
//     corners.push(...lu);
//     // RU
//     var ru = Array.from(nb);
//     ru.sort((a,b)=>{return dist({x:2.5,y:-1},a)-dist({x:2.5,y:-1},b);});
//     // ru = ru.slice(0,2);
//     // ru.sort((a,b)=>{return a.y-b.y;});
//     ru = ru.slice(0,1);
//     corners.push(...ru);
//     // LU
//     var rl = Array.from(nb);
//     rl.sort((a,b)=>{return dist({x:2.5,y:2.5},a)-dist({x:2.5,y:2.5},b);});
//     rl = rl.slice(0,1);
//     corners.push(...rl);
//   }
//   if (pId == 4) {
//     // LL
//     var ll = Array.from(nb);
//     ll.sort((a,b)=>{return dist({x:0,y:2},a)-dist({x:0,y:2},b);});
//     ll = ll.slice(0,1);
//     corners.push(...ll);
//     // LU
//     var lu = Array.from(nb);
//     lu.sort((a,b)=>{return dist({x:-1,y:-1},a)-dist({x:-1,y:-1},b);});
//     lu = lu.slice(0,1);
//     corners.push(...lu);
//     // RU
//     var ru = Array.from(nb);
//     ru.sort((a,b)=>{return dist({x:1,y:0},a)-dist({x:1,y:0},b);});
//     // ru = ru.slice(0,2);
//     // ru.sort((a,b)=>{return a.y-b.y;});
//     ru = ru.slice(0,1);
//     corners.push(...ru);
//     // LU
//     var rl = Array.from(nb);
//     rl.sort((a,b)=>{return dist({x:2.5,y:2.5},a)-dist({x:2.5,y:2.5},b);});
//     rl = rl.slice(0,1);
//     corners.push(...rl);
//   }
//   if (pId == 1) {
//     // LL
//     var ll = Array.from(nb);
//     ll.sort((a,b)=>{return dist({x:0,y:2},a)-dist({x:0,y:2},b);});
//     ll = ll.slice(0,2);
//     ll.sort((a,b)=>{return a.x-b.x;});
//     ll = ll.slice(0,1);
//     corners.push(...ll);
//     // LU
//     var lu = Array.from(nb);
//     lu.sort((a,b)=>{return dist({x:-1,y:-1},a)-dist({x:-1,y:-1},b);});
//     lu = lu.slice(0,2);
//     lu.sort((a,b)=>{return a.y-b.y;});
//     lu = lu.slice(0,1);
//     corners.push(...lu);
//     // RU
//     var ru = Array.from(nb);
//     ru = ru.filter((a)=>{return a.x > 0.4})
//     ru.sort((a,b)=>{return a.y-b.y;});
//     ru = ru.slice(0,1);
//     corners.push(...ru);
//     // LU
//     var rl = Array.from(nb);
//     rl = rl.filter((a)=>{return a.x > 0.6})
//     if (rl.length > 0) {
//       rl.sort((a,b)=>{return b.y-a.y;});
//       rl = rl.slice(0,2);
//       rl.sort((a,b)=>{return a.x-b.x;});
//       if (rl.length > 1) {
//         if (dist(rl[0],rl[1]) > 0.2 && rl.length > 1) {
//           rl = [rl[1]];
//         } else {
//           rl = [rl[0]];
//         }
//       } else {
//         rl = [rl[0]];
//       }
//       corners.push(...rl);
//     } else {
//       corners.push([{x:1, y:1, w:1, h:1}]);
//     }
//   }
//   return denormblobs(corners,nvals);
//   return corners;
// }
//
// function normblobs(blobs) {
//   var nb = [];
//   var maxx = 0;
//   var maxy = 0;
//   var minx = 10000;
//   var miny = 10000;
//   for (var i = 0; i < blobs.length; i++) {
//     maxx = Math.max(maxx,blobs[i].x);
//     maxy = Math.max(maxy,blobs[i].y);
//     minx = Math.min(minx,blobs[i].x);
//     miny = Math.min(miny,blobs[i].y);
//   }
//   for (var i = 0; i < blobs.length; i++) {
//     nb.push({
//       x:(blobs[i].x-minx)/(maxx-minx),
//       y:(blobs[i].y-miny)/(maxy-miny),
//       w:blobs[i].w,
//       h:blobs[i].h
//     })
//   }
//   return [nb, [maxx,maxy,minx,miny]];
// }
//
// function denormblobs(blobs, nvals) {
//   var [maxx, maxy, minx, miny] = nvals;
//   var n = [];
//   for (var i = 0; i < blobs.length; i++) {
//     n.push({
//       x:blobs[i].x*(maxx-minx)+minx,
//       y:blobs[i].y*(maxy-miny)+miny,
//       w:blobs[i].w,
//       h:blobs[i].h
//     })
//   }
//   return n;
// }
//
// function posterId(blobs) {
//   var postern = 0;
//   if (blobs.length < 3) {
//     postern = 0;
//   } else if (blobs.length < 10) {
// 		postern = 4;
// 	} else if (blobs.length < 24) {
// 		postern = 3;
// 	} else if (blobs.length < 35) {
// 		postern = 2;
// 	} else if (blobs.length > 3) {
// 		postern = 1;
// 	}
//   return postern;
// }
//
// function dist(v1, v2) {
//   var dx = Math.abs(v1.x - v2.x);
//   var dy = Math.abs(v1.y - v2.y);
//   return Math.sqrt(dx*dx+dy*dy);
// }
//
function hide_loading() {
  document.querySelector("#loadscreen").style.visibility = "hidden";
}
cv['onRuntimeInitialized'] = () => {draw();};
