function Graph(root, params, options) {

    var _this = this;

    this.root = root;
    this.params = params;
    this.getStepLen = options.getStepLen || function() {
        return 100;
    };
    this._canDraw = true;

    this.init(options);

    params.forEach(function(graph) {
        d3.tsv(graph.source, type, function(error, data) {

            graph.data = data;
            if (graph.source === 'data.tsv')
                graph.data = data.filter(function(v, k) {
                    return k % 6 === 0;
                });

            if (params.every(function(g) { return g.data; })) {
                _this._buildYAxis();
                _this.update(1);
            }
        });
    });

    function type(d) {
        d.time = +d.time;
        d.close = +d.close;
        return d;
    }

}

Graph.prototype.init = function(options) {

    var margin = options.margin,
        width = this.width = options.width,
        height = this.height = options.height,
        x,
        y = this.y = d3.scale.linear().range([height, 0]);

    this.params.forEach(function(graph) {
        x = graph.x = d3.scale.linear().range([0, width]);
        graph.y = d3.scale.linear().range([height, 0]);

        graph.line = d3.svg.line()
            .x(function(d) { return graph.x(d.time); })
            .y(function(d) { return graph.y(d.close); })
            .interpolate('basis-open');

    });

    this.xAxis = d3.svg.axis().scale(this.params[0].x).orient('bottom');

    this.svg = this.root.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

};

Graph.prototype.update = function(zoom) {

    var x;

    this.params.forEach(function(graph) {

        x = graph.x;

        graph.x.domain(d3.extent(graph.data, function(d) { return d.time; }));

        var svgPath = this.svg.append('path')
            .datum(graph.data)
            .attr('stroke', graph.color)
            .attr('class', 'line')
            .attr('d', graph.line);

        // var pathLen = svgPath.node().getTotalLength();
        var pathLen = 15000;
        svgPath
            .style('stroke-dasharray', pathLen + ' ' + pathLen)
            .style('stroke-dashoffset', pathLen);

        var drawGraph = function() {
            if (pathLen > 0) {
                if (this._canDraw) {
                    pathLen -= this.getStepLen();
                    svgPath.style('stroke-dashoffset', pathLen > 0 ? pathLen : 0);
                }
                graph.drawTimeout = setTimeout(drawGraph, 100);
            }
        }.bind(this);
        drawGraph();

    }.bind(this));

    this.svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + this.height + ')')
        .call(d3.svg.axis().scale(x).orient('bottom'));

    return;

    this.svgX && this.svgX.remove();
    this.svgPath && this.svgPath.remove();
    clearTimeout(this.drawTimeout);

};

Graph.prototype.toggleDrawing = function() {
    this._canDraw = !this._canDraw;
    return this._canDraw;
};

Graph.prototype.destruct = function() {
    this.root.node().innerHTML = '';
};

Graph.prototype._buildYAxis = function() {
    this.params.forEach(function(graph, i) {
        graph.y.domain(d3.extent(graph.data, function(d) { return d.close; }));
        this.svg.append('g')
            .attr('class', 'y axis')
            .call(d3.svg.axis().scale(graph.y).orient(graph.orient))
            .attr('transform', 'translate(' + this.width * i + ', 0)')
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -20 * i + 6)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text(graph.text);
    }.bind(this));
};
