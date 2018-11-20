function parse_input_row(row) {
  return {
    id: +row.id,
    inst_name: row.inst_name,
    wire_name: row.wire_name,
    scope: row.scope,
    value: +row.value,
    cycle: +row.cycle
  };
}

d3.csv("data/trace.csv", parse_input_row).then(ready)

function ready(data) {
  console.log(data)
  d3.select("body").append("p").text("Hi")
}
