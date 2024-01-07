function Matrix(options) {

	var margin = {top: 75, right: 50, bottom: 150, left: 100},
	    width = options.width,
	    height = options.height,
	    data = options.data,
	    container = options.container,
	    labelsData = options.labels,
	    cell_clickable = options.cell_clickable,
	    on_cell_clicked = options.on_cell_clicked,
	    max_val = 0,
	    n_rows,
	    n_cols;

	if(!data){
		throw new Error('No data passed.');
	}

	if(!Array.isArray(data) || !data.length || !Array.isArray(data[0])){
		throw new Error('Data type should be two-dimensional Array.');
	}

	n_rows = data.length;
	n_cols = data[0].length;

	for (var i = 0; i < data.length; i++) {
	    var tmp_max = Math.max.apply(Math, data[i]);
	    max_val = max_val <= tmp_max ? tmp_max : max_val;
	}

	var svg = d3.select(container).append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
		.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // X axis title
    svg.append("text")
        .attr("transform", "translate(" + (width/2) + " ," + (-40) + ")")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Predicted");

    // Y axis title
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Actual");

	var background = svg.append("rect")
	    .style("stroke", "black")
	    .style("stroke-width", "2px")
	    .attr("width", width)
	    .attr("height", height);

	var x = d3.scaleBand()
	    .domain(d3.range(n_cols))
	    .range([0, width]);

	var y = d3.scaleBand()
	    .domain(d3.range(n_rows))
	    .range([0, height]);

	var true_color_map = d3.scaleLinear()
	    .domain([0, max_val])
	    .range(["white", "steelblue"]);

    var false_color_map = d3.scaleLinear()
        .domain([0, max_val])
	    .range(["white", "tomato"]);

	var row = svg.selectAll(".row")
	    .data(data)
	  	.enter().append("g")
	    .attr("class", "row")
	    .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; });

	var cell = row.selectAll(".cell")
	    .data(function(d) { return d; })
			.enter().append("g")
	    .attr("class", "cell")
	    .attr("transform", function(d, i) { return "translate(" + x(i) + ", 0)"; })
	    .on("click", function(d, i){
	        var selected_row = this.parentNode;
	        var matrix = selected_row.parentNode;
	        var col_idx = i;
	        var row_idx = Array.from(matrix.querySelectorAll('.row')).indexOf(selected_row);
	        if (cell_clickable) {
	            on_cell_clicked(row_idx, col_idx, labelsData[row_idx], labelsData[col_idx])
	        }
	    });

	cell.append('rect')
	    .attr("width", x.bandwidth())
	    .attr("height", y.bandwidth())
	    .style("stroke-width", 0);

    cell.append("text")
	    .attr("dy", ".32em")
	    .attr("x", x.bandwidth() / 2)
	    .attr("y", y.bandwidth() / 2)
	    .attr("text-anchor", "middle")
	    .style("fill", function(d, i) { return d >= max_val / 2 ? 'white' : 'black'; })
	    .text(function(d, i) { return d; });

	row.selectAll(".cell")
	    .data(function(d, i) { return data[i]; })
	    .style("fill", function(d, i) {
	        var selected_row = this.parentNode;
	        var matrix = selected_row.parentNode;
	        var col_idx = i;
	        var row_idx = Array.from(matrix.querySelectorAll('.row')).indexOf(selected_row);
	        return col_idx == row_idx ? true_color_map(d) : false_color_map(d);
	    })
	    .style("cursor", "pointer");

	var labels = svg.append('g')
		.attr('class', "labels");

	var columnLabels = labels.selectAll(".column-label")
	    .data(labelsData)
	  .enter().append("g")
	    .attr("class", "column-label")
	    .attr("transform", function(d, i) { return "translate(" + x(i) + "," + height + ")"; });

	columnLabels.append("line")
		.style("stroke", "black")
	    .style("stroke-width", "1px")
	    .attr("x1", x.bandwidth() / 2)
	    .attr("x2", x.bandwidth() / 2)
	    .attr("y1", 0)
	    .attr("y2", 5);

	columnLabels.append("text")
	    .attr("x", 6)
	    .attr("y", y.bandwidth() / 2)
	    .attr("dy", ".32em")
	    .attr("text-anchor", "end")
	    .attr("transform", "rotate(-60)")
	    .text(function(d, i) { return d; });

	var rowLabels = labels.selectAll(".row-label")
	    .data(labelsData)
	    .enter().append("g")
	    .attr("class", "row-label")
	    .attr("transform", function(d, i) { return "translate(" + 0 + "," + y(i) + ")"; });

	rowLabels.append("line")
		.style("stroke", "black")
	    .style("stroke-width", "1px")
	    .attr("x1", 0)
	    .attr("x2", -5)
	    .attr("y1", y.bandwidth() / 2)
	    .attr("y2", y.bandwidth() / 2);

	rowLabels.append("text")
	    .attr("x", -8)
	    .attr("y", y.bandwidth() / 2)
	    .attr("dy", ".32em")
	    .attr("text-anchor", "end")
	    .text(function(d, i) { return d; });
}