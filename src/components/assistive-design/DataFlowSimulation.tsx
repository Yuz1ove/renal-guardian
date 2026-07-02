import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { dataFlowSteps } from "./assistiveDeviceData";

export function DataFlowSimulation() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStep = activeIndex >= 0 ? dataFlowSteps[activeIndex] : dataFlowSteps[0];

  useEffect(() => {
    if (!isPlaying) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= dataFlowSteps.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 850);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  function replay() {
    setActiveIndex(0);
    setIsPlaying(true);
  }

  function togglePlay() {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setActiveIndex((current) => (current < 0 || current >= dataFlowSteps.length - 1 ? 0 : current));
    setIsPlaying(true);
  }

  return (
    <section className="assistive-flow-section blueprint-section" aria-label="資料如何串接">
      <header className="assistive-section-header">
        <div>
          <span>Data Flow Simulation</span>
          <h3>資料串接小圖</h3>
          <p>從手環感測到守望隊處置，使用低資料量封包、弱網暫存與風險引擎完成閉環。</p>
        </div>
        <div className="flow-controls">
          <button type="button" onClick={togglePlay}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? "暫停資料流" : "播放資料流"}
          </button>
          <button type="button" onClick={replay}>
            <RotateCcw size={16} />
            重新播放
          </button>
        </div>
      </header>

      <div className="data-flow-workspace">
        <ol className={`data-flow-track ${isPlaying ? "is-playing" : ""}`}>
          {dataFlowSteps.map((step, index) => (
            <li
              key={step.id}
              className={index < activeIndex ? "is-done" : index === activeIndex ? "is-active" : ""}
            >
              <i>{index + 1}</i>
              <div>
                <b>{step.label}</b>
                <span>{step.detail}</span>
              </div>
            </li>
          ))}
        </ol>
        <aside className="flow-detail-panel" aria-live="polite">
          <span>Current Step</span>
          <b>{activeIndex < 0 ? "尚未播放" : activeStep.label}</b>
          <code>{activeIndex < 0 ? "點擊播放資料流後開始亮起" : activeStep.detail}</code>
        </aside>
      </div>
    </section>
  );
}
