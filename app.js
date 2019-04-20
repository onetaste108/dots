vs = `
precision mediump float;
precision mediump int;

attribute vec2 a_pos;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
uniform vec2 u_resolution;
uniform vec2 u_texResolution;
uniform mat3 u_tmat;
uniform float u_angle;
uniform float u_flip;
uniform int u_mode;
uniform int u_fill;

vec2 fill(vec2 s_res, vec2 t_res) {
  float s_rat = s_res.x / s_res.y;
  float t_rat = t_res.x / t_res.y;
  vec2 f_pos = vec2(1, 1);
  if (s_rat < t_rat) {
    f_pos.x = t_rat / s_rat;
  } else {
    f_pos.y = s_rat / t_rat;
  }
  return f_pos;
}

void main() {
  vec2 pos = a_pos;
  vec4 Position;
  if (u_mode != 100) {
    mat2 rotation_mat = mat2(cos(u_angle), -sin(u_angle), sin(u_angle), cos(u_angle));
    pos = pos * vec2(1.0, u_flip);
    if (u_fill == 1) {
      pos *= fill(u_resolution, u_texResolution);
    }
    pos = rotation_mat * pos / (1.0+abs(u_angle)); // Test transformation
    Position = vec4(pos, 0, 1);
    v_texCoord = vec2(a_texCoord.x, a_texCoord.y);
  } else {
    vec3 n_pos = u_tmat * vec3(pos, 1);
    Position = vec4(n_pos.x, -n_pos.y, 0, n_pos.z);
    v_texCoord = vec2(a_texCoord.x, 1.0-a_texCoord.y);
  }
  gl_Position = Position;
}
`;
fs = `
precision mediump float;
precision mediump int;

uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform int u_mode;
uniform float u_kernel9[9];
uniform float u_kernel25[25];
uniform vec3 u_hsv_l;
uniform vec3 u_hsv_u;
varying vec2 v_texCoord;

vec4 conv9(sampler2D tex, vec2 pos, float k[9], vec2 res) {
  vec2 pixelSize = 1.0 / res;
  vec4 sum;
  float w;
  for (int y = 0; y < 3; y++) {
    for (int x = 0; x < 3; x++) {
      vec2 pt = vec2( pos.x + float(x-1)*pixelSize.x, pos.y + float(y-1)*pixelSize.y);
      sum += texture2D(tex, pt) * k[3*y+x];
      w += k[3*y+x];
    }
  }
  sum = vec4(sum.rgb/w, 1.0);
  return sum;
}

vec4 conv25(sampler2D tex, vec2 pos, float k[25], vec2 res) {
  vec2 pixelSize = 1.0 / res;
  vec4 sum;
  float w;
  for (int y = 0; y < 5; y++) {
    for (int x = 0; x < 5; x++) {
      vec2 pt = vec2( pos.x + float(x-2)*pixelSize.x, pos.y + float(y-2)*pixelSize.y);
      sum += texture2D(tex, pt) * k[5*y+x];
      w += k[5*y+x];
    }
  }
  sum = vec4(sum.rgb/w, 1.0);
  return sum;
}

float test(float x, float l, float u) {
  float y = 0.0;
  if (x >= l && x <= u) {
      y = 1.0;
  }
  return y;
}

vec4 clip(vec4 hsv, vec3 hsv_l, vec3 hsv_u) {
  float h = test(hsv.r, hsv_l.r, hsv_u.r);
  float s = test(hsv.g, hsv_l.g, hsv_u.g);
  float v = test(hsv.b, hsv_l.b, hsv_u.b);
  float a = min(h,min(s,v));
  return mix(vec4(h,s,v,1.0), vec4(a,a,a,1.0), 1.0);
}

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec4 erode(sampler2D tex, vec2 pos, vec2 res) {
  vec2 pixelSize = 1.0 / res;
  float fin = 1.0;
  for (int y = 0; y < 3; y++) {
    for (int x = 0; x < 3; x++) {
      vec2 pt = vec2( pos.x + float(x-1)*pixelSize.x, pos.y + float(y-1)*pixelSize.y);
      float test = length(texture2D(tex, pt).rgb);
      fin = min(fin, test);
    }
  }
  vec4 sum = vec4(fin, fin, fin, 1.0);
  return sum;
}

vec4 dilate(sampler2D tex, vec2 pos, vec2 res) {
  vec2 pixelSize = 1.0 / res;
  float fin = 0.0;
  for (int y = 0; y < 3; y++) {
    for (int x = 0; x < 3; x++) {
      vec2 pt = vec2( pos.x + float(x-1)*pixelSize.x, pos.y + float(y-1)*pixelSize.y);
      float test = length(texture2D(tex, pt).rgb);
      fin = max(fin, test);
    }
  }
  vec4 sum = vec4(fin, fin, fin, 1.0);
  return sum;
}

void main() {
  vec4 color;
  if (u_mode == 0) {
    color = vec4(texture2D(u_tex, v_texCoord).rgb, 1.0);
  } else if (u_mode == 1) {
    color = conv9(u_tex, v_texCoord, u_kernel9, u_resolution);
  } else if (u_mode == 2) {
    color = conv25(u_tex, v_texCoord, u_kernel25, u_resolution);
  } else if (u_mode == 3) {
    color = vec4(rgb2hsv(texture2D(u_tex, v_texCoord).rgb), 1.0);
  } else if (u_mode == 4) {
    color = clip(texture2D(u_tex, v_texCoord), u_hsv_l, u_hsv_u);
  } else if (u_mode == 5) {
    color = erode(u_tex, v_texCoord, u_resolution);
  } else if (u_mode == 6) {
    color = dilate(u_tex, v_texCoord, u_resolution);
  } else if (u_mode == 100) {
    color = texture2D(u_tex, vec2(v_texCoord.x, 1.0-v_texCoord.y));
    float a = (1.0-color.r) - (1.0-color.a);
    color = vec4(0,0,0,a);
  }
  gl_FragColor = color;
}
`;

