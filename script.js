var ui_ctx = new UIContext();
d3.json("data/trace.json").then(ready);

function make_comparison_object(start_x, start_y, end_x, end_y, data) {
  var cycle_counter = d3.select('#cycles-bar .cycles-area');
  var pos_offset = cycle_counter.node().getBoundingClientRect().left;
  start_x -= pos_offset;
  end_x -= pos_offset;

  var x_scale = cycle_counter.datum().scale;

  var cur_offset = cycle_counter.node().scrollLeft;

  var start_cycle = Math.ceil((x_scale.invert(start_x + cur_offset) + 1) / 2);
  var end_cycle = Math.floor((x_scale.invert(end_x + cur_offset) + 1) / 2);

  var selected = [];
  ui_ctx.get_cur_panel().selectAll('.visualization-area').each(function () {
    var bbox = this.getBoundingClientRect();
  });

  console.log(start_y);
  console.log(end_y);
  console.log(start_cycle);
  console.log(end_cycle);

  //ui_ctx.add_comparison_object(name, start_cycle, end_cycle, data);
}

function setup_waveform(container, wire_name, isinput, data) {
  var waveform_container = ui_ctx.make_waveform(container, wire_name, isinput,
    function (sx, sy, ex, ey) {
      make_comparison_object(sx, sy, ex, ey, data);
    });

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

function create_cycle_counter(data) {
  // Hack
  var top_outs = data['/']['_top']['outputs']
  var num_cycles = top_outs[Object.keys(top_outs)[0]].length;
  draw_cycles_counter(d3.select('#cycles-bar .cycles-area'), num_cycles);
}

function ready(data) {
  console.log(data);
  ui_ready()
  create_cycle_counter(data);

  var default_panel = ui_ctx.make_panel();
  default_panel.style('display', null)
               .attr('aria-hidden', false);
  d3.select("[role='tab']").attr('aria-selected', true);

  render_scope(default_panel, '/', data);
}

d3.select('#comparison-create').on('click', function () {
  d3.event.preventDefault();
});
