/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/home/index.tsx
import { useEffect, useRef, useState } from 'react';
import { Button, Flex, Layout, Menu, Steps, Typography, message as antdMessage } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import StructuredInput from '../../components/StructuredInput';
import ActorReview, { type Actor } from '../../components/ActorReview';
import { DiagramWrapper, type NodeData, type LinkData } from '../../components/DiagramWrapper';
import type { ReactDiagram } from 'gojs-react';
import { DiagramPalette } from '../../components/DiagramPalette';
import { UseCaseDetailEditor, type UseCaseDetail } from '../../components/ScenarioReview';
import { apiService, type BackendActor } from '../../components/api';
import { storageService, type ProjectSession } from '../../utils/storage';

const { Sider, Content } = Layout;
const { Text } = Typography;

export default function HomePage() {
  // 1. Session State
  const [sessions, setSessions] = useState<ProjectSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ProjectSession | null>(null);
  // 2. Application Flow State (Derived from Session)
  const [phase, setPhase] = useState<'input' | 'actor-review' | 'diagram-scenario-review'>('input');
  // 3. Data State
  const [inputStoryText, setInputStoryText] = useState(''); // Text for Step 1
  const [actors, setActors] = useState<Actor[]>([]); // Data for Step 2
  // const [diagramNodes, setDiagramNodes] = useState<NodeData[]>([]); // Data for Step 3
  // const [diagramLinks, setDiagramLinks] = useState<LinkData[]>([]);
  // const [useCaseDetails, setUseCaseDetails] = useState<Record<number, UseCaseDetail>>({});
  // UI State
  const [isTyping, setIsTyping] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // const [selectedUseCaseId, setSelectedUseCaseId] = useState<number | null>(null);
  // const diagramRef = useRef<ReactDiagram>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const loaded = storageService.getSessions();
    setSessions(loaded);
    // Note: We don't auto-load the first session anymore, we start with a blank slate (New Chat)
  }, []);
  const handleNewChat = () => {
    setCurrentSession(null); // Clear current session
    setPhase('input'); // Reset phase
    setInputStoryText(''); // Clear text
    setActors([]); // Clear actors
  };

  // --- SESSION HELPERS ---
  // 2. LOAD EXISTING SESSION
  const loadSession = (session: ProjectSession) => {
    setCurrentSession(session);
    setPhase(session.currentPhase);

    // Restore Step 1 Data
    if (session.step1) {
      setInputStoryText(session.step1.initial.rawInput);

      // If we have Final (approved) actors, show those. Else show Initial (extracted).
      const actorsToLoad = session.step1.final ? session.step1.final.approvedActors : session.step1.initial.extractedActors;

      setActors(actorsToLoad);
    }
  };

  // 3. DELETE SESSION
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.deleteSession(id);
    const remaining = storageService.getSessions();
    setSessions(remaining);

    // If we deleted the active session, reset to new chat
    if (currentSession?.id === id) {
      handleNewChat();
    }
  };

  // Simulate diagram generation from actors
  // const simulateDiagramGeneration = (): Promise<void> => {
  //   return new Promise((resolve) => {
  //     const nodes: NodeData[] = [
  //       { key: -99, label: 'Inventory Management System', isGroup: true },
  //       { key: 1, category: 'Actor', label: 'Warehouse Staff' },
  //       { key: 2, category: 'Actor', label: 'Manager' },
  //       { key: 3, category: 'Usecase', label: 'Scan RFID Tag', group: -99 },
  //       { key: 4, category: 'Usecase', label: 'Create Check Sheet', group: -99 },
  //       { key: 5, category: 'Usecase', label: 'Approve Inventory', group: -99 },
  //     ];
  //     setDiagramNodes(nodes);
  //     setDiagramLinks([
  //       { key: -1, from: 1, to: 3 },
  //       { key: -2, from: 1, to: 4 },
  //       { key: -3, from: 4, to: 3, text: '<<include>>' },
  //       { key: -4, from: 2, to: 5 },
  //     ]);
  //     const initialDetails: Record<number, UseCaseDetail> = {};
  //     nodes.forEach((node) => {
  //       if (node.category === 'Usecase') {
  //         initialDetails[node.key] = {
  //           id: node.key,
  //           name: node.label,
  //           actors: 'Warehouse Staff', // Simplified logic
  //           description: `User wants to ${node.label} to ensure inventory accuracy.`,
  //           preconditions: 'User is logged into the system.',
  //           postconditions: 'Data is saved successfully.',
  //           mainFlow: '1. User selects action.\n2. System validates.\n3. System performs action.',
  //           alternativeFlow: '3a. If validation fails, show error.',
  //           scores: {
  //             completeness: Math.floor(Math.random() * (100 - 70) + 70), // Random 70-100
  //             correctness: Math.floor(Math.random() * (100 - 80) + 80), // Random 80-100
  //             relevance: Math.floor(Math.random() * (100 - 60) + 60), // Random 60-100
  //           },
  //         };
  //       }
  //     });
  //     setUseCaseDetails(initialDetails);
  //     resolve();
  //   });
  // };
  // --- HANDLERS ---
  const handleStructuredSubmit = async (fullText: string) => {
    if (!fullText.trim()) {
      antdMessage.warning('Please enter user stories.');
      return;
    }
    const storiesList = fullText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setIsTyping(true);
    antdMessage.loading({ content: 'Đang phân tích user stories...', key: 'analyzing', duration: 0 });
    try {
      // 3. Call the API
      const data = await apiService.extractActors(storiesList);
      console.log(data);
      if (data.interrupt?.type === 'review_actors') {
        const mappedActors = data.interrupt.actors.map((apiActor: BackendActor, index: number) => ({
          id: String(index),
          name: apiActor.actor,
          alias: apiActor.aliases,
          sentences_idx: apiActor.sentence_idx,
          status: 'candidate' as const,
        }));

        setActors(mappedActors);
        setInputStoryText(fullText); // Keep text in sync
        // SAVE STEP 1
        const newSession: ProjectSession = {
          id: data.thread_id,
          name: `Project ${new Date().toLocaleTimeString()}`, // You can generate a better name later
          lastModified: Date.now(),
          currentPhase: 'actor-review',
          step1: {
            initial: {
              rawInput: fullText,
              extractedActors: mappedActors,
            },
            final: undefined, // Not confirmed yet
          },
        };
        storageService.saveSession(newSession);
        setSessions(storageService.getSessions());
        antdMessage.success({ content: 'Đã trích xuất actors!', key: 'analyzing' });
        setPhase('actor-review');
      }
    } catch {
      antdMessage.error({ content: 'Có lỗi xảy ra khi phân tích', key: 'analyzing' });
    } finally {
      setIsTyping(false);
    }
  };

  const handleActorConfirm = async (candidates: Actor[], approved: Actor[]) => {
    setIsTyping(true);
    antdMessage.loading({ content: 'Đang tạo diagram...', key: 'generating', duration: 0 });
    console.log(candidates, approved);

    try {
      // await simulateDiagramGeneration();
      antdMessage.success({ content: 'Đã tạo diagram!', key: 'generating' });
      // setPhase('diagram-scenario-review');
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
    // Might haven't check for delete action on the diagram
    // 1. Create a copy of current details
    const finalDetails = { ...useCaseDetails };

    // 2. Loop through all nodes to check for missing details
    finalNodes.forEach((node) => {
      if (node.category === 'Usecase' && !finalDetails[node.key]) {
        // Fill in the gap for unclicked nodes
        finalDetails[node.key] = {
          id: node.key,
          name: node.label,
          actors: '',
          description: '',
          preconditions: '',
          postconditions: '',
          mainFlow: '',
          alternativeFlow: '',
          scores: { completeness: 0, correctness: 0, relevance: 0 },
        };
      }
    });
    console.log(finalNodes, finalLinks);
    console.log(finalDetails);
    // setPhase('scenario-review');
    antdMessage.success('Đã hoàn thành workflow!');
  };

  // Handle Selection
  const handleNodeSelect = (key: number | null) => {
    setSelectedUseCaseId(key);

    // If a new node is dragged in (doesn't exist in details yet), create default data
    if (key !== null && !useCaseDetails[key]) {
      const node = diagramNodes.find((n) => n.key === key);
      if (node) {
        setUseCaseDetails((prev) => ({
          ...prev,
          [key]: {
            id: key,
            name: node.label,
            actors: '',
            description: '',
            preconditions: '',
            postconditions: '',
            mainFlow: '',
            alternativeFlow: '',
            scores: { completeness: 0, correctness: 0, relevance: 0 },
          },
        }));
      }
    }
  };

  // Handle Detail Updates (Typing in the table)
  const handleDetailUpdate = (updated: UseCaseDetail) => {
    setUseCaseDetails((prev) => ({ ...prev, [updated.id]: updated }));

    // Optional: Sync Name change back to Diagram Node Label
    const node = diagramNodes.find((n) => n.key === updated.id);
    if (node && node.label !== updated.name) {
      setDiagramNodes((prev) => prev.map((n) => (n.key === updated.id ? { ...n, label: updated.name } : n)));
    }
  };

  const steps = [
    { title: 'Nhập yêu cầu', content: 'Nhập user stories' },
    { title: 'Actor Review', content: 'Xem và chỉnh sửa actors' },
    { title: 'Diagram & Scenario Review', content: 'Xem và chỉnh sửa diagram và scenario' },
    { title: 'Hoàn thành', content: 'Kết quả cuối cùng' },
  ];

  const currentStep = phase === 'input' ? 0 : phase === 'actor-review' ? 1 : phase === 'diagram-scenario-review' ? 2 : 3;

  return (
    <Flex>
      {/* SIDEBAR */}
      <Sider theme="light" width={260} collapsible collapsed={collapsed} onCollapse={setCollapsed} style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px' }}>
          <Button type="primary" block icon={<PlusOutlined />} onClick={handleNewChat}>
            {!collapsed && 'New Project'}
          </Button>
        </div>

        <Menu mode="inline" selectedKeys={[currentSession?.id || '']} style={{ border: 'none', overflowY: 'auto', height: 'calc(100% - 64px)' }}>
          {sessions.map((s) => (
            <Menu.Item key={s.id} onClick={() => loadSession(s)} style={{ height: 'auto', padding: '10px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                  <Text strong>{s.name}</Text>
                  <div style={{ fontSize: 11, color: '#999' }}>{new Date(s.lastModified).toLocaleTimeString()}</div>
                </div>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => handleDeleteSession(s.id, e)} />
              </div>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Flex vertical style={{ height: '100%', flex: 1, padding: '24px' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Generative AI Use Case Diagram</h2>
        </Flex>

        <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {phase === 'input' && (
            <Flex vertical gap="large" style={{ padding: '16px', height: '100%', minHeight: 0 }}>
              <StructuredInput onSubmit={handleStructuredSubmit} isSubmitting={isTyping} initialValue={inputStoryText} />
            </Flex>
          )}

          {phase === 'actor-review' && <ActorReview actors={actors} onConfirm={handleActorConfirm} />}

          {/* {phase === 'diagram-scenario-review' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', height: '500px', position: 'relative' }}>
                <DiagramPalette />
                <div style={{ flex: 1, position: 'relative', height: '100%', overflow: 'hidden' }}>
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
                  <DiagramWrapper
                    ref={diagramRef}
                    nodeDataArray={diagramNodes}
                    linkDataArray={diagramLinks}
                    onModelChange={handleDiagramUpdate}
                    onNodeSelect={handleNodeSelect} // <--- Pass the listener here!
                  />
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 20 }}>
                <UseCaseDetailEditor data={selectedUseCaseId ? useCaseDetails[selectedUseCaseId] : null} onUpdate={handleDetailUpdate} />
              </div>
            </div>
          )} */}

          {/* {phase === 'final' && (
            <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h3>Diagram cuối cùng</h3>
              <DiagramWrapper nodeData={diagramNodes} linkData={diagramLinks} onConfirm={handleDiagramConfirm} readonly />
            </div>
          )} */}
        </div>
      </Flex>
    </Flex>
  );
}
