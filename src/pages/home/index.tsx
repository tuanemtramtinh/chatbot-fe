/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/home/index.tsx
import { useRef, useState } from 'react';
import { Button, Flex, Steps, message as antdMessage } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import StructuredInput from '../../components/StructuredInput';
import ActorReview, { type Actor } from '../../components/ActorReview';
import { DiagramWrapper, type NodeData, type LinkData } from '../../components/DiagramWrapper';
import { useLocalChat } from '../../hooks/useLocalChat';
import { useAgentStream } from '../../hooks/useAgentStream';
import type { ReactDiagram } from 'gojs-react';
import { DiagramPalette } from '../../components/DiagramPalette';

type WorkflowPhase = 'input' | 'actor-review' | 'diagram-scenario-review' | 'scenario-review' | 'final';

export default function HomePage() {
  const [phase, setPhase] = useState<WorkflowPhase>('input');
  const [actors, setActors] = useState<Actor[]>([]);
  const [diagramNodes, setDiagramNodes] = useState<NodeData[]>([]);
  const [diagramLinks, setDiagramLinks] = useState<LinkData[]>([]);
  const diagramRef = useRef<ReactDiagram>(null);
  const { isTyping, setIsTyping, createNewConversation } = useLocalChat();
  const { isBlocking } = useAgentStream();

  // Simulate actor extraction from backend
  const simulateActorExtraction = (): Promise<Actor[]> => {
    return new Promise((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        // Mock actors extracted from input
        const mockActors: Actor[] = [
          {
            id: '1',
            name: 'Warehouse Staff',
            type: 'Person',
            description: 'Staff responsible for inventory management',
            confidenceScore: 0.95,
          },
          {
            id: '2',
            name: 'Manager',
            type: 'Person',
            description: 'Manager who approves inventory',
            confidenceScore: 0.92,
          },
          {
            id: '3',
            name: 'Admin',
            type: 'Person',
            description: 'Administrator role',
            confidenceScore: 0.75, // Low confidence - should be highlighted
          },
        ];
        resolve(mockActors);
      }, 2000);
    });
  };

  // Simulate diagram generation from actors
  const simulateDiagramGeneration = (): Promise<void> => {
    return new Promise((resolve) => {
      setDiagramNodes([
        { key: -99, label: 'Inventory Management System', isGroup: true },
        { key: 1, category: 'Actor', label: 'Warehouse Staff' },
        { key: 2, category: 'Actor', label: 'Manager' },
        { key: 3, category: 'Usecase', label: 'Scan RFID Tag', group: -99 },
        { key: 4, category: 'Usecase', label: 'Create Check Sheet', group: -99 },
        { key: 5, category: 'Usecase', label: 'Approve Inventory', group: -99 },
      ]);
      setDiagramLinks([
        { key: -1, from: 1, to: 3 },
        { key: -2, from: 1, to: 4 },
        { key: -3, from: 4, to: 3, text: '<<include>>' },
        { key: -4, from: 2, to: 5 },
      ]);
      resolve();
    });
  };

  const handleStructuredSubmit = async (_fullText: string, blocksData: any[]) => {
    setIsTyping(true);
    antdMessage.loading({ content: 'Đang phân tích actors...', key: 'analyzing', duration: 0 });

    console.log('Analyzing Paragraph:', _fullText);
    console.log('Raw Blocks Data:', blocksData);

    try {
      // Simulate actor extraction
      const extractedActors = await simulateActorExtraction();
      setActors(extractedActors);

      antdMessage.success({ content: 'Đã trích xuất actors!', key: 'analyzing' });
      setPhase('actor-review');
    } catch {
      antdMessage.error({ content: 'Có lỗi xảy ra khi phân tích', key: 'analyzing' });
    } finally {
      setIsTyping(false);
    }
  };

  const handleActorUpdate = (updatedActors: Actor[]) => {
    setActors(updatedActors);
  };

  const handleActorConfirm = async (confirmedActors: Actor[]) => {
    setIsTyping(true);
    antdMessage.loading({ content: 'Đang tạo diagram...', key: 'generating', duration: 0 });
    console.log(confirmedActors);

    try {
      await simulateDiagramGeneration();
      antdMessage.success({ content: 'Đã tạo diagram!', key: 'generating' });
      setPhase('diagram-scenario-review');
    } catch {
      antdMessage.error({ content: 'Có lỗi xảy ra khi tạo diagram', key: 'generating' });
    } finally {
      setIsTyping(false);
    }
  };

  const handleDiagramUpdate = (nodes: NodeData[], links: LinkData[]) => {
    setDiagramNodes(nodes);
    setDiagramLinks(links);
  };

  const handleDiagramConfirm = (finalNodes: NodeData[], finalLinks: LinkData[]) => {
    console.log(finalNodes, finalLinks);
    // setPhase('scenario-review');
    antdMessage.success('Đã hoàn thành workflow!');
  };

  const handleNewConversation = () => {
    setPhase('input');
    setActors([]);
    setDiagramNodes([]);
    setDiagramLinks([]);
    createNewConversation();
  };

  const steps = [
    { title: 'Nhập yêu cầu', content: 'Nhập theo format' },
    { title: 'Actor Review', content: 'Xem và chỉnh sửa actors' },
    { title: 'Diagram & Scenario Review', content: 'Xem và chỉnh sửa diagram và scenario' },
    { title: 'Hoàn thành', content: 'Kết quả cuối cùng' },
  ];

  const currentStep = phase === 'input' ? 0 : phase === 'actor-review' ? 1 : phase === 'diagram-scenario-review' ? 2 : 3;

  return (
    <Flex vertical style={{ height: '100%', padding: '24px' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Generative AI Use Case Diagram</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNewConversation}>
          Hội thoại mới
        </Button>
      </Flex>

      <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {phase === 'input' && (
          <Flex vertical gap="large" style={{ padding: '16px', height: '100%', minHeight: 0 }}>
            <StructuredInput onSubmit={handleStructuredSubmit} isSubmitting={isTyping || isBlocking} />
          </Flex>
        )}

        {phase === 'actor-review' && <ActorReview actors={actors} onUpdate={handleActorUpdate} onConfirm={handleActorConfirm} />}

        {phase === 'diagram-scenario-review' && (
          <div style={{ display: 'flex', height: '490px', position: 'relative' }}>
            <DiagramPalette />
            <div style={{ flex: 1, position: 'relative', height: '100%', overflow: 'hidden' }}>
              {/* Confirm Button Overlay */}
              <button
                onClick={() => handleDiagramConfirm(diagramNodes, diagramLinks)}
                style={{
                  position: 'absolute',
                  zIndex: 10,
                  top: 10,
                  right: 10,
                  backgroundColor: '#52c41a',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Confirm Diagram
              </button>
              <DiagramWrapper ref={diagramRef} nodeDataArray={diagramNodes} linkDataArray={diagramLinks} onModelChange={handleDiagramUpdate} />
            </div>
          </div>
        )}

        {/* {phase === 'final' && (
          <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3>Diagram cuối cùng</h3>
            <DiagramWrapper nodeData={diagramNodes} linkData={diagramLinks} onConfirm={handleDiagramConfirm} readonly />
          </div>
        )} */}
      </div>
    </Flex>
  );
}
