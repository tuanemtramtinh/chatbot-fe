/* eslint-disable @typescript-eslint/no-explicit-any */
import { forwardRef, useEffect, useRef } from 'react';
import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import './DiagramWrapper.css';

export type NodeData = { key: number; category?: string; label: string; isGroup?: boolean; group?: number; loc?: string };
export type LinkData = { key: number; from: number; to: number; text?: string };

interface DiagramProps {
  nodeDataArray: Array<NodeData>;
  linkDataArray: Array<LinkData>;
  onModelChange: (nodes: NodeData[], links: LinkData[]) => void;
  onNodeSelect?: (key: number | null) => void;
}

const initDiagram = () => {
  const $ = go.GraphObject.make;

  // Initialize the Diagram
  const diagram = $(go.Diagram, {
    'undoManager.isEnabled': true, // Must be enabled for user editing
    allowDrop: true,
    'toolManager.mouseWheelBehavior': go.ToolManager.WheelZoom,
    // Force layout to push node apart
    layout: $(go.ForceDirectedLayout, {
      defaultSpringLength: 50,
      defaultElectricalCharge: 10,
      // isOngoing: false,
    }),
    model: $(go.GraphLinksModel, {
      linkKeyProperty: 'key', // required for merging link data
    }),
  });

  // Actor template
  const actorTemplate = $(
    go.Node,
    'Vertical',
    { locationSpot: go.Spot.Center },
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
    // Stick figure
    $(go.Shape, {
      geometryString: 'F M25 0 A10 10 0 1 1 25 20 A10 10 0 1 1 25 0 M25 20 L25 50 M5 30 L45 30 M10 70 L25 50 L40 70',
      fill: '#f5f5f5',
      stroke: 'black',
      strokeWidth: 2,
      desiredSize: new go.Size(50, 70),
      portId: '',
      fromSpot: go.Spot.AllSides,
      toSpot: go.Spot.AllSides,
      fromLinkable: true,
      toLinkable: true,
    }),
    // Actor name
    $(
      go.TextBlock,
      {
        margin: 5,
        font: 'bold 11pt sans-serif',
        editable: true,
        wrap: go.TextBlock.WrapFit,
        textAlign: 'center',
        maxSize: new go.Size(100, NaN),
        cursor: 'move',
      },
      new go.Binding('text', 'label').makeTwoWay(),
    ),
  );

  // Usecase template
  const usecaseTemplate = $(
    go.Node,
    'Auto',
    { locationSpot: go.Spot.Center },
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
    // Oval shape
    $(go.Shape, 'Ellipse', {
      fill: 'white',
      stroke: '#007bff',
      strokeWidth: 2,
      minSize: new go.Size(140, 60),
      portId: '',
      fromLinkable: true,
      toLinkable: true,
    }),
    // Usecase text
    $(
      go.TextBlock,
      {
        margin: 12,
        font: '10pt sans-serif',
        textAlign: 'center',
        editable: true,
        wrap: go.TextBlock.WrapFit,
        maxSize: new go.Size(160, NaN),
        cursor: 'move',
      },
      new go.Binding('text', 'label').makeTwoWay(),
    ),
  );

  // SystemBox
  diagram.groupTemplate = $(
    go.Group,
    'Auto',
    {
      layout: $(go.GridLayout, { wrappingColumn: 1, spacing: new go.Size(50, 50) }),
      padding: 10,
      mouseDrop: (e: go.InputEvent, grp: go.GraphObject) => {
        const group = grp as go.Group;
        if (group.diagram) {
            const ok = group.addMembers(group.diagram.selection, true);
            // If the drop isn't allowed for some reason, cancel the tool
            if (!ok) group.diagram.currentTool.doCancel();
        }
      },
    },
    // The "System Boundary" Rectangle
    $(go.Shape, 'Rectangle', {
      fill: 'transparent',
      stroke: '#333',
      strokeWidth: 2,
    }),
    $(
      go.Panel,
      'Vertical',
      // System Name Title
      $(go.TextBlock, { font: 'bold 12pt sans-serif', margin: 10 }, new go.Binding('text', 'label')),
      // The Placeholder holds the member Nodes (Use Cases)
      $(go.Placeholder, { padding: 20 }),
    ),
  );

  // Mapping
  diagram.nodeTemplateMap.add('Actor', actorTemplate);
  diagram.nodeTemplateMap.add('Usecase', usecaseTemplate);

  // Trigger Context Menu Button
  const makeButton = (text: string, action: (e: go.InputEvent, obj: go.GraphObject) => void) => {
    return $('ContextMenuButton', $(go.TextBlock, text), { click: action });
  };
  // Context Menu
  const linkContextMenu = $(
    'ContextMenu',
    makeButton('Đảo chiều (Reverse)', (e, obj) => {
      const link = (obj.part as go.Adornment).adornedPart as go.Link;
      if (link) {
        e.diagram.model.commit((m: any) => {
          const from = link.data.from;
          const to = link.data.to;
          m.set(link.data, 'from', to); // Đảo from -> to
          m.set(link.data, 'to', from); // Đảo to -> from
        }, 'Reverse Link');
      }
    }),
    makeButton('Chuyển thành <<include>>', (e, obj) => {
      const link = (obj.part as go.Adornment).adornedPart as go.Link;
      e.diagram.model.commit((m: any) => {
        m.set(link.data, 'text', '<<include>>');
        const from = link.data.from;
        const to = link.data.to;
        m.set(link.data, 'from', to);
        m.set(link.data, 'to', from);
      }, 'Set Include');
    }),
    makeButton('Chuyển thành <<extend>>', (e, obj) => {
      const link = (obj.part as go.Adornment).adornedPart as go.Link;
      e.diagram.model.commit((m: any) => {
        m.set(link.data, 'text', '<<extend>>');
        const from = link.data.from;
        const to = link.data.to;
        m.set(link.data, 'from', to);
        m.set(link.data, 'to', from);
      }, 'Set Extend');
    }),
    makeButton('Xóa Link', (e) => {
      // const link = (obj.part as go.Adornment).adornedPart as go.Link;
      e.diagram.commandHandler.deleteSelection();
    }),
  );

  // Relationship link template
  diagram.linkTemplate = $(
    go.Link,
    {
      routing: go.Link.Normal,
      curve: go.Link.None,
      reshapable: true,
      resegmentable: true,
      adjusting: go.Link.Stretch,
      contextMenu: linkContextMenu,
      relinkableFrom: true,
      relinkableTo: true,
      fromShortLength: 5,
      toShortLength: 5,
    },
    new go.Shape({ isPanelMain: true, stroke: 'transparent', strokeWidth: 8 }), // thick undrawn path
    // new go.Shape({ isPanelMain: true }),
    // Đường kẻ
    $(
      go.Shape,
      { isPanelMain: true, strokeWidth: 1.5 },
      new go.Binding('stroke', 'text', (t) => (t ? '#555' : 'black')), // Include/Extend màu xám, thường màu đen
      // Nếu có text (include/extend) thì nét đứt [4, 2], không thì nét liền null
      new go.Binding('strokeDashArray', 'text', (t) => (t === '<<include>>' || t === '<<extend>>' ? [4, 4] : null)),
    ),
    // Mũi tên
    $(go.Shape, { toArrow: 'OpenTriangle' }), // Mũi tên mở đặc trưng UML Use Case
    // Label hiển thị <<include>> hoặc <<extend>>
    $(
      go.Panel,
      'Auto',
      $(go.Shape, { fill: '#f4f6f8', stroke: null }),
      $(go.TextBlock, { font: '9pt sans-serif', segmentIndex: 0, segmentOffset: new go.Point(NaN, NaN) }, new go.Binding('text', 'text')),
    ),
  );

  return diagram;
};

