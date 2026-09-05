import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ProjectIdea } from '../types';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Eye, Sparkles, AlertCircle } from 'lucide-react';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'domain' | 'idea';
  label: string;
  domain: string;
  ideaData?: ProjectIdea;
  score?: number;
  noveltyBand?: 'high' | 'moderate' | 'low';
  radius: number;
  isExpanded?: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface IdeaGraphCanvasProps {
  ideas: ProjectIdea[];
  selectedIdea: ProjectIdea | null;
  onSelectIdea: (idea: ProjectIdea) => void;
}

export const IdeaGraphCanvas: React.FC<IdeaGraphCanvasProps> = ({
  ideas,
  selectedIdea,
  onSelectIdea
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Group ideas by domain
  const domainsList = useMemo(() => {
    const map = new Map<string, ProjectIdea[]>();
    for (const idea of ideas) {
      if (!map.has(idea.domain)) {
        map.set(idea.domain, []);
      }
      map.get(idea.domain)!.push(idea);
    }
    return Array.from(map.entries()).map(([domain, items]) => ({
      domain,
      count: items.length,
      topScore: Math.max(...items.map((i) => i.combined_score)),
      items
    }));
  }, [ideas]);

  // Expand top 2 domains by default on first load
  useEffect(() => {
    if (domainsList.length > 0 && expandedDomains.size === 0) {
      const topDomains = domainsList.slice(0, 3).map((d) => d.domain);
      setExpandedDomains(new Set(topDomains));
    }
  }, [domainsList]);

  // Toggle domain expansion
  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  // Build nodes and links based on expanded domains
  const { nodes, links } = useMemo(() => {
    const nList: GraphNode[] = [];
    const lList: GraphLink[] = [];

    // Add domain anchor nodes
    domainsList.forEach(({ domain, count, topScore }) => {
      const isExp = expandedDomains.has(domain);
      nList.push({
        id: `domain-${domain}`,
        type: 'domain',
        label: domain,
        domain: domain,
        radius: 40,
        score: topScore,
        isExpanded: isExp
      });

      // If domain expanded, add child idea nodes
      if (isExp) {
        const domainIdeas = ideas.filter((i) => i.domain === domain);
        domainIdeas.forEach((idea) => {
          const nov = idea.novelty.novelty_score;
          const band: 'high' | 'moderate' | 'low' =
            nov >= 75 ? 'high' : nov >= 50 ? 'moderate' : 'low';
          const r = 16 + (idea.combined_score / 100) * 14;

          nList.push({
            id: idea.id,
            type: 'idea',
            label: idea.title,
            domain: domain,
            ideaData: idea,
            score: idea.combined_score,
            noveltyBand: band,
            radius: r
          });

          lList.push({
            source: `domain-${domain}`,
            target: idea.id
          });
        });
      }
    });

    return { nodes: nList, links: lList };
  }, [domainsList, expandedDomains, ideas]);

  // D3 Simulation & Rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Container group with zoom/pan
    const g = svg.append('g').attr('class', 'main-canvas');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initial center transform
    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85)
    );

    // Setup Force Simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((d) => (d.target as GraphNode).type === 'idea' ? 95 : 160)
          .strength(0.6)
      )
      .force('charge', d3.forceManyBody().strength((d) => ((d as GraphNode).type === 'domain' ? -420 : -140)))
      .force('collide', d3.forceCollide<GraphNode>().radius((d) => d.radius + 12).iterations(2))
      .force('center', d3.forceCenter(0, 0).strength(0.04));

    // Render Links
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#d6cfc4')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0.85);

    // Render Nodes Group
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node Circles
    node.each(function (d) {
      const el = d3.select(this);

      if (d.type === 'domain') {
        // Outer pulsing ring if expanded
        if (d.isExpanded) {
          el.append('circle')
            .attr('r', d.radius + 6)
            .attr('fill', 'none')
            .attr('stroke', '#1d6e5c')
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0.4)
            .attr('stroke-dasharray', '4 4');
        }

        // Domain main circle
        el.append('circle')
          .attr('r', d.radius)
          .attr('fill', '#ffffff')
          .attr('stroke', d.isExpanded ? '#1d6e5c' : '#8c827a')
          .attr('stroke-width', d.isExpanded ? 3 : 2)
          .attr('filter', 'drop-shadow(0 2px 6px rgba(28,25,23,0.08))');

        // Domain label text
        const words = d.label.split(' ');
        const text = el
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-family', 'Fraunces, serif')
          .attr('font-weight', '700')
          .attr('fill', '#1c1917')
          .attr('pointer-events', 'none');

        if (words.length > 2) {
          text.append('tspan').attr('x', 0).attr('dy', '-0.5em').text(words.slice(0, 2).join(' '));
          text.append('tspan').attr('x', 0).attr('dy', '1.1em').text(words.slice(2).join(' '));
        } else {
          text.attr('dy', '0.3em').text(d.label);
        }

        // Mini badge for idea count
        el.append('circle')
          .attr('cx', d.radius - 4)
          .attr('cy', -d.radius + 4)
          .attr('r', 9)
          .attr('fill', d.isExpanded ? '#1d6e5c' : '#78716c');

        el.append('text')
          .attr('x', d.radius - 4)
          .attr('y', -d.radius + 7)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('font-weight', '700')
          .attr('fill', '#ffffff')
          .attr('pointer-events', 'none')
          .text(d.isExpanded ? '−' : '+');

      } else {
        // Idea Node
        const isSelected = selectedIdea?.id === d.id;
        const color =
          d.noveltyBand === 'high'
            ? '#1d6e5c' // Deep teal
            : d.noveltyBand === 'moderate'
            ? '#c2703d' // Warm amber
            : '#991b1b'; // Muted red/slate

        // Selection highlight ring
        if (isSelected) {
          el.append('circle')
            .attr('r', d.radius + 7)
            .attr('fill', 'none')
            .attr('stroke', '#1d6e5c')
            .attr('stroke-width', 2.5)
            .attr('stroke-dasharray', '2 2');
        }

        // Idea main circle
        el.append('circle')
          .attr('r', d.radius)
          .attr('fill', color)
          .attr('stroke', isSelected ? '#ffffff' : '#f5f1e8')
          .attr('stroke-width', 2)
          .attr('filter', 'drop-shadow(0 2px 5px rgba(28,25,23,0.15))');

        // Score in center
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('font-size', d.radius > 24 ? '11px' : '9.5px')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('font-weight', '700')
          .attr('fill', '#ffffff')
          .attr('pointer-events', 'none')
          .text(Math.round(d.score || 0));
      }
    });

    // Node Interaction Handlers
    node
      .on('click', (event, d) => {
        event.stopPropagation();
        if (d.type === 'domain') {
          toggleDomain(d.domain);
        } else if (d.ideaData) {
          onSelectIdea(d.ideaData);
        }
      })
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left + 15,
            y: event.clientY - rect.top + 15
          });
        }
      })
      .on('mousemove', (event) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left + 15,
            y: event.clientY - rect.top + 15
          });
        }
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Tick function
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x || 0)
        .attr('y1', (d) => (d.source as GraphNode).y || 0)
        .attr('x2', (d) => (d.target as GraphNode).x || 0)
        .attr('y2', (d) => (d.target as GraphNode).y || 0);

      node.attr('transform', (d) => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, selectedIdea]);

  // Controls
  const handleZoom = (factor: number) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy, factor);
  };

  const handleReset = () => {
    if (!svgRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      d3.zoom<SVGSVGElement, unknown>().transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85)
    );
  };

  return (
    <div className="relative w-full h-full min-h-[640px] bg-[#f5f1e8] blueprint-grid rounded-xl border border-[#e7e2d8] overflow-hidden" ref={containerRef}>
      
      {/* Interactive SVG Canvas */}
      <svg ref={svgRef} className="w-full h-full min-h-[640px] select-none" />

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-white/90 backdrop-blur-sm border border-[#d6cfc4] rounded-lg p-1.5 shadow-sm">
        <button
          onClick={() => handleZoom(1.25)}
          className="p-1.5 hover:bg-[#ede8df] rounded text-[#1c1917] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          className="p-1.5 hover:bg-[#ede8df] rounded text-[#1c1917] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 hover:bg-[#ede8df] rounded text-[#1c1917] transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Graph Legend & Navigation Hint */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-[#d6cfc4] rounded-lg p-3 text-xs shadow-sm max-w-xs space-y-2">
        <div className="font-serif-heading font-bold text-[#1c1917] flex items-center justify-between">
          <span>Discovery Node Graph</span>
          <span className="text-[10px] font-mono text-[#78716c]">D3 Force</span>
        </div>
        <p className="text-[11px] text-[#57534e]">
          Click any <strong>Domain circle</strong> to expand/collapse matched ideas. Click an <strong>Idea node</strong> to view complete score breakdown.
        </p>
        <div className="flex items-center gap-3 pt-1 border-t border-[#e7e2d8] text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1d6e5c]"></span>
            <span>High Novelty (&gt;75)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c2703d]"></span>
            <span>Moderate (50-75)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#991b1b]"></span>
            <span>Overlap Risk</span>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-50 bg-[#1c1917] text-white p-3 rounded-lg shadow-xl max-w-sm text-xs font-sans space-y-1.5"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          {hoveredNode.type === 'domain' ? (
            <div>
              <span className="text-[10px] font-mono uppercase text-[#1d6e5c] font-bold">Engineering Domain</span>
              <h4 className="font-serif-heading font-bold text-sm text-white mt-0.5">{hoveredNode.label}</h4>
              <p className="text-[11px] text-[#d6cfc4] mt-1">
                {hoveredNode.isExpanded ? 'Click to collapse ideas' : 'Click to expand matched project nodes'}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase text-[#e7e2d8] font-semibold">{hoveredNode.domain}</span>
                <span className="font-mono text-emerald-400 font-bold">Match: {Math.round(hoveredNode.score || 0)}%</span>
              </div>
              <h4 className="font-serif-heading font-bold text-sm text-white mt-0.5">{hoveredNode.label}</h4>
              {hoveredNode.ideaData && (
                <>
                  <p className="text-[11px] text-[#d6cfc4] line-clamp-2 mt-1">
                    {hoveredNode.ideaData.description}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 pt-2 mt-2 border-t border-[#44403c] text-[10px] font-mono text-center">
                    <div className="bg-[#292524] p-1 rounded">
                      <span className="text-[#a8a29e] block">Feasibility</span>
                      <span className="text-white font-bold">{hoveredNode.ideaData.feasibility.feasibility_score}%</span>
                    </div>
                    <div className="bg-[#292524] p-1 rounded">
                      <span className="text-[#a8a29e] block">Novelty</span>
                      <span className="text-white font-bold">{hoveredNode.ideaData.novelty.novelty_score}%</span>
                    </div>
                    <div className="bg-[#292524] p-1 rounded">
                      <span className="text-[#a8a29e] block">Hireability</span>
                      <span className="text-white font-bold">{hoveredNode.ideaData.hireability.hireability_score}%</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-teal-400 font-mono pt-1 text-right">
                    Click to open full blueprint →
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
