vs = `
precision mediump float;
attribute vec2 a_pos;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
uniform vec2 u_resolution;
uniform vec2 u_texResolution;
uniform float flip;
void main() {
  float screen = u_resolution.x / u_resolution.y;
  float tex = u_texResolution.x / u_texResolution.y;
  vec2 pos = a_pos;
  gl_Position = vec4(pos * vec2(1.0, flip), 0, 1);
  v_texCoord = vec2(a_texCoord.x, a_texCoord.y);
}
`;
fs = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform int mode;
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
  if (x > l && x < u) {
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
  if (mode == 0) {
    color = texture2D(u_tex, v_texCoord);
  } else if (mode == 1) {
    color = conv9(u_tex, v_texCoord, u_kernel9, u_resolution);
  } else if (mode == 2) {
    color = conv25(u_tex, v_texCoord, u_kernel25, u_resolution);
  } else if (mode == 3) {
    color = vec4(rgb2hsv(texture2D(u_tex, v_texCoord).rgb), 1.0);
  } else if (mode == 4) {
    color = clip(texture2D(u_tex, v_texCoord), u_hsv_l, u_hsv_u);
  } else if (mode == 5) {
    color = erode(u_tex, v_texCoord, u_resolution);
  } else if (mode == 6) {
    color = dilate(u_tex, v_texCoord, u_resolution);
  }
  gl_FragColor = color;
}
`;

var params = {
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
		}).catch(function(error) {
					video = new Image;
          video.src = "data/test1.jpg";
			});
}

cv['onRuntimeInitialized'] = () => {
  var canvas = document.querySelector("#canvas");
  var cv_canvas = document.querySelector("#cv");
  var ctx = cv_canvas.getContext("2d");
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

  img = new Image();
  img.src = "data/test1.jpg";

  var screen_size = {w: canvas.clientWidth, h: canvas.clientHeight};
  canvas.width = screen_size.w;
  canvas.height = screen_size.h;
  cv_canvas.width = screen_size.w;
  cv_canvas.height = screen_size.h;
  var mask_ratio = params.max_size / Math.max(screen_size.w, screen_size.h);
  var mask_size = {w: Math.round(screen_size.w * mask_ratio), h: Math.round(screen_size.h * mask_ratio)};

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
    twgl.setUniforms(programInfo, { u_tex: textures[fboIndex], mode: n});
    twgl.drawBufferInfo(gl, bufferInfo);
    fboIndex = fboIndex_next;
  }

  function drawCurrent() {
    twgl.bindFramebufferInfo(gl);
    twgl.setUniforms(programInfo, { u_tex: textures[fboIndex], flip: -1, mode: 0 });
    twgl.drawBufferInfo(gl, bufferInfo);
    twgl.setUniforms(programInfo, { flip: 1 });
  }

  function grabPixels() {
    var pixels = new Uint8Array(mask_size.w * mask_size.h * 4);
    gl.readPixels(0, 0, mask_size.w, mask_size.h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    return pixels;
  }

  function drawBlobs(blobs) {
    for (var i = 0; i < blobs.length; i++) {
      ctx.strokeStyle = "black";
      ctx.strokeRect(blobs[i].x*screen_size.w-blobs[i].w/2*screen_size.w-1, blobs[i].y*screen_size.h-blobs[i].h/2*screen_size.h-1, blobs[i].w*screen_size.w+2, blobs[i].h*screen_size.h+2);
      ctx.strokeStyle = "yellow";
      ctx.strokeRect(blobs[i].x*screen_size.w-blobs[i].w/2*screen_size.w, blobs[i].y*screen_size.h-blobs[i].h/2*screen_size.h, blobs[i].w*screen_size.w, blobs[i].h*screen_size.h);
      ctx.strokeStyle = "black";
      ctx.strokeRect(blobs[i].x*screen_size.w-blobs[i].w/2*screen_size.w+1, blobs[i].y*screen_size.h-blobs[i].h/2*screen_size.h+1, blobs[i].w*screen_size.w-2, blobs[i].h*screen_size.h-2);
    }
  }


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
      u_resolution: [screen_size.w, screen_size.h],
      flip: 1,
      u_kernel25: kernel25,
      u_hsv_l: [params.hl, params.sl, params.vl],
      u_hsv_u: [params.hu, params.su, params.vu]
    });

    twgl.setTextureFromElement(gl, texture, video, {level:0});

    twgl.setUniforms(programInfo, {
      u_texResolution: [video.videoWidth, video.videoHeight]
    });

    twgl.bindFramebufferInfo(gl, fbi2);
    twgl.setUniforms(programInfo, { u_tex: texture, mode: 0});
    twgl.drawBufferInfo(gl, bufferInfo);


    twgl.setUniforms(programInfo, {
      u_texResolution: [mask_size.w, mask_size.h]
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
    drawBlobs(blobs);

    src.delete()
    gray.delete()

    requestAnimationFrame(draw);
  }
  hide_loading();
  draw();

};

function hide_loading() {
  document.querySelector("#loadscreen").style.visibility = "hidden";
}
