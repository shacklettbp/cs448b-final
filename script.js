d3.json("data/trace.json").then(ready)

function ready(data) {
  ui_startup()
  setup_tabs(function() {
    draw_waveform('visualization-area', data['/']['_top']['outputs']['O']);
  });
}