export const DiagramWrapper = forwardRef<ReactDiagram, DiagramProps>((props, ref) => {
  const diagramRef = useRef<go.Diagram | null>(null);

  // [NEW] 1. Create a Ref to store the latest callback to avoid stale closures
  const onNodeSelectRef = useRef(props.onNodeSelect);
  useEffect(() => {
    onNodeSelectRef.current = props.onNodeSelect;
  }, [props.onNodeSelect]);

  // [NEW] 2. Add the Event Listener
  useEffect(() => {
    if (ref && 'current' in ref && ref.current) {
      const diagram = ref.current.getDiagram();

      if (diagram && diagram !== diagramRef.current) {
        diagramRef.current = diagram;

        // Listen for Object Clicks
        diagram.addDiagramListener('ObjectSingleClicked', (e) => {
          const part = e.subject.part;
          // Only trigger if it is a Usecase Node
          if (part instanceof go.Node && part.data.category === 'Usecase') {
            if (onNodeSelectRef.current) {
              onNodeSelectRef.current(part.data.key);
            }
          } else {
            // If clicking Link or Actor, deselect
            if (onNodeSelectRef.current) onNodeSelectRef.current(null);
          }
        });

        // Listen for Background Clicks (Deselect)
        diagram.addDiagramListener('BackgroundSingleClicked', () => {
          if (onNodeSelectRef.current) onNodeSelectRef.current(null);
        });
      }
    }
  });
  const handleModelChange = (changes: go.IncrementalData) => {
    console.log(changes);
    // 1. Check if we have the Diagram reference
    if (ref && 'current' in ref && ref.current) {
      const diagram = ref.current.getDiagram();

      if (diagram) {
        // 2. Extract the FULL current state from the model
        // We create a shallow copy to ensure React detects the change
        const allNodes = diagram.model.nodeDataArray.slice();
        const allLinks = (diagram.model as go.GraphLinksModel).linkDataArray.slice();

        // 3. Send the full arrays back to parent
        props.onModelChange(allNodes as NodeData[], allLinks as LinkData[]);
      }
    }
  };

  return (
    <ReactDiagram
      ref={ref}
      divClassName="diagram-component"
      initDiagram={initDiagram}
      nodeDataArray={props.nodeDataArray}
      linkDataArray={props.linkDataArray}
      onModelChange={handleModelChange}
    />
  );
});
