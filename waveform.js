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
  return Math.max(50, Math.min(200, range));
}

function compute_differences(data) {
  var diffs = [];
  for (var i = 0; i < data.length - 1; i++) {
    diffs.push(data[i + 1] - data[i]);
  }

  return diffs;
}

function draw_waveform(container, waveform_data) {
  var margin_top = 5;
  var margin_bottom = 5;
  var margin_left = 45;

  var width = container.node().clientWidth - margin_left;

  var stats = get_stats(waveform_data)
  var height = calculate_height(stats.range);
  var cycles = waveform_data.length;

  var pixels_per_cycle = 10;
  var total_width = cycles * pixels_per_cycle;
  if (total_width < width) {
    total_width = width;
  }

  var svg = container.append('svg')
                     .attr('width', width + margin_left)
                     .attr('height', height + margin_top + margin_bottom);

  var movegroup = svg.append('g');
  var drawgroup = movegroup.append('g')
                           .attr('transform', `translate(${margin_left}, 0)`);
  var clockgroup = drawgroup.append('g');
  var waveformgroup = drawgroup.append('g')
                               .attr('transform', `translate(0, ${margin_top})`);

  var axisgroup = movegroup.append('g')
                           .attr('transform', `translate(${margin_left-2}, ${margin_top})`);

  var x_scale = d3.scaleLinear()
                  .domain([0, cycles - 1])
                  .range([0, total_width]);

  var y_max;
  if (stats.range == 0) {
    y_max = stats.min + 1;
  } else {
    y_max = stats.max;
  }
  var y_scale = d3.scaleLinear()
                  .domain([stats.min, y_max])
                  .range([height, 0]);

  var differences = compute_differences(waveform_data);

  // FIXME
  var skip_downclock = [];
  for (var i = 0; i < differences.length; i += 2) {
    skip_downclock.push(differences[i]);
  }

  // Draw Clock Lines
  clockgroup.selectAll('line').data(skip_downclock)
    .enter()
    .append('line')
    .attr('class', function (d) {
      if (d == 0) {
        return 'clock-nochange';
      } else {
        return 'clock-change';
      }
    })
    .attr('x1', function (d, i) { return x_scale(i*2); })
    .attr('x2', function (d, i) { return x_scale(i*2); })
    .attr('y1', 0)
    .attr('y2', height+margin_top+margin_bottom);

  // Draw Waveform
  waveformgroup.append('path')
    .datum(waveform_data)
    .attr('class', 'waveform-line')
    .attr('d', d3.line()
      .x(function(d, i) { return x_scale(i); })
      .y(function (d) { return y_scale(d); })
      .curve(d3.curveStepBefore)
    );

  var marks = [stats.min];
  var middle = Math.floor(stats.range / 2);
  if (middle != stats.min) {
    marks.push(middle);
  }
  marks.push(y_max);

  // Draw Axis
  axisgroup.call(d3.axisLeft(y_scale)
                   .ticks(10, '#06X')
                   .tickValues(marks)
                );
}
