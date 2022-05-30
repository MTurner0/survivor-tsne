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

const leg = d3.select("#legend")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height / 2);

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

// This function will convert the JSON readout from an object of objects to an array of arrays
const processJson = obj => {
    const jsonArray = Array();
    for (let key of Object.keys(obj)) {
        jsonArray.push(obj[key])
    }
    return jsonArray;
}

// This function will make a sequence (Array if length > 1) of numbers
function makeSequence(start, end, length) {
    if(length == 1) {
        return (start + end)/2;
    }
    const increment = (end - start)/(length - 1);
    const seq = [start];
    for(let i=0; i<(length - 1); i++) {
        seq.push(seq[i] + increment)
    }
    return seq;
}

function constructUniqueSet(col, dataArray) {
    let uniqueSetConstructor = Array();
    for(let element of dataArray) {
        uniqueSetConstructor.push(element[col]);
    }
    let uniqueSet = [... new Set(uniqueSetConstructor)].filter(d => {
        if(d !== null) {
            return true;
        } else {
            return false;
        }
    });
    console.log(uniqueSet);
    return uniqueSet;
}

function makeLegend(colorScale, title, infoArray, dataArray) {
    // Clear old legend
    leg.selectAll("circle")
        .remove();
    leg.selectAll("text")
        .remove();

    // Add title
    /* leg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top)
        .text(title)
        .style("font-size", "18px"); */

    // Check whether scale is sequential or ordinal
    if(infoArray[1] == "seq") {
        scaleDomain = makeSequence(infoArray[3][0], infoArray[3][1], 5);
        console.log(scaleDomain);
        leg.selectAll("circle")
            .data(scaleDomain)
            .enter()
            .append("circle")
                .attr("cx", function (d, i) { return 150 + i*100 })
                .attr("cy", height / 4)
                .style("r", 7)
                .style("fill", function (d) { return colorScale(d) });
        const placeArray = ["First boot", "Pre-merge boot", "Merge boot", "Juror", "Finale"];
        leg.selectAll("text")
            .data(scaleDomain)
            .enter()
            .append("text")
                .attr("x", function (d, i) { return 150 + i*100 })
                .attr("y", height / 6)
                .style("fill", function (d) { return colorScale(d) })
                .text(function(d, i) {
                    if(title == "Placement") { // Special text for Placement scale
                        return placeArray[i];
                    }
                    return Math.round(d) })
                .style("text-anchor", "middle")
                .style("alignment-baseline", "middle")
                .style("font-size", "15px");
    } else {
        scaleDomain = constructUniqueSet(infoArray[0], dataArray);
        let x_pos = makeSequence(margin.left, width - margin.right, scaleDomain.length);
        let y_pos = [];
        if(title == "State") {
            for(let i=0; i<scaleDomain.length; i++) {
                if(i < 8) {
                    y_pos.push(100);
                }
                if(i < 16) {
                    y_pos.push(150);
                } if(i < 24) {
                    y_pos.push(200);
                } if(i < 32) {
                    y_pos.push(250);
                } if(i < 40) {
                    y_pos.push(300);
                } else {
                    y_pos.push(350);
                }
            }
        } if(title == "Personality type") {
            for(let i=0; i<scaleDomain.length; i++) {
                if(i % 2 == 0){
                    y_pos.push(height / 5);
                } else { y_pos.push( height / 3); }
            }
        } else {
            for(let i=0; i<scaleDomain.length; i++) {
                y_pos.push(height / 5);
            }
        }
        console.log(x_pos);
        leg.selectAll("circle")
            .data(scaleDomain)
            .enter()
            .append("circle")
                .attr("cx", function (d, i) { return x_pos[i]; })
                .attr("cy", function (d, i) { return y_pos[i]; } )
                .attr("r", 7)
                .style("fill", function (d) { return colorScale(d) });
        leg.selectAll("text")
            .data(scaleDomain)
            .enter()
            .append("text")
                .attr("x", function (d, i) { return x_pos[i]; })
                .attr("y", function (d, i) { return y_pos[i] - 20; })
                .style("fill", function (d) { return colorScale(d) })
                .text(function(d){ return d })
                .attr("text-anchor", "middle")
                .style("alignment-baseline", "middle")
                .style("font-size", "13px");
    }
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

    // Map menu imput to selection
    const menuMap = {'Season': ['season', 'seq', d3.interpolateRainbow, [1, 42]],
                    'Confessional count': ['confessional_count', 'seq', d3.interpolateWarm, [1, 108]],
                    'State': ['state', 'ord', ["#e32636", "#5d8aa8", "#ffbf00", "#9966cc", "#a4c639", "#915c83", "#008000", "#00ffff", "#7fffd4", "#4b5320", "#b2beb5", "#ff9966", "#a52a2a", "#007fff", "#f4c2c2", "#21abcd", "#9f8170", "#3d2b1f", "#8a2be2", "#de5d83", "#cc0000", "#006a4e", "#873260", "#b5a642", "#66ff00", "#d19fe8", "#a52a2a",
                    "#ffc1cc", "#800020", "#cc5500", "#e97451", "#91a3b0", "#4b3621", "#78866b", "#00cc99", "#ed9121", "#ff0040", "#36454f", "#0047ab", "#8c92ac", "#b87333", "#ff7f50", "#990000", "#00008b", "#1a2421", "#177245", "#ffa812", "#801818", "#df73ff", "#4b0082", "#ff4f00", "#00a86b"]],
                    'Placement': ['prop_sur', 'seq', d3.interpolateTurbo, [0.13, 1]],
                    'Age': ['age', 'seq', d3.interpolateCool, [18, 75]],
                    'Personality type': ['personality_type', 'ord', ["#00a86b", "#a50b5e", "#bdda57", "#5a4fcf", "#ff4f00", "#ccccff", "#26619c", "#20b2aa", "#534b4f", "#800000", "#0067a5", "#ffdb58", "#000080", "#0f0f0f", " #78184a", "#96ded1"]],
                    'Gender': ['gender', 'ord', d3.schemeAccent]}

    dropdown // Add button
        .selectAll("options")
            .data(Object.keys(menuMap))
        .enter()
            .append("option")
        .text(function (d) { return d; }) // Show text in the menu
        .attr("value", function (d) { return d; }); // Return value

    const getColor = (selectionArray) => {
        if(selectionArray[1] == 'seq') {
            let newScale = d3.scaleSequential(selectionArray[2])
                .domain(selectionArray[3]);
            return newScale;
        }
        // For ordinal scales
        let newScale = d3.scaleOrdinal(selectionArray[2])
            .domain(constructUniqueSet(selectionArray[0], castArray));
        return newScale;
    }

    dropdown.on("change", function() {
        let choice = d3.select(this).property("value");
        let selectionArray = menuMap[choice];
        console.log(selectionArray);

        let color = getColor(selectionArray); // Get new scale

        scatter
        .selectAll("circle")
            .style("fill", d => color(d[selectionArray[0]]));

        makeLegend(color, choice, selectionArray, castArray);

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