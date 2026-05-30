"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { ScoreContribution, Severity } from "@/lib/domain";

interface ScoreGaugeProps {
  score: number;
  severity: Severity;
  contributions: ScoreContribution[];
  confidence: number;
  evidenceCount: number;
}

const severityLabels: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function ScoreGauge({
  score,
  severity,
  contributions,
  confidence,
  evidenceCount,
}: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const topDrivers = contributions.slice(0, 3);

  useEffect(() => {
    let current = 0;
    const increment = Math.max(1, score / 18);
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(interval);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, 24);

    return () => clearInterval(interval);
  }, [score]);

  return (
    <section className="surface score-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Selected company</p>
          <h2>Strategic instability</h2>
        </div>
        <span className={`status-pill status-${severity}`}>
          {severityLabels[severity]}
        </span>
      </div>

      <div className="score-body">
        <div className="score-hero">
          <div>
            <strong>{animatedScore}</strong>
            <span>out of 100</span>
          </div>
          <div
            className="score-ring"
            style={{ "--score": score } as CSSProperties}
          >
            <span>{confidence}%</span>
            <small>confidence</small>
          </div>
        </div>

        <div className="score-bar">
          <span style={{ width: `${Math.min(100, score)}%` }} />
        </div>

        <dl className="score-facts">
          <div>
            <dt>Evidence</dt>
            <dd>{evidenceCount} sources</dd>
          </div>
          <div>
            <dt>Decay</dt>
            <dd>Applied</dd>
          </div>
          <div>
            <dt>Caps</dt>
            <dd>Active</dd>
          </div>
        </dl>

        <div className="driver-list">
          <p className="eyebrow">Top drivers</p>
          {topDrivers.map((driver) => (
            <div className="driver-row" key={driver.signalId}>
              <div>
                <span>{driver.title}</span>
                <small>{driver.type.replaceAll("_", " ")}</small>
              </div>
              <strong>+{driver.finalScore}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
