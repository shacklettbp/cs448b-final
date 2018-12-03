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

    this.panel_idx = 1;
    this.tab_container = d3.select('#tab-container').node();
    this.body = d3.select('body').node();
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

  make_panel() {
    var panel_num = this.panel_idx++;
    var tab = this.append_template(this.tab_container, this.tab_template);
    tab = tab.select('a');
    tab.select('.tab-target').text(panel_num);

    tab.on('click', function(d) {
      d3.event.preventDefault();
      d3.selectAll("*[role='tabpanel']")
        .style('display', 'none')
        .attr('aria-hidden', true);

      d3.selectAll("*[role='tab']")
        .attr('aria-selected', false);

      d.style('display', null)
       .attr('aria-hidden', false);

      d3.select(this).attr('aria-selected', true);
    });

    var panel = this.append_template(this.body, this.panel_template);
    tab.datum(panel);
    panel.select('.panel-num').text(panel_num);
    panel.style('display', 'none');

    return panel;
  }

  make_scope(panel, scope_name) {
    var scope = this.append_template(panel.node(), this.scope_template);
    scope.select('.scope-value').text(scope_name);
    return scope;
  }

  make_circuit(scope, circuit_name) {
    var circuit = this.append_template(scope.node(), this.circuit_template);
    circuit.select('.circuit-name').text(circuit_name);
    return circuit;
  }

  make_waveform(circuit, row_name) {
    var waveform_container = this.append_template(circuit.node(), this.waveform_template);
    circuit.select('.label').text(row_name);
    return waveform_container;
  }
}

function ui_ready() {
  d3.select('#loading').remove()
  d3.select('#comparison-creator').style('display', null);
  d3.select('#tab-container').style('display', null);
}
