d3.json("data/trace.json").then(ready)

function ready(data) {
  console.log(data)
  d3.select("body").append("p").text("Hi")
}
