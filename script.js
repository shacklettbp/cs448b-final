var ui_ctx = new UIContext();
d3.json("data/trace.json").then(ready);

function render_scope(panel, scope_name, data) {
  var scope_data = data[scope_name];
}

function ready(data) {
  console.log(data);
  ui_ready()
  //draw_waveform('visualization-area', data['/']['_top']['outputs']['O']);

  var default_panel = ui_ctx.make_panel();
  default_panel.style('display', null);
  render_scope(default_panel, '/', data);
}

