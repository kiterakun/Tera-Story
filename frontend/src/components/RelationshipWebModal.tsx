import { useEffect, useRef, useMemo } from 'react';
import { X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Relationship, Character } from '../services/playthroughApi';
import { useTranslation } from '../i18n';

interface RelationshipWebModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationships: Relationship[];
  characters: Character[];
}

interface RelationshipNode {
  id: string;
  name: string;
  val: number;
  color: string;
  x?: number;
  y?: number;
}

interface RelationshipLink {
  source: string;
  target: string;
  type: Relationship['type'];
  intensity: number;
  color: string;
}

interface ForceGraphRef {
  zoomToFit: (duration?: number, padding?: number) => void;
  centerAt: (x?: number, y?: number, duration?: number) => void;
  zoom: (scale: number, duration?: number) => void;
}

interface RelationshipGraphData {
  nodes: RelationshipNode[];
  links: RelationshipLink[];
}

export function RelationshipWebModal({ isOpen, onClose, relationships, characters }: RelationshipWebModalProps) {
  const t = useTranslation();
  const fgRef = useRef<ForceGraphRef | null>(null);

  const graphData = useMemo(() => {
    if (!isOpen) return { nodes: [], links: [] };

    // Build nodes from characters that have relationships
    const charIdsInRels = new Set<string>();
    relationships.forEach((r) => {
      charIdsInRels.add(r.characterA._id);
      charIdsInRels.add(r.characterB._id);
    });

    const nodes = characters
      .filter((c) => charIdsInRels.has(c._id) || c.role === 'protagonist')
      .map((c) => ({
        id: c._id,
        name: c.name,
        val: c.role === 'protagonist' ? 30 : 15,
        color: c.role === 'protagonist' ? '#f59e0b' : '#3b82f6', // Amber for protag, blue for npc
      }));

    // Build links
    const links = relationships.map((r) => {
      let color = '#6b7280'; // gray
      if (r.type === 'enemy' || r.type === 'rival') color = '#ef4444'; // red
      if (r.type === 'ally') color = '#10b981'; // emerald
      if (r.type === 'romantic') color = '#ec4899'; // pink
      if (r.type === 'mentor') color = '#8b5cf6'; // violet
      if (r.type === 'family') color = '#3b82f6'; // blue

      return {
        source: r.characterA._id,
        target: r.characterB._id,
        type: r.type,
        intensity: r.intensity,
        color,
      };
    });

    return { nodes, links };
  }, [isOpen, relationships, characters]);

  useEffect(() => {
    if (!isOpen) return;
    // Zoom to fit after a short delay
    const timer = setTimeout(() => {
      fgRef.current?.zoomToFit(400, 50);
    }, 500);
    return () => clearTimeout(timer);
  }, [isOpen, graphData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-ink-900 border border-ink-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink-800 bg-ink-900/50 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-display text-ink-100 uppercase tracking-wide">
              {t.storyReader.rpgPanel} - Relationship Web
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-400 text-xs font-medium border border-accent-500/20">
              Interactive
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-300 hover:text-ink-100 hover:bg-ink-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Graph Area */}
        <div className="flex-1 relative bg-ink-950/50">
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeLabel="name"
            nodeColor="color"
            nodeRelSize={6}
            linkColor="color"
            linkWidth={(link: { intensity: number }) => 1 + (link.intensity / 2)}
            linkDirectionalParticles={(link: { intensity: number }) => link.intensity / 2}
            linkDirectionalParticleSpeed={(link: { intensity: number }) => link.intensity * 0.001}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            onNodeClick={(node: { x?: number; y?: number }) => {
              fgRef.current?.centerAt(node.x, node.y, 1000);
              fgRef.current?.zoom(3, 2000);
            }}
            nodeCanvasObject={(node: { name: string }, ctx, globalScale) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

              ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // ink-950
              ctx.beginPath();
              ctx.roundRect(
                node.x - bckgDimensions[0] / 2,
                node.y - bckgDimensions[1] / 2 - 12,
                bckgDimensions[0],
                bckgDimensions[1],
                4
              );
              ctx.fill();

              // Draw node circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.val / 2, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.color;
              ctx.fill();

              // Draw text
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#e2e8f0'; // ink-200
              ctx.fillText(label, node.x, node.y - 12);
            }}
          />

          {/* Controls Overlay */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => fgRef.current?.zoom(fgRef.current?.zoom() * 1.2, 400)}
              className="p-2 bg-ink-800/80 border border-ink-700 text-ink-200 hover:text-ink-100 rounded-lg backdrop-blur shadow hover:bg-ink-700/80 transition"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => fgRef.current?.zoom(fgRef.current?.zoom() / 1.2, 400)}
              className="p-2 bg-ink-800/80 border border-ink-700 text-ink-200 hover:text-ink-100 rounded-lg backdrop-blur shadow hover:bg-ink-700/80 transition"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={() => fgRef.current?.zoomToFit(400, 50)}
              className="p-2 bg-ink-800/80 border border-ink-700 text-ink-200 hover:text-ink-100 rounded-lg backdrop-blur shadow hover:bg-ink-700/80 transition"
              title="Fit to Screen"
            >
              <Maximize size={18} />
            </button>
          </div>
          
          {/* Legend */}
          <div className="absolute top-4 left-4 bg-ink-900/80 backdrop-blur-md border border-ink-800 p-3 rounded-xl shadow-lg">
            <h4 className="text-xs font-semibold text-ink-300 mb-2 uppercase tracking-wider">Legend</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-[10px] text-ink-200">Ally</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-[10px] text-ink-200">Enemy / Rival</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-500"></span><span className="text-[10px] text-ink-200">Romantic</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500"></span><span className="text-[10px] text-ink-200">Mentor</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="text-[10px] text-ink-200">Family / Neutral</span></div>
            </div>
            <div className="mt-3 text-[9px] text-ink-400 italic">Particles indicate relationship intensity.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
