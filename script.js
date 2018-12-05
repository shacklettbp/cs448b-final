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

  var cycle_counter = ui_ctx.get_cur_bottom().select('.cycles-area');
  var pos_offset = cycle_counter.node().getBoundingClientRect().left;
  start_x -= pos_offset;
  end_x -= pos_offset;

  var x_scale = cycle_counter.datum().scale;

  var cur_offset = cycle_counter.node().scrollLeft;

  var start_cycle = Math.ceil((x_scale.invert(start_x + cur_offset) + 1) / 2);
  var end_cycle = Math.floor((x_scale.invert(end_x + cur_offset) + 1) / 2);

  var existing_lookup = {};
  ui_ctx.get_cur_bottom().selectAll('.comparison-object').each(function (d) {
    existing_lookup[d.info.scope + '/' + d.info.instance + '.' + d.info.name] = d3.select(this);
  });

  ui_ctx.get_cur_panel().selectAll('.visualization-area').each(function (d) {
    var bbox = this.getBoundingClientRect();
    var relative_bbox_bottom = bbox.bottom + window.scrollY;
    var relative_bbox_top = bbox.top + window.scrollY;

    if ((start_y < relative_bbox_bottom && end_y > relative_bbox_bottom) ||
        (start_y < relative_bbox_top && end_y > relative_bbox_top) ||
        (start_y > relative_bbox_top && end_y < relative_bbox_bottom)) {

      var full_name = d.instance + '.' + d.name;
      var key = d.scope + '/' + full_name;
      if (key in existing_lookup) {
        var existing_element = existing_lookup[key];
        var existing_data = existing_element.datum();
        existing_data['cycles'].push([start_cycle, end_cycle]);

        existing_element.select('p').append('span').text(`, ${start_cycle}-${end_cycle}`);
      } else { 
        ui_ctx.add_comparison_object(full_name, start_cycle, end_cycle, {info: d, cycles: [[start_cycle, end_cycle]]});
      }
    }
  });

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
  self_container.select('.circuit-name').text("Inputs & Outputs");
  self_container.select('.circuit-name-prefix').text("");
  self_container.select('.descend-icon-button').remove();
  render_inputs_outputs(self_container, 'self', scope_name, scope_data['_top']);

  instances.forEach(function (inst) {
    var next_scope = scope_name + scope_name == '/' ? '' : '/' + inst
    var circuit_container = ui_ctx.make_circuit(scope, inst, function () {
      render_scope(panel, next_scope, data);
      window.scrollTo(0, 0);
    });
    if (!(next_scope in data)) {
      circuit_container.select('.descend-icon-button').remove();
      circuit_container.select('.circuit-name-prefix').text("Primitive: ");
    }
    render_inputs_outputs(circuit_container, inst, scope_name, scope_data[inst]);
  });

  update_colors();
}

function create_cycle_counter(data) {
  // Hack
  var top_outs = data['/']['_top']['outputs']
  var num_cycles = top_outs[Object.keys(top_outs)[0]].length;
  draw_cycles_counter(ui_ctx.get_cur_bottom().select('.cycles-area'), num_cycles);
}

function setup_comparison_creator() {
  d3.select('#comparison-create').on('click', function () {
    d3.event.preventDefault();
  
    var comp_panel = ui_ctx.make_panel();
    ui_ctx.activate_panel(comp_panel);
  
    var comp_objs = d3.selectAll('#comparison-drop-area .comparison-object');
    var data = comp_objs.data()
    comp_objs.remove();

    data.forEach(function (d) {
      var full_key = d.info.scope + d.info.scope == '/' ? '' : '/' + d.info.instance + '.' + d.info.name;
      var comp_container = ui_ctx.make_comparison(comp_panel, full_key);
      d.cycles.forEach(function (cycles) {
        setup_waveform(comp_container, `Cycles ${cycles[0]}-${cycles[1]}`, null, d.info.instance, d.info.scope, d.info.data.slice(cycles[0], cycles[1]));
      });
    });

    update_colors();
  });
}

function setup_new_button(data) {
  d3.select('#new-panel-button').on('click', function () {
    console.log('STUPID DUMDUM');
  });
}
  
function ready(data) {
  console.log(data);
  ui_ready()
  create_cycle_counter(data);
  setup_comparison_creator();
  setup_new_button(data);

  var default_panel = ui_ctx.make_panel();
  ui_ctx.activate_panel(default_panel);

  render_scope(default_panel, '/', data);
}

