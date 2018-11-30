d3.json("data/trace.json").then(ready)

var plot_layout = {
  showlegend: false,
  hovermode: 'closest'
}

function draw_waveform(div_id, waveform_data) {
  var x = [];
  var y = [];
  var prev = null;
  for (var i = 0; i < waveform_data.length; i++) {
    var cur = waveform_data[i];
    if (prev != null && prev != cur) {
      x.push(i);
      y.push(prev);
    }
    x.push(i);
    y.push(cur);
    prev = cur;
  }

  var trace = {
    x: x,
    y: y,
    type: 'scatter',
    mode: 'lines'
  }

  Plotly.newPlot(div_id, [trace], plot_layout, {displaylogo: false, displayModeBar: false});
}

function ready(data) {
  console.log(Object.keys(data['/']));
  draw_waveform('visualization-area', data['/']['top']['O']);
}

d3.selectAll("*[role='tablist']")
  .each(function() {
    // grab all of the tabs and panels
    var tabs = d3.select(this).selectAll("*[role='tab'][href]")
          .datum(function() {
            var href = this.href,
                target = document.getElementById(href.split("#").pop());
            return {
              selected: this.getAttribute("aria-selected") === "true",
              target: target
            };
          }),
        targets = tabs.data()
          .map(function(d) {
            return d.target;
          }),
        panels = d3.selectAll("*[role='tabpanel']")
          .filter(function() {
            return targets.indexOf(this) > -1;
          })
          .datum(function(d) {
            return d || {selected: false};
          });

    // when a tab is clicked, update the panels
    tabs.on("click.tab", function(d) {
      d3.event.preventDefault();
      tabs.each(function(tab) { tab.selected = false; });
      d.selected = true;
      update();
    });

    // update them to start
    update();

    function update() {
      var selected;
      tabs
        .attr("aria-selected", function(tab) {
          if (tab.selected) selected = tab.target;
          return tab.selected;
        });
      panels
        .attr("aria-hidden", function(panel) {
          panel.selected = (selected === this);
          return !panel.selected;
        })
        .style("display", function(d) {
          return d.selected ? null : "none";
        });
     d3.json("data/trace.json").then(ready)
    }
  });
