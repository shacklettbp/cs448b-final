var ui_ctx = new UIContext();
d3.json("data/trace.json").then(ready);

function setup_waveform(container, wire_name, isinput, data) {
  var waveform_container = ui_ctx.make_waveform(container, wire_name, isinput);
  draw_waveform(waveform_container.select('.visualization-area'), data);
}

function render_scope(panel, scope_name, data) {
  var scope = ui_ctx.make_scope(panel, scope_name);
  var scope_data = data[scope_name];
  var instances = scope_data['_instances'];

  instances.forEach(function (inst) {
    var inputs = scope_data[inst]['inputs'];
    var outputs = scope_data[inst]['outputs'];
    var circuit_container = ui_ctx.make_circuit(scope, inst);
    for (var key in inputs) {
      setup_waveform(circuit_container, key, true, inputs[key]);
    }
    for (var key in outputs) {
      setup_waveform(circuit_container, key, false, outputs[key]);
    }
  });
}

function ready(data) {
  console.log(data);
  ui_ready()

  var default_panel = ui_ctx.make_panel();
  default_panel.style('display', null)
               .attr('aria-hidden', false);
  d3.select("[role='tab']").attr('aria-selected', true);
  render_scope(default_panel, '/', data);
}

