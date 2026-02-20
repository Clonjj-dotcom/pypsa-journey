import re

with open('index.html', 'r') as f:
    content = f.read()

# Find and replace the SVG map with D3 container
# Look for the specific pattern in the generator screen
old_pattern = r'<div class="map-container">\s*<svg id="europeMap"[^>]*>.*?</svg>\s*</div>'

new_html = '''<div class="map-container">
                        <div id="d3Map" style="width: 100%; height: 450px; background: #1e293b; border-radius: 8px;"></div>
                    </div>
                    <script src="https://d3js.org/d3.v7.min.js"></script>
                    <script src="https://unpkg.com/topojson@3"></script>
                    <script>
                        (function() {
                            const width = 800, height = 450;
                            const svg = d3.select("#d3Map")
                                .append("svg")
                                .attr("viewBox", `0 0 ${width} ${height}`)
                                .attr("width", "100%")
                                .attr("height", "100%");
                            
                            const projection = d3.geoMercator()
                                .center([10, 52])
                                .scale(650)
                                .translate([width / 2, height / 2]);
                            
                            const path = d3.geoPath().projection(projection);
                            
                            d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then(function(world) {
                                const euCodes = {"Norway": "NO", "Sweden": "SE", "Finland": "FI", "Denmark": "DK",
                                    "United Kingdom": "GB", "Ireland": "IE", "France": "FR", "Spain": "ES",
                                    "Portugal": "PT", "Italy": "IT", "Germany": "DE", "Netherlands": "NL",
                                    "Belgium": "BE", "Switzerland": "CH", "Austria": "AT",
                                    "Czech Republic": "CZ", "Poland": "PL"};
                                
                                const countries = topojson.feature(world, world.objects.countries).features
                                    .filter(d => Object.keys(euCodes).includes(d.properties.name));
                                
                                svg.selectAll("path.country")
                                    .data(countries)
                                    .join("path")
                                    .attr("class", "country")
                                    .attr("d", path)
                                    .attr("id", d => euCodes[d.properties.name] || "")
                                    .attr("data-name", d => d.properties.name)
                                    .on("click", function(event, d) {
                                        const code = euCodes[d.properties.name];
                                        if (code && typeof toggleCountry === 'function') toggleCountry(code);
                                    });
                                
                                const labels = [
                                    {name: "DE", coords: [10, 51]}, {name: "FR", coords: [2, 46]},
                                    {name: "ES", coords: [-4, 40]}, {name: "IT", coords: [12, 42]},
                                    {name: "GB", coords: [-2, 54]}, {name: "PL", coords: [19, 52]},
                                    {name: "SE", coords: [18, 60]}, {name: "NO", coords: [8, 62]}
                                ];
                                
                                svg.selectAll("text.map-label")
                                    .data(labels)
                                    .join("text")
                                    .attr("class", "map-label")
                                    .attr("x", d => projection(d.coords)[0])
                                    .attr("y", d => projection(d.coords)[1])
                                    .text(d => d.name)
                                    .style("font-size", "11px")
                                    .style("fill", "#94a3b8")
                                    .style("font-weight", "600")
                                    .style("pointer-events", "none")
                                    .style("text-anchor", "middle");
                            }).catch(err => {
                                console.error("Map load error:", err);
                                d3.select("#d3Map").html('<div style="padding: 40px; text-align: center; color: #94a3b8;">Unable to load map. Check internet connection.</div>');
                            });
                        })();
                    </script>'''

# Replace
content = re.sub(old_pattern, new_html, content, count=1, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)

print('✅ Map replaced with D3.js version')
