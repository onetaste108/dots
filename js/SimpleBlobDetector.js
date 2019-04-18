// Port of https://github.com/opencv/opencv/blob/a50a355/modules/features2d/src/blobdetector.cpp
// But with special `faster` option which has slightly different semantics,
// but is a whole bunch faster.

function diff(v1, v2) {
  if (v1.x !== undefined) return { x: v1.x - v2.x, y: v1.y - v2.y };
  return v1.map((value, index) => value - v2[index]);
}

function norm(vector) {
  if (vector.x !== undefined) return norm([vector.x, vector.y]);
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

const defaultParams = {
  filterByColor: true,
  blobColor: 255,
  filterByArea: true,
  minArea: 25,
  maxArea: 5000,
  minCircularity: 25,
  maxCircularity: 5000,
};

function findBlobs(binaryImage, params) {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(binaryImage, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
  hierarchy.delete();

  const centers = [];
  const objectsToDelete = [];
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    objectsToDelete.push(contour);
    const area = cv.contourArea(contour);

    let center;
    const { x, y, width, height } = cv.boundingRect(contour);
    center = {
      x: x + width / 2,
      y: y + height / 2,
      w: width,
      h: height
    };

    if (params.filterByArea) {
      if (area < params.minArea || area >= params.maxArea) continue;
    }

    if (params.filterByCircularity) {
      const perimeter = cv.arcLength(contour, true);
      const ratio = 4 * cv.CV_PI * area / (perimeter * perimeter);
      if (ratio < params.minCircularity || ratio >= params.maxCircularity) continue;
    }

    if (params.filterByColor) {
      if (
        binaryImage.ucharAt(Math.round(center.y), Math.round(center.x)) !=
        params.blobColor
      )
        continue;
    }

    centers.push(center);
  }
  objectsToDelete.forEach(obj => obj.delete());
  contours.delete();
  return centers;
}
