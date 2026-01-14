/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from 'react';
import { DiagramWrapper } from '../../components/DiagramWrapper';
import type { ReactDiagram } from 'gojs-react';

type NodeData = { key: number; category: string; label: string };
type LinkData = { key: number; from: number; to: number; text?: string };

export default function HomePage() {
  // Initial Data (In your real app, this might come from the AI/Streaming)
  const [nodeData, setNodeData] = useState<NodeData[]>([]);
  const [linkData, setLinkData] = useState<LinkData[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isStreaming, setIsStreaming] = useState(false);
  const diagramRef = useRef<ReactDiagram>(null);

  // Mô phỏng stream data
  const startSimulation = () => {
    setIsStreaming(true);
    setNodeData([]);
    setLinkData([]);

    // Data specifically for a USE CASE diagram
    const streamSequence = [
      { type: 'node', data: { key: -99, label: 'Inventory Management System', isGroup: true } },
      // 1. Create Actors
      { type: 'node', data: { key: 1, category: 'Actor', label: 'Warehouse Staff' } },
      { type: 'node', data: { key: 2, category: 'Actor', label: 'Manager' } },

      // 2. Create Use Cases
      { type: 'node', data: { key: 3, category: 'Usecase', label: 'Scan RFID Tag', group: -99 } },
      { type: 'node', data: { key: 4, category: 'Usecase', label: 'Create Check Sheet', group: -99 } },
      { type: 'node', data: { key: 5, category: 'Usecase', label: 'Approve Inventory', group: -99 } },

      // 3. Create Links (Associations)
      // Staff -> Scan RFID
      { type: 'link', data: { key: -1, from: 1, to: 3 } },
      // Staff -> Create Sheet
      { type: 'link', data: { key: -2, from: 1, to: 4 } },

      // Include relationship: Creating a sheet <<includes>> Scanning RFID
      { type: 'link', data: { key: -3, from: 4, to: 3, text: '<<include>>' } },

      // Manager -> Approve
      { type: 'link', data: { key: -4, from: 2, to: 5 } },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index >= streamSequence.length) {
        clearInterval(interval);
        setIsStreaming(false);
        return;
      }

      const item = streamSequence[index];
      if (item.type === 'node') {
        setNodeData((prev) => [...prev, item.data as NodeData]);
      } else {
        setLinkData((prev) => [...prev, item.data as LinkData]);
      }
      index++;
    }, 600);
  };
  // Export diagram
  const exportForScenarioAgent = () => {
    // Lấy instance thực của Diagram từ GoJS
    const diagram = diagramRef.current?.getDiagram();

    if (diagram) {
      // Lấy toàn bộ data hiện tại (đã được user chỉnh sửa)
      const modelJson = diagram.model.toJson();
      const parsedModel = JSON.parse(modelJson);

      // Format lại theo chuẩn Scenario Agent (Ví dụ)
      const outputPayload = {
        timestamp: new Date().toISOString(),
        actors: parsedModel.nodeDataArray
          .filter((n: any) => n.category === 'Actor')
          .map((n: any) => ({
            label: n.label,
            location: n.loc, // "loc" string like "120.5 300"
          })),

        useCases: parsedModel.nodeDataArray
          .filter((n: any) => n.category === 'Usecase')
          .map((n: any) => ({
            id: n.key,
            name: n.label,
            location: n.loc, // Include location here too
          })),
        relationships: parsedModel.linkDataArray.map((l: any) => ({
          from: l.from,
          to: l.to,
          type: l.text || 'Association', // Nếu không có text thì là Association thường
        })),
      };

      console.log('>>> JSON FOR SCENARIO AGENT:', JSON.stringify(outputPayload, null, 2));
      // alert('Đã xuất JSON ra Console (F12) để gửi cho Agent!');
    }
  };

  // Handle updates from GoJS (User dragging, renaming, linking)
  const handleModelChange = (changes: any) => {
    // GoJS provides an event object with 'modifiedNodeData' and 'modifiedLinkData'
    // You typically only need to update state if you want to save it or send it back to backend
    console.log('GoJS Model Changed:', changes);
    // Note: gojs-react handles the immediate visual updates automatically.
    // If you need to sync heavily, you might update state here,
    // but often you just track the changes for the final "Save" action.
  };

  return (
    <div className="app-container">
      <h1>Generative AI Diagram Editor</h1>

      <div style={{ marginBottom: 10 }}>
        {/* Nút giả lập AI */}
        <button
          onClick={() => {
            startSimulation();
          }}
        >
          Start AI Stream
        </button>

        {/* Nút Save/Export */}
        <button onClick={exportForScenarioAgent} style={{ marginLeft: 10, backgroundColor: 'green', color: 'white' }}>
          Export JSON for Agent
        </button>
      </div>

      <DiagramWrapper ref={diagramRef} nodeDataArray={nodeData} linkDataArray={linkData} onModelChange={handleModelChange} />
    </div>
  );
}
