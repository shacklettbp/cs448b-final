function get_range(data) {
  var min = data[0];
  var max = data[0];

  for (elem in data) {
    if (elem < min) {
      min = elem;
    } 
    if (elem > max) {
      max = elem;
    }
  }

  return max - min;
}

function calculate_height(range) {
  return Math.max(50, Math.min(400, range));
}

function draw_waveform(container, waveform_data) {
  var colors = ['#4E79A7', '#59A14F', '#9C755F', '#F28E2B', '#EDC948',
                '#E14759', '#B07AA1', '#76B7B2', '#FF9DA7'];

  var range = get_range(waveform_data)
  var height = calculate_height(range);
  var pixels_per_value = 1;
  if (pixels_per_value * range < height) {
    pixels_per_value = height / range;
  }

  var cycles = waveform_data.length;
  var pixels_per_cycle = 10;
  var width = container.node().clientWidth;
  var total_width = cycles * pixels_per_cycle;
  if (total_width < width) {
    pixels_per_cycle = width / cycles;
  }


  var svg = container.append('svg')
                     .attr('width', width)
                     .attr('height', height);

  var drawgroup = svg.append('g')
                     .attr('transform', `scale(${pixels_per_cycle}, ${pixels_per_value})`)

  for (var i = 0; i < waveform_data.length; i++) {

  }
}
