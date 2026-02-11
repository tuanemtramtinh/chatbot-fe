// src/components/DiagramPalette.tsx
import { ReactPalette } from 'gojs-react';
import * as go from 'gojs';
import './DiagramWrapper.css';
import type { ActorEntity } from './api';

interface DiagramPaletteProps {
  candidateActors: ActorEntity[]; // Receive the list of candidate actors
}

const initPalette = () => {
  const $ = go.GraphObject.make;

  const palette = $(go.Palette, {
    layout: $(go.GridLayout, {
      alignment: go.GridLayout.Location,
      wrappingColumn: 1,
      cellSize: new go.Size(50, 50),
      spacing: new go.Size(20, 20),
    }),
    contentAlignment: go.Spot.Center,
    // 2. Just define the Model type here, don't pass data
    model: $(go.GraphLinksModel, {
      linkKeyProperty: 'key',
    }),
  });

  // --- TEMPLATES (Same as before) ---
  palette.nodeTemplateMap.add(
    'Actor',
    $(
      go.Node,
      'Vertical',
      { locationSpot: go.Spot.Center },
      $(go.Shape, {
        geometryString: 'F M25 0 A10 10 0 1 1 25 20 A10 10 0 1 1 25 0 M25 20 L25 50 M5 30 L45 30 M10 70 L25 50 L40 70',
        fill: '#f5f5f5',
        stroke: 'black',
        strokeWidth: 2,
        desiredSize: new go.Size(50, 70),
        // margin: new go.Margin(70, 0, 0, 0),
      }),
      $(go.TextBlock, { margin: 5, font: 'bold 11pt sans-serif' }, new go.Binding('text', 'label')),
    ),
  );

  palette.nodeTemplateMap.add(
    'Usecase',
    $(
      go.Node,
      'Auto',
      { locationSpot: go.Spot.Center },
      $(go.Shape, 'Ellipse', {
        fill: 'white',
        stroke: '#007bff',
        strokeWidth: 2,
        minSize: new go.Size(110, 40),
      }),
      $(go.TextBlock, { margin: 12, font: '10pt sans-serif' }, new go.Binding('text', 'label')),
    ),
  );

  return palette;
};

export const DiagramPalette = ({ candidateActors }: DiagramPaletteProps) => {
  const PALETTE_DATA = [
    { key: 'P-1', category: 'Actor', label: 'Actor' },
    { key: 'P-2', category: 'Usecase', label: 'Use Case', group: -99 },
  ];
  const candidateItems = candidateActors.map((actor) => ({
    key: `CAND_${new Date().toLocaleTimeString()}`, // Unique key prefix
    category: 'Actor',
    label: actor.actor, // The name
  }));
  return (
    <div style={{ width: '150px', marginRight: '10px', backgroundColor: '#f0f2f5' }}>
      <ReactPalette
        initPalette={initPalette}
        style={{ marginTop: -65 }}
        divClassName="palette-component"
        // 3. Pass data via props to satisfy TypeScript
        nodeDataArray={[...PALETTE_DATA, ...candidateItems]}
        linkDataArray={[]}
      />
    </div>
  );
};
