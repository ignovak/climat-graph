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
            // TODO: hardcode
            if (graph.source === 'temperature.tsv')
                graph.data = data.filter(function(v, k) {
                    return k % 6 === 0;
                });

            if (params.every(function(g) { return g.data; })) {
                _this._buildYAxis();
                _this.update();
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
        height = this.height = options.height;

    this.svg = this.root.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    this.params.forEach(function(graph) {
        graph.x = d3.scale.linear().range([0, width]);
        graph.y = d3.scale.linear().range([height, 0]);

        graph.line = d3.svg.line()
            .x(function(d) { return graph.x(d.time); })
            .y(function(d) { return graph.y(d.close); })
            .interpolate('basis-open');

        graph.svgPath = this.svg.append('path')
            .attr('stroke', graph.color)
            .attr('class', 'line');

    }.bind(this));

    this.x = this.params[0].x;
    this.axisX = d3.svg.axis().orient('bottom');
    this.svgX = this.svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + this.height + ')');

};

Graph.prototype.zoom = function() {

    this.count = 25;
    this.getStepLen = function() {
        return 20;
    };
    this.scaleX();

};

Graph.prototype.update = function() {

    this.params.forEach(function(graph) {

        graph.x.domain(d3.extent(graph.data, function(d) { return d.time; }));
        graph.svgPath
            .datum(graph.data)
            .attr('d', graph.line);

        // TODO: hardcode
        // var pathLen = graph.svgPath.node().getTotalLength();
        var totalLen = 15000,
            pathLen = totalLen;
        graph.svgPath
            .style('stroke-dasharray', pathLen + ' ' + pathLen)
            .style('stroke-dashoffset', pathLen);

        var drawGraph = function() {
            if (pathLen > 0) {
                if (this._canDraw) {
                    pathLen -= this.getStepLen();
                    graph.svgPath.style('stroke-dashoffset', pathLen > 0 ? pathLen : 0);
                }
                graph.drawTimeout = setTimeout(drawGraph, 100);
            }
            if (pathLen < totalLen / 2 && this.count === undefined) {
                this.zoom();
            }
        }.bind(this);
        drawGraph();

    }.bind(this));

    this.updateXAxis();
};

Graph.prototype.scaleX = function() {

    this.params.forEach(function(graph) {

        var i = 0,
            bound = graph.data[0].time * 0.9;

        while (Math.abs(graph.data[i] && graph.data[i].time) > Math.abs(bound))
            i++;

        graph.data = graph.data.slice(i);
        graph.x.domain(d3.extent(graph.data, function(d) { return d.time; }));
        graph.svgPath
            .datum(graph.data)
            .attr('d', graph.line);

    }.bind(this));

    this.updateXAxis();
    if (this.count--) {
        setTimeout(this.scaleX.bind(this), 100);
    }
};

Graph.prototype.updateXAxis = function() {
    this.axisX.scale(this.x);
    this.svgX.call(this.axisX);
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
