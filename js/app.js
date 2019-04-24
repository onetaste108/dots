// NOTES
// cv.mat ---

// PARAMETERS -----------------------------------------------------------------

var params = {
  mask_max: 512,
  render_max: 1024,
  hl: 0.1,
  hu: 0.25,
  sl: 0.3, //0.4
  su: 1,
  vl: 0.6, //0.5
  vu: 1,
  b: 2,
  d: 0,
  mina: 10,
  maxa: 10000,
  draw_poster: true,
  show_detecton: true,
  show_corners: true,
  show_mask: false,
  testing: false,
  test_rotation: false,
  test_matrix: true,
};

// ----------------------------------------------------------------------------

// GLOBALS --------------------------------------------------------------------

var test_points = [];
var lastTime = new Date();
var time = 0;

// ----------------------------------------------------------------------------

// LOADING --------------------------------------------------------------------

var ready_cv = false;
function on_ready_cv() {
  ready_cv = true;
}
cv['onRuntimeInitialized'] = () => {on_ready_cv();};



var waitingId;
function wait() {
  var ready = false;
  if (ready_cv) ready = true;
  if (ready) {
    clearInterval(waitingId);
    hide_loading();
    requestAnimationFrame(draw);
  }
}

// SETUP VIDEO ----------------------------------------------------------------
var video;
if (!params.testing) {
  video = document.querySelector("#video");
  init_video(video);
} else {
  video = new Image();
  video.src = "data/5.png"
};

// ----------------------------------------------------------------------------

// SETUP GL -------------------------------------------------------------------

var canvas = document.querySelector("#canvas");
var [gl, programInfo, bufferInfo] = setup_gl(canvas);
var canvas2d = document.querySelector("#canvas2d");
var ctx = canvas2d.getContext("2d");
canvas2d.onclick = ()=>{params.show_mask = !params.show_mask;};

// ----------------------------------------------------------------------------

// SETUP SCREEN SIZE ----------------------------------------------------------

var render_size, mask_size;
function update_render_size() {
  var screen_size = {w: canvas.clientWidth, h: canvas.clientHeight};
  var render_ratio = params.render_max / Math.max(screen_size.w, screen_size.h);
  render_size = {w: Math.round(screen_size.w * render_ratio), h: Math.round(screen_size.h * render_ratio)};
  canvas.width = render_size.w;
  canvas.height = render_size.h;
  canvas2d.width = render_size.w;
  canvas2d.height = render_size.h;
  var mask_ratio = params.mask_max / Math.max(screen_size.w, screen_size.h);
  mask_size = {w: Math.round(screen_size.w * mask_ratio), h: Math.round(screen_size.h * mask_ratio)};
}
update_render_size();

// ----------------------------------------------------------------------------

// LOAD POSTERS ---------------------------------------------------------------

var [posterTextures, posterImages] = load_posters(gl, poster_data);

// ----------------------------------------------------------------------------

// CREATE TEXTURES ------------------------------------------------------------
var [tex_main, tex_filter, fbo_filter] = create_textures(gl, mask_size, render_size);
var fboId;

// ----------------------------------------------------------------------------

// DRAWING FUNCTIONS ----------------------------------------------------------

function capture() {
  var video_size;
  var u_angle = 0;
  if (!params.testing) {
    video_size = get_video_size(video);
  } else {
    video_size = render_size;
    if (params.test_rotation) u_angle = Math.sin(time*2)/3;
  }
  twgl.setTextureFromElement(gl, tex_main, video, {level:0, minMag: gl.LINEAR});
  twgl.bindFramebufferInfo(gl);
  twgl.setUniforms(programInfo, {
    u_hsv_l: [params.hl, params.sl, params.vl],
    u_hsv_u: [params.hu, params.su, params.vu],
    u_resolution: [render_size.w, render_size.h],
    u_texResolution: [video_size.w, video_size.h],
    u_fill: 1,
    u_tex: tex_main,
    u_flip: -1,
    u_mode: NORMAL,
    u_angle: u_angle
  });
  twgl.drawBufferInfo(gl, bufferInfo);

  twgl.bindFramebufferInfo(gl, fbo_filter[0]);
  twgl.setUniforms(programInfo, {
    u_resolution: [mask_size.w, mask_size.h],
    u_flip: 1,
    u_angle: u_angle*-1
  });
  twgl.drawBufferInfo(gl, bufferInfo);
  twgl.setUniforms(programInfo, {
    u_fill: 0,
    u_angle: 0
  });
}

function applyFilter(n) {
  var fboId_next = (fboId+1)%2;
  twgl.bindFramebufferInfo(gl, fbo_filter[fboId_next]);
  twgl.setUniforms(programInfo, { u_tex: tex_filter[fboId], u_mode: n});
  twgl.drawBufferInfo(gl, bufferInfo);
  fboId = fboId_next;
}

function drawCurrent() {
  twgl.bindFramebufferInfo(gl);
  twgl.setUniforms(programInfo, { u_tex: tex_filter[fboId], u_mode: NORMAL, u_flip: -1});
  twgl.drawBufferInfo(gl, bufferInfo);
  twgl.setUniforms(programInfo, { u_flip: 1 });
}

function drawPoster(matrix, tex) {
  twgl.bindFramebufferInfo(gl);
  twgl.setUniforms(programInfo, { u_tex: tex, u_mode: PROJECT, u_tmat: matrix});
  twgl.drawBufferInfo(gl, bufferInfo);
}

var pixels = new Uint8Array(mask_size.w * mask_size.h * 4);
function grabPixels() {
  gl.readPixels(0, 0, mask_size.w, mask_size.h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
}

// ----------------------------------------------------------------------------

///////////////////////////////////////////////////////////////////////////////
// DRAW LOOP ------------------------------------------------------------------
///////////////////////////////////////////////////////////////////////////////

function draw() {
  fboId = 0;

  // CAPTURE VIDEO ------------------------------------------------------------

  capture();

  // --------------------------------------------------------------------------

  // PROCESS ------------------------------------------------------------------

  for (var i = 0; i < params.b; i++) { applyFilter(BLUR); }
  applyFilter(HSV_CLIP);
  // drawCurrent();

  // --------------------------------------------------------------------------

  // GET BLOBS ----------------------------------------------------------------

  // grabPixels();
  // if (params.show_mask) drawCurrent();
  // var blobs =  get_blobs(pixels, mask_size, params);
  // var pId = get_poster_id(blobs);
  //
  // ctx.clearRect(0, 0, render_size.w, render_size.h);
  // if (params.show_detecton) strokeBlobs(ctx, blobs, render_size, "red");

  // --------------------------------------------------------------------------
  //
  // // GET MATRIX ---------------------------------------------------------------
  //
  // if (pId >= 0) {
  //   var corners = detectCorners(blobs, pId);
  //   t_corners = corners;
  //   if (params.show_corners) fillBlobs(ctx, corners, render_size, "red");
  //   if (params.draw_poster) {
  //     console.log()
  //     var matrix = get_matrix(corners, poster_data, pId);
  //
  //   // DRAW POSTER ------------------------------------------------------------
  //
  //     drawPoster(matrix, posterTextures[pId]);
  //   }
  // }

  // --------------------------------------------------------------------------
  time += 1/60;
  requestAnimationFrame(draw);
}


///////////////////////////////////////////////////////////////////////////////
// RUN! -----------------------------------------------------------------------
///////////////////////////////////////////////////////////////////////////////


waitingId = setInterval(wait, 1000/60);