test_points = [];
var o_pins = [
	[-0.4325842696629213, 0.85451197053407, -0.5917602996254682, -0.85451197053407, 0.19475655430711614, -0.6887661141804788, 0.42883895131086147, 0.85451197053407],
  [-0.8689138576779026, 0.5985267034990791, -0.9531835205992509, -0.5985267034990792, 0.7940074906367041, -0.429097605893186, 0.7134831460674158, 0.4290976058931859],
  [-0.5617977528089888, 0.5414364640883975, -0.8183520599250936, -0.7016574585635359, 0.8183520599250933, -0.5267034990791897, 0.7284644194756553, 0.3683241252302025],
  [0.24531835205992492, 0.9465930018416207, -0.7340823970037453, -0.9465930018416207, 0.24344569288389506, -0.06261510128913439, 0.7340823970037453, 0.9465930018416207],
]

var params = {
  min_screen: 720,
  max_size: 1024,

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

var isSettings = false;
var settingsElm = document.getElementById("controls");
var fpsElm = document.getElementById("fps");
var insizeElm = document.getElementById("insize");
var rensizeElm = document.getElementById("rensize");
var psizeElm = document.getElementById("psize");
var blobsElm = document.getElementById("blobs");

function toggle_settings() {
  isSettings = !isSettings;
  if (isSettings) {
    settingsElm.style.visibility = "visible";
  } else {
    settingsElm.style.visibility = "hidden";
  }
}

var sliders = document.getElementsByClassName("slider");
var slidertexts = document.getElementsByClassName("sliderspan");
function update_sliders() {
  for (var i = 0; i < sliders.length; i++) {
    sliders[i].value = params[sliders[i].id];
    slidertexts[i].innerHTML = sliders[i].value;
  }
}
update_sliders();
function slider_change(event) {
  var me = event.target;
  document.getElementById("t"+me.id).innerHTML = me.value;
  params[me.id] = me.value;
}

var videoIsLoaded = false;

var video = document.querySelector("#video");
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
					video = new Image;
          video.src = "data/3.png";
          video.onload = ()=>{videoIsLoaded=true;};
			});
}

cv['onRuntimeInitialized'] = () => {
  main();
}

