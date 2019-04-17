init_controls();
function draw() {

  // update_sliders();
  requestAnimationFrame(draw);
}
function update_sliders() {
  // vals = range.noUiSlider.get();
  // ts[0].innerHTML = vals[0];
  // ts[1].innerHTML = vals[1];
}
draw()

function init_controls() {

  var sh = document.getElementById("sh");
  var thl = document.getElementById("thl");
  var thu = document.getElementById("thu");
  noUiSlider.create(sh, {start: [0,1], range: {'min': [0], 'max': [1]}, connect: true});

  // var ss = document.getElementById("ss");
  // var tsl = document.getElementById("tsl");
  // var tsu = document.getElementById("tsu");
  // noUiSlider.create(ss, {start: [0,1], range: {'min': [0], 'max': [1]}, connect: true});
  //
  // var sv = document.getElementById("sv");
  // var tvl = document.getElementById("tvl");
  // var tvu = document.getElementById("tvu");
  // noUiSlider.create(sv, {start: [0,1], range: {'min': [0], 'max': [1]}, connect: true});

}
