function Graph(root, source, params) {

    this.root = root;
    this.getStepLen = params.getStepLen || function() {
        return 100;
    };
    this._canDraw = true;

    this.init(params);

    d3.tsv(source, function(error, data) {
        data.forEach(function(d) {
            d.time = +d.time;
            d.close = +d.close;
        });

        this.points = data;

        this._buildYAxis(data);
        this.update(data, 1);
    }.bind(this));

}

Graph.prototype.init = function(params) {

    var margin = params.margin,
        width = params.width,
        height = this.height = params.height,
        x = this.x = d3.scale.linear().range([0, width]),
        y = this.y = d3.scale.linear().range([height, 0]);

    this.xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom');

    this.yAxis = d3.svg.axis()
        .scale(y)
        .orient('left');

    this.line = d3.svg.line()
        .x(function(d) { return x(d.time); })
        .y(function(d) { return y(d.close); })
        .interpolate('basis-open');

    this.svg = this.root.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

};

Graph.prototype.update = function(data, zoom) {

    var len = data.length,
        factor = ~~(len * zoom / 500) || 1;

    data = data.slice(~~(len * (1 - zoom))).filter(function(v, k) {
        return k % factor == 0;
    });

    this.x.domain(d3.extent(data, function(d) { return d.time; }));

    this.svgX && this.svgX.remove();
    this.svgPath && this.svgPath.remove();
    clearTimeout(this.drawTimeout);

    this.svgX = this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

    this.svgPath = this.svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", this.line);

    var pathLen = this.svgPath.node().getTotalLength();
    this.svgPath
        .style('stroke-dasharray', pathLen + ' ' + pathLen)
        .style('stroke-dashoffset', pathLen);

    var drawGraph = function() {
        if (pathLen > 0) {
            this._canDraw && this.svgPath.style('stroke-dashoffset', pathLen -= this.getStepLen());
            this.drawTimeout = setTimeout(drawGraph, 100);
        }
    }.bind(this);
    drawGraph();

};

Graph.prototype.toggleDrawing = function() {
    this._canDraw = !this._canDraw;
    return this._canDraw;
};

Graph.prototype.destruct = function() {
    this.root.node().innerHTML = '';
};

Graph.prototype._buildYAxis = function(data) {
    this.y.domain(d3.extent(data, function(d) { return d.close; }));
    this.svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Temperature delta, C");
};
