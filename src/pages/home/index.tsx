/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { Button, Flex, Layout, Menu, Steps, Typography, message as antdMessage } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

// Components
import StructuredInput from '../../components/StructuredInput';
import ActorReview, { type UIActor } from '../../components/ActorReview';
import { UsecaseReview } from '../../components/UsecaseReview';

// Services & Types
import {
  apiService,
  type BackendUseCase,
  type Step2Request,
  type ActorEntity,
  type Step3Request,
  type DiagramNode,
  type DiagramLink,
} from '../../components/api';
import { storageService, type ProjectSession } from '../../utils/storage';
import { DiagramWrapper } from '../../components/DiagramWrapper';
import { DiagramPalette } from '../../components/DiagramPalette';
import type { ReactDiagram } from 'gojs-react';
import { UseCaseDetailEditor, type UseCaseDetail } from '../../components/ScenarioReview';

const { Sider, Content } = Layout;
const { Text } = Typography;

export default function HomePage() {
  // 1. Session State
  const [sessions, setSessions] = useState<ProjectSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ProjectSession | null>(null);

  // 2. Flow State
  const [phase, setPhase] = useState<'input' | 'actor-review' | 'usecase-review' | 'diagram-scenario-review'>('input');

  // 3. Data State
  const [inputStoryText, setInputStoryText] = useState('');
  const [actors, setActors] = useState<UIActor[]>([]); // Uses UI Actor type
  const [usecases, setUsecases] = useState<BackendUseCase[]>([]);
  const [diagramNodes, setDiagramNodes] = useState<DiagramNode[]>([]);
  const [diagramLinks, setDiagramLinks] = useState<DiagramLink[]>([]);
  const diagramRef = useRef<ReactDiagram>(null);
  const [useCaseDetails, setUseCaseDetails] = useState<Record<number, UseCaseDetail>>({});
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<number | null>(null);

  const initialDetails: Record<number, UseCaseDetail> = {};

  const [isTyping, setIsTyping] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const loaded = storageService.getSessions();
    setSessions(loaded);
  }, []);

  const handleNewChat = () => {
    setCurrentSession(null);
    setPhase('input');
    setInputStoryText('');
    setActors([]);
    setUsecases([]);
  };

  // --- SESSION HELPERS ---
  const loadSession = (session: ProjectSession) => {
    setCurrentSession(session);
    setPhase(session.currentPhase);

    // Restore Step 1 (Actors)
    if (session.step1) {
      setInputStoryText(session.step1.initial.rawInput);
      const sourceActors = session.step1.final ? session.step1.final.approvedActors : session.step1.initial.extractedActors;
      const uiActors: UIActor[] = sourceActors.map((a, idx) => ({
        ...a, // Spread actor, aliases, sentence_idx
        id: (a as any).id || String(idx),
        status: session.step1?.final ? 'approved' : 'candidate',
      }));

      setActors(uiActors);
    }

    // Restore Step 2 (Use Cases)
    if (session.step2) {
      const ucToLoad = session.step2.final ? session.step2.final.approvedUseCases : session.step2.initial.extractedUseCases;
      setUsecases(ucToLoad);
    }
    if (session.step3) {
      setDiagramNodes(session.step3.initial.nodes);
      setDiagramLinks(session.step3.initial.links);
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.deleteSession(id);
    const remaining = storageService.getSessions();
    setSessions(remaining);
    if (currentSession?.id === id) {
      handleNewChat();
    }
  };

  // --- HANDLERS ---
  // STEP 1: SUBMIT STORIES
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
    const stopLoading = antdMessage.loading({ content: 'Analyzing user stories...', key: 'analyzing', duration: 0 });

    try {
      const data = await apiService.extractActors(storiesList);

      if (data.interrupt?.type === 'review_actors') {
        // Map Backend Data -> UIActor
        const mappedActors: UIActor[] = data.interrupt.actors.map((apiActor, index) => ({
          ...apiActor, // This correctly copies 'actor', 'aliases', 'sentence_idx'
          id: String(index),
          status: 'candidate' as const,
        }));

        setActors(mappedActors);
        setInputStoryText(fullText);
        setPhase('actor-review');

        // Create Session
        const newSession: ProjectSession = {
          id: data.thread_id,
          name: `Project ${new Date().toLocaleTimeString()}`,
          lastModified: Date.now(),
          currentPhase: 'actor-review',
          step1: {
            initial: {
              rawInput: fullText,
              extractedActors: mappedActors, // Save initial state
            },
            final: undefined,
          },
          step2: null,
          step3: null,
        };

        storageService.saveSession(newSession);
        setSessions(storageService.getSessions());
        setCurrentSession(newSession);

        antdMessage.success({ content: 'Actors extracted!', key: 'analyzing' });
      }
    } catch (error) {
      console.error(error);
      antdMessage.error({ content: 'Failed to analyze stories', key: 'analyzing' });
    } finally {
      setIsTyping(false);
      stopLoading();
    }
  };

  // STEP 2: CONFIRM ACTORS -> GET USE CASES
  const handleActorConfirm = async (candidates: ActorEntity[], approved: ActorEntity[]) => {
    if (!currentSession) return;

    // 1. Save Step 1 Final State
    const step1FinalSession: ProjectSession = {
      ...currentSession,
      lastModified: Date.now(),
      step1: {
        ...currentSession.step1!,
        final: {
          candidateActors: candidates,
          approvedActors: approved,
        },
      },
    };
    storageService.saveSession(step1FinalSession);
    setCurrentSession(step1FinalSession);

    // 2. Call API (No complex mapping needed anymore!)
    const requestPayload: Step2Request = {
      thread_id: currentSession.id,
      actors: approved,
    };
    const stopLoading = antdMessage.loading({ content: 'Generating Use Cases...', key: 'generating', duration: 0 });
    try {
      const data = await apiService.extractUseCases(requestPayload);

      if (data.interrupt?.type === 'review_usecases') {
        const extractedUC = data.interrupt.usecases;

        // 4. Save Step 2 Initial State
        const step2Session: ProjectSession = {
          ...step1FinalSession,
          currentPhase: 'usecase-review',
          step2: {
            initial: {
              extractedUseCases: extractedUC,
            },
            final: undefined,
          },
        };

        storageService.saveSession(step2Session);
        setCurrentSession(step2Session);

        // 5. Update UI
        setUsecases(extractedUC);
        setPhase('usecase-review');
        antdMessage.success({ content: 'Use cases generated!', key: 'generating' });
      }
    } catch {
      antdMessage.error({ content: 'Failed to generate use cases', key: 'generating' });
    } finally {
      stopLoading();
    }
  };

  const handleUseCaseConfirm = async (finalUseCases: BackendUseCase[]) => {
    if (!currentSession) return;

    // 1. Save Step 2 Final
    const step2FinalSession: ProjectSession = {
      ...currentSession,
      lastModified: Date.now(),
      step2: { ...currentSession.step2!, final: { approvedUseCases: finalUseCases } },
    };
    storageService.saveSession(step2FinalSession);
    setCurrentSession(step2FinalSession);

    // 2. Call API
    const requestPayload: Step3Request = { thread_id: currentSession.id, usecases: finalUseCases };
    const stopLoading = antdMessage.loading({ content: 'Generating Diagram...', key: 'gen_diagram', duration: 0 });

    try {
      const data = await apiService.generateDiagram(requestPayload);

      // 3. Save Step 3 Initial
      const step3Session: ProjectSession = {
        ...step2FinalSession,
        currentPhase: 'diagram-scenario-review',
        step3: {
          initial: { nodes: data.nodes, links: data.links },
          final: undefined,
        },
      };
      storageService.saveSession(step3Session);
      setCurrentSession(step3Session);

      // 4. Update UI
      setDiagramNodes(data.nodes);
      setDiagramLinks(data.links);
      setPhase('diagram-scenario-review');
      antdMessage.success({ content: 'Diagram Generated!', key: 'gen_diagram' });
    } catch (e) {
      console.error(e);
      antdMessage.error({ content: 'Failed to generate diagram', key: 'gen_diagram' });
    } finally {
      stopLoading();
    }
  };

  const handleDiagramConfirm = async (userDiagramNodes: DiagramNode[], userDiagramLinks: DiagramLink[]) => {
    console.log(userDiagramNodes, userDiagramLinks);
  };
  const handleNodeSelect = () => {};
  const handleDetailUpdate = () => {};

  // --- RENDER HELPERS ---
  const steps = [
    { title: 'Input', content: 'Enter user stories' },
    { title: 'Actors', content: 'Review actors' },
    { title: 'Usecases', content: 'Review usecases' },
    { title: 'Diagram & Detail', content: 'Diagram & Scenario Review' },
  ];

  const currentStep = phase === 'input' ? 0 : phase === 'actor-review' ? 1 : phase === 'usecase-review' ? 2 : phase === 'diagram-scenario-review' ? 3 : 4;

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

      {/* CONTENT */}
      <Flex vertical style={{ height: '100%', flex: 1 }}>
        <Content style={{ padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ marginTop: 0 }}>Generative AI Use Case Diagram</h2>
            <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* PHASE 1: INPUT */}
            {phase === 'input' && <StructuredInput onSubmit={handleStructuredSubmit} isSubmitting={isTyping} />}

            {/* PHASE 2: ACTOR REVIEW */}
            {phase === 'actor-review' && <ActorReview actors={actors} rawStoryText={inputStoryText} onConfirm={handleActorConfirm} />}

            {/* PHASE 3: USECASE REVIEW */}
            {phase === 'usecase-review' && <UsecaseReview usecases={usecases} onConfirm={handleUseCaseConfirm} />}

            {/* PHASE 4: DIAGRAM */}
            {phase === 'diagram-scenario-review' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Top Half: Diagram */}
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
                      onModelChange={() => {}}
                      onNodeSelect={handleNodeSelect} // <--- Pass the listener here!
                    />
                  </div>
                </div>

                {/* Bottom Half: Detail Editor */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 20 }}>
                  <UseCaseDetailEditor data={selectedUseCaseId ? useCaseDetails[selectedUseCaseId] : null} onUpdate={handleDetailUpdate} />
                </div>
              </div>
            )}
          </div>
        </Content>
      </Flex>
    </Flex>
  );
}
