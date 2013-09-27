//Example on adding/remove nodes and links: http://bl.ocks.org/mbostock/1095795

function nodeOverlay(svg,w,h) {
    var color = d3.scale.category10();
    
    var nodes = [],
    links = [];
    this.nodes = nodes;
    this.links = links;
    var svg = svg;
    var _this = this;
    
    // Toggle children on click.
    var click = function(d) {
      start();
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
        .style('stroke-width','2px');
      link.exit().remove();
    
      node = node.data(force.nodes());
      
      var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            //.each(function(d){console.log("node enter: " + d.id)});
            
      nodeEnter.append("circle")
        .classed("circle",true)
        .attr("id",function(d) { return d.id;})
        .attr("r", 5)
        .attr("fill",function(d){
                if (d.groep == 'mdw') return "orange"
                else return "steelBlue"
        })
        .on("click", click)
        .on("mouseover", function(d, i) {
                var color = 'steelBlue'
                if (d.groep == 'mdw') color = 'yellow';
                    
                d3.selectAll('.link'+d.id).style('stroke',color);
        })
        .on("mouseout", function(d, i) { 
                d3.selectAll('.link'+d.id).style('stroke','none');
        })
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
  
    var redraw = function(project){
        //force.nodes(treenodes);
        //force.links(treelinks);
        force.nodes(nodes);
        force.links(links);
        node = node.data(force.nodes(), function(d) { return d.id;});
        node.each(function(d){
            if (d.coords){
              d.px = project(d.coords)[0];
              d.py = project(d.coords)[1];
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
    
    var addLink = function(data){
        nodes.forEach(function(node){
            if (node.id == data.nucleus){
                links.push({source: node, target: data});
            }
        });
    }
    
    var addNode = function(data){
        var isnew = true; 
        nodes.forEach(function(node){
            if (node.id == data.id){
                isnew = false;
                //Check if nucleus has changed
                if (node.nucleus != data.nucleus){
                    node.nucleus = data.nucleus;
                    links.forEach(function(link,i){
                        if (link.target.id == data.id) links.splice(i,1);
                    });
                    addLink(node);
                }
                node.name = data.name;
            }
        });
        if (isnew && data.type == 'nucleus'){
            nodes.push(data);
        }
        if (isnew && data.type == 'satellite'){
            nodes.push(data);
            addLink(data);
        }
    }
    this.addNode = addNode;
    
    var clearNodes = function(){
        nodes = [];
        links = [];
    }
    this.clearNodes = clearNodes;
    
    var removeNode = function(data){
        nodes.forEach(function(node,i){
            if (node.id == data.id) nodes.splice(i,1);
        });
        
    }
    this.removeNode = removeNode;
    
    var updateNode = function(uid){
        /*
        var node = d3.select('circle#peer' + uid);
        if (node.length > 0){
            node.style('fill','red')
            .transition().duration(1000)
            .style('fill','#dddddd')
            ;
        }*/
    }
    this.updateNode = updateNode;
    
    var updateLink = function(uid){
        var line = d3.select('line#satellite' + uid);
        if (line.length > 0){
            line.style('stroke','red')
            .style('stroke-width',3)
            .transition().duration(1000)
            .style('stroke','#dddddd')
            .style('stroke-width',1);
        }
    }
    this.updateLink = updateLink;
    
    
}


