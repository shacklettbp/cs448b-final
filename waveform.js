function draw_waveform(container, waveform_data) {
  var colors = ['#4E79A7', '#59A14F', '#9C755F', '#F28E2B', '#EDC948',
                '#E14759', '#B07AA1', '#76B7B2', '#FF9DA7'];
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

  Plotly.newPlot(container, [trace], plot_layout, {displaylogo: false, displayModeBar: false});
}
