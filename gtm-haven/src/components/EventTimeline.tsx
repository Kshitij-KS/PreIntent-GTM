"use client";

import { ExternalLink } from "lucide-react";
import type { Signal } from "@/lib/domain";

interface EventTimelineProps {
  signals: Signal[];
}

const signalLabels: Record<Signal["type"], string> = {
  m_and_a: "M&A",
  executive_change: "Executive",
  negative_sentiment: "Sentiment",
  positive_milestone: "Milestone",
  negative_space: "Page diff",
  job_posting: "Hiring",
  community_pain: "Community",
  regulatory: "Regulatory",
};

export default function EventTimeline({ signals }: EventTimelineProps) {
  if (!signals || signals.length === 0) {
    return (
      <section className="surface evidence-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Evidence</p>
            <h2>Signal Timeline</h2>
          </div>
        </div>
        <p className="empty-note">No significant events detected recently.</p>
      </section>
    );
  }

  return (
    <section className="surface evidence-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Evidence</p>
          <h2>Signal Timeline</h2>
        </div>
        <span className="small-muted">{signals.length} sources</span>
      </div>

      <div className="evidence-list">
        {signals.map((signal) => (
          <article key={signal.id}>
            <div className="evidence-main">
              <div className="evidence-meta">
                <span className="status-pill neutral">
                  {signalLabels[signal.type]}
                </span>
                <span>
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(signal.eventTime))}
                </span>
                <span>{Math.round(signal.confidence * 100)}% confidence</span>
              </div>
              <h3>{signal.title}</h3>
              <p>{signal.description}</p>
              <div className="source-quality">
                <span>Source quality</span>
                <div>
                  <i
                    style={{
                      width: `${Math.round(signal.source.sourceQuality * 100)}%`,
                    }}
                  />
                </div>
                <strong>
                  {Math.round(signal.source.sourceQuality * 100)}%
                </strong>
              </div>
            </div>
            <div className="impact-block">
              <span>Impact</span>
              <strong>+{signal.impactScore}</strong>
              <a href={signal.source.url} rel="noreferrer" target="_blank">
                Source <ExternalLink />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
