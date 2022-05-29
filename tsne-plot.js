// set the dimensions and margins of the graph
const margin = {top: 30, right: 30, bottom: 30, left: 30},
    width = 750 - margin.left - margin.right,
    height = 750 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#castaway-tsne")
.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
.append("g")
    .attr("transform",
        `translate(${margin.left}, ${margin.top})`);

const url = "data/processed/tsne-results.json";

// This function collects the JSON file
const fetchJson = async () => {
    try {
        const file = await fetch(url);
        const tsneRes = await file.json();
        console.log("Data collected.")
        return(tsneRes);
    } catch (error) {
        console.log(error);
    }
};

const processJson = obj => {
    const jsonArray = Array();
    for (let key of Object.keys(obj)) {
        jsonArray.push(obj[key])
    }
    return jsonArray;
}

fetchJson().then((data) => {

    const castArray = processJson(data);

    // Add x-axis
    const x = d3.scaleLinear()
        .domain([ d3.min(castArray, d => d["0"]), d3.max(castArray, d => d["0"])])
        .range([ 0, width ]);
    const xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add y-axis
    const y = d3.scaleLinear()
        .domain([ d3.min(castArray, d => d["1"]), d3.max(castArray, d => d["1"])])
        .range([ height, 0 ]);
    const yAxis = svg.append("g")
        .call(d3.axisLeft(y));

    // Add a clipPath: everything outside of this region will not be drawn
    const clip = svg.append("defs")
        .append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    // Define brushing
    const brush = d3.brush()
        .extent([ [0,0], [width, height] ])
        .on("end", updateChart); // Trigger updateChart() each time brush selection changes

    // Set timeout to null
    let idleTimeout;
    function idled() { idleTimeout = null; };

    // Update the chart for given boundaries
    function updateChart() {

        extent = d3.brushSelection(this);

        // If no selection, back to initial coordinates
        if(!extent) {
            if(!idleTimeout) return idleTimeout = setTimeout(idled, 350); // Wait a bit before resetting
            x.domain([ d3.min(castArray, d => d["0"]), d3.max(castArray, d => d["0"])]);
            y.domain([ d3.min(castArray, d => d["1"]), d3.max(castArray, d => d["1"])]);
        } else {
            x.domain([ x.invert(extent[0][0]), x.invert(extent[1][0]) ])
            y.domain([ y.invert(extent[1][1]), y.invert(extent[0][1])])
            scatter.select(".brush").call(brush.move, null); // This will remove the grey brush area when finished brushing
        }

        // Update axis and point positions
        xAxis.transition().duration(1000).call(d3.axisBottom(x));
        yAxis.transition().duration(1000).call(d3.axisLeft(y));
        scatter
            .selectAll("circle")
            .transition().duration(1000)
            .attr("cx", d => x(d["0"]))
            .attr("cy", d => y(d["1"]));

    }

    // Initialize menu
    const dropdown = d3.select("#castaway-tsne")
        .append("select");

    dropdown // Add button
        .selectAll("options")
            .data(['Season', 'Age', 'Placement', 'State'])
        .enter()
            .append("option")
        .text(function (d) { return d; }) // Show text in the menu
        .attr("value", function (d) { return d; }); // Return value

    const getColor = (menuSelection) => {
        if(menuSelection == "age") {
            let newScale = d3.scaleSequential(d3.interpolateWarm)
                .domain([ 18, 75 ]);
            return newScale;
        }
        if(menuSelection == "prop_sur") {
            let newScale = d3.scaleSequential(d3.interpolateTurbo)
                .domain([ 0, 1 ]);
            return newScale;
        }
        if(menuSelection == "season") {
            let newScale = d3.scaleSequential(d3.interpolateRainbow)
                .domain([1, 42]);
            return newScale;
        }
        // For state
        let uniqueSetConstructor = Array();
        for(let castaway of castArray) {
            uniqueSetConstructor.push(castaway[menuSelection]);
        }
        let uniqueSet = [... new Set(uniqueSetConstructor)].filter(d => {
            if(d !== null) {
                return true;
            } else {
                return false;
            }
        });
        console.log(uniqueSet);
        let newScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(uniqueSet);
        return newScale;
    }

    // Map menu imput to selection
    const menuMap = {'Season': 'season', 'State': 'state', 'Placement': 'prop_sur', 'Age': 'age'}

    dropdown.on("change", function() {
        let selectedColor = menuMap[d3.select(this).property("value")];
        console.log(selectedColor);

        let color = getColor(selectedColor);

        scatter
        .selectAll("circle")
            .style("fill", d => color(d[selectedColor]));

    })

    // Add a tooltip div
    const tooltip = d3.select("#castaway-tsne")
        .append("div")
        .style("opacity", 1)
        .attr("class", "tooltip");

    // Functions for tooltip
    // A function that change this tooltip when the user hover a point.
    // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
    const mouseover = function(event, d) {
        tooltip
            .style("visibility", "visible");
    }

    const mousemove = function(event, d) {
        tooltip
            .html(`<p class="tooltip-text"><strong>` + d.short_name + `</strong>
            <br>` + d.result + `
            <br><em>` + d.season_name + `</em></p>`)
            .style("left", (2 * event.x)/3 + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
            .style("top", (event.y)/2 + "px");
    }

    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    const mouseleave = function(event,d) {
        tooltip
            .transition()
            .duration(200)
            .style("visibility", "hidden");
    }

    // Create div for brush and points
    const scatter = svg.append("g")
        .attr("clip-path", "url(#clip)");

    // Add brushing -- the brush needs to be appended before the points!
    // Otherwise the brush will obscure pointer events
    scatter
        .append("g")
            .attr("class", "brush")
            .call(brush);

    scatter
        .selectAll("circle")
        .data(castArray)
        .enter()
        .append("circle")
            .attr("cx", d => x(d["0"]))
            .attr("cy", d => y(d["1"]))
            .attr("r", 7)
            .style("opacity", "0.5")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

});