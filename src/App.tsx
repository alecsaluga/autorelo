import { useState, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, AlertCircle } from 'lucide-react';
import { sections } from './config/steps';
import type { FormData, WebhookPayload } from './types';

const STORAGE_KEY = 'auto-shipment-agreement-v3';
const WEBHOOK_URL = 'https://n8n.alecautomations.com/webhook/e7f88aa9-ac79-4de7-a906-563cbfbde469';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getInitialFormData(): FormData {
  return {
    selectedOptions: {},
    inputs: {},
    initials: {},
    fullName: '',
    email: '',
    phone: '',
    signatureDate: getTodayDate(),
  };
}

// Calculate total micro-steps
const totalMicroSteps = sections.reduce((acc, s) => acc + s.microSteps.length, 0);

export default function App() {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const currentSection = sections[sectionIndex];
  const isFinalSection = sectionIndex === sections.length - 1;
  const isSignatureStep = currentSection.id === 'signature';

  // Calculate progress
  const progress = ((sectionIndex + 1) / sections.length) * 100;

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData);
        setSectionIndex(parsed.sectionIndex);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save progress
  useEffect(() => {
    if (!isSubmitted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          formData,
          sectionIndex
        }));
      } catch {
        // Ignore
      }
    }
  }, [formData, sectionIndex, isSubmitted]);

  const handleOptionToggle = (microStepId: string, optionId: string) => {
    const current = formData.selectedOptions[microStepId] || [];
    const updated = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId];

    setFormData(prev => ({
      ...prev,
      selectedOptions: { ...prev.selectedOptions, [microStepId]: updated }
    }));
  };

  const handleInputChange = (microStepId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      inputs: { ...prev.inputs, [microStepId]: value }
    }));
  };

  const handleInitialsChange = (sectionId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      initials: { ...prev.initials, [sectionId]: value }
    }));
  };

  const canProceed = () => {
    if (isSignatureStep) {
      return (
        formData.fullName.trim() !== '' &&
        formData.email.includes('@') &&
        formData.phone.trim() !== ''
      );
    }

    // Check if initials are required and provided
    if (currentSection.requiresInitials) {
      return (formData.initials[currentSection.id] || '').trim() !== '';
    }

    return true;
  };

  const handleBack = () => {
    setError('');
    if (sectionIndex > 0) {
      setSectionIndex(sectionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = async () => {
    if (!canProceed()) {
      setError('Please complete all required fields.');
      return;
    }

    setError('');

    // If this is the final step, submit
    if (isFinalSection) {
      await handleSubmit();
      return;
    }

    // Move to next section
    setSectionIndex(sectionIndex + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    const payload: WebhookPayload = {
      transfereeName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      signatureDate: formData.signatureDate,
      sections: sections.map(section => ({
        id: section.id,
        title: section.title,
        responses: section.microSteps.map(ms => ({
          microStepId: ms.id,
          selectedOptions: formData.selectedOptions[ms.id],
          input: formData.inputs[ms.id],
        })),
      })),
      submittedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      language: navigator.language,
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to submit');

      localStorage.removeItem(STORAGE_KEY);
      setIsSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-8 max-w-sm w-full text-center fade-in">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--ai-accent)]/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[var(--ai-accent)]" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">
            Agreement Submitted
          </h1>
          <p className="text-[var(--ai-text-muted)] text-sm">
            We've received your signed agreement. Our team will be in touch with next steps.
          </p>
        </div>
      </div>
    );
  }

  const isFirstStep = sectionIndex === 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-6 border-b border-[var(--ai-border)] bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <img
            src="/autorelologo.png"
            alt="AutoRelo"
            className="h-10 w-auto"
          />
          <span className="text-base text-[var(--ai-text-muted)]">
            {currentSection.title}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Main content - Scrollable */}
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div key={currentSection.id} className="fade-in space-y-12">

            {/* Render all micro-steps in this section */}
            {currentSection.microSteps.map((microStep, idx) => (
              <div key={microStep.id} className="space-y-6">
                {/* Intro text */}
                {microStep.intro && (
                  <p className="text-[var(--ai-accent)] text-lg font-medium">
                    {microStep.intro}
                  </p>
                )}

                {/* Main content */}
                <div className={`text-[var(--ai-text)] leading-relaxed whitespace-pre-line ${
                  microStep.isImportant ? 'text-xl' : 'text-xl'
                }`}>
                  {microStep.content}
                </div>

                {/* Important badge */}
                {microStep.isImportant && (
                  <div className="flex items-center gap-2 text-yellow-600 text-base">
                    <AlertCircle className="w-5 h-5" />
                    <span>Please read carefully</span>
                  </div>
                )}

                {/* Options */}
                {microStep.options && microStep.options.length > 0 && (
                  <div className="space-y-4">
                    {microStep.options.map(option => {
                      const isSelected = (formData.selectedOptions[microStep.id] || []).includes(option.id);
                      return (
                        <label
                          key={option.id}
                          className={`option-card ${isSelected ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleOptionToggle(microStep.id, option.id)}
                          />
                          <span className="text-lg text-[var(--ai-text)]">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Input field */}
                {microStep.hasInput && (
                  <div>
                    <input
                      type="text"
                      value={formData.inputs[microStep.id] || ''}
                      onChange={e => handleInputChange(microStep.id, e.target.value)}
                      placeholder={microStep.inputPlaceholder || 'Enter here...'}
                      className="form-input"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Initials field at the end of section if required */}
            {currentSection.requiresInitials && (
              <div className="pt-8 border-t-2 border-[var(--ai-border)]">
                <label className="block text-lg font-medium text-[var(--ai-text)] mb-3">
                  Please provide your initials to acknowledge this section:
                </label>
                <input
                  type="text"
                  value={formData.initials[currentSection.id] || ''}
                  onChange={e => handleInitialsChange(currentSection.id, e.target.value)}
                  placeholder="Your initials"
                  className="form-input max-w-xs"
                  maxLength={4}
                />
              </div>
            )}

            {/* Signature fields */}
            {isSignatureStep && (
              <div className="space-y-5 pt-8">
                <div>
                  <label className="block text-base text-[var(--ai-text-muted)] mb-2">
                    Full Name (E-Signature)
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Your full name"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-base text-[var(--ai-text-muted)] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-base text-[var(--ai-text-muted)] mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-base text-[var(--ai-text-muted)] mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.signatureDate}
                    onChange={e => setFormData(prev => ({ ...prev, signatureDate: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-red-600 text-base">{error}</p>
            )}
          </div>
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="px-6 py-6 border-t border-[var(--ai-border)] bg-white">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Primary action button */}
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="btn-primary text-lg py-5"
          >
            {isSubmitting
              ? 'Submitting...'
              : isFinalSection
              ? 'Submit Agreement'
              : 'Continue'}
          </button>

          {/* Back button */}
          {!isFirstStep && (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-4"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}

          {/* Section indicator */}
          <p className="text-center text-base text-[var(--ai-text-muted)]">
            Section {sectionIndex + 1} of {sections.length}
          </p>
        </div>
      </footer>
    </div>
  );
}