function main() {
  var canvas = document.querySelector("#canvas");
  var cv_canvas = document.querySelector("#cv");
  var ctx = cv_canvas.getContext("2d");
  var gl = canvas.getContext("webgl");
  // var gl = canvas.getContext("webgl", {
  //   premultipliedAlpha: false  // Ask for non-premultiplied alpha
  // });
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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


  var screen_size = {w: canvas.clientWidth, h: canvas.clientHeight};
  var screen_size_ratio = Math.max( Math.max(screen_size.w, screen_size.h), params.min_screen ) / Math.max(screen_size.w, screen_size.h);
  screen_size.w = Math.round(screen_size.w*screen_size_ratio);
  screen_size.h = Math.round(screen_size.h*screen_size_ratio);
  canvas.width = screen_size.w;
  canvas.height = screen_size.h;
  cv_canvas.width = screen_size.w;
  cv_canvas.height = screen_size.h;
  var mask_ratio = Math.min(params.max_size, Math.max(screen_size.w, screen_size.h)) / Math.max(screen_size.w, screen_size.h);
  var mask_size = {w: Math.round(screen_size.w * mask_ratio), h: Math.round(screen_size.h * mask_ratio)};

  var posterTex1 = twgl.createTexture(gl, {width: 10, height: 10});
  var posterTex2 = twgl.createTexture(gl, {width: 10, height: 10});
  var posterTex3 = twgl.createTexture(gl, {width: 10, height: 10});
  var posterTex4 = twgl.createTexture(gl, {width: 10, height: 10});

  posterTextures = [posterTex1, posterTex2, posterTex3, posterTex4];

  var posterImg1 = new Image();
  posterImg1.src = "data/1.1.png";
  posterImg1.onload = () => { twgl.setTextureFromElement(gl, posterTex1, posterImg1, {minMag:gl.LINEAR}); };
  var posterImg2 = new Image();
  posterImg2.src = "data/2.1.png";
  posterImg2.onload = () => { twgl.setTextureFromElement(gl, posterTex2, posterImg2, {minMag:gl.LINEAR}); };
  var posterImg3 = new Image();
  posterImg3.src = "data/3.1.png";
  posterImg3.onload = () => { twgl.setTextureFromElement(gl, posterTex3, posterImg3, {minMag:gl.LINEAR}); };
  var posterImg4 = new Image();
  posterImg4.src = "data/4.1.png";
  posterImg4.onload = () => { twgl.setTextureFromElement(gl, posterTex4, posterImg4, {minMag:gl.LINEAR}); };

  var texture = twgl.createTexture(gl, {width: screen_size.w, height: screen_size.h});
  var texture2 = twgl.createTexture(gl, {width: mask_size.w, height: mask_size.h});
  var texture3 = twgl.createTexture(gl, {width: mask_size.w, height: mask_size.h});

  var fbi2 = twgl.createFramebufferInfo(gl, [{attachment:texture2}],  mask_size.w,  mask_size.h);
  var fbi3 = twgl.createFramebufferInfo(gl, [{attachment:texture3}],  mask_size.w,  mask_size.h);

  var kernel25 = [
                    0.003765,0.015019,0.023792,0.015019,0.003765,
                    0.015019,0.059912,0.094907,0.059912,0.015019,
                    0.023792,0.094907,0.150342,0.094907,0.023792,
                    0.015019,0.059912,0.094907,0.059912,0.015019,
                    0.003765,0.015019,0.023792,0.015019,0.003765
                 ];

  var textures = [texture2, texture3];
  var fbis = [fbi2, fbi3];
  var fboIndex = 0;

  var lastTime = new Date();

  function applyFilter(n) {
    fboIndex_next = (fboIndex+1)%2;
    twgl.bindFramebufferInfo(gl, fbis[fboIndex_next]);
    twgl.setUniforms(programInfo, { u_tex: textures[fboIndex], u_mode: n, u_flip: 1});
    twgl.drawBufferInfo(gl, bufferInfo);
    fboIndex = fboIndex_next;
  }

  function drawCurrent() {
    twgl.bindFramebufferInfo(gl);
    twgl.setUniforms(programInfo, { u_tex: textures[fboIndex], u_flip: -1, u_mode: 0 });
    twgl.drawBufferInfo(gl, bufferInfo);
    twgl.setUniforms(programInfo, { u_flip: 1 });
  }

  function drawPoster(matrix, poster) {
    twgl.bindFramebufferInfo(gl);
    twgl.setUniforms(programInfo, { u_tex: poster, u_flip: 1, u_mode: 100, u_tmat: matrix});
    twgl.drawBufferInfo(gl, bufferInfo);
  }

  function grabPixels() {
    var pixels = new Uint8Array(mask_size.w * mask_size.h * 4);
    gl.readPixels(0, 0, mask_size.w, mask_size.h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    return pixels;
  }


  function drawBlobs(blobs, color) {
    for (var i = 0; i < blobs.length; i++) {
      ctx.strokeStyle = "black";
      ctx.strokeRect(blobs[i].x*screen_size.w-blobs[i].w/2*screen_size.w-1, blobs[i].y*screen_size.h-blobs[i].h/2*screen_size.h-1, blobs[i].w*screen_size.w+2, blobs[i].h*screen_size.h+2);
      ctx.strokeStyle = color;
      ctx.strokeRect(blobs[i].x*screen_size.w-blobs[i].w/2*screen_size.w, blobs[i].y*screen_size.h-blobs[i].h/2*screen_size.h, blobs[i].w*screen_size.w, blobs[i].h*screen_size.h);
      ctx.strokeStyle = "black";
      ctx.strokeRect(blobs[i].x*screen_size.w-blobs[i].w/2*screen_size.w+1, blobs[i].y*screen_size.h-blobs[i].h/2*screen_size.h+1, blobs[i].w*screen_size.w-2, blobs[i].h*screen_size.h-2);
    }
  }
  function fillBlobs(blobs, color) {
    for (var i = 0; i < blobs.length; i++) {
      ctx.fillStyle = color;
      ctx.fillRect(blobs[i].x*screen_size.w-blobs[i].w/2*screen_size.w, blobs[i].y*screen_size.h-blobs[i].h/2*screen_size.h, blobs[i].w*screen_size.w, blobs[i].h*screen_size.h);
    }
  }

  var time = 0;


  function draw() {
    if (isSettings) {
      var newTime = new Date();
      var fps = Math.round(10000 / (newTime - lastTime))/10;
      fpsElm.innerHTML = fps;
      lastTime = newTime;

      insizeElm.innerHTML = video.videoWidth+" "+video.videoHeight;
      rensizeElm.innerHTML = screen_size.w + " " + screen_size.h;
      psizeElm.innerHTML = mask_size.w + " " + mask_size.h;
    }
    var blobParams = {
      thresholdStep: 1000,
      minThreshold: 200,
      maxThreshold: 256,

      filterByColor: true,
      blobColor: 255,

      filterByArea: true,
      minArea: params["mina"],
      maxArea: params["maxa"],

      filterByCircularity: false,


      filterByInertia: false,


      filterByConvexity: false,


      faster: true
    };
    fboIndex = 0;
    twgl.setUniforms(programInfo, {
      u_resolution: [canvas.clientWidth, canvas.clientHeight],
      u_flip: 1,
      u_kernel25: kernel25,
      u_hsv_l: [params.hl, params.sl, params.vl],
      u_hsv_u: [params.hu, params.su, params.vu]
    });

    if (videoIsLoaded) {
      if (video.videoWidth) {
        twgl.setTextureFromElement(gl, texture, video, {level:0});
        twgl.setUniforms(programInfo, {
          u_texResolution: [video.videoWidth, video.videoHeight],
          u_fill:1,
          // r: Math.sin(time*2)/3

        });
      }
    }

    twgl.bindFramebufferInfo(gl, fbi2);
    twgl.setUniforms(programInfo, { u_tex: texture, u_mode: 0});
    twgl.drawBufferInfo(gl, bufferInfo);


    twgl.setUniforms(programInfo, {
      u_texResolution: [mask_size.w, mask_size.h],
      u_resolution: [mask_size.w, mask_size.h],
      u_angle:0,
      u_fill:0
    });

    if (params.d == 0) drawCurrent();
    // BLUR
    for (var i = 0; i < params.b; i++) {
      applyFilter(2);
    }
    if (params.d == 1) drawCurrent();

    // HSV
    applyFilter(3);
    if (params.d == 2) drawCurrent();

    // TRESHOLD
    applyFilter(4);
    if (params.d == 3) drawCurrent();

    // ERODE & DILATE
    for (var i = 0; i < params.e; i++) {
      applyFilter(5);
      applyFilter(6);
    }
    var pixels = grabPixels();
    if (params.d == 4) drawCurrent();



    var src = cv.matFromArray(mask_size.h, mask_size.w, cv.CV_8UC4, pixels);
    var gray = new cv.Mat(src.rows, src.cols, cv.CV_8UC1);
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    var blobs = findBlobs(gray, blobParams);
    for (var i = 0; i < blobs.length; i++) {
      blobs[i].x /= mask_size.w;
      blobs[i].y /= mask_size.h;
      blobs[i].w /= mask_size.w;
      blobs[i].h /= mask_size.h;
    }
    if (isSettings) {
      blobsElm.innerHTML = blobs.length;
    }

    ctx.clearRect(0,0, cv_canvas.width, cv_canvas.height);
    // cv.imshow("cv", gray);
    src.delete()
    gray.delete()
    if (isSettings) drawBlobs(blobs,"yellow");
    var posterINDEX = posterId(blobs)
    if (posterINDEX > 0 && !isSettings) {
      // console.log(posterINDEX);
      // var [nb,v] = normblobs(blobs);
      // fillBlobs(nb,"red");
      corners = detectCorners(blobs, posterINDEX);
      // fillBlobs(corners,"blue");
      var origin = o_pins[posterINDEX-1];
      var trans = [ corners[1-1].x, corners[1-1].y,corners[2-1].x, corners[2-1].y, corners[3-1].x, corners[3-1].y, corners[4-1].x, corners[4-1].y];
      for (var i = 0; i < trans.length; i++) {
        trans[i] = trans[i]*2-1;
      }
      test_points = trans;
      var mat1 = cv.matFromArray(4, 2, cv.CV_32F, origin);
      var mat2 = cv.matFromArray(4, 2, cv.CV_32F, trans);
    	var tmat = cv.getPerspectiveTransform(mat1, mat2);
    	cv.transpose(tmat, tmat);
    	var tmat_arr = new Float32Array(tmat.data64F);
    	mat1.delete()
    	mat2.delete();
    	tmat.delete();
      drawPoster(tmat_arr, posterTextures[posterINDEX-1]);
    }
    time += 1/60;
    requestAnimationFrame(draw);
  }
  hide_loading();
  draw();

};

function detectCorners(blobs, pId) {
  var [nb, nvals] = normblobs(blobs);
  var corners = [];
  if (pId == 2) {
    // LL
    var ll = Array.from(nb);
    ll.sort((a,b)=>{return dist({x:-1,y:2},a)-dist({x:-1,y:2},b);});
    ll = ll.slice(0,1);
    corners.push(...ll);
    // LU
    var lu = Array.from(nb);
    lu.sort((a,b)=>{return dist({x:-1,y:-1},a)-dist({x:-1,y:-1},b);});
    lu = lu.slice(0,1);
    corners.push(...lu);
    // RU
    var ru = Array.from(nb);
    ru.sort((a,b)=>{return dist({x:2.5,y:-1},a)-dist({x:2.5,y:-1},b);});
    ru = ru.slice(0,2);
    ru.sort((a,b)=>{return a.y-b.y;});
    ru = ru.slice(0,1);
    corners.push(...ru);
    // LU
    var rl = Array.from(nb);
    rl.sort((a,b)=>{return dist({x:2.5,y:2.5},a)-dist({x:2.5,y:2.5},b);});
    rl = rl.slice(0,1);
    corners.push(...rl);
  }
  if (pId == 3) {
    // LL
    var ll = Array.from(nb);
    ll.sort((a,b)=>{return dist({x:-1,y:2},a)-dist({x:-1,y:2},b);});
    ll = ll.slice(0,1);
    corners.push(...ll);
    // LU
    var lu = Array.from(nb);
    lu.sort((a,b)=>{return dist({x:-1,y:-1},a)-dist({x:-1,y:-1},b);});
    lu = lu.slice(0,1);
    corners.push(...lu);
    // RU
    var ru = Array.from(nb);
    ru.sort((a,b)=>{return dist({x:2.5,y:-1},a)-dist({x:2.5,y:-1},b);});
    // ru = ru.slice(0,2);
    // ru.sort((a,b)=>{return a.y-b.y;});
    ru = ru.slice(0,1);
    corners.push(...ru);
    // LU
    var rl = Array.from(nb);
    rl.sort((a,b)=>{return dist({x:2.5,y:2.5},a)-dist({x:2.5,y:2.5},b);});
    rl = rl.slice(0,1);
    corners.push(...rl);
  }
  if (pId == 4) {
    // LL
    var ll = Array.from(nb);
    ll.sort((a,b)=>{return dist({x:0,y:2},a)-dist({x:0,y:2},b);});
    ll = ll.slice(0,1);
    corners.push(...ll);
    // LU
    var lu = Array.from(nb);
    lu.sort((a,b)=>{return dist({x:-1,y:-1},a)-dist({x:-1,y:-1},b);});
    lu = lu.slice(0,1);
    corners.push(...lu);
    // RU
    var ru = Array.from(nb);
    ru.sort((a,b)=>{return dist({x:1,y:0},a)-dist({x:1,y:0},b);});
    // ru = ru.slice(0,2);
    // ru.sort((a,b)=>{return a.y-b.y;});
    ru = ru.slice(0,1);
    corners.push(...ru);
    // LU
    var rl = Array.from(nb);
    rl.sort((a,b)=>{return dist({x:2.5,y:2.5},a)-dist({x:2.5,y:2.5},b);});
    rl = rl.slice(0,1);
    corners.push(...rl);
  }
  if (pId == 1) {
    // LL
    var ll = Array.from(nb);
    ll.sort((a,b)=>{return dist({x:0,y:2},a)-dist({x:0,y:2},b);});
    ll = ll.slice(0,2);
    ll.sort((a,b)=>{return a.x-b.x;});
    ll = ll.slice(0,1);
    corners.push(...ll);
    // LU
    var lu = Array.from(nb);
    lu.sort((a,b)=>{return dist({x:-1,y:-1},a)-dist({x:-1,y:-1},b);});
    lu = lu.slice(0,2);
    lu.sort((a,b)=>{return a.y-b.y;});
    lu = lu.slice(0,1);
    corners.push(...lu);
    // RU
    var ru = Array.from(nb);
    ru = ru.filter((a)=>{return a.x > 0.4})
    ru.sort((a,b)=>{return a.y-b.y;});
    ru = ru.slice(0,1);
    corners.push(...ru);
    // LU
    var rl = Array.from(nb);
    rl = rl.filter((a)=>{return a.x > 0.6})
    if (rl.length > 0) {
      rl.sort((a,b)=>{return b.y-a.y;});
      rl = rl.slice(0,2);
      rl.sort((a,b)=>{return a.x-b.x;});
      if (rl.length > 1) {
        if (dist(rl[0],rl[1]) > 0.2 && rl.length > 1) {
          rl = [rl[1]];
        } else {
          rl = [rl[0]];
        }
      } else {
        rl = [rl[0]];
      }
      corners.push(...rl);
    } else {
      corners.push([{x:1, y:1, w:1, h:1}]);
    }
  }
  return denormblobs(corners,nvals);
  return corners;
}


function normblobs(blobs) {
  var nb = [];
  var maxx = 0;
  var maxy = 0;
  var minx = 10000;
  var miny = 10000;
  for (var i = 0; i < blobs.length; i++) {
    maxx = Math.max(maxx,blobs[i].x);
    maxy = Math.max(maxy,blobs[i].y);
    minx = Math.min(minx,blobs[i].x);
    miny = Math.min(miny,blobs[i].y);
  }
  for (var i = 0; i < blobs.length; i++) {
    nb.push({
      x:(blobs[i].x-minx)/(maxx-minx),
      y:(blobs[i].y-miny)/(maxy-miny),
      w:blobs[i].w,
      h:blobs[i].h
    })
  }
  return [nb, [maxx,maxy,minx,miny]];
}

function denormblobs(blobs, nvals) {
  var [maxx, maxy, minx, miny] = nvals;
  var n = [];
  for (var i = 0; i < blobs.length; i++) {
    n.push({
      x:blobs[i].x*(maxx-minx)+minx,
      y:blobs[i].y*(maxy-miny)+miny,
      w:blobs[i].w,
      h:blobs[i].h
    })
  }
  return n;
}

function posterId(blobs) {
  var postern = 0;
  if (blobs.length < 3) {
    postern = 0;
  } else if (blobs.length < 10) {
		postern = 4;
	} else if (blobs.length < 24) {
		postern = 3;
	} else if (blobs.length < 35) {
		postern = 2;
	} else if (blobs.length > 3) {
		postern = 1;
	}
  return postern;
}

function sortBlobs(ref, blobs) {
  var sorted = [];
  var values = [];
  for (var i = 0; i < blobs.length; i++) {

  }

}

function dist(v1, v2) {
  var dx = Math.abs(v1.x - v2.x);
  var dy = Math.abs(v1.y - v2.y);
  return Math.sqrt(dx*dx+dy*dy);
}

function hide_loading() {
  document.querySelector("#loadscreen").style.visibility = "hidden";
}
