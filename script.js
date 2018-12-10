var ui_ctx = new UIContext();

d3.select('.select-trace-button').on('click', function () {
  d3.select('#file-load').node().dispatchEvent(new MouseEvent('click'));
});

d3.select('#file-load').on('change', function () {
  var reader = new FileReader();
  reader.onload = function () {
    var content = reader.result;
    ready(JSON.parse(content));
  };

  reader.readAsText(this.files[0]);
  d3.select('.select-input-data').style('display', 'none');
  d3.select('#loading').style('display', null);
});

d3.select('.default-trace-button').on('click', function () {
  d3.json("data/trace.json").then(ready);
  d3.select('.select-input-data').style('display', 'none');
  d3.select('#loading').style('display', null);
});

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

function setup_waveform(container, wire_name, isinput, instance_name, scope_name, data, max_range) {
  var waveform_container = ui_ctx.make_waveform(container, wire_name, isinput,
    function (sx, sy, ex, ey) {
      make_comparison_object(sx, sy, ex, ey, data);
    }
  );

  var visualization_area = waveform_container.select('.visualization-area');

  var info = draw_waveform(visualization_area,
                           waveform_container.select('.axis-container'),
                           data, max_range);

  visualization_area.datum({
                            name: wire_name,
                            instance: instance_name,
                            scope: scope_name,
                            data: data,
                            x_scale: info.x_scale,
                            y_scale: info.y_scale
                           });
}

function render_inputs_outputs(container, instance_name, scope_name, data) {
  var inputs = data['inputs'];
  var outputs = data['outputs'];

  for (var key in inputs) {
    if (key === 'CLK' || key === 'clk') continue;
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
    var next_scope = scope_name + (scope_name == '/' ? '' : '/') + inst;
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
  
    var comp_panel = ui_ctx.make_panel(function () {
      d3.select('.bottom-bar').style('display', 'none');
    });
    ui_ctx.activate_panel(comp_panel);
  
    var comp_objs = d3.selectAll('#comparison-drop-area .comparison-object');
    var data = comp_objs.data()
    comp_objs.remove();

    var max_range = 0;
    data.forEach(function (d) {
      d.cycles.forEach(function (cycles) {
        var range = cycles[1] - cycles[0];
        if (range > max_range) {
          max_range = range;
        }
      });
    });

    data.forEach(function (d) {
      var full_key = d.info.scope + (d.info.scope == '/' ? '' : '/') + d.info.instance + '.' + d.info.name;
      var comp_container = ui_ctx.make_comparison(comp_panel, full_key);
      d.cycles.forEach(function (cycles) {
        setup_waveform(comp_container, `Cycles ${cycles[0]}-${cycles[1]}`, null, d.info.instance, d.info.scope, d.info.data.slice(cycles[0]*2, cycles[1]*2 + 1), max_range);
      });
    });

    update_colors();
  });
}

function setup_new_button(data) {
  d3.select('#new-panel-button').on('click', function () {
    var default_panel = ui_ctx.make_panel();
    ui_ctx.activate_panel(default_panel);
    ui_ctx.activate_panel(default_panel);

    render_scope(default_panel, '/', data);
    return;

    var canvas = default_panel.append('div');
    
    var hierarchy = data_to_hierarchy(data, '/');

    var root = d3.hierarchy(hierarchy);

    var treemapLayout = d3.treemap();
    treemapLayout
      .tile(d3.treemapBinary)
      .size([.95 * default_panel.node().clientWidth, 700])
      .paddingTop(20)
      .paddingBottom(5)
      .paddingLeft(5)
      .paddingRight(5)
      .paddingInner(5);
    
    root.sum(function(d) {
      return d.value;
    });

    treemapLayout(root);

    canvas.append('svg')
      .attr('width', '100%')
      .attr('height', 700)
      .append('g')
      .selectAll('rect')
      .data(root.descendants())
      .enter()
      .append('rect')
      .attr('x', function(d) { return d.x0; })
      .attr('y', function(d) { return d.y0; })
      .attr('width', function(d) { return d.x1 - d.x0; })
      .attr('height', function(d) { return d.y1 - d.y0; })
      .style('fill', 'rgb(100, 100, 100)')
      .style('opacity', 0.2)
      .style('stroke', '#000000');

    console.log(d3.select('svg g').selectAll('g'));
    var nodes = d3.select('svg g')
      .selectAll('g')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('transform', function(d) { return 'translate(' + [d.x0, d.y0] + ')'});
    
    nodes
      .append('text')
      .attr('dx', 4)
      .attr('dy', 14)
      .text(function(d) { return d.data.name; } );
  });
}

function data_to_hierarchy(data, cur_scope) {
  var hierarchy = {
    'name': cur_scope,
  };

  if (!(cur_scope in data)) {
    hierarchy['value'] = 1;
    return hierarchy;
  }

  var instances = data[cur_scope]._instances;

  var children = instances.map(function (inst) {
    var new_scope = cur_scope + (cur_scope == '/' ? '' : '/') + inst;
    return data_to_hierarchy(data, new_scope);
  });

  hierarchy['children'] = children;
  return hierarchy;
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

