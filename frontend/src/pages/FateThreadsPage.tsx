import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GitBranch,
  ChevronDown,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { Spinner } from '../design-system/Spinner';
import { FATE_THREAD_COLORS } from '../design-system/colors';
import { useFateThreads } from '../hooks/useFateThreads';
import { PeekModal } from '../components/fate/PeekModal';
import { ChapterDetailPanel } from '../components/fate/ChapterDetailPanel';
import { useTranslation } from '../i18n';
import type { ThreadNode, ThreadEdge } from '../services/fateThreadsApi';

// ── Layout constants ──
const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const H_SPACING = 220;
const V_SPACING = 130;
const ARC_GAP = 60;
const PADDING = 60;

// ── Helpers ──

interface LayoutNode {
  node: ThreadNode;
  x: number;
  y: number;
}

interface ArcInfo {
  arcId: string;
  arcIndex: number;
  label: string;
  y: number;
  height: number;
}

function buildLayout(
  graph: { nodes: ThreadNode[] } | null,
  selectedArcId: string | null,
): { nodes: LayoutNode[]; arcs: ArcInfo[]; contentWidth: number; contentHeight: number } {
  if (!graph || !graph.nodes.length) {
    return { nodes: [], arcs: [], contentWidth: 0, contentHeight: 0 };
  }

  const filtered = selectedArcId
    ? graph.nodes.filter((n) => n.arcId === selectedArcId)
    : graph.nodes;

  // Group by arcId
  const arcMap = new Map<string, ThreadNode[]>();
  for (const n of filtered) {
    const list = arcMap.get(n.arcId) || [];
    list.push(n);
    arcMap.set(n.arcId, list);
  }

  // Sort arcs by arcIndex
  const sortedArcs = Array.from(arcMap.entries())
    .map(([arcId, nodes]) => ({
      arcId,
      arcIndex: nodes[0]!.arcIndex,
      nodes,
    }))
    .sort((a, b) => a.arcIndex - b.arcIndex);

  const layoutNodes: LayoutNode[] = [];
  const arcInfos: ArcInfo[] = [];
  let currentY = PADDING;

  for (const arc of sortedArcs) {
    // Group by depth
    const depthMap = new Map<number, ThreadNode[]>();
    for (const n of arc.nodes) {
      const list = depthMap.get(n.depth) || [];
      list.push(n);
      depthMap.set(n.depth, list);
    }
    const depths = Array.from(depthMap.keys()).sort((a, b) => a - b);

    let maxNodesInDepth = 0;
    for (const [, ns] of depthMap) {
      if (ns.length > maxNodesInDepth) maxNodesInDepth = ns.length;
    }

    const arcStartY = currentY;

    for (const depth of depths) {
      const atDepth = depthMap.get(depth)!.sort(
        (a, b) => a.chapterIndex - b.chapterIndex,
      );
      for (let i = 0; i < atDepth.length; i++) {
        const node = atDepth[i]!;
        layoutNodes.push({
          node,
          x: PADDING + depth * H_SPACING,
          y: currentY + i * V_SPACING,
        });
      }
    }

    const arcHeight = Math.max(maxNodesInDepth * V_SPACING, V_SPACING) + 40;
    arcInfos.push({
      arcId: arc.arcId,
      arcIndex: arc.arcIndex,
      label: `Arc ${arc.arcIndex + 1}`,
      y: arcStartY,
      height: arcHeight,
    });

    currentY += arcHeight + ARC_GAP;
  }

  const contentWidth =
    layoutNodes.length > 0
      ? Math.max(...layoutNodes.map((n) => n.x + NODE_WIDTH)) + PADDING
      : PADDING;
  const contentHeight =
    layoutNodes.length > 0
      ? Math.max(...layoutNodes.map((n) => n.y + NODE_HEIGHT)) + PADDING
      : PADDING;

  return { nodes: layoutNodes, arcs: arcInfos, contentWidth, contentHeight };
}

// ── Main component ──

