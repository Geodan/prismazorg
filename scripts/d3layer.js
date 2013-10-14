var tmp;
var d3layer = function(layername, config){
		var f = {}, bounds, feature, collection;
		this.f = f;
		var _this = this;        
		var layername = layername;
		f.layername = layername;
		this.data;
		this.type = config.type || "path";
		this.freq = 100;
		this.g = config.g;
		this.map = config.map;
		this.style = config.style;
		this.autoclean = config.autoclean || true;
		this.minzoomlevel = config.minzoomlevel || 1;
		this.mouseoverContent = config.mouseoverContent;
		this.classfield = config.classfield;
		this.satellites = config.satellites || false;
        this.eachFunctions = config.eachFunctions || false;		
        this.chartconfig = config.chartconfig;
		this.labels = config.labels || false;
		this.labelconfig = config.labelconfig;
		this.highlight = config.highlight || false;
		this.scale = config.scale || 'px';
		this.pointradius = config.pointradius || 5;
		this.bounds = [[0,0],[1,1]];
		var width, height,bottomLeft,topRight;
		
        //Adding a tooltip div
        var div = d3.select("body").append("div")   
            .attr("class", "tooltip")               
            .style("opacity", 0);
        
        var legend = d3.select("#legend").append("div");
		
		if (config.maptype == 'OpenLayers'){//Getting the correct OpenLayers SVG. 
			var div = d3.selectAll("#" + config.divid);
			div.attr("z-index",10001);
			div.selectAll("svg").remove();
			var svg = div.append("svg");
		}
		else if (config.maptype == 'Leaflet') { //Leaflet does it easier
			/* Initialize the SVG layer */
			this.map._initPathRoot()    
			var svg = d3.select("#map").select("svg");
		}
		else if (config.maptype == 'D3') {
		    var svg = this.map; 
		}
		
		var g = svg.append("g");
        var projection = d3.geo.mercator()
            .translate([-500,10640])
            .scale(60000);
        
        this.getZoomLevel = function(){
            var zoomleven = 0;
            if (config.maptype == 'Leaflet') {
                zoomlevel = _this.map.getZoom();
            }
            return zoomlevel;
        }
        
        // Projecting latlon to screen coordinates
		this.project = function(x) {
		  if (config.maptype == 'D3') {
		    var point = projection(x);
		    return [point[0],point[1]];
		  }
		  else if (config.maptype == 'Leaflet') {
		  	  var point = _this.map.latLngToLayerPoint(new L.LatLng(x[1], x[0])); //Leaflet version
		  }
		  else if (config.maptype == 'OpenLayers'){
		  	  var loc =  new OpenLayers.LonLat(x[0],x[1]);
		  	  var fromproj = new OpenLayers.Projection("EPSG:4326");
		  	  var toproj = new OpenLayers.Projection("EPSG:900913");
		  	  loc.transform(fromproj, toproj);
		  	  var point = _this.map.getViewPortPxFromLonLat(loc); //OpenLayers version
		  }
		  else {
		  	  console.warn("Error, no correct maptype specified for d3 layer " + layername);
		  	  return;
		  }
		  return [point.x, point.y];
		};
		
		
		var olextentproject = function(x){
			var point = _this.map.getViewPortPxFromLonLat(new OpenLayers.LonLat(x[0],x[1]));
			return [point.x,point.y];
		}
		//Set the SVG to the correct dimensions
		this.set_svg = function(){
			var extent = _this.map.getExtent();
			bottomLeft = olextentproject([extent.left,extent.bottom]);
			topRight = olextentproject([extent.right,extent.top]);
			width = topRight[0] - bottomLeft[0];
			height = bottomLeft[1] - topRight[1];
			svg.attr("width", width)
				.attr("height", height)
				.style("margin-left", bottomLeft[0] + "px")
				.style("margin-top", topRight[1] + "px");
		}
		if (config.maptype == 'OpenLayers')
			this.set_svg();
	
		
		this.geoPath = d3.geo.path().projection(this.project);
		
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
		
		//A per feature styling method
		this.textstyling = function(d){ 
			for (var key in _this.labelconfig.style) { //First check for generic layer style
				d3.select(this).style(key,function(d){
					if (d.labelconfig && d.labelconfig.style && d.labelconfig.style[key])
						return d.labelconfig.style[key]; //Override with features style if present
 					else	
						return _this.labelconfig.style[key]; //Apply generic style
				});
			};
			//Now apply remaining styles of feature (possible doing a bit double work from previous loop)
			if (d.labelconfig && d.labelconfig.style) { //If feature has style information
				for (var key in d.labelconfig.style){ //run through the styles
					d3.select(this).style(key,d.labelconfig.style[key]); //and apply them
				}
			}
		};
		
		//Some path specific styles (point radius, label placement eg.)
		this.pathStyler = function(d){ 
		    if (d.style && d.style.radius)
		        _this.geoPath.pointRadius(d.style.radius);
		    else if (_this.style && _this.style.radius)
		        _this.geoPath.pointRadius(_this.style.radius);

		    return _this.geoPath(d);
		};
		
		//Calculating the location of the label, based on settings
		this.textLocation = function(d){
		    var textLocation = _this.geoPath.centroid(d);
		    /*
		    var bounds = _this.geoPath.bounds(d);
		    */
		    if (_this.style && _this.style.textlocation){
		        switch(_this.style.textlocation){
		          case 'ul':
		            textLocation[0] = bounds[0][0];
		            textLocation[1] = bounds[0][1];
		            break;
		          case 'ur':
		            textLocation[0] = bounds[1][0];
		            textLocation[1] = bounds[1][1];
		            break;
		          //TODO: add other positions
		        }
		    }
		    else {
		        textLocation[1] = textLocation[1] + 20; //a bit down..
		    }
		    return textLocation;
		}
		
		f.clean = function(){
		    g.selectAll(".entity").remove();
		    return f;
		}
		
		//The part where new data comes in
		f.data = function(collection){
		    if (!collection){
		        return _this.data; 
		    }
		    _this.data = collection;
	    
			if (config.maptype == 'OpenLayers')
				_this.set_svg();
            
			//Create a 'g' element first, in case we need to bind more then 1 elements to a data entry
			var entities = g.selectAll(".entity")
			    .data(collection.features, function(d){return d.id;});
			
			//On enter
			var newentity = entities.enter()
			    .append('g')
			    .classed('entity',true)
			    .attr('opacity',0);
			newentity
			    .transition()
			    .duration(500)
			    .attr('opacity',1)
			    ;

		    if (_this.type == "path" || _this.type == "circle"){
			    newentity.append("path")
			        //.classed("zoomable",true)
			        
			        .attr('class',function(d){
			            if (_this.classfield)
			                return escape(d.properties[_this.classfield]);
			            else return "foo";
			        })
			        .each(_this.styling)
			        ;
			}
 
			
			if (_this.labels){
			    var label = newentity.append('g')
			        .classed('place-label',true);
			    //On new:	
				label
					.append('text')
					.attr("x",function(d) {return _this.textLocation(d)[0] ;})
					.attr("y",function(d) {return _this.textLocation(d)[1] ;})
					//.classed("zoomable",true)
					.attr('text-anchor', 'left')
					.style('stroke','white')
					.style('stroke-width','3px')
					.style('stroke-opacity',.8)
					.text(function(d) {
							if (_this.labelconfig.field)
								return d.properties[_this.labelconfig.field];
							else
								return d.id; 
					});
				label
					.append('text')
					.attr("x",function(d) {return _this.textLocation(d)[0] ;})
					.attr("y",function(d) {return _this.textLocation(d)[1] ;})
					//.classed("zoomable",true)
					.attr('text-anchor', 'left')
					.each(_this.textstyling)
					.text(function(d) {
							if (_this.labelconfig.field)
								return d.properties[_this.labelconfig.field];
							else
								return d.id; 
					})
			} //End of new label
			
            //Add custum functions to each feature
            if (_this.eachFunctions){
                _this.eachFunctions.forEach(function(f){
                    newentity.each(function(d,i){
                        f(d,i,this,_this);
                    });
                });
            }
            
			//On update
			entities.each(function(d,i){
			    var entity = d3.select(this);
			    if (_this.type == "path" || _this.type == "circle"){
			        entity.select('path') //Only 1 path per entity
			            .transition().duration(500)
			            .attr("d",_this.pathStyler(d))
			            ;
			    }
			    if (_this.labels){
			        entity.select('.place-label')
                        .selectAll('text')
                        .transition().duration(500)
                        .attr("x", _this.textLocation(d)[0] )
                        .attr("y", _this.textLocation(d)[1] )
                        .text(function(foo) {
                            if (_this.labelconfig.field)
                                return d.properties[_this.labelconfig.field];
                            else
                                return d.id; 
                        })
			    }
			});
			//On exit
			entities.exit().transition().duration(500).attr('opacity',0).remove();
			
			
			function onmouseover(item, d){
			    if (_this.mouseoverContent){
                    div.transition()        
                        .duration(200)      
                        .style("opacity", .9);      
                    div .html(d[_this.mouseoverContent] + "<br/>")  
                        .style("left", (d3.event.pageX) + "px")     
                        .style("top", (d3.event.pageY - 28) + "px");
                }
                /*
			    d3.select(item)
			        .transition().duration(10)
			        .attr('fill','white')
			        .transition().duration(500)
			        .attr('fill',function(d){
			            console.log(d);
                        if (data.color)
                            return data.color;
                        else
                            return _this.fillcolor;
                    });
                    */
			        
			}
			function onmouseout(item, data){
			    div.transition()        
                    .duration(500)      
                    .style("opacity", 0); 
			}
			//On mouse interaction
			newentity.on("mouseover",function(d) {
				onmouseover(this,d);
			});
			newentity.on("mouseout",function(d) {
				onmouseout(this,d);
			});
			return f;
        }
    
        //Redraw all features
		f.reset = function() {
			if (config.maptype == 'OpenLayers')
				_this.set_svg();
			//var opacity = 1;
			//if (this.minZoomLevel > _this.getZoomLevel())
			//{
			//    var opacity = 0;
			//}
			g.selectAll(".entity")
			    .each(function(d,i){
			        var entity = d3.select(this);
			        
			        if (_this.type == "path" || _this.type == "circle"){
                        entity.select('path') //Only 1 path per entity
                            .attr("d",_this.pathStyler(d));
                    }
                     if (_this.labels){
                        entity.select('.place-label')
                            .selectAll('text')
                            .attr("x", _this.textLocation(d)[0] )
                            .attr("y", _this.textLocation(d)[1] )
                            .text(function(foo) {
                                if (_this.labelconfig.field)
                                    return d.properties[_this.labelconfig.field];
                                else
                                    return d.id; 
                            })
                    }
                    
                    entity.select('g.zoomable')
                        .attr("transform", function(d){
                            if (d.geometry.type == 'Point'){
                                var x = _this.project(d.geometry.coordinates)[0];
                                var y = _this.project(d.geometry.coordinates)[1];
                            }
                            else {
                                var x = _this.geoPath.centroid(d)[0];
                                var y = _this.geoPath.centroid(d)[1];
                            }
                            return "translate(" + x + "," + y + ")"
                        })
                        .transition().duration(500)
                        .attr('opacity',function(d){
                                if (d.minzoomlevel && d.minzoomlevel > _this.getZoomLevel()){
                                    return 0;
                                }
                                else return 1;
                        });
    
                    
			    });
		}
		f.reset();
		
		
		
		return f;
	}
