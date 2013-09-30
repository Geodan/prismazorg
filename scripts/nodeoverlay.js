//Example on adding/remove nodes and links: http://bl.ocks.org/mbostock/1095795

function nodeOverlay(svg,w,h) {
    var color = d3.scale.category10();
    
    var nodes = [],
    links = [];
    this.nodes = nodes;
    this.links = links;
    var svg = svg;
    var _this = this;
    
    //Adding a tooltip div
    var div = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);
    
    //A per feature styling method
    this.styling = function(d){ 
        for (var key in _this.style) { //First check for generic layer style
            d3.select(this)
            .style(key,function(d){
                if (d.style && d.style[key])
                    return d.style[key]; //Override with features style if present
                else	
                    return _this.style[key]; //Apply generic style
            });
        };
        //Now apply remaining styles of feature (possible doing a bit double work from previous loop)
        if (d.style) { //If feature has style information
            for (var key in d.style){ //run through the styles
                d3.select(this).style(key,d.style[key]); //and apply them
            }
        }
    };     
        
        
    // Toggle children on click.
    var click = function(d) {
        if (d.active){
            d.active = false;
            d3.select(this).attr('r',5);
            d3.selectAll('.link'+d.id).style('stroke','none');
        }
        else{
            d.active = true;
            d3.select(this).attr('r',10);
            var color = 'steelBlue'
            if (d.groep == 'mdw') color = 'orange';
            d3.selectAll('.link'+d.id).style('stroke',color);
        }
    }
    
    
    
    
    var tick = function() {
      //node.attr("cx", function(d) { return d.x; })
      //    .attr("cy", function(d) { return d.y; })
      node.attr("transform", function(d) { 
            return "translate(" + d.x + "," + d.y + ")"; 
          });
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
    }
    
    // init force layout
    var force = d3.layout.force()
        .nodes(this.nodes)
        .links(this.links)
        .gravity(0)
        //.charge(-40)
        .linkDistance(50)
        .size([w, h])
        .on("tick", tick);
    this.force = force;    
    
    var node = svg.selectAll(".node"),
        link = svg.selectAll(".link");
    /* Mapdragtest. purpose is to get a dx dy after dragging the map so we can properly set the nodes
    var mapdrag = d3.behavior.drag()
        .origin(Object)
        .on("drag", dragmove);
    function dragmove(d) {
        console.log('dragged!');
      d3.select(this);
        //.etcetera      
    }    
    svg.call(mapdrag);
    */    
    var start = function() {
      force.nodes(this.nodes)
        .links(this.links)
        .start();
      

    link = link.data(force.links());
      var linkenter = link.enter().append("line")
//        .classed("link", true)
        .attr("id",function(d) { return d.source.id + "-" + d.target.id;})
        .attr("class",function(d) { return "link"+ d.source.id + " link" + d.target.id;})
        .style('stroke','none')
        .style('stroke-width','2px')
        .style('opacity',0.7);
      link.exit().remove();
      
      node = node.data(force.nodes());
      
      var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            //.each(function(d){console.log("node enter: " + d.id)});
      function onmouseover(d){
        var color = 'steelBlue';
        if (d.groep == 'mdw') color = 'orange';
        d3.selectAll('.link'+d.id)
            .style('stroke',color).style("opacity", 1)

        if (d.html){
            div.transition()        
                .duration(200)      
                .style("opacity", .9);      
            div .html(d.html + "<br/>")  
                .style("left", (d3.event.pageX) + "px")     
                .style("top", (d3.event.pageY - 28) + "px");
        }
      }
      function onmouseout(d){
        if (!d.active){
            d3.selectAll('.link'+d.id)
                .style('stroke','none');
        }
        div.transition()        
            .duration(500)      
            .style("opacity", 0); 
	  }
      nodeEnter.append("circle")
        .attr("class",function(d){return d.product})
        .attr("id",function(d) { return d.id;})
        .attr("r", function(d){
                if (d.groep == 'mdw') return 5
                else if (d.groep == 'clnt') return 5
                else return 10
        })
        .attr("fill",function(d){
                if (d.groep == 'mdw') return "orange"
                else return "steelBlue"
        })
        .each(_this.styling)
        .on("click", click)
        .on("mouseover", onmouseover)
        .on("mouseout", onmouseout)
        .call(force.drag);
        
      //nodeEnter.append("text")
      //  .classed("nodetext",true)
      //  .classed('foo',function(d) { return "node " + d.type; })
      //  .attr("dx", 12)
      //  .attr("dy", ".35em")
      //  .text(function(d) {return d.name});
      
      node.selectAll('text').text(function(d){return d.name;});
      node.exit().remove();
      
      
      force.start();
      d3.timer(force.resume);
    }
    this.start = start;
  
    var redraw = function(map){
        var project = function(x){
            var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0])); //Leaflet version
            return [point.x,point.y];
        }
        //force.nodes(treenodes);
        //force.links(treelinks);
        force.nodes(this.nodes);
        force.links(this.links);
        node = node.data(force.nodes(), function(d) { return d.id;});
        node.each(function(d){
            
            if (d.xcoord){
              coords = [d.xcoord, d.ycoord];
              d.px = project(coords)[0];
              d.py = project(coords)[1];
            }
            else {
               //d.px = d.px + _this.moved[0];
               //d.py = d.py + _this.moved[1];
            }
        });
        force.start();
        //d3.timer(force.resume);
    }
    this.redraw = redraw;
    
}


