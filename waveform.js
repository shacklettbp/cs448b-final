var pixels_per_cycle = 10;
var margin_left = 4;

function get_stats(data) {
  var min = data[0];
  var max = data[0];
  var diffs = [];
  var diffs_lhs = data[0];
  var min_diff = Number.MAX_SAFE_INTEGER;

  for (var i = 1; i < data.length; i++) {
    var elem = data[i];
    if (elem < min) {
      min = elem;
    }
    if (elem > max) {
      max = elem;
    }

    var diff = elem - diffs_lhs;
    diffs.push(diff);
    diffs_lhs = elem;
    if (Math.abs(diff) < min_diff && Math.abs(diff) > 0) {
      min_diff = Math.abs(diff);
    }
  }
  
  min_diff = min_diff == Number.MAX_SAFE_INTEGER ? 0 : min_diff;

  return {max: max, min: min, range: max - min, diffs: diffs, min_diff: min_diff};
}

function calculate_height(min_diff, range) {
  var scale_factor = 3;

  var new_range = range;
  if (min_diff < scale_factor) {
    var scaled_range = (range / min_diff) * scale_factor;
    if (scaled_range > range) {
      new_range = scaled_range;
    }
  }

  return Math.max(30, Math.min(150, new_range));
}

function draw_cycles_counter(container, num_cycles) {
  var total_width = num_cycles * pixels_per_cycle;

  var drawgroup = container.append('svg')
                  .attr('width', total_width + margin_left)
                  .attr('height', 25)
                  .append('g')
                  .attr('transform', `translate(${margin_left}, 0)`);

  var x_scale = d3.scaleLinear()
                  .domain([0, num_cycles])
                  .range([0, total_width]);

  // Store the x_scale in the bar for reference by others
  container.datum({scale: x_scale});

  // Draw the grid lines in the same way as the clock grid
  // Axis lines don't line up perfectly otherwise
  var ticks = [];
  var skip = 20;
  for (var i = 0; i < num_cycles; i += skip) {
    ticks.push(i);
  }
  var points = drawgroup.selectAll('line').data(ticks).enter()
    .append('g')
    .attr('transform', function (d) {
      return `translate(${x_scale(d)}, 0)`;
    });

  points
    .append('line')
    .attr('y1', 0)
    .attr('y2', 8);

  points
    .append('text')
    .text(function(d) { return d/2; })
    .attr('y', 20)
    .attr('x', function(d) { return -this.clientWidth / 2; });

  container.on('scroll', function () {
    ui_ctx.scroll_waveforms(this.scrollLeft);
  });
}

function draw_waveform(container, axis_container, waveform_data, max_range) {
  var margin_top = 5;
  var margin_bottom = 5;

  var stats = get_stats(waveform_data)
  var height = calculate_height(stats.min_diff, stats.range);
  var cycles = waveform_data.length;

  var total_width = cycles * pixels_per_cycle;
  var parent_width = container.node().clientWidth;

  if (max_range && parent_width > total_width) {
    total_width = Math.floor(parent_width / max_range) * max_range;
    cycles = max_range;
  }

  var x_scale = d3.scaleLinear()
                  .domain([0, cycles])
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

  var svg = container.append('svg')
                     .attr('width', total_width + margin_left)
                     .attr('height', height + margin_top + margin_bottom);

  var movegroup = svg.append('g');
  var drawgroup = movegroup.append('g')
                           .attr('transform', `translate(${margin_left}, 0)`);

  var clockgroup = drawgroup.append('g');
  var waveformgroup = drawgroup.append('g')
                               .attr('transform', `translate(0, ${margin_top})`);

  // FIXME
  var skip_downclock = [];
  for (var i = 0; i < stats.diffs.length; i += 2) {
    skip_downclock.push(stats.diffs[i]);
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

  // Draw axis
  var axis_width = 48;
  var axisgroup = axis_container.append('svg')
                                .attr('height', height + margin_top + margin_bottom)
                                .attr('width', axis_width)
                                .append('g')
                                .attr('transform', `translate(${axis_width - 1}, ${margin_top})`);

  var marks = [stats.min];
  var middle = Math.floor((stats.max + stats.min)/ 2);
  if (middle != stats.min) {
    marks.push(middle);
  }
  marks.push(y_max);

  // Draw Axis
  axisgroup.call(d3.axisLeft(y_scale)
                   .ticks(10, '#06X')
                   .tickValues(marks)
                );

  container.on('mousemove', function () {
    var bounding = drawgroup.node().getBoundingClientRect();
    var pos = d3.event.x - bounding.left;
    d3.selectAll('g.cur-value').remove()
    var cycle = Math.floor(x_scale.invert(pos));

    ui_ctx.get_cur_panel().selectAll('.visualization-area').each(function (d) {
      var cur = d3.select(this);
      var cur_height = cur.select('svg').attr('height');
      var value = d.data[cycle + 1];
      var y_pos = d.y_scale(value);
      if (y_pos > cur_height - 12) {
        y_pos = cur_height - 12;
      }

      var cur_group = cur.select('svg > g > g');
      var marker_group = cur_group.append('g')
                                  .attr('class', 'cur-value')

      var marker_label = marker_group.append('g').attr('transform', `translate(${pos}, ${y_pos})`);

      var formatted = d3.format('#06X')(value);

      var rect = marker_label.append('rect');
      var text = marker_label.append('text').text(formatted)
                             .attr('dy', '0.85em')
                             .attr('x', '4px');
      rect.attr('width', '45px').attr('height', '0.7em');

      marker_group.append('line')
      .attr('x1', pos)
      .attr('x2', pos)
      .attr('y1', 0)
      .attr('y2', cur_height)
    });
  });

  return {x_scale: x_scale, y_scale: y_scale};
}
