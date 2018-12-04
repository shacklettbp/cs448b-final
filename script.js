var ui_ctx = new UIContext();
d3.json("data/trace.json").then(ready);

function make_comparison_object(start_x, start_y, end_x, end_y, data) {
  if (start_y > end_y) {
    var tmp = start_y;
    start_y = end_y;
    end_y = tmp;
  }
  if (start_x > end_x) {
    var tmp = start_x;
    start_x = end_x;
    end_x = tmp;
  }

  var cycle_counter = d3.select('#cycles-bar .cycles-area');
  var pos_offset = cycle_counter.node().getBoundingClientRect().left;
  start_x -= pos_offset;
  end_x -= pos_offset;

  var x_scale = cycle_counter.datum().scale;

  var cur_offset = cycle_counter.node().scrollLeft;

  var start_cycle = Math.ceil((x_scale.invert(start_x + cur_offset) + 1) / 2);
  var end_cycle = Math.floor((x_scale.invert(end_x + cur_offset) + 1) / 2);

  var selected = [];
  var names = [];
  ui_ctx.get_cur_panel().selectAll('.visualization-area').each(function (d) {
    var bbox = this.getBoundingClientRect();
    var relative_bbox_bottom = bbox.bottom + window.scrollY;
    var relative_bbox_top = bbox.top + window.scrollY;

    if ((start_y < relative_bbox_bottom && end_y > relative_bbox_bottom) ||
        (start_y < relative_bbox_top && end_y > relative_bbox_top) ||
        (start_y > relative_bbox_top && end_y < relative_bbox_bottom)) {
      var parent_name_container = d3.select(this.parentElement.parentElement).select('.circuit-name');
      var parent_name;
      if (parent_name_container.empty()) {
        parent_name = 'self';
      } else {
        parent_name = parent_name_container.text();
      }
      names.push(parent_name + '.' + d.name);
      selected.push(d);
    }
  });

  var name = names.join(', ');

  ui_ctx.add_comparison_object(name, start_cycle, end_cycle, selected);
}

function setup_waveform(container, wire_name, isinput, instance_name, scope_name, data) {
  var waveform_container = ui_ctx.make_waveform(container, wire_name, isinput,
    function (sx, sy, ex, ey) {
      make_comparison_object(sx, sy, ex, ey, data);
    }
  );

  var visualization_area = waveform_container.select('.visualization-area');
  visualization_area.datum({
                            name: wire_name,
                            instance: instance_name,
                            scope: scope_name,
                            data: data
                           });

  draw_waveform(visualization_area,
                waveform_container.select('.axis-container'),
                data);
}

function render_inputs_outputs(container, instance_name, scope_name, data) {
  var inputs = data['inputs'];
  var outputs = data['outputs'];

  for (var key in inputs) {
    if (key === 'CLK') continue;
    setup_waveform(container, key, true, instance_name, scope_name, inputs[key]);
  }
  for (var key in outputs) {
    setup_waveform(container, key, false, instance_name, scope_name, outputs[key]);
  }
}

function update_colors() {
  var colors = ['#4E79A7', '#59A14F', '#9C755F', '#F28E2B', '#EDC948',
              '#E14759', '#B07AA1', '#76B7B2', '#FF9DA7'];

  ui_ctx.get_cur_panel().selectAll('.waveform-line').each(function (d, i) {
    d3.select(this).style('stroke', colors[i % colors.length]);
  });
}

function render_scope(panel, scope_name, data) {
  var scope = ui_ctx.make_scope(panel, scope_name);
  var scope_data = data[scope_name];
  var instances = scope_data['_instances'];

  var self_container = ui_ctx.make_circuit(scope, 'self');
  self_container.select('.circuit-header').text("Inputs & Outputs");
  render_inputs_outputs(self_container, 'self', scope_name, scope_data['_top']);

  instances.forEach(function (inst) {
    var circuit_container = ui_ctx.make_circuit(scope, inst);
    render_inputs_outputs(circuit_container, inst, scope_name, scope_data[inst]);
  });

  update_colors();
}

function create_cycle_counter(data) {
  // Hack
  var top_outs = data['/']['_top']['outputs']
  var num_cycles = top_outs[Object.keys(top_outs)[0]].length;
  draw_cycles_counter(d3.select('#cycles-bar .cycles-area'), num_cycles);
}

function setup_comparison_creator() {
  d3.select('#comparison-create').on('click', function () {
    d3.event.preventDefault();
  
    var comp_panel = ui_ctx.make_panel();
    ui_ctx.activate_panel(comp_panel);
  
    var comp_objs = d3.selectAll('#comparison-drop-area .comparison-object');
    var data = comp_objs.data()
    comp_objs.remove();
    console.log(data);
    data.forEach(function (d) {
    });
  
    //var comp_container = ui_ctx.make_comparison(comp_panel, '/pico.inst1/DualRAM16x8.inst6.WDATA');
    //setup_waveform(comp_container, 'Cycles 15-60', true, data['/pico.inst1']['DualRAM16x8.inst6']['inputs']['WDATA']);
    //setup_waveform(comp_container, 'Cycles 90-135', true, data['/pico.inst1']['DualRAM16x8.inst6']['outputs']['RDATA0']);
    //update_colors();
  });
}

function ready(data) {
  console.log(data);
  ui_ready()
  create_cycle_counter(data);
  setup_comparison_creator();

  var default_panel = ui_ctx.make_panel();
  ui_ctx.activate_panel(default_panel);

  render_scope(default_panel, '/', data);
}

