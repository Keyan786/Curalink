import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle2, User, HeartPulse, Apple, AlertCircle } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    basicInfo: { age: '', gender: 'other', weight: '', height: '' },
    medicalHistory: { conditions: [], medications: [], allergies: [] },
    lifestyle: { activityLevel: 'moderate', dietType: 'balanced', smoking: false, alcohol: 'rarely', sleepHours: 7 },
    currentSymptoms: []
  });

  const [newCondition, setNewCondition] = useState('');
  const [newSymptom, setNewSymptom] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { updateOnboarding } = useAuth();
  const totalSteps = 4;

  const handleNext = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const addChip = (key, value, field) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [key]: [...prev[field][key], value.trim()] }
    }));
    if (key === 'conditions') setNewCondition('');
  };

  const removeChip = (key, index, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [key]: prev[field][key].filter((_, i) => i !== index) }
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/profile', formData);
      updateOnboarding(true);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sectionHeader = (icon, title) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, color: 'var(--primary)' }}>
      {icon}
      <h3 style={{ marginBottom: 0 }}>{title}</h3>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fade">
            {sectionHeader(<User size={22} />, 'Basic Profile')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label>Age</label>
                <input type="number" value={formData.basicInfo.age} onChange={e => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, age: e.target.value } })} />
              </div>
              <div>
                <label>Gender</label>
                <select value={formData.basicInfo.gender} onChange={e => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, gender: e.target.value } })}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other/Non-binary</option>
                </select>
              </div>
              <div>
                <label>Weight (kg)</label>
                <input type="number" value={formData.basicInfo.weight} onChange={e => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, weight: e.target.value } })} />
              </div>
              <div>
                <label>Height (cm)</label>
                <input type="number" value={formData.basicInfo.height} onChange={e => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, height: e.target.value } })} />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fade">
            {sectionHeader(<HeartPulse size={22} />, 'Medical History')}
            <div>
              <label>Health Conditions</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <input value={newCondition} onChange={e => setNewCondition(e.target.value)} placeholder="e.g. Hypertension" style={{ flex: 1 }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChip('conditions', newCondition, 'medicalHistory'); } }}
                />
                <button onClick={() => addChip('conditions', newCondition, 'medicalHistory')} className="btn-primary" style={{ marginTop: 6, padding: '12px 20px', whiteSpace: 'nowrap' }}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {formData.medicalHistory.conditions.map((c, i) => (
                  <span key={i} className="chip" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {c} <button onClick={() => removeChip('conditions', i, 'medicalHistory')}>&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fade">
            {sectionHeader(<Apple size={22} />, 'Lifestyle')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label>Diet Type</label>
                <select value={formData.lifestyle.dietType} onChange={e => setFormData({ ...formData, lifestyle: { ...formData.lifestyle, dietType: e.target.value } })}>
                  <option value="balanced">Balanced</option>
                  <option value="vegan">Vegan</option>
                  <option value="keto">Keto</option>
                  <option value="paleo">Paleo</option>
                </select>
              </div>
              <div>
                <label>Activity Level</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
                  {['Sedentary', 'Moderate', 'Active'].map(lvl => {
                    const isActive = formData.lifestyle.activityLevel === lvl.toLowerCase();
                    return (
                      <button
                        key={lvl}
                        onClick={() => setFormData({ ...formData, lifestyle: { ...formData.lifestyle, activityLevel: lvl.toLowerCase() } })}
                        style={{
                          padding: '12px 8px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600,
                          border: `2px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                          background: isActive ? 'var(--primary-light)' : '#fff',
                          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                          transition: 'var(--transition)'
                        }}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label>Sleep Hours ({formData.lifestyle.sleepHours}h)</label>
                <input type="range" min="4" max="12" step="0.5" value={formData.lifestyle.sleepHours}
                  onChange={e => setFormData({ ...formData, lifestyle: { ...formData.lifestyle, sleepHours: e.target.value } })} />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="animate-fade">
            {sectionHeader(<AlertCircle size={22} />, 'Current Symptoms')}
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>Any health issues you're experiencing today?</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input value={newSymptom} onChange={e => setNewSymptom(e.target.value)} placeholder="e.g. Headache, Fatigue" style={{ flex: 1 }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newSymptom.trim()) {
                      setFormData(prev => ({ ...prev, currentSymptoms: [...prev.currentSymptoms, newSymptom.trim()] }));
                      setNewSymptom('');
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newSymptom.trim()) {
                    setFormData(prev => ({ ...prev, currentSymptoms: [...prev.currentSymptoms, newSymptom.trim()] }));
                    setNewSymptom('');
                  }
                }}
                className="btn-primary" style={{ marginTop: 6, padding: '12px 20px', whiteSpace: 'nowrap' }}
              >
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {formData.currentSymptoms.map((s, i) => (
                <span key={i} className="chip" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                  {s} <button onClick={() => setFormData({ ...formData, currentSymptoms: formData.currentSymptoms.filter((_, idx) => idx !== i) })}>&times;</button>
                </span>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
          {[1, 2, 3, 4].map(num => (
            <div key={num} style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'var(--primary)', borderRadius: 999,
                width: step >= num ? '100%' : '0%', transition: 'width 0.5s ease'
              }} />
            </div>
          ))}
        </div>

        <div className="card glass">
          <div style={{ marginBottom: 28 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Step {step} of {totalSteps}
            </span>
          </div>

          <div style={{ minHeight: 280 }}>
            {renderStep()}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
            <button
              onClick={handleBack}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontWeight: 700,
                visibility: step === 1 ? 'hidden' : 'visible', background: 'none', fontSize: '0.95rem'
              }}
            >
              <ChevronLeft size={20} /> Back
            </button>
            {step < totalSteps ? (
              <button onClick={handleNext} className="btn-primary">
                Continue <ChevronRight size={20} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ padding: '14px 32px' }}>
                {loading ? 'Saving...' : 'Finish Setup'} <CheckCircle2 size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
