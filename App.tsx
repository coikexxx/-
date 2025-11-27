import React, { useState, useEffect } from 'react';
import { Layout, Button, Input, Switch, Drawer, Form, Select, ColorPicker, message, Modal, Dropdown, MenuProps } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, SearchOutlined, DeploymentUnitOutlined } from '@ant-design/icons';
import GraphCanvas from './components/GraphCanvas';
import Legend from './components/Legend';
import { INITIAL_DATA, NODE_TYPES } from './constants';
import { GraphData, GraphNode, GraphEdge, ContextMenuState } from './types';

const { Header, Content } = Layout;

// Helper to generate IDs
const generateId = () => Date.now().toString();

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>(INITIAL_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLinkMode, setIsLinkMode] = useState(false);
  
  // Drawer / Selection State
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'node' | 'edge' | null>(null);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, targetId: null, targetType: null
  });

  // Modal States
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [pendingLink, setPendingLink] = useState<{source: string, target: string} | null>(null);

  const [form] = Form.useForm();
  const [newNodeForm] = Form.useForm();
  const [newLinkForm] = Form.useForm();

  // --- Actions ---

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelect = (item: any, type: 'node' | 'edge') => {
    setSelectedItem(item);
    setSelectedType(type);
    setDrawerVisible(true);
    form.setFieldsValue({
      ...item,
      // Handle color object from some pickers or string
      color: item.color
    });
  };

  const handleCanvasClick = () => {
    setDrawerVisible(false);
    setSelectedItem(null);
    setSelectedType(null);
  };

  // --- CRUD Operations ---

  const addNode = (values: any) => {
    const typeConfig = NODE_TYPES.find(t => t.value === values.type);
    const newNode: GraphNode = {
      id: generateId(),
      label: values.label,
      type: values.type,
      color: typeof values.color === 'string' ? values.color : values.color.toHexString(),
      size: values.type === 'Disease' ? 50 : 40,
    };

    setGraphData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setIsNodeModalOpen(false);
    newNodeForm.resetFields();
    message.success('节点已创建');
  };

  const updateItem = (values: any) => {
    if (!selectedItem || !selectedType) return;

    if (selectedType === 'node') {
      const updatedNodes = graphData.nodes.map(n => 
        n.id === selectedItem.id ? { ...n, ...values, color: typeof values.color === 'string' ? values.color : values.color?.toHexString() || n.color } : n
      );
      setGraphData({ ...graphData, nodes: updatedNodes });
    } else {
      const updatedEdges = graphData.edges.map(e => 
        // Edges in G6 sometimes have internal IDs, but we match by source/target/label usually or internal ID
        (e.id === selectedItem.id || (e.source === selectedItem.source && e.target === selectedItem.target)) 
          ? { ...e, label: values.label } : e
      );
      setGraphData({ ...graphData, edges: updatedEdges });
    }
    setDrawerVisible(false);
    message.success('更新成功');
  };

  const deleteItem = (item: any, type: 'node' | 'edge') => {
    if (type === 'node') {
      const newNodes = graphData.nodes.filter(n => n.id !== item.id);
      // Cascade delete edges
      const newEdges = graphData.edges.filter(e => e.source !== item.id && e.target !== item.id);
      setGraphData({ nodes: newNodes, edges: newEdges });
    } else {
      const newEdges = graphData.edges.filter(e => {
          // If item has ID use it, otherwise match source/target
          if (item.id) return e.id !== item.id;
          return !(e.source === item.source && e.target === item.target);
      });
      setGraphData({ ...graphData, edges: newEdges });
    }
    setDrawerVisible(false);
    setContextMenu(prev => ({ ...prev, visible: false }));
    message.success('删除成功');
  };

  const handleLinkComplete = (sourceId: string, targetId: string) => {
    // Check if edge already exists
    const exists = graphData.edges.some(e => e.source === sourceId && e.target === targetId);
    if (exists) {
      message.warning('这两个节点之间已经存在连线');
      return;
    }
    setPendingLink({ source: sourceId, target: targetId });
    setIsLinkModalOpen(true);
  };

  const confirmLink = (values: any) => {
    if (!pendingLink) return;
    const newEdge: GraphEdge = {
      source: pendingLink.source,
      target: pendingLink.target,
      label: values.label || '关联',
      id: generateId(), // Give edge an ID for easier deletion
    };
    setGraphData(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge]
    }));
    setIsLinkModalOpen(false);
    newLinkForm.resetFields();
    setPendingLink(null);
    message.success('连线已建立');
  };

  // --- Context Menu ---
  const handleContextMenu = (state: ContextMenuState) => {
    setContextMenu(state);
  };

  // Context Menu Items
  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;

    const menuStyle: React.CSSProperties = {
      position: 'fixed',
      top: contextMenu.y,
      left: contextMenu.x,
      zIndex: 1000,
      backgroundColor: 'white',
      border: '1px solid #eee',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      borderRadius: '4px',
      padding: '4px 0',
      minWidth: '120px'
    };

    const itemStyle = "px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 block w-full text-left";

    if (contextMenu.targetType === 'node') {
      return (
        <div style={menuStyle}>
          <button className={itemStyle} onClick={() => {
            const node = graphData.nodes.find(n => n.id === contextMenu.targetId);
            if(node) handleSelect(node, 'node');
            setContextMenu(prev => ({...prev, visible: false}));
          }}>编辑属性</button>
          <button className={`${itemStyle} text-red-500`} onClick={() => {
            const node = graphData.nodes.find(n => n.id === contextMenu.targetId);
             Modal.confirm({
                title: '确认删除?',
                content: '删除节点将同时删除相关连线',
                onOk: () => node && deleteItem(node, 'node')
             });
          }}>删除节点</button>
        </div>
      );
    } 
    
    // Canvas Menu
    return (
      <div style={menuStyle}>
        <button className={itemStyle} onClick={() => {
          setIsNodeModalOpen(true);
          setContextMenu(prev => ({...prev, visible: false}));
        }}>新增节点</button>
      </div>
    );
  };

  // Listen for delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItem) {
        // Prevent deleting if typing in input
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        Modal.confirm({
          title: `确认删除该${selectedType === 'node' ? '节点' : '连线'}?`,
          onOk: () => deleteItem(selectedItem, selectedType!),
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, selectedType, graphData]);

  return (
    <Layout className="h-screen overflow-hidden">
      {/* --- Header --- */}
      <Header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20 shadow-sm h-16">
        <div className="flex items-center gap-3">
          <DeploymentUnitOutlined className="text-2xl text-blue-600" />
          <h1 className="text-lg font-bold text-gray-800 tracking-wide">食管癌知识图谱管理系统</h1>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Search */}
           <Input 
              prefix={<SearchOutlined className="text-gray-400" />} 
              placeholder="搜索节点..." 
              className="w-64"
              value={searchQuery}
              onChange={handleSearch}
              allowClear
           />
           
           <div className="h-6 w-px bg-gray-300 mx-2"></div>

           {/* Link Mode Switch */}
           <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              <span className={`text-sm ${isLinkMode ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>连线模式</span>
              <Switch 
                checked={isLinkMode} 
                onChange={setIsLinkMode} 
                size="small"
              />
           </div>

           {/* Actions */}
           <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsNodeModalOpen(true)}
            disabled={isLinkMode}
           >
             新建节点
           </Button>
        </div>
      </Header>

      {/* --- Main Content --- */}
      <Content className="relative flex-1 bg-slate-50 overflow-hidden">
        <GraphCanvas 
          data={graphData}
          searchQuery={searchQuery}
          isLinkMode={isLinkMode}
          onSelect={handleSelect}
          onLinkComplete={handleLinkComplete}
          onContextMenu={handleContextMenu}
          onCanvasClick={handleCanvasClick}
        />
        
        <Legend />
        
        {renderContextMenu()}

        {/* --- Drawer: Edit Properties --- */}
        <Drawer
          title={`编辑${selectedType === 'node' ? '节点' : '连线'}属性`}
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          mask={false} // Allow interacting with graph while drawer is open
          extra={
            <Button 
              type="primary" 
              danger 
              size="small" 
              icon={<DeleteOutlined />} 
              onClick={() => {
                Modal.confirm({
                  title: '确认删除?',
                  content: '此操作不可恢复',
                  onOk: () => deleteItem(selectedItem, selectedType!)
                });
              }}
            >
              删除
            </Button>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={updateItem}
          >
             {/* Read-only ID */}
            <Form.Item label="ID" name="id">
               <Input disabled className="bg-gray-50 text-gray-500" />
            </Form.Item>

            <Form.Item 
              label="名称/标签" 
              name="label" 
              rules={[{ required: true, message: '请输入名称' }]}
            >
              <Input />
            </Form.Item>

            {selectedType === 'node' && (
              <>
                <Form.Item label="类型" name="type">
                  <Select options={NODE_TYPES.map(t => ({ label: t.label, value: t.value }))} />
                </Form.Item>
                <Form.Item label="颜色" name="color">
                   <ColorPicker showText />
                </Form.Item>
              </>
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" block icon={<SaveOutlined />}>
                保存更改
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
      </Content>

      {/* --- Modal: Add Node --- */}
      <Modal
        title="新建节点"
        open={isNodeModalOpen}
        onCancel={() => setIsNodeModalOpen(false)}
        onOk={() => newNodeForm.submit()}
      >
        <Form form={newNodeForm} layout="vertical" onFinish={addNode} initialValues={{ type: 'Symptom', color: '#fa8c16' }}>
          <Form.Item label="节点名称" name="label" rules={[{ required: true }]}>
             <Input placeholder="例如: 吞咽疼痛" />
          </Form.Item>
          <Form.Item label="类型" name="type" rules={[{ required: true }]}>
             <Select 
               options={NODE_TYPES.map(t => ({ label: t.label, value: t.value }))} 
               onChange={(val) => {
                 // Auto set color based on type
                 const typeDef = NODE_TYPES.find(t => t.value === val);
                 if(typeDef) newNodeForm.setFieldValue('color', typeDef.color);
               }}
             />
          </Form.Item>
          <Form.Item label="颜色" name="color">
             <ColorPicker showText disabled />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- Modal: Add Link --- */}
      <Modal
         title="创建连线"
         open={isLinkModalOpen}
         onCancel={() => {
           setIsLinkModalOpen(false);
           setPendingLink(null);
         }}
         onOk={() => newLinkForm.submit()}
      >
         <div className="mb-4 text-gray-500 text-sm">
           连接: <b>{graphData.nodes.find(n => n.id === pendingLink?.source)?.label}</b> -> <b>{graphData.nodes.find(n => n.id === pendingLink?.target)?.label}</b>
         </div>
         <Form form={newLinkForm} layout="vertical" onFinish={confirmLink} initialValues={{ label: '' }}>
            <Form.Item label="关系名称 (Label)" name="label" rules={[{ required: true, message: '请输入关系名称' }]}>
               <Input placeholder="例如: 导致, 属于, 治疗" />
            </Form.Item>
         </Form>
      </Modal>
    </Layout>
  );
};

export default App;
