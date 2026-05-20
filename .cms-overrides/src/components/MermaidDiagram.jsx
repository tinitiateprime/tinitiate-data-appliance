import mermaid from 'mermaid';
import { useEffect, useMemo, useState } from 'react';

let mermaidInitialized = false;
let nextDiagramId = 0;

export default function MermaidDiagram({ chart = '' }) {
  const diagramId = useMemo(() => {
    nextDiagramId += 1;
    return `mermaid-${nextDiagramId}`;
  }, []);
  const normalizedChart = useMemo(() => normalizeMermaidChart(chart), [chart]);
  const [renderedSvg, setRenderedSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function renderDiagram() {
      if (!normalizedChart) {
        setRenderedSvg('');
        setError('');
        return;
      }

      try {
        initializeMermaid();
        const { svg } = await mermaid.render(diagramId, normalizedChart);

        if (active) {
          setRenderedSvg(svg);
          setError('');
        }
      } catch (renderError) {
        if (active) {
          setRenderedSvg('');
          setError(renderError?.message ?? 'Unable to render Mermaid diagram.');
        }
      }
    }

    renderDiagram();

    return () => {
      active = false;
    };
  }, [diagramId, normalizedChart]);

  if (error) {
    return (
      <div className="mermaid-diagram mermaid-error">
        <p>Unable to render diagram.</p>
        <p>{error}</p>
        <pre>{normalizedChart}</pre>
      </div>
    );
  }

  if (!renderedSvg) {
    return <div className="mermaid-diagram mermaid-loading">Loading diagram...</div>;
  }

  return <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: renderedSvg }} />;
}

function initializeMermaid() {
  if (mermaidInitialized) {
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    flowchart: {
      htmlLabels: true,
      useMaxWidth: true,
    },
    themeVariables: {
      background: '#ffffff',
      primaryColor: '#dff1ed',
      primaryTextColor: '#20241f',
      primaryBorderColor: '#0e6f66',
      lineColor: '#626b60',
      tertiaryColor: '#f0f3ee',
    },
  });

  mermaidInitialized = true;
}

function normalizeMermaidChart(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .trim();
}
