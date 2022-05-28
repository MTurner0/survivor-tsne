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

// Object to array -- DELETE
const columnsToArray = obj => {
    for (let key of Object.keys(obj)) {
        obj[key] = Object.values(obj[key]);
    }
    return obj;
}


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

    //Color scale

    // Add brushing

    // Add a tooltip div and define general properties (move to CSS)
    // Its opacity is set to 0: we don't see it by default.
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
            <br>` + d.full_name + `
            <br>` + d.season_name + `</p>`)
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

    // Add points
    const scatter = svg.append("g");
    scatter
        .selectAll("circle")
        .data(castArray)
        .enter()
        .append("circle")
            .attr("cx", d => x(d["0"]))
            .attr("cy", d => y(d["1"]))
            .attr("r", 5)
            .style("fill", "#3AA845")
            .style("opacity", "0.5")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

});