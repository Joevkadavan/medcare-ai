import type { RiskLevel } from "@/lib/api";

export const SYMPTOM_OPTIONS = [
  "Headache",
  "Fever",
  "Cough",
  "Sore throat",
  "Chest pain",
  "Breathing difficulty",
  "Stomach pain",
  "Nausea",
  "Dizziness",
  "Fatigue",
];

export const DURATION_OPTIONS = [
  "A few hours",
  "1-2 days",
  "3-7 days",
  "More than a week",
  "More than a month",
];

export const SEVERITY_OPTIONS = [
  { label: "Mild", hint: "Noticeable, but you can carry on with your day" },
  { label: "Moderate", hint: "Interfering with work, sleep, or daily activity" },
  { label: "Severe", hint: "Hard to do much at all" },
  { label: "Very severe", hint: "The worst you have felt, or rapidly worsening" },
];

export const ADDITIONAL_OPTIONS = [
  "Fatigue",
  "Dizziness",
  "Nausea",
  "Vomiting",
  "Cough",
  "Sore throat",
  "Body ache",
  "None of these",
];

export const RISK_STYLES: Record<
  RiskLevel,
  { label: string; text: string; border: string; bg: string; dot: string }
> = {
  LOW: {
    label: "Low concern",
    text: "text-emerald-300",
    border: "border-emerald-400/40",
    bg: "bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
  MODERATE: {
    label: "Moderate concern",
    text: "text-amber-300",
    border: "border-amber-400/40",
    bg: "bg-amber-400/10",
    dot: "bg-amber-400",
  },
  HIGH: {
    label: "High concern",
    text: "text-orange-300",
    border: "border-orange-400/40",
    bg: "bg-orange-400/10",
    dot: "bg-orange-400",
  },
  EMERGENCY: {
    label: "Urgent",
    text: "text-red-300",
    border: "border-red-400/50",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
  },
};
