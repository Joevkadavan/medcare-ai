"use client";

import { useState } from "react";

import {
  Activity,
  ArrowRight,
  Brain,
  ShieldAlert,
  Stethoscope,
  Thermometer,
  Headphones,
  Wind,
  HeartPulse,
  Check,
  Sparkles,
  MessageCircle,
} from "lucide-react";

export default function Home() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const analyzeSymptoms = async () => {
  const allSymptoms = [
    ...selectedSymptoms,
    customSymptom
  ]
    .filter(Boolean)
    .join(", ");

  if (!allSymptoms.trim()) {
    alert("Please select or enter at least one symptom.");
    return;
  }

  setLoading(true);
  setResult(null);

  try {
const response = await fetch(
  "https://zany-carnival-5gr4qpw5xqr27499-8000.app.github.dev/assess",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      symptoms: allSymptoms,
    }),
  }
);

    const data = await response.json();
    setResult(data);

  } catch (error) {
    console.error("Backend error:", error);
    alert("Unable to connect to MedCare AI backend.");
  } finally {
    setLoading(false);
  }
};

  const [answers, setAnswers] = useState({
    symptom: "",
    duration: "",
    severity: "",
    additional: "",
    custom: "",
  });

  const startConsultation = () => {
    document
      .getElementById("consultation")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const questions = [
  {
    title: "What are you experiencing?",
    subtitle: "Select the symptom that best describes how you're feeling.",
    key: "symptom",
    options: [
      { label: "Headache", icon: Brain },
      { label: "Chest Pain", icon: HeartPulse },
      { label: "Fever", icon: Thermometer },
      { label: "Breathing Issues", icon: Wind },
    ],
  },

  {
    title: "How long have you felt this way?",
    subtitle: "Choose the option closest to your situation.",
    key: "duration",
    options: [
      { label: "A few hours" },
      { label: "1–2 days" },
      { label: "Several days" },
      { label: "More than a week" },
    ],
  },

  {
    title: "How severe are your symptoms?",
    subtitle: "Your answer helps us understand the situation better.",
    key: "severity",
    options: [
      { label: "Mild" },
      { label: "Moderate" },
      { label: "Severe" },
      { label: "Very Severe" },
    ],
  },

  {
    title: "Any additional symptoms?",
    subtitle: "Select one if applicable.",
    key: "additional",
    options: [
      { label: "Fatigue" },
      { label: "Dizziness" },
      { label: "Nausea" },
      { label: "None of these" },
    ],
  },
];

  return (
    <main className="min-h-screen bg-[#07111f] text-white overflow-hidden">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center text-[#07111f]">
            <Activity size={22} />
          </div>

          <div>
            <h1 className="font-bold text-xl">MedCare AI</h1>
            <p className="text-xs text-slate-400">
              Intelligent Healthcare
            </p>
          </div>
        </div>

        <div className="hidden md:flex gap-8 text-sm text-slate-300">
          <a href="#features" className="hover:text-cyan-400 transition">
            Features
          </a>
          <a href="#rag" className="hover:text-cyan-400 transition">
            RAG Technology
          </a>
        </div>

        <button
                onClick={startConsultation}
                className="..."
      >          Start Consultation
        </button>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-28 text-center">

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 text-sm mb-8">
          <Brain size={16} />
          Retrieval-Augmented Healthcare Intelligence
        </div>

        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
          Healthcare guidance,
          <br />
          powered by <span className="text-cyan-400">evidence.</span>
        </h2>

        <p className="max-w-2xl mx-auto mt-8 text-lg md:text-xl text-slate-400 leading-relaxed">
          MedCare AI retrieves relevant information from trusted medical
          knowledge sources before generating intelligent, transparent,
          and evidence-backed healthcare guidance.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
        <button
          onClick={startConsultation}
          className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-cyan-500 text-[#07111f] font-semibold hover:bg-cyan-400 transition"
        >
        Start AI Consultation
        <ArrowRight size={18} />
        </button> 
          <button className="px-7 py-4 rounded-xl border border-white/15 text-slate-200 hover:bg-white/5 transition">
            Explore How It Works
          </button>
        </div>

        {/* Feature Cards */}
        <div
          id="features"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
            <Stethoscope className="text-cyan-400 mx-auto mb-4" />

            <h3 className="font-semibold text-lg">
              Medical Assistance
            </h3>

            <p className="text-sm text-slate-400 mt-3">
              AI-guided healthcare information and symptom support.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
            <ShieldAlert className="text-cyan-400 mx-auto mb-4" />

            <h3 className="font-semibold text-lg">
              Emergency Awareness
            </h3>

            <p className="text-sm text-slate-400 mt-3">
              Identifies warning signs that may require urgent medical
              attention.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
            <Brain className="text-cyan-400 mx-auto mb-4" />

            <h3 className="font-semibold text-lg">
              RAG Powered
            </h3>

            <p className="text-sm text-slate-400 mt-3">
              Responses are grounded in relevant information retrieved from
              trusted knowledge sources.
            </p>
          </div>
        </div>
      </section>

      {/* RAG Section */}
      <section
        id="rag"
        className="border-t border-white/10 bg-[#0a1628] py-24"
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10">

          <div className="text-center mb-16">
            <p className="text-cyan-400 font-medium mb-4">
              THE INTELLIGENCE BEHIND MEDCARE AI
            </p>

            <h2 className="text-4xl md:text-5xl font-bold">
              Not just AI answers.
              <br />
              <span className="text-cyan-400">
                Evidence-backed responses.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            {[
              {
                title: "Medical Knowledge Base",
                text: "Trusted healthcare information is processed and indexed.",
              },
              {
                title: "Semantic Retrieval",
                text: "The system searches for information relevant to the user's query.",
              },
              {
                title: "Relevant Evidence",
                text: "The most relevant medical context is selected before answering.",
              },
              {
                title: "AI Response",
                text: "The AI generates a response grounded in retrieved evidence.",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <span className="text-cyan-400 font-bold">
                  0{index + 1}
                </span>

                <h3 className="font-semibold mt-4">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        © 2026 MedCare AI • Academic Research Project
      </footer>
<section id="consultation">
  <div className="max-w-4xl mx-auto px-6 py-20">
  <div className="rounded-3xl border border-cyan-400/30 bg-[#0d1b2a] p-6 md:p-10 shadow-2xl">

    {/* Progress */}
    <div className="mb-8">
      <div className="flex justify-between text-sm text-slate-400 mb-3">
        <span>AI Consultation</span>
        <span>Step {step + 1} of {questions.length + 1}</span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-cyan-400 transition-all duration-500"
          style={{
            width: `${((step + 1) / (questions.length + 1)) * 100}%`,
          }}
        />
      </div>
    </div>

    {/* Question */}
    {step < questions.length ? (
      <>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center">
              <Stethoscope className="text-cyan-400" size={24} />
            </div>

            <div>
              <p className="text-cyan-400 text-sm font-medium">
                MEDCARE AI CONSULTATION
              </p>

              <h2 className="text-2xl md:text-3xl font-bold">
                {questions[step].title}
              </h2>
            </div>
          </div>

          <p className="text-slate-400">
            {questions[step].subtitle}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {questions[step].options.map((option: any) => {

            const Icon = option.icon;

            const selected =
              answers[
                questions[step].key as keyof typeof answers
              ] === option.label;

            return (
              <button
                key={option.label}
                onClick={() => {
                  setAnswers({
                    ...answers,
                    [questions[step].key]: option.label,
                  });
                }}
                className={`group text-left p-5 rounded-2xl border transition-all duration-300
                  ${
                    selected
                      ? "border-cyan-400 bg-cyan-400/10"
                      : "border-white/10 bg-[#07111f] hover:border-cyan-400/50 hover:bg-cyan-400/5"
                  }
                `}
              >
                <div className="flex items-center gap-4">

                  {Icon && (
                    <div className="w-11 h-11 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                      <Icon
                        size={22}
                        className="text-cyan-400"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {option.label}
                    </p>
                  </div>

                  {selected && (
                    <Check
                      size={22}
                      className="text-cyan-400"
                    />
                  )}

                </div>
              </button>
            );
          })}

        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">

          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-5 py-3 rounded-xl border border-white/10 text-slate-300 disabled:opacity-30"
          >
            Back
          </button>

          <button
            onClick={() => {
              if (step < questions.length - 1) {
                setStep(step + 1);
              } else {
                setStep(questions.length);
              }
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-400 text-[#07111f] font-semibold hover:bg-cyan-300 transition"
          >
            Continue
            <ArrowRight size={18} />
          </button>

        </div>
      </>
    ) : (

      /* CUSTOM RESPONSE */
      <div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">

            <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center">
              <MessageCircle className="text-cyan-400" size={24} />
            </div>

            <div>
              <p className="text-cyan-400 text-sm">
                ONE LAST THING
              </p>

              <h2 className="text-2xl md:text-3xl font-bold">
                Tell us anything else
              </h2>
            </div>

          </div>

          <p className="text-slate-400">
            Can't find your symptom? Describe how you're feeling in your own words.
          </p>
        </div>

        <textarea
          value={answers.custom}
          onChange={(e) =>
            setAnswers({
              ...answers,
              custom: e.target.value,
            })
          }
          placeholder="Example: I feel tired and have pain in my throat..."
          className="w-full min-h-[160px] rounded-2xl bg-[#07111f] border border-white/10 p-5 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 transition"
        />

        <div className="flex justify-between mt-8">

          <button
            onClick={() => setStep(questions.length - 1)}
            className="px-5 py-3 rounded-xl border border-white/10 text-slate-300"
          >
            Back
          </button>

          <button
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-cyan-400 text-[#07111f] font-bold hover:bg-cyan-300 transition"
          >
            Analyze My Symptoms
            <button
                onClick={analyzeSymptoms}
                disabled={loading}
                className="..."
              >
                {loading ? "Analyzing..." : "Analyze My Symptoms ✨"}
              </button>
            <Sparkles size={18} />
          </button>

        </div>

      </div>
    )}

  </div>
  </div>
  </section>
    </main>
  ); 
}

