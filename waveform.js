function get_stats(data) {
  var min = data[0];
  var max = data[0];

  data.forEach(function (elem) {
    if (elem < min) {
      min = elem;
    } 
    if (elem > max) {
      max = elem;
    }
  });

  return {max: max, min: min, range: max - min};
}

function calculate_height(range) {
  return Math.max(50, Math.min(400, range));
}

function draw_waveform(container, waveform_data) {
  var colors = ['#4E79A7', '#59A14F', '#9C755F', '#F28E2B', '#EDC948',
                '#E14759', '#B07AA1', '#76B7B2', '#FF9DA7'];

  var width = container.node().clientWidth;
  console.log(width);

  var stats = get_stats(waveform_data)
  var height = calculate_height(stats.range);
  var cycles = waveform_data.length;

  var pixels_per_cycle = 10;
  var total_width = cycles * pixels_per_cycle;
  if (total_width < width) {
    total_width = width;
  }

  var svg = container.append('svg')
                     .attr('width', width)
                     .attr('height', height);

  var drawgroup = svg.append('g');

  var x_scale = d3.scaleLinear()
                  .domain([0, cycles - 1])
                  .range([0, total_width]);

  var y_scale = d3.scaleLinear()
                  .domain([stats.min, stats.max])
                  .range([height, 0]);

  drawgroup.append('path')
    .datum(waveform_data)
    .attr('class', 'waveform-line')
    .attr('d', d3.line()
      .x(function(d, i) { return x_scale(i); })
      .y(function (d) { return y_scale(d); })
      .curve(d3.curveStepAfter)
    );
  //drawgroup.selectAll('.clock_grid')
  //  .data(waveform_data)
  //  .enter()
  //  .append('rect')

  for (var i = 0; i < waveform_data.length; i++) {

  }
}
