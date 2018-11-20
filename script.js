d3.json("data/trace.json").then(ready)

var plot_layout = {
  showlegend: false,
  hovermode: 'closest'
}

function draw_waveform(div_id, waveform_data) {
  var x = [];
  var y = [];
  var prev = null;
  for (var i = 0; i < waveform_data.length; i++) {
    var cur = waveform_data[i];
    if (prev != null && prev != cur) {
      x.push(i);
      y.push(prev);
    }
    x.push(i);
    y.push(cur);
    prev = cur;
  }

  var trace = {
    x: x,
    y: y,
    type: 'scatter',
    mode: 'lines'
  }

  Plotly.newPlot(div_id, [trace], plot_layout, {displaylogo: false, displayModeBar: false});
}

function ready(data) {
  console.log(Object.keys(data['/']));
  draw_waveform('visualization-area', data['/']['top']['O']);
}