export default function FateThreadsPage() {
  const t = useTranslation();
  const { playthroughId } = useParams<{ playthroughId: string }>();
  const navigate = useNavigate();
  const {
    graph,
    loading,
    error,
    refetch,
    peekLoading,
    peekResult,
    peekError,
    peekGhostThread,
    clearPeek,
  } = useFateThreads(playthroughId);

  // ── Viewport state ──
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const hasDraggedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Selection ──
  const [selectedNode, setSelectedNode] = useState<ThreadNode | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [peekModalOpen, setPeekModalOpen] = useState(false);


  // ── Viewport dimensions (for minimap) ──
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Arc filter ──
  const [selectedArcId, setSelectedArcId] = useState<string | null>(null);
  const [arcDropdownOpen, setArcDropdownOpen] = useState(false);

  // ── Layout ──
  const { nodes: layoutNodes, arcs, contentWidth, contentHeight } = useMemo(
    () => buildLayout(graph, selectedArcId),
    [graph, selectedArcId],
  );

  // Build node position lookup (by node.id)
  const nodePosMap = useMemo(() => {
    const map = new Map<string, LayoutNode>();
    for (const ln of layoutNodes) {
      map.set(ln.node.id, ln);
    }
    return map;
  }, [layoutNodes]);

  // ── Unique arcs for dropdown ──
  const allArcs = useMemo(() => {
    if (!graph) return [];
    const arcSet = new Map<string, { arcId: string; arcIndex: number }>();
    for (const n of graph.nodes) {
      if (!arcSet.has(n.arcId)) {
        arcSet.set(n.arcId, { arcId: n.arcId, arcIndex: n.arcIndex });
      }
    }
    return Array.from(arcSet.values()).sort((a, b) => a.arcIndex - b.arcIndex);
  }, [graph]);

  // ── Zoom / pan ──
  const clampScale = useCallback((s: number) => Math.min(3, Math.max(0.2, s)), []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = clampScale(scale * delta);

      // Zoom toward mouse position
      const newPanX = mouseX - (mouseX - panX) * (newScale / scale);
      const newPanY = mouseY - (mouseY - panY) * (newScale / scale);

      setScale(newScale);
      setPanX(newPanX);
      setPanY(newPanY);
    },
    [scale, panX, panY, clampScale],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan with left button on background
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      // Don't start drag if clicking a node or control
      if (target.closest('[data-node]') || target.closest('[data-edge]') || target.closest('button')) {
        return;
      }
      setIsDragging(true);
      hasDraggedRef.current = false;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX,
        panY,
      };
    },
    [panX, panY],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasDraggedRef.current = true;
      }
      setPanX(dragStartRef.current.panX + dx);
      setPanY(dragStartRef.current.panY + dy);
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleGlobalUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => window.removeEventListener('mouseup', handleGlobalUp);
  }, [isDragging]);

  // ── Node click ──
  const handleNodeClick = useCallback(
    (node: ThreadNode) => {
      if (hasDraggedRef.current) return;
      setSelectedNode(node);
      setPanelOpen(true);
    },
    [],
  );

  // ── Edge click (ghost peek) ──
  const handleEdgeClick = useCallback(
    (edge: ThreadEdge) => {
      if (hasDraggedRef.current) return;
      if (!graph || edge.isChosen) return;

      const sourceNode = graph.nodes.find((n) => n.id === edge.from);
      if (!sourceNode) return;

      // Compute choiceIndex as edge position among edges from same source
      const siblings = graph.edges.filter((e) => e.from === edge.from);
      const choiceIndex = siblings.findIndex(
        (e) => e.from === edge.from && e.to === edge.to,
      );

      setPeekModalOpen(true);
      peekGhostThread(sourceNode.chapterId, choiceIndex >= 0 ? choiceIndex : 0);
    },
    [graph, peekGhostThread],
  );

  // ── Zoom controls ──
  const zoomIn = useCallback(() => {
    setScale((s) => clampScale(s * 1.25));
  }, [clampScale]);

  const zoomOut = useCallback(() => {
    setScale((s) => clampScale(s * 0.8));
  }, [clampScale]);

  const fitToView = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || contentWidth === 0 || contentHeight === 0) return;

    const pad = 40;
    const scaleX = (rect.width - pad * 2) / contentWidth;
    const scaleY = (rect.height - pad * 2) / contentHeight;
    const newScale = clampScale(Math.min(scaleX, scaleY, 1.5));

    const centerX = contentWidth / 2;
    const centerY = contentHeight / 2;

    setScale(newScale);
    setPanX(rect.width / 2 - centerX * newScale);
    setPanY(rect.height / 2 - centerY * newScale);
  }, [contentWidth, contentHeight, clampScale]);

  // Auto-fit on first load
  const hasFitted = useRef(false);
  useEffect(() => {
    if (!hasFitted.current && layoutNodes.length > 0) {
      hasFitted.current = true;
      // Small delay to ensure container has dimensions
      const t = setTimeout(() => fitToView(), 100);
      return () => clearTimeout(t);
    }
  }, [layoutNodes.length, fitToView]);

  // ── Minimap ──
  const minimapWidth = 180;
  const minimapHeight = 120;
  const minimapScale = useMemo(() => {
    if (contentWidth === 0 || contentHeight === 0) return 1;
    const sx = (minimapWidth - 16) / contentWidth;
    const sy = (minimapHeight - 16) / contentHeight;
    return Math.min(sx, sy);
  }, [contentWidth, contentHeight]);

  // ── Peek close ──
  const handlePeekClose = useCallback(() => {
    setPeekModalOpen(false);
    clearPeek();
  }, [clearPeek]);

  const handlePeekContinue = useCallback(() => {
    setPeekModalOpen(false);
    clearPeek();
  }, [clearPeek]);

  // ── Render ──

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" className="w-10 h-10 text-gold" />
          <p className="text-sm text-ink-400">{t.fateThreads.loading}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 rounded-lg border border-ink-600 text-ink-300 hover:bg-ink-800 transition-colors text-sm"
          >
            {t.common.retry}
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!graph || !graph.nodes.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <GitBranch size={40} className="text-ink-600" />
          <p className="text-sm text-ink-400">
            {t.fateThreads.emptyTitle}
          </p>
          <p className="text-xs text-ink-500">
            {t.fateThreads.emptySubtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-ink-700 bg-ink-950/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-ink-800 text-ink-400 hover:text-ink-200 transition-colors"
            aria-label={t.fateThreads.back}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gold flex items-center gap-2">
            <GitBranch size={20} />
            {t.fateThreads.title}
          </h1>
          {graph.metadata && (
            <span className="text-xs text-ink-500">
              {t.fateThreads.metadata
                .replace('{chapters}', String(graph.metadata.totalChapters))
                .replace('{branches}', String(graph.metadata.totalGhostBranches))}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Arc selector */}
          <div className="relative">
            <button
              onClick={() => setArcDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-600 bg-ink-900 text-sm text-ink-300 hover:bg-ink-800 transition-colors"
            >
              <Layers size={14} />
              <span>
                {selectedArcId
                  ? t.fateThreads.arcLabel.replace(
                      '{index}',
                      String(
                        (allArcs.find((a) => a.arcId === selectedArcId)
                          ?.arcIndex ?? 0) + 1,
                      ),
                    )
                  : t.fateThreads.allArcs}
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform ${
                  arcDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {arcDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setArcDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-ink-700 bg-ink-900 shadow-xl py-1">
                  <button
                    onClick={() => {
                      setSelectedArcId(null);
                      setArcDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-ink-800 transition-colors ${
                      !selectedArcId ? 'text-gold' : 'text-ink-300'
                    }`}
                  >
                    {t.fateThreads.allArcs}
                  </button>
                  {allArcs.map((arc) => (
                    <button
                      key={arc.arcId}
                      onClick={() => {
                        setSelectedArcId(arc.arcId);
                        setArcDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-ink-800 transition-colors ${
                        selectedArcId === arc.arcId
                          ? 'text-gold'
                          : 'text-ink-300'
                      }`}
                    >
                      {t.fateThreads.arcLabel.replace('{index}', String(arc.arcIndex + 1))}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-ink-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gold" />
              {t.fateThreads.currentPath}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-500" />
              {t.fateThreads.unselectedBranch}
            </span>
          </div>
        </div>
      </header>

      {/* ── Graph canvas ── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-ink-950 cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <g
            transform={`translate(${panX}, ${panY}) scale(${scale})`}
            style={{ pointerEvents: 'auto' }}
          >
            {/* ── Arc labels ── */}
            {arcs.map((arc) => (
              <g key={arc.arcId}>
                <rect
                  x={0}
                  y={arc.y - 8}
                  width={contentWidth}
                  height={arc.height + 16}
                  rx={6}
                  fill="transparent"
                  stroke="currentColor"
                  className="text-ink-800"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={8}
                  y={arc.y + 14}
                  fill="currentColor"
                  className="text-ink-500 text-xs font-semibold"
                >
                  {t.fateThreads.arcLabel.replace('{index}', String(arc.arcIndex + 1))}
                </text>
              </g>
            ))}

            {/* ── Edges ── */}
            {graph.edges.map((edge) => {
              const from = nodePosMap.get(edge.from);
              const to = nodePosMap.get(edge.to);
              if (!from || !to) return null;

              const x1 = from.x + NODE_WIDTH / 2;
              const y1 = from.y + NODE_HEIGHT;
              const x2 = to.x + NODE_WIDTH / 2;
              const y2 = to.y;

              return (
                <g key={`${edge.from}-${edge.to}`} data-edge>
                  {/* Hit area for ghost edges */}
                  {!edge.isChosen && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="transparent"
                      strokeWidth={16}
                      className="cursor-pointer"
                      onClick={() => handleEdgeClick(edge)}
                    />
                  )}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={edge.isChosen ? FATE_THREAD_COLORS.chosen.color : FATE_THREAD_COLORS.inactive.color}
                    strokeWidth={edge.isChosen ? 2.5 : 1.5}
                    strokeDasharray={edge.isChosen ? undefined : '6 4'}
                    strokeLinecap="round"
                    className={
                      edge.isChosen
                        ? ''
                        : 'cursor-pointer hover:stroke-gray-400 transition-colors'
                    }
                    onClick={
                      edge.isChosen
                        ? undefined
                        : () => handleEdgeClick(edge)
                    }
                  />
                  {/* Arrowhead for chosen edges */}
                  {edge.isChosen && (
                    <polygon
                      points={`${x2 - 5},${y2 - 8} ${x2},${y2} ${x2 + 5},${y2 - 8}`}
                      fill={FATE_THREAD_COLORS.chosen.color}
                    />
                  )}
                </g>
              );
            })}

            {/* ── Nodes ── */}
            {layoutNodes.map((ln) => {
              const isCurrent = ln.node.isCurrentPath;
              const bgColor = isCurrent
                ? 'rgba(212, 168, 67, 0.15)'
                : 'rgba(107, 114, 128, 0.1)';
              const borderColor = isCurrent ? FATE_THREAD_COLORS.current.color : FATE_THREAD_COLORS.other.color;
              const textColor = isCurrent ? FATE_THREAD_COLORS.textCurrent.color : FATE_THREAD_COLORS.otherText.color;
              const subtitleColor = isCurrent ? FATE_THREAD_COLORS.currentSub.color : FATE_THREAD_COLORS.inactive.color;

              const title = ln.node.title.length > 28
                ? ln.node.title.slice(0, 28) + '…'
                : ln.node.title;
              const summary = ln.node.summary.length > 50
                ? ln.node.summary.slice(0, 50) + '…'
                : ln.node.summary;

              return (
                <g
                  key={ln.node.id}
                  data-node
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(ln.node)}
                >
                  <rect
                    x={ln.x}
                    y={ln.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={8}
                    fill={bgColor}
                    stroke={borderColor}
                    strokeWidth={isCurrent ? 2 : 1}
                    className="transition-colors hover:brightness-125"
                  />
                  <text
                    x={ln.x + NODE_WIDTH / 2}
                    y={ln.y + 24}
                    textAnchor="middle"
                    fill={textColor}
                    className="text-xs font-semibold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {title}
                  </text>
                  {summary && (
                    <text
                      x={ln.x + NODE_WIDTH / 2}
                      y={ln.y + 48}
                      textAnchor="middle"
                      fill={subtitleColor}
                      className="text-[10px]"
                      style={{ pointerEvents: 'none' }}
                    >
                      {summary}
                    </text>
                  )}
                  {isCurrent && (
                    <circle
                      cx={ln.x + NODE_WIDTH - 12}
                      cy={ln.y + 12}
                      r={4}
                      fill={FATE_THREAD_COLORS.chosen.color}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* ── Zoom controls ── */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-1">
          <button
            onClick={zoomIn}
            className="p-2 rounded-lg bg-ink-900/90 border border-ink-700 text-ink-400 hover:text-ink-200 hover:bg-ink-800 transition-colors"
            aria-label={t.fateThreads.zoomIn}
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 rounded-lg bg-ink-900/90 border border-ink-700 text-ink-400 hover:text-ink-200 hover:bg-ink-800 transition-colors"
            aria-label={t.fateThreads.zoomOut}
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={fitToView}
            className="p-2 rounded-lg bg-ink-900/90 border border-ink-700 text-ink-400 hover:text-ink-200 hover:bg-ink-800 transition-colors"
            aria-label={t.fateThreads.fitToView}
          >
            <Maximize2 size={18} />
          </button>
        </div>

        {/* ── Minimap ── */}
        <div className="absolute bottom-6 right-6 rounded-lg border border-ink-700 bg-ink-900/90 overflow-hidden shadow-lg">
          <svg
            width={minimapWidth}
            height={minimapHeight}
            viewBox={`0 0 ${minimapWidth} ${minimapHeight}`}
          >
            <rect
              x={0}
              y={0}
              width={minimapWidth}
              height={minimapHeight}
              fill={FATE_THREAD_COLORS.node.color}
            />
            {/* All nodes */}
            {layoutNodes.map((ln) => {
              const mx = 8 + ln.x * minimapScale;
              const my = 8 + ln.y * minimapScale;
              const mw = NODE_WIDTH * minimapScale;
              const mh = NODE_HEIGHT * minimapScale;
              return (
                <rect
                  key={ln.node.id}
                  x={mx}
                  y={my}
                  width={Math.max(mw, 1.5)}
                  height={Math.max(mh, 1.5)}
                  rx={1}
                  fill={ln.node.isCurrentPath ? FATE_THREAD_COLORS.current.color : FATE_THREAD_COLORS.other.color}
                  opacity={0.7}
                />
              );
            })}
            {/* Viewport indicator */}
            {viewportSize.width > 0 && viewportSize.height > 0 && (
              <rect
                x={8 + (-panX / scale) * minimapScale}
                y={8 + (-panY / scale) * minimapScale}
                width={
                  (viewportSize.width / scale) * minimapScale
                }
                height={
                  (viewportSize.height / scale) * minimapScale
                }
                fill="none"
                stroke={FATE_THREAD_COLORS.chosen.color}
                strokeWidth={1.5}
                rx={2}
              />
            )}
          </svg>
        </div>

        {/* Mobile legend (shown below sm breakpoint) */}
        <div className="absolute top-3 left-3 sm:hidden flex gap-3 text-[10px] text-ink-400 bg-ink-950/80 rounded-lg px-3 py-1.5">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gold" />
            {t.fateThreads.currentPath}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            {t.fateThreads.unselectedBranch}
          </span>
        </div>
      </div>

      {/* ── Chapter Detail Panel ── */}
      <ChapterDetailPanel
        isOpen={panelOpen}
        node={selectedNode}
        onClose={() => setPanelOpen(false)}
      />

      {/* ── Peek Modal ── */}
      <PeekModal
        isOpen={peekModalOpen}
        onClose={handlePeekClose}
        onContinue={handlePeekContinue}
        peekResult={peekResult}
        isLoading={peekLoading}
        error={peekError}
      />
    </div>
  );
}
