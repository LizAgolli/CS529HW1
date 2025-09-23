import React, {useEffect, useRef,useMemo} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

//change the code below to modify the bottom plot view
export default function WhiteHatStats(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    //this automatically constructs an svg canvas the size of the parent container (height and width)
    //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
    //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);

  const marginTop = 10;
  const marginRight = 10;
  const marginBottom = 20;
  const marginLeft = 40;
  const radius = 10;

    //TODO: modify or replace the code below to draw a more truthful or insightful representation of the dataset. This other representation could be a histogram, a stacked bar chart, etc.
    //this loop updates when the props.data changes or the window resizes
    //we can edit it to also use props.brushedState if you want to use linking
    useEffect(()=>{
        //wait until the data loads
        if(svg === undefined | props.data === undefined){ return }

        //aggregate gun deaths by state
        const data = props.data.states;

        //data
        const stackedData = data.map(state => ({
            state: state.state.replace('_', ' '),
	    abbreviation: state.abreviation,
	    total: state.count,
            male: state.male_count,
            female: state.female_count
        }));

       //sorting states by total deaths
	stackedData.sort((a, b) => b.total - a.total);

//https://observablehq.com/@d3/stacked-bar-chart/2 https://observablehq.com/@d3/stacked-horizontal-bar-chart/2  is where I got reference code

//stacking data
const series = d3.stack().keys(['male', 'female'])(stackedData);

// Prepare the scales for positional and color encodings.
  const x = d3.scaleBand()
    .domain(stackedData.map(d => d.state))  // Use state names from your stackedData
    .range([marginLeft, width - marginRight])
    .padding(0.1);

const y = d3.scaleLinear()
    .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
    .rangeRound([height - marginBottom, marginTop]);

const color = d3.scaleOrdinal()
    .domain(series.map(d => d.key))  // ['male', 'female']
    .range(['#0671B7', '#F8B7CD'])   // Explicit colors for male/female
    .unknown("#ccc");

  // A function to format the value in the tooltip.
  const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")

  // Append a group for each series, and a rect for each element in the series.
	const chartGroup = svg.append("g");

	chartGroup.selectAll("g")
    		.data(series)
    		.join("g")
    		.attr("fill", d => color(d.key))
    		.selectAll("rect")
    		.data(D => D.map(d => (d.key = D.key, d)))
    		.join("rect")
    		.attr("x", d => x(d.data.state))  // Changed from d.data[0] to d.data.state
    		.attr("y", d => y(d[1]))
    		.attr("height", d => y(d[0]) - y(d[1]))
    		.attr("width", x.bandwidth())
    .on('mouseover', (e, d) => {
        const gender = d.key === 'male' ? 'Male' : 'Female';
        const text = `${d.data.state} ${gender}\n${formatValue(d.data[d.key])}`;
        tTip.html(text.replace('\n', '</br>'));
        props.ToolTip.moveTTipEvent(tTip, e);
    })
    .on('mousemove', (e) => {
        props.ToolTip.moveTTipEvent(tTip, e);
    })
    .on('mouseout', () => {
        props.ToolTip.hideTTip(tTip);
    });

  // Append the horizontal axis.
  const abrev = svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
  abrev.selectAll(".tick text")
    .text(d => {
        const state = stackedData.find(s => s.state === d);
        return state ? state.abbreviation : d;
    })
    .attr("font-size", "10px");

  // Append the vertical axis.
  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(null, "s"))
      .call(g => g.selectAll(".domain").remove());

  // Add chart title and legend
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Gun Deaths by State and Gender");

  // Return the chart with the color scale as a property (for the legend).
  return Object.assign(svg.node(), {scales: {color}});
},[props.data,svg]);

    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}
//END of TODO #1.

//works but x-axis text too big, how to get abbreviated names... 
