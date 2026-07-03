import { Info, MousePointer2 } from "lucide-react";
import type { DeviceModule } from "./assistiveDeviceData";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export function DiagramAnnotations({
  modules,
  activeModuleId,
  hoveredModuleId,
  onHoverModule,
  onSelectModule
}: {
  modules: DeviceModule[];
  activeModuleId: string;
  hoveredModuleId?: string;
  onHoverModule: (moduleId?: string) => void;
  onSelectModule: (moduleId: string) => void;
}) {
  return (
    <>
      <svg className="annotation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="annotationArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" />
          </marker>
        </defs>
        {modules.map((item) => (
          <line
            key={item.id}
            className={classNames(
              "annotation-line",
              `tone-${item.tone}`,
              (item.id === activeModuleId || item.id === hoveredModuleId) && "is-active"
            )}
            x1={item.position.markerX}
            y1={item.position.markerY}
            x2={item.position.lineEndX}
            y2={item.position.lineEndY}
          />
        ))}
      </svg>

      {modules.map((item) => (
        <button
          key={`${item.id}-marker`}
          type="button"
          className={classNames(
            "annotation-marker",
            `tone-${item.tone}`,
            (item.id === activeModuleId || item.id === hoveredModuleId) && "is-active"
          )}
          style={{ left: `${item.position.markerX}%`, top: `${item.position.markerY}%` }}
          onMouseEnter={() => onHoverModule(item.id)}
          onMouseLeave={() => onHoverModule(undefined)}
          onFocus={() => onHoverModule(item.id)}
          onBlur={() => onHoverModule(undefined)}
          onClick={() => onSelectModule(item.id)}
          aria-label={item.title}
        >
          {item.index}
        </button>
      ))}

      {modules.map((item) => (
        <button
          key={`${item.id}-card`}
          type="button"
          className={classNames(
            "annotation-card",
            `tone-${item.tone}`,
            (item.id === activeModuleId || item.id === hoveredModuleId) && "is-active"
          )}
          style={{ left: `${item.position.cardX}%`, top: `${item.position.cardY}%` }}
          onMouseEnter={() => onHoverModule(item.id)}
          onMouseLeave={() => onHoverModule(undefined)}
          onFocus={() => onHoverModule(item.id)}
          onBlur={() => onHoverModule(undefined)}
          onClick={() => onSelectModule(item.id)}
        >
          <b>{item.index}</b>
          <span>{item.title}</span>
        </button>
      ))}
    </>
  );
}

export function ModuleInfoPanel({
  module,
  locked
}: {
  module: DeviceModule;
  locked: boolean;
}) {
  return (
    <aside className={`module-info-panel tone-${module.tone}`} aria-live="polite">
      <header>
        <div>
          <span>Module Detail</span>
          <h4>{module.title}</h4>
          <p>{module.subtitle}</p>
        </div>
        <b>{String(module.index).padStart(2, "0")}</b>
      </header>
      <div className="module-field-list">
        {module.fields.map((field) => (
          <code key={field}>{field}</code>
        ))}
      </div>
      <p className="module-description">{module.description}</p>
      {module.riskImpact ? (
        <div className="module-risk-impact">
          <span>是否影響風險分數</span>
          <b>{module.riskImpact}</b>
        </div>
      ) : null}
      <footer>
        {locked ? <MousePointer2 size={15} /> : <Info size={15} />}
        <span>{locked ? "目前顯示已選模組" : "目前預覽模組"}</span>
      </footer>
    </aside>
  );
}
