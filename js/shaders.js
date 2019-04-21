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

#define PROJECT 100

void main() {
  vec2 pos = a_pos;
  vec4 Position;
  if (u_mode != PROJECT) {
    pos = pos * vec2(1.0, u_flip);
    if (u_fill == 1) {
      pos *= fill(u_resolution, u_texResolution);
    }
    if (u_angle != 0.0) {
      mat2 rotation_mat = mat2(cos(u_angle), -sin(u_angle), sin(u_angle), cos(u_angle));
      pos = rotation_mat * pos / (1.0+abs(u_angle)); // Test transformation
    }
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
uniform vec3 u_hsv_l;
uniform vec3 u_hsv_u;
uniform float blurk[25];
varying vec2 v_texCoord;

vec4 blur(sampler2D tex, vec2 pos, float k[25], vec2 res) {
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

#define NORMAL 0
#define BLUR 1
#define RGB2HSV 2
#define CLIP 3
#define ERODE 4
#define DILATE 5
#define HSV_CLIP 6
#define PROJECT 100

void main() {
  vec4 color;
  if (u_mode == NORMAL) {
    color = vec4(texture2D(u_tex, v_texCoord).rgb, 1.0);
  } else if (u_mode == BLUR) {
    color = blur(u_tex, v_texCoord, blurk, u_resolution);
  } else if (u_mode == RGB2HSV) {
    color = vec4(rgb2hsv(texture2D(u_tex, v_texCoord).rgb), 1.0);
  } else if (u_mode == CLIP) {
    color = clip(texture2D(u_tex, v_texCoord), u_hsv_l, u_hsv_u);
  } else if (u_mode == HSV_CLIP) {
    color = vec4(rgb2hsv(texture2D(u_tex, v_texCoord).rgb), 1.0);
    color = clip(color, u_hsv_l, u_hsv_u);
  } else if (u_mode == ERODE) {
    color = erode(u_tex, v_texCoord, u_resolution);
  } else if (u_mode == DILATE) {
    color = dilate(u_tex, v_texCoord, u_resolution);
  } else if (u_mode == PROJECT) {
    color = texture2D(u_tex, vec2(v_texCoord.x, 1.0-v_texCoord.y));
    float a = (1.0-color.r) - (1.0-color.a);
    color = vec4(0,0,0,a);
  }
  gl_FragColor = color;
}
`;
var NORMAL = 0;
var BLUR = 1;
var RGB2HSV = 2;
var CLIP = 3;
var ERODE = 4;
var DILATE = 5;
var HSV_CLIP = 6;
var PROJECT = 100;

var blurk = [
                  0.003765,0.015019,0.023792,0.015019,0.003765,
                  0.015019,0.059912,0.094907,0.059912,0.015019,
                  0.023792,0.094907,0.150342,0.094907,0.023792,
                  0.015019,0.059912,0.094907,0.059912,0.015019,
                  0.003765,0.015019,0.023792,0.015019,0.003765
               ];
