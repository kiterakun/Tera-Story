import { useEffect, useMemo, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Relationship, Character } from '../services/playthroughApi';
import { useTranslation } from '../i18n';
import { Modal, ModalHeader, ModalBody } from '../design-system';
import { RELATIONSHIP_TYPE_COLORS, getRelationshipTypeColor } from '../design-system/colors';
import { cn } from '../design-system/cn';

interface RelationshipWebModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationships: Relationship[];
  characters: Character[];
}

interface ForceGraphRef {
  zoomToFit: (duration?: number, padding?: number) => void;
  centerAt: (x?: number, y?: number, duration?: number) => void;
  zoom: (scale: number, duration?: number) => void;
}

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  x?: number;
  y?: number;
}

export function RelationshipWebModal({ isOpen, onClose, relationships, characters }: RelationshipWebModalProps) {
  const t = useTranslation();
  const fgRef = useRef<ForceGraphRef | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const { nodes, links } = useMemo(() => {
    if (!isOpen) return { nodes: [] as GraphNode[], links: [] as Array<{ source: string; target: string; type: string; intensity: number; color: string }> };
    const charIdsInRels = new Set<string>();
    relationships.forEach((r) => {
      charIdsInRels.add(r.characterA._id);
      charIdsInRels.add(r.characterB._id);
    });
    const PROTAGONIST_COLOR = '#f59e0b';
    const NPC_COLOR = '#3b82f6';
    const graphNodes: GraphNode[] = characters
      .filter((c) => charIdsInRels.has(c._id) || c.role === 'protagonist')
      .map((c) => ({
        id: c._id,
        name: c.name,
        val: c.role === 'protagonist' ? 30 : 15,
        color: c.role === 'protagonist' ? PROTAGONIST_COLOR : NPC_COLOR,
      }));
    const graphLinks = relationships.map((r) => ({
      source: r.characterA._id,
      target: r.characterB._id,
      type: r.type,
      intensity: r.intensity,
      color: getRelationshipTypeColor(r.type).color,
    }));
    return { nodes: graphNodes, links: graphLinks };
  }, [isOpen, relationships, characters]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fgRef.current?.zoomToFit(400, 50);
    }, 500);
    return () => clearTimeout(timer);
  }, [isOpen, nodes, links]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setFocusedIndex(0);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen]);

  const focusNode = (index: number) => {
    const length = Math.max(nodes.length, 1);
    const bounded = ((index % length) + length) % length;
    setFocusedIndex(bounded);
    const node = nodes[bounded];
    if (node && typeof node.x === 'number' && typeof node.y === 'number') {
      fgRef.current?.centerAt(node.x, node.y, 600);
      fgRef.current?.zoom(3, 600);
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      focusNode(focusedIndex + 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      focusNode(focusedIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusNode(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusNode(nodes.length - 1);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="xl"
      closeOnEsc
      closeOnScrimClick
      className="max-w-5xl h-[85vh] overflow-hidden rounded-2xl"
    >
      <ModalHeader className="bg-ink-900/50">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-display text-ink-100 uppercase tracking-wide">
            {t.storyReader.rpgPanel} - Relationship Web
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-400 text-xs font-medium border border-accent-500/20">
            Interactive
          </span>
        </div>
      </ModalHeader>

      <ModalBody className="flex-1 relative bg-ink-950/50 p-0 flex flex-col md:flex-row">
        <div className="flex-1 relative">
          <ForceGraph2D
            ref={fgRef}
            graphData={{ nodes, links }}
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
            nodeCanvasObject={(node: GraphNode, ctx, globalScale) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map((n) => n + fontSize * 0.2);

              ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
              ctx.beginPath();
              ctx.roundRect(
                (node.x ?? 0) - bckgDimensions[0] / 2,
                (node.y ?? 0) - bckgDimensions[1] / 2 - 12,
                bckgDimensions[0],
                bckgDimensions[1],
                4,
              );
              ctx.fill();

              ctx.beginPath();
              ctx.arc(node.x ?? 0, node.y ?? 0, node.val / 2, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.color;
              ctx.fill();

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#e2e8f0';
              ctx.fillText(label, node.x ?? 0, (node.y ?? 0) - 12);
            }}
          />

          {/* Controls Overlay */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fgRef.current?.zoom((fgRef.current?.zoom() ?? 1) * 1.2, 400)}
              aria-label="Zoom In"
              className="p-2 bg-ink-800/80 border border-ink-700 text-ink-200 hover:text-ink-100 rounded-lg backdrop-blur shadow hover:bg-ink-700/80 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <ZoomIn size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => fgRef.current?.zoom((fgRef.current?.zoom() ?? 1) / 1.2, 400)}
              aria-label="Zoom Out"
              className="p-2 bg-ink-800/80 border border-ink-700 text-ink-200 hover:text-ink-100 rounded-lg backdrop-blur shadow hover:bg-ink-700/80 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <ZoomOut size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => fgRef.current?.zoomToFit(400, 50)}
              aria-label="Fit to Screen"
              className="p-2 bg-ink-800/80 border border-ink-700 text-ink-200 hover:text-ink-100 rounded-lg backdrop-blur shadow hover:bg-ink-700/80 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <Maximize size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Character navigation list */}
        <div className="md:w-56 border-t md:border-t-0 md:border-l border-ink-800 p-3 bg-ink-900/70 flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-ink-300 uppercase tracking-wider">Characters</h4>
          <div
            role="listbox"
            aria-label="Character navigation"
            aria-orientation="vertical"
            onKeyDown={handleListKeyDown}
            className="flex flex-col gap-1 max-h-60 md:max-h-full overflow-y-auto"
          >
            {nodes.length === 0 && (
              <p className="text-xs text-ink-300/60 italic">No characters in the web.</p>
            )}
            {nodes.map((node, idx) => (
              <button
                key={node.id}
                ref={(el) => { buttonRefs.current[idx] = el; }}
                type="button"
                role="option"
                aria-selected={idx === focusedIndex}
                tabIndex={idx === focusedIndex ? 0 : -1}
                onClick={() => focusNode(idx)}
                onFocus={() => setFocusedIndex(idx)}
                className={cn(
                  'text-left text-sm rounded-md px-2 py-1 transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                  idx === focusedIndex
                    ? 'bg-accent-500/20 text-accent-200'
                    : 'text-ink-100 hover:bg-ink-800/70',
                )}
                style={{ minHeight: '32px' }}
              >
                {node.name}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-ink-400">
            Use arrow keys or Home/End to navigate characters.
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-ink-900/80 backdrop-blur-md border border-ink-800 p-3 rounded-xl shadow-lg">
          <h4 className="text-xs font-semibold text-ink-300 mb-2 uppercase tracking-wider">Legend</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {(Object.keys(RELATIONSHIP_TYPE_COLORS) as Array<keyof typeof RELATIONSHIP_TYPE_COLORS>).map((key) => (
              <div key={key} data-testid="relationship-legend-item" className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', RELATIONSHIP_TYPE_COLORS[key].swatchClass)} aria-hidden="true" />
                <span className="text-[10px] text-ink-200 capitalize">{(t.relationship as Record<string, string>)[key] || key}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[9px] text-ink-400 italic">Particles indicate relationship intensity.</div>
        </div>
      </ModalBody>
    </Modal>
  );
}
