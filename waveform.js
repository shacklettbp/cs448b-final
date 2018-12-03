function draw_waveform(div_id, waveform_data) {
  var plot_layout = {
    showlengend: false,
    hovermode: 'closest'
  }

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
