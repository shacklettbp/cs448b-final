function is_all_ws(nod) {
  return !(/[^\t\n\r ]/.test(nod.textContent));
}

function is_ignorable(nod) {
  return ( nod.nodeType == 8) || // A comment node
         ( (nod.nodeType == 3) && is_all_ws(nod) ); // a text node, all ws
}

class UIContext {
  constructor() {
    this.tab_template = d3.select('#tab-template').node();
    this.panel_template = d3.select('#panel-template').node();
    this.scope_template = d3.select('#scope-template').node();
    this.circuit_template = d3.select('#circuit-template').node();
    this.waveform_template = d3.select('#waveform-template').node();
    this.comparison_object_template = d3.select('#comparison-object-template').node();
    this.comparison_template = d3.select('#comparison-template').node()

    this.panel_idx = 1;
    this.tab_container = d3.select('#tab-container').node();
    this.body = d3.select('body').node();
    this.comparison_drop_area = d3.select('#comparison-drop-area').node();
  }

  create_node(template) {
    return document.importNode(template.content, true);
  }

  append_template(parent_node, template) {
    var new_node = this.create_node(template);
    var children = [].slice.call(new_node.childNodes, 0);
    children = children.filter(function(val) {
      return !is_ignorable(val);
    });
  
    parent_node.appendChild(new_node);
    return d3.selectAll(children);
  }

  get_cur_panel() {
    return d3.select('section[aria-hidden="false"]');
  }

  activate_panel(panel) {
    d3.selectAll("*[role='tabpanel']")
      .style('display', 'none')
      .attr('aria-hidden', true);

    d3.selectAll("*[role='tab']")
      .attr('aria-selected', false);

    panel.style('display', null)
         .attr('aria-hidden', false);

    panel.datum().attr('aria-selected', true);
    panel.style('display', null)
         .attr('aria-hidden', false);
  }

  make_panel() {
    var panel_num = this.panel_idx++;
    var tab = this.append_template(this.tab_container, this.tab_template);
    tab = tab.select('a');
    tab.select('.tab-target').text(panel_num);

    tab.on('click', function(d) {
      d3.event.preventDefault();
      ui_ctx.activate_panel(d);
    });

    var panel = this.append_template(this.body, this.panel_template);
    tab.datum(panel);
    panel.datum(tab);
    panel.select('.panel-num')
         .text(panel_num)
         .style('display', 'none')
         .attr('aria-hidden', true);

    return panel;
  }

  make_scope(panel, scope_name) {
    var scope = this.append_template(panel.node(), this.scope_template);
    scope.select('.scope-value').text(scope_name);

    scope.select('.scope-toggle').on("click", function () {
      if (scope.select('.scope-toggle').property('checked')) {
        scope.selectAll('.circuit-area')
          .style('display', 'none');
        scope.selectAll('.circuit-padding')
          .style('display', 'none');
      } else {
        scope.selectAll('.circuit-area')
          .style('display', null);
        scope.selectAll('.circuit-padding')
          .style('display', null);
      }
    });
    return scope;
  }

  make_circuit(scope, circuit_name) {
    console.log('making circuit with name: ', circuit_name);
    var circuit = this.append_template(scope.node(), this.circuit_template);
    circuit.select('.circuit-name').text(circuit_name);

    circuit.select('.circuit-toggle').on("click", function () {
      if (circuit.select('.circuit-toggle').property('checked')) {
        circuit.selectAll('.waveform-container')
          .style('display', 'none');
      } else {
        circuit.selectAll('.waveform-container')
          .style('display', null);
      }
    });
    return circuit;
  }

  make_waveform(circuit, row_name, isinput, drag_callback) {
    var waveform_container = this.append_template(circuit.node(), this.waveform_template);

    var icon = isinput ? "icons/input.png" : "icons/output.png";
    waveform_container.select('.icon').append("svg:image")
      .attr("hlink:href", icon)
      .attr("width", 18)
      .attr("height", 18);

    waveform_container.select('.label').text(row_name);

    waveform_container.call(d3.drag().filter(function () {
        return d3.event.ctrlKey;
      }).on('start', function() {
        d3.dragDisable(window);

        var start_x = d3.event.x;
        var start_y = d3.event.sourceEvent.pageY;

        var div_top = d3.event.sourceEvent.pageY;
        var div_left = d3.event.sourceEvent.pageX;
        d3.select('body').append('div')
          .attr('id', 'selection-area')
          .style('position', 'absolute')
          .style('top', div_top + 'px')
          .style('left', div_left + 'px');

        d3.event.on('drag', function () {
          var y_pos = d3.event.sourceEvent.pageY;
          var x_pos = d3.event.sourceEvent.pageX;

          if (x_pos <= div_left) {
            d3.select('#selection-area')
              .style('left', x_pos+'px')
              .style('width', div_left - x_pos + 'px');
          } else {
            d3.select('#selection-area')
              .style('left', div_left + 'px')
              .style('width', x_pos - div_left + 'px');
          }

          if (y_pos <= div_top) {
            d3.select('#selection-area')
              .style('top', y_pos + 'px')
              .style('height', div_top - y_pos + 'px');
          } else {
            d3.select('#selection-area')
              .style('top', div_top + 'px')
              .style('height', y_pos - div_top + 'px');
          }
        });

        d3.event.on('end', function () {
          d3.dragEnable(window);
          drag_callback(start_x, start_y, d3.event.x, d3.event.sourceEvent.pageY);

          d3.select('#selection-area').remove();
        });
      }));

    var visualization_area = waveform_container.select('.visualization-area');
    visualization_area.call(d3.drag().filter(function () {
        return d3.event.shiftKey;
      }).on('start', function () {
        var cur_x = d3.event.x;
        d3.event.on('drag', function () {
          ui_ctx.scroll_waveforms(this.scrollLeft + cur_x - d3.event.x);
          cur_x = d3.event.x;
        });
      }));

    visualization_area.on('scroll', function () {
      ui_ctx.scroll_waveforms(this.scrollLeft);
    });

    return waveform_container;
  }

  add_comparison_object(name, start, end, data) {
    var obj = this.append_template(this.comparison_drop_area, this.comparison_object_template);
    var obj = obj.datum(data);
    obj.select('h3').text(name);
    obj.select('p').append('span').text(` ${start}-${end}`);
  }

  make_comparison(container, comparison_name) {
    var circuit = this.append_template(container.node(), this.comparison_template);
    circuit.select('.comp-desc').text(comparison_name);
    return circuit;
  }

  get_cur_bottom() {
    // FIXME
    return d3.select('.bottom-bar');
  }

  scroll_waveforms(scroll) {
    this.get_cur_bottom().select('.cycles-area').node().scrollLeft = scroll;
    d3.selectAll('.visualization-area').each(function () {
      this.scrollLeft = scroll;
    });
  }
}

function ui_ready() {
  d3.select('#loading').remove()
  d3.select('#comparison-creator').style('display', null);
  d3.select('#cycles-bar').style('display', null);
  d3.select('#tab-container').style('display', null);
}
