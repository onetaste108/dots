function get_blobs(pixels, mask_size, par) {
  var blobParams = {
    thresholdStep: 1000,
    minThreshold: 200,
    maxThreshold: 256,
    filterByColor: true,
    blobColor: 255,
    filterByArea: true,
    minArea: par["mina"],
    maxArea: par["maxa"],
    filterByCircularity: false,
    faster: true
  };

  var src = cv.matFromArray(mask_size.h, mask_size.w, cv.CV_8UC4, pixels);
  var gray = new cv.Mat(src.rows, src.cols, cv.CV_8UC1);
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  var blobs = findBlobs(gray, blobParams);
  src.delete();
  gray.delete();

  for (var i = 0; i < blobs.length; i++) {
    blobs[i].x /= mask_size.w;
    blobs[i].y /= mask_size.h;
    blobs[i].w /= mask_size.w;
    blobs[i].h /= mask_size.h;
  }

  return blobs;
}

function get_matrix(corners, pd, pId) {
  var origin = pd[pId].corners;
  var points = [corners[0].x, corners[0].y, corners[1].x, corners[1].y, corners[2].x, corners[2].y, corners[3].x, corners[3].y];
  for (var i = 0; i < points.length; i++) {
    points[i] = points[i]*2-1;
  }
  t_points = points;
  var mat1 = cv.matFromArray(4, 2, cv.CV_32F, origin);
  var mat2 = cv.matFromArray(4, 2, cv.CV_32F, points);
  var tmat = cv.getPerspectiveTransform(mat1, mat2);
  cv.transpose(tmat, tmat);
  var matrix = new Float32Array(tmat.data64F);
  mat1.delete()
  mat2.delete();
  tmat.delete();
  return matrix;
}

function detectCorners(blobs, pId) {
  var [nb, nvals] = normblobs(blobs);
  var corners = [];
  if (pId == 0) {
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
  if (pId == 1) {
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
    ll.sort((a,b)=>{return dist({x:0,y:2},a)-dist({x:0,y:2},b);});
    ll = ll.slice(0,1);
    corners.push(...ll);
    // LU
    var lu = Array.from(nb);
    lu = lu.filter((a)=>{return a.y > 0.3});
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
  if (pId == 4) {
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
    ru.sort((a,b)=>{return dist({x:2,y:-1},a)-dist({x:2,y:-1},b);});
    ru = ru.slice(0,1);
    corners.push(...ru);
    // LU
    var rl = Array.from(nb);
    rl.sort((a,b)=>{return dist({x:2.5,y:2.5},a)-dist({x:2.5,y:2.5},b);});
    rl = rl.slice(0,2);
    rl.sort((a,b)=>{return b.y-a.y;});
    rl = rl.slice(0,1);
    corners.push(...rl);
  }
  if (pId == 5) {
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
    lu = lu.slice(0,1);
    corners.push(...lu);
    // RU
    var ru = Array.from(nb);
    ru.sort((a,b)=>{return dist({x:2.5,y:-1},a)-dist({x:2.5,y:-1},b);});
    ru = ru.slice(0,1);
    corners.push(...ru);
    // LU
    var rl = Array.from(nb);
    rl.sort((a,b)=>{return dist({x:2.5,y:2.5},a)-dist({x:2.5,y:2.5},b);});
    rl = rl.slice(0,1);
    corners.push(...rl);
  }
  return denormblobs(corners,nvals);
}

function get_poster_id(blobs) {
  var postern;
  if (blobs.length <= 3 || blobs.length > 55) {
    postern = -1;
  } else if (blobs.length < 10) {
		postern = 3;  // 6
  } else if (blobs.length < 17) {
		postern = 4;  // 15
  } else if (blobs.length < 21) {
		postern = 5;  // 19
	} else if (blobs.length < 26) {
		postern = 2;  // 23
	} else if (blobs.length < 35) {
		postern = 1;  // 30
	} else {
		postern = 0;  // 47
	}
  return postern;
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

function dist(v1, v2) {
  var dx = Math.abs(v1.x - v2.x);
  var dy = Math.abs(v1.y - v2.y);
  return Math.sqrt(dx*dx+dy*dy);
}


function strokeBlobs(ctx, blobs, render_size, color) {
  for (var i = 0; i < blobs.length; i++) {
    ctx.strokeStyle = color;
    ctx.strokeRect(blobs[i].x*render_size.w-blobs[i].w/2*render_size.w, blobs[i].y*render_size.h-blobs[i].h/2*render_size.h, blobs[i].w*render_size.w, blobs[i].h*render_size.h);
  }
}

function fillBlobs(ctx, blobs, render_size, color) {
  for (var i = 0; i < blobs.length; i++) {
    ctx.fillStyle = color;
    ctx.fillRect(blobs[i].x*render_size.w-blobs[i].w/2*render_size.w, blobs[i].y*render_size.h-blobs[i].h/2*render_size.h, blobs[i].w*render_size.w, blobs[i].h*render_size.h);
  }
}
