import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Package,
  Pause,
  Play,
  RotateCcw,
  Timer
} from "lucide-react";
import { AnimatedFlowMap } from "./AnimatedFlowMap";
import { BehindTheCodePanel } from "./BehindTheCodePanel";
import { CareDashboardPanel } from "./CareDashboardPanel";
import { PatientLiveStatusPanel } from "./PatientLiveStatusPanel";
import {
  buildLogsThroughStep,
  caseScenario,
  createRuntimeLogs,
  deriveRuntimeStep,
  riskLevelLabels,
  riskLevelZhLabels,
  type RuntimeLogEntry
} from "./caseScenario";
import "./case-demo.css";

const speedOptions = [0.5, 1, 1.5] as const;

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export function CaseAnimationDemo() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<(typeof speedOptions)[number]>(1);
  const [showCode, setShowCode] = useState(true);
  const [showPackets, setShowPackets] = useState(true);
  const [sessionId, setSessionId] = useState(1);
  const [logs, setLogs] = useState<RuntimeLogEntry[]>(() => buildLogsThroughStep(0, 1));
  const lastStepIndex = caseScenario.length - 1;
  const currentStep = caseScenario[stepIndex];
  const runtimeStep = useMemo(() => deriveRuntimeStep(currentStep, progress), [currentStep, progress]);
  const overallProgress = ((stepIndex + progress) / caseScenario.length) * 100;

  const goToStep = useCallback(
    (nextIndex: number, options?: { pause?: boolean }) => {
      const clamped = Math.max(0, Math.min(lastStepIndex, nextIndex));
      setProgress(0);
      if (clamped <= stepIndex) {
        setLogs(buildLogsThroughStep(clamped, sessionId));
      } else {
        const additions = caseScenario
          .slice(stepIndex + 1, clamped + 1)
          .flatMap((step) => createRuntimeLogs(step, sessionId));
        setLogs((currentLogs) => [...currentLogs, ...additions]);
      }
      setStepIndex(clamped);
      if (options?.pause) setIsPlaying(false);
    },
    [lastStepIndex, sessionId, stepIndex]
  );

  useEffect(() => {
    if (!isPlaying) return undefined;

    const duration = currentStep.durationMs / speed;
    const startProgress = progress;
    const startedAt = performance.now() - startProgress * duration;
    let frame = 0;

    function tick(now: number) {
      const nextProgress = (now - startedAt) / duration;
      if (nextProgress >= 1) {
        setProgress(1);
        if (stepIndex >= lastStepIndex) {
          setIsPlaying(false);
        } else {
          goToStep(stepIndex + 1);
        }
        return;
      }

      setProgress(nextProgress);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [currentStep.durationMs, goToStep, isPlaying, lastStepIndex, speed, stepIndex]);

  function replay() {
    const nextSessionId = sessionId + 1;
    setSessionId(nextSessionId);
    setStepIndex(0);
    setProgress(0);
    setLogs(buildLogsThroughStep(0, nextSessionId));
    setIsPlaying(true);
  }

  return (
    <section className={classNames("case-animation-demo", !showCode && "code-hidden")} aria-label="案例動畫展示區">
      <header className="case-demo-header">
        <div>
          <span>Case Animation Demo</span>
          <h2>案例：洗腎返家後的居家恢復期風險</h2>
          <p>{runtimeStep.description}</p>
        </div>
        <aside className={classNames("case-risk-pill", `risk-${runtimeStep.risk.level}`)}>
          <b>{runtimeStep.risk.score}</b>
          <span>{riskLevelLabels[runtimeStep.risk.level]} / {riskLevelZhLabels[runtimeStep.risk.level]}</span>
        </aside>
      </header>

      <section className="case-control-bar" aria-label="案例動畫控制">
        <div className="case-playback-controls">
          <button type="button" className={isPlaying ? "is-active" : ""} onClick={() => setIsPlaying(true)}>
            <Play size={16} />
            播放
          </button>
          <button type="button" className={!isPlaying ? "is-active" : ""} onClick={() => setIsPlaying(false)}>
            <Pause size={16} />
            暫停
          </button>
          <button type="button" onClick={replay}>
            <RotateCcw size={16} />
            重新播放
          </button>
          <button type="button" disabled={stepIndex === 0} onClick={() => goToStep(stepIndex - 1, { pause: true })}>
            <ChevronLeft size={16} />
            上一步
          </button>
          <button type="button" disabled={stepIndex === lastStepIndex} onClick={() => goToStep(stepIndex + 1, { pause: true })}>
            <ChevronRight size={16} />
            下一步
          </button>
        </div>

        <div className="case-toggle-controls">
          <div className="speed-control" aria-label="播放速度">
            <Timer size={15} />
            {speedOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={speed === option ? "is-active" : ""}
                onClick={() => setSpeed(option)}
              >
                {option}x
              </button>
            ))}
          </div>
          <button type="button" className={showCode ? "is-active" : ""} onClick={() => setShowCode((value) => !value)}>
            {showCode ? <Eye size={16} /> : <EyeOff size={16} />}
            {showCode ? "隱藏 Code" : "顯示 Code"}
          </button>
          <button type="button" className={showPackets ? "is-active" : ""} onClick={() => setShowPackets((value) => !value)}>
            <Package size={16} />
            {showPackets ? "隱藏封包" : "顯示封包"}
          </button>
        </div>
      </section>

      <div className="case-step-bar">
        <div>
          <span>{runtimeStep.title}</span>
          <strong>{runtimeStep.wearable.packetType}</strong>
        </div>
        <i aria-hidden="true">
          <b style={{ width: `${Math.round(overallProgress)}%` }} />
        </i>
      </div>

      <div className="case-animation-grid">
        <PatientLiveStatusPanel step={runtimeStep} />
        <AnimatedFlowMap step={runtimeStep} showPackets={showPackets} isPlaying={isPlaying} />
        {showCode ? <BehindTheCodePanel step={runtimeStep} logs={logs} showPackets={showPackets} /> : null}
      </div>

      <CareDashboardPanel step={runtimeStep} progress={progress} />
    </section>
  );
}
