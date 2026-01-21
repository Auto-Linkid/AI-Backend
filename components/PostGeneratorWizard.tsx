'use client';

import React, { useState } from 'react';
// We will create the CSS file separately
// import styles from './PostGeneratorWizard.module.css';

// Types
export type WizardStep = 'topic' | 'hooks' | 'body' | 'final';
export type IntentType = 'viral' | 'storytelling' | 'educational' | 'promotional';
export type LengthType = 'short' | 'medium' | 'long';
export type CtaType = 'none' | 'value' | 'promotional';

export interface WizardState {
  topic: string;
  intent: IntentType;
  length: LengthType;
  ctaType: CtaType;
  selectedHook: string;
  selectedBody: string;
  finalPost: string;
  generatedTopics: string[];
  generatedHooks: string[];
  generatedBodyOptions: { optionA: string; optionB: string };
  isMagicMode: boolean; // For Phase 9
}

const PostGeneratorWizard: React.FC = () => {
  const [step, setStep] = useState<WizardStep>('topic');
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<WizardState>({
    topic: '',
    intent: 'viral',
    length: 'medium',
    ctaType: 'value',
    selectedHook: '',
    selectedBody: '',
    finalPost: '',
    generatedTopics: [],
    generatedHooks: [],
    generatedBodyOptions: { optionA: '', optionB: '' },
    isMagicMode: false,
  });

  const updateState = (updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>✨ AI LinkedIn Post Wizard</h1>
        <p style={{ color: '#666' }}>Creating authentic, high-impact content.</p>
      </header>

      <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        {/* --- Step 1: Configuration --- */}
        {step === 'topic' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Step 1: Configuration</h2>
            
            {/* Mode Selector */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <label>
                    <input type="checkbox" 
                           checked={state.isMagicMode} 
                           onChange={(e) => updateState({ isMagicMode: e.target.checked })} 
                    />
                    Wait, I'm feeling lazy (Magic Mode 🪄)
                </label>
            </div>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Topic / Keyword</label>
                <input 
                  type="text" 
                  value={state.topic}
                  onChange={(e) => updateState({ topic: e.target.value })}
                  placeholder="e.g. AI Coding, Remote Work"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }}
                />
              </div>
              
               <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Intent (Style)</label>
                <select 
                  value={state.intent}
                  onChange={(e) => updateState({ intent: e.target.value as any })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                  <option value="viral">Viral (Punchy/Controversial)</option>
                  <option value="storytelling">Storytelling (Personal/Narrative)</option>
                  <option value="educational">Educational (Actionable Tips)</option>
                  <option value="promotional">Promotional (Sales/Launch)</option>
                </select>
              </div>

               <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Length</label>
                <select 
                  value={state.length}
                  onChange={(e) => updateState({ length: e.target.value as any })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                  <option value="short">Short / Compact Essay (50-100 words)</option>
                  <option value="medium">Medium (100-200 words)</option>
                  <option value="long">Long (200+ words)</option>
                </select>
              </div>

               <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Call to Action (CTA)</label>
                <select 
                  value={state.ctaType}
                  onChange={(e) => updateState({ ctaType: e.target.value as any })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                  <option value="value">Value (Engagement Only)</option>
                  <option value="promotional">Promotional (Link/Offer)</option>
                  <option value="none">None (Just End It)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <button 
                onClick={async () => {
                   setLoading(true);
                   try {
                       const res = await fetch('/api/generate', {
                           method: 'POST',
                           body: JSON.stringify({ step: 'topics', input: state.topic })
                       });
                       const data = await res.json();
                       if (data.result) {
                           updateState({ generatedTopics: data.result });
                       }
                   } catch(e) { console.error(e); }
                   setLoading(false);
                }}
                disabled={!state.topic || loading}
                style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    background: '#000', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    opacity: (!state.topic || loading) ? 0.5 : 1
                }}
            >
                {loading ? 'Thinking...' : 'Generate Topics 🚀'}
            </button>

            {/* Generated Topics List */}
            {state.generatedTopics.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>Select a Topic/Angle:</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        {state.generatedTopics.map((t, i) => (
                            <button 
                                key={i}
                                onClick={() => {
                                    updateState({ topic: t });
                                    setStep('hooks'); 
                                    // Trigger Hook Gen immediately after selection would be nice, 
                                    // but let's let component effect handle it or do it in next step render?
                                    // For now, simpler to just set topic and move next.
                                }}
                                style={{ 
                                    textAlign: 'left', 
                                    padding: '1rem', 
                                    background: '#f9f9f9', 
                                    border: '1px solid #eee', 
                                    borderRadius: '6px',
                                    cursor: 'pointer' 
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            )}

          </div>
        )}

        {/* --- Step 2: Hooks --- */}
        {step === 'hooks' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Step 2: Start with a Hook</h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>Topic: <strong>{state.topic}</strong> ({state.intent})</p>

            {/* Auto-fetch hooks if empty */}
            {state.generatedHooks.length === 0 && !loading && (
                 <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Ready to generate hooks?</p>
                    <button 
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const res = await fetch('/api/generate', {
                                    method: 'POST',
                                    body: JSON.stringify({ 
                                        step: 'hooks', 
                                        input: state.topic,
                                        intent: state.intent 
                                    })
                                });
                                const data = await res.json();
                                if (data.result) updateState({ generatedHooks: data.result });
                            } catch(e) { console.error(e); }
                            setLoading(false);
                        }}
                        style={{ padding: '0.8rem 1.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Generate Hooks 🎣
                    </button>
                 </div>
            )}

            {/* Hooks List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {state.generatedHooks.map((hook, i) => (
                    <div key={i} 
                         onClick={() => {
                             updateState({ selectedHook: hook });
                             setStep('body');
                         }}
                         style={{ 
                             padding: '1.5rem', 
                             border: '2px solid #eee', 
                             borderRadius: '8px', 
                             cursor: 'pointer',
                             background: state.selectedHook === hook ? '#f0f9ff' : '#fff',
                             borderColor: state.selectedHook === hook ? '#0070f3' : '#eee',
                             transition: 'all 0.2s ease'
                         }}
                         onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0070f3'; }}
                         onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; }}
                    >
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{hook}</h4>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- Step 3: Body Content --- */}
        {step === 'body' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Step 3: Choose Your Angle</h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>Hook: <em>"{state.selectedHook}"</em></p>

            {/* Auto-fetch Body if empty */}
            {!state.generatedBodyOptions.optionA && !loading && (
                 <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Ready to write the content?</p>
                    <button 
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const res = await fetch('/api/generate', {
                                    method: 'POST',
                                    body: JSON.stringify({ 
                                        step: 'body', 
                                        input: state.selectedHook,
                                        context: state.topic,
                                        intent: state.intent,
                                        length: state.length
                                    })
                                });
                                const data = await res.json();
                                if (data.result) updateState({ generatedBodyOptions: data.result });
                            } catch(e) { console.error(e); }
                            setLoading(false);
                        }}
                        style={{ padding: '0.8rem 1.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Draft Content ✍️
                    </button>
                 </div>
            )}

            {/* Body Options Split View */}
            {state.generatedBodyOptions.optionA && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Option A */}
                    <div 
                        onClick={() => {
                            updateState({ selectedBody: state.generatedBodyOptions.optionA });
                            setStep('final');
                        }}
                        style={{ 
                            padding: '1.5rem', 
                            border: '2px solid #eee', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            whiteSpace: 'pre-wrap'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0070f3'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; }}
                    >
                        <h3 style={{ marginTop: 0 }}>Option A</h3>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{state.generatedBodyOptions.optionA}</p>
                    </div>

                    {/* Option B */}
                    <div 
                        onClick={() => {
                            updateState({ selectedBody: state.generatedBodyOptions.optionB });
                            setStep('final');
                        }}
                        style={{ 
                            padding: '1.5rem', 
                            border: '2px solid #eee', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            whiteSpace: 'pre-wrap'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0070f3'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; }}
                    >
                         <h3 style={{ marginTop: 0 }}>Option B</h3>
                         <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{state.generatedBodyOptions.optionB}</p>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* --- Step 4: Final Polish --- */}
        {step === 'final' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Step 4: Ready to Post! 🚀</h2>
            
             {/* Auto-fetch Final if empty */}
            {!state.finalPost && !loading && (
                 <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Putting it all together...</p>
                    <button 
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const res = await fetch('/api/generate', {
                                    method: 'POST',
                                    body: JSON.stringify({ 
                                        step: 'final', 
                                        hook: state.selectedHook,
                                        input: state.selectedBody, // input is body here
                                        context: state.topic,
                                        ctaType: state.ctaType
                                    })
                                });
                                const data = await res.json();
                                if (data.result?.finalPost) updateState({ finalPost: data.result.finalPost });
                            } catch(e) { console.error(e); }
                            setLoading(false);
                        }}
                        style={{ padding: '0.8rem 1.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Assemble Post ✨
                    </button>
                 </div>
            )}

            {/* Final Editor */}
            {state.finalPost && (
                <div>
                    <textarea 
                        value={state.finalPost}
                        onChange={(e) => updateState({ finalPost: e.target.value })}
                        style={{ width: '100%', height: '400px', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', fontFamily: 'monospace' }}
                    />
                    
                     <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <button 
                             onClick={() => { navigator.clipboard.writeText(state.finalPost); alert('Copied!'); }}
                             style={{ flex: 1, padding: '1rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            Copy to Clipboard 📋
                        </button>
                        
                        <button 
                             onClick={() => { 
                                 setStep('topic'); 
                                 updateState({ 
                                     topic: '', generatedTopics: [], generatedHooks: [], generatedBodyOptions: {optionA:'', optionB:''}, finalPost: '', selectedHook: '', selectedBody: '' 
                                 }); 
                             }}
                             style={{ padding: '1rem', background: '#eee', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            Start New Post 🔄
                        </button>
                    </div>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostGeneratorWizard;
