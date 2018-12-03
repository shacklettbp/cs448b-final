var ui_ctx = new UIContext();
d3.json("data/trace.json").then(ready);

function setup_waveform(container, wire_name, isinput, data) {
  var waveform_container = ui_ctx.make_waveform(container, wire_name, isinput);
  draw_waveform(waveform_container.select('.visualization-area'),
                waveform_container.select('.axis-container'),
                data);
}

function render_inputs_outputs(container, data) {
  var inputs = data['inputs'];
  var outputs = data['outputs'];

  for (var key in inputs) {
    if (key === 'CLK') continue;
    setup_waveform(container, key, true, inputs[key]);
  }
  for (var key in outputs) {
    setup_waveform(container, key, false, outputs[key]);
  }
}

function update_colors() {
  var colors = ['#4E79A7', '#59A14F', '#9C755F', '#F28E2B', '#EDC948',
              '#E14759', '#B07AA1', '#76B7B2', '#FF9DA7'];

  d3.selectAll('.waveform-line').each(function (d, i) {
    d3.select(this).style('stroke', colors[i % colors.length]);
  });
}

function render_scope(panel, scope_name, data) {
  var scope = ui_ctx.make_scope(panel, scope_name);
  var scope_data = data[scope_name];
  var instances = scope_data['_instances'];

  var self_container = ui_ctx.make_circuit(scope, 'self');
  self_container.select('.circuit-header').text("Inputs & Outputs");
  render_inputs_outputs(self_container, scope_data['_top']);

  instances.forEach(function (inst) {
    var circuit_container = ui_ctx.make_circuit(scope, inst);
    render_inputs_outputs(circuit_container, scope_data[inst]);
  });

  update_colors();
}

function ready(data) {
  console.log(data);
  ui_ready()

  var default_panel = ui_ctx.make_panel();
  default_panel.style('display', null)
               .attr('aria-hidden', false);
  d3.select("[role='tab']").attr('aria-selected', true);

  // Hack
  var top_outs = data['/']['_top']['outputs']
  var num_cycles = top_outs[Object.keys(top_outs)[0]].length;
  draw_cycles_counter(d3.select('#cycles-bar .cycles-area'), num_cycles);
  render_scope(default_panel, '/', data);
}

