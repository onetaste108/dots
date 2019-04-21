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
