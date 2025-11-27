import React, { useEffect, useRef, useState } from 'react';
import { Graph } from '@antv/g6';
import { GraphData, GraphNode, ContextMenuState } from '../types';

interface GraphCanvasProps {
  data: GraphData;
  searchQuery: string;
  isLinkMode: boolean;
  onSelect: (item: any, type: 'node' | 'edge') => void;
  onLinkComplete: (sourceId: string, targetId: string) => void;
  onContextMenu: (state: ContextMenuState) => void;
  onCanvasClick: () => void;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  data,
  searchQuery,
  isLinkMode,
  onSelect,
  onLinkComplete,
  onContextMenu,
  onCanvasClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);

  // Refs for current props state to be used inside G6 event callbacks
  const propsRef = useRef({
    isLinkMode,
    sourceNodeId,
    onSelect,
    onLinkComplete,
    onContextMenu,
    onCanvasClick,
    searchQuery
  });

  // Update refs when props change
  useEffect(() => {
    propsRef.current = {
      isLinkMode,
      sourceNodeId,
      onSelect,
      onLinkComplete,
      onContextMenu,
      onCanvasClick,
      searchQuery
    };
  }, [isLinkMode, sourceNodeId, onSelect, onLinkComplete, onContextMenu, onCanvasClick, searchQuery]);

  // Initialize Graph
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Check if graph already exists and destroy it
    if (graphRef.current) {
        try {
            graphRef.current.destroy();
        } catch (e) {
            console.error("Error destroying graph", e);
        }
        graphRef.current = null;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    const graph = new Graph({
      container: container,
      width,
      height,
      autoFit: 'view',
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
      layout: {
        type: 'force',
        linkDistance: 150,
        nodeStrength: -1000,
        edgeStrength: 0.8,
        preventOverlap: true,
        nodeSize: 40,
        alphaDecay: 0.028,
        // Disable worker to prevent CSP/Cross-origin issues in some environments
        workerEnabled: false, 
      },
      data: JSON.parse(JSON.stringify(data)), // Deep copy to prevent G6 mutation issues
      node: {
        style: {
          size: 40,
          lineWidth: 2,
          stroke: '#fff',
          fillOpacity: 0.9,
          cursor: 'pointer',
          labelText: (d: any) => d.label,
          labelPosition: 'bottom',
          labelOffset: 8,
          labelFontSize: 12,
          labelFill: '#333',
          labelBackground: true,
          labelBackgroundFill: '#ffffff',
          labelBackgroundPadding: [2, 2, 2, 2],
          labelBackgroundRadius: 2,
          fill: (d: any) => d.color || '#999',
        },
        state: {
          highlight: {
            stroke: '#000',
            lineWidth: 3,
            shadowColor: '#666',
            shadowBlur: 10,
            opacity: 1,
          },
          dim: {
            opacity: 0.2,
            labelOpacity: 0.2,
          },
          selected: {
            stroke: '#1677ff',
            lineWidth: 3,
          },
          source: {
            stroke: '#722ed1',
            lineWidth: 4,
            lineDash: [4, 4],
            shadowColor: '#722ed1',
            shadowBlur: 10,
          }
        },
      },
      edge: {
        style: {
          lineWidth: 1.5,
          stroke: '#999',
          cursor: 'pointer',
          endArrow: true,
          labelText: (d: any) => d.label,
          labelAutoRotate: true,
          labelFill: '#666',
          labelFontSize: 11,
          labelBackground: true,
          labelBackgroundFill: '#ffffff',
          labelBackgroundPadding: [2, 4, 2, 4],
          labelBackgroundRadius: 2,
        },
      },
    });

    graphRef.current = graph;

    // --- Event Handlers ---
    
    graph.on('node:click', (evt: any) => {
      const { isLinkMode, sourceNodeId, onSelect, onLinkComplete } = propsRef.current;
      const { target } = evt;
      
      // In G6 v5, the target in a node:click event is typically the Node instance.
      // However, we ensure we get the ID safely.
      const nodeId = target?.id; 
      
      // Safety check
      if (!nodeId) return;

      // In v5, fetching data is via getNodeData
      const model = graph.getNodeData(nodeId) as GraphNode;
      if (!model) return;

      if (isLinkMode) {
        if (!sourceNodeId) {
          // Select first node
          setSourceNodeId(nodeId);
          graph.setElementState(nodeId, 'source', true);
        } else {
           // Select second node
           if (sourceNodeId !== nodeId) {
             onLinkComplete(sourceNodeId, nodeId);
           }
           // Reset
           graph.setElementState(sourceNodeId, 'source', false);
           setSourceNodeId(null);
        }
      } else {
        onSelect(model, 'node');
      }
    });

    graph.on('edge:click', (evt: any) => {
      const { isLinkMode, onSelect } = propsRef.current;
      if (isLinkMode) return;
      const edgeId = evt.target?.id;
      if (!edgeId) return;
      
      const model = graph.getEdgeData(edgeId);
      if (model) {
        onSelect(model, 'edge');
      }
    });

    graph.on('canvas:click', (evt: any) => {
      const { isLinkMode, sourceNodeId, onCanvasClick, onContextMenu } = propsRef.current;
      
      onCanvasClick();
      
      if (isLinkMode && sourceNodeId) {
         // Reset state if clicking canvas while linking
         graph.setElementState(sourceNodeId, 'source', false);
         setSourceNodeId(null);
      }
      
      onContextMenu({ visible: false, x: 0, y: 0, targetId: null, targetType: null });
    });

    graph.on('node:contextmenu', (evt: any) => {
      evt.preventDefault();
      const { onContextMenu } = propsRef.current;
      
      // G6 v5 client coordinates
      const x = evt.client.x;
      const y = evt.client.y;
      
      onContextMenu({
        visible: true,
        x,
        y,
        targetId: evt.target?.id,
        targetType: 'node',
      });
    });

    graph.on('canvas:contextmenu', (evt: any) => {
        evt.preventDefault();
        const { onContextMenu } = propsRef.current;
        const x = evt.client.x;
        const y = evt.client.y;
        
        onContextMenu({
          visible: true,
          x,
          y,
          targetId: null,
          targetType: 'canvas',
        });
    });

    // Resize handler
    const handleResize = () => {
      if (containerRef.current && graphRef.current) {
        graphRef.current.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };
    window.addEventListener('resize', handleResize);

    // Initial Render
    graph.render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphRef.current) {
        try {
          graphRef.current.destroy();
        } catch(e) {
          console.error("Cleanup error", e);
        }
        graphRef.current = null;
      }
    };
  }, []); // Run once on mount

  // --- Effect: Handle Data Changes ---
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    // In G6 v5, setData updates the graph data structure
    // We wrap in try-catch to avoid transient errors during hot reload or rapid updates
    try {
        graph.setData(JSON.parse(JSON.stringify(data)));
        graph.render();
    } catch(e) {
        console.error("Data update error", e);
    }
  }, [data]);

  // --- Effect: Handle Search & Highlights ---
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const { searchQuery, isLinkMode, sourceNodeId } = propsRef.current;
    
    // getNodeData() returns array of nodes in v5
    try {
        const nodes = graph.getNodeData();

        nodes.forEach((node: any) => {
          const nodeId = node.id;
          // Reset states
          graph.setElementState(nodeId, 'highlight', false);
          graph.setElementState(nodeId, 'dim', false);
          
          if (searchQuery) {
            if (node.label && String(node.label).toLowerCase().includes(searchQuery.toLowerCase())) {
              graph.setElementState(nodeId, 'highlight', true);
            } else {
              graph.setElementState(nodeId, 'dim', true);
            }
          }

          // Reset source state - we will re-apply it below if needed
          graph.setElementState(nodeId, 'source', false);
        });

        // Re-apply source highlight if needed
        if (isLinkMode && sourceNodeId) {
            graph.setElementState(sourceNodeId, 'source', true);
        }
    } catch(e) {
        console.error("Highlight error", e);
    }

  }, [searchQuery, isLinkMode, sourceNodeId, data]);

  return <div ref={containerRef} className="w-full h-full bg-slate-50" />;
};

export default GraphCanvas;