export type NodeType = 'Disease' | 'Symptom' | 'RiskFactor' | 'Examination' | 'Treatment';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  color: string;
  size?: number;
  x?: number;
  y?: number;
  [key: string]: any;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  id?: string;
  [key: string]: any;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetId: string | null;
  targetType: 'node' | 'canvas' | null;
}
