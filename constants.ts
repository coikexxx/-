import { GraphData, NodeType } from './types';

export const NODE_TYPES: { label: string; value: NodeType; color: string }[] = [
  { label: '疾病 (Disease)', value: 'Disease', color: '#ff4d4f' },
  { label: '症状 (Symptom)', value: 'Symptom', color: '#fa8c16' },
  { label: '风险因素 (RiskFactor)', value: 'RiskFactor', color: '#ffec3d' },
  { label: '检查 (Examination)', value: 'Examination', color: '#4096ff' },
  { label: '治疗 (Treatment)', value: 'Treatment', color: '#73d13d' },
];

export const INITIAL_DATA: GraphData = {
  "nodes": [
    { "id": "1", "label": "食管癌", "type": "Disease", "color": "#ff4d4f", "size": 60 },
    { "id": "2", "label": "进行性吞咽困难", "type": "Symptom", "color": "#fa8c16" },
    { "id": "3", "label": "胸骨后疼痛", "type": "Symptom", "color": "#fa8c16" },
    { "id": "4", "label": "消瘦/贫血", "type": "Symptom", "color": "#fa8c16" },
    { "id": "5", "label": "吸烟与重度饮酒", "type": "RiskFactor", "color": "#ffec3d" },
    { "id": "6", "label": "亚硝胺(腌制食品)", "type": "RiskFactor", "color": "#ffec3d" },
    { "id": "7", "label": "进食过烫", "type": "RiskFactor", "color": "#ffec3d" },
    { "id": "8", "label": "胃镜检查", "type": "Examination", "color": "#4096ff" },
    { "id": "9", "label": "病理活检", "type": "Examination", "color": "#4096ff" },
    { "id": "10", "label": "CT扫描", "type": "Examination", "color": "#4096ff" },
    { "id": "11", "label": "手术切除", "type": "Treatment", "color": "#73d13d" },
    { "id": "12", "label": "放射治疗", "type": "Treatment", "color": "#73d13d" },
    { "id": "13", "label": "化学治疗", "type": "Treatment", "color": "#73d13d" },
    { "id": "14", "label": "食管鳞状细胞癌", "type": "Disease", "color": "#ff4d4f" },
    { "id": "15", "label": "食管腺癌", "type": "Disease", "color": "#ff4d4f" }
  ],
  "edges": [
    { "source": "1", "target": "2", "label": "临床表现" },
    { "source": "1", "target": "3", "label": "临床表现" },
    { "source": "1", "target": "4", "label": "伴随症状" },
    { "source": "5", "target": "1", "label": "诱发" },
    { "source": "6", "target": "1", "label": "诱发" },
    { "source": "7", "target": "1", "label": "高危因素" },
    { "source": "1", "target": "8", "label": "首选检查" },
    { "source": "8", "target": "9", "label": "确诊依据" },
    { "source": "1", "target": "10", "label": "辅助分期" },
    { "source": "1", "target": "11", "label": "早期治疗" },
    { "source": "1", "target": "12", "label": "联合治疗" },
    { "source": "1", "target": "13", "label": "联合治疗" },
    { "source": "14", "target": "1", "label": "属于" },
    { "source": "15", "target": "1", "label": "属于" }
  ]
};
