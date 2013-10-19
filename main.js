(function() {

var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// var parseDate = d3.time.format("%d-%b-%y").parse;
var points,
    timeRange;

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .tickFormat(function(d, x) {
        return timeRange * (x - 8) / 8;
    })
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
    .x(function(d) { return x(d.time); })
    .y(function(d) { return y(d.close); })
    .interpolate('basis-open');

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.select('.zoom').on('change', _.throttle(function() {
    draw(points, this.value / this.max);
}, 100));

d3.tsv('data.tsv', function(error, data) {
    timeRange = +data[data.length - 1].time;

    data.forEach(function(d) {
        // invert time
        d.time = timeRange - d.time;
        d.close = +d.close;
    });

    points = data;

    draw(data, 1);
});

var svgX,
    svgY,
    svgPath;

function draw(data, zoom) {

    var len = data.length,
        factor = ~~(len * zoom / 500) || 1;

    data = data.slice(0, ~~(len * zoom)).filter(function(v, k) {
        return k % factor == 0;
    });

    x.domain(d3.extent(data, function(d) { return d.time; }));
    y.domain(d3.extent(data, function(d) { return d.close; }));

    svgX && svgX.remove();
    svgY && svgY.remove();
    svgPath && svgPath.remove();

    svgX = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svgY = svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Temperature delta, C");

    svgPath = svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);
}

})();
