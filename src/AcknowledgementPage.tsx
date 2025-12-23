import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import { sections } from './config/steps';
import type { FormData } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AcknowledgementData {
  transfereeName: string;
  arpNumber: string;
  vehicle1: string;
  vehicle2: string;
  vehicle3: string;
  vehicleCount: number;
  containsEV: boolean;
  pickupDate: string;
  arrivalWindowStart: string;
  arrivalWindowEnd: string;
  earliestAvailableDeliveryDate: string;
  transitTimeDescription: string;
  checklistSnapshot: string;
  checklistVersion: string;
  email: string;
  phone: string;
  status: string;
}

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

// Helper function to replace template variables in content
function replaceVariables(content: string, data: AcknowledgementData): string {
  return content
    .replace(/\{\{transfereeName\}\}/g, data.transfereeName)
    .replace(/\{\{arpNumber\}\}/g, data.arpNumber)
    .replace(/\{\{pickupDate\}\}/g, data.pickupDate)
    .replace(/\{\{arrivalWindowStart\}\}/g, data.arrivalWindowStart)
    .replace(/\{\{arrivalWindowEnd\}\}/g, data.arrivalWindowEnd)
    .replace(/\{\{earliestAvailableDeliveryDate\}\}/g, data.earliestAvailableDeliveryDate)
    .replace(/\{\{transitTimeDescription\}\}/g, data.transitTimeDescription);
}

export default function AcknowledgementPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [acknowledgementData, setAcknowledgementData] = useState<AcknowledgementData | null>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch acknowledgement data on mount
  useEffect(() => {
    async function fetchData() {
      if (!token) {
        setError('Invalid acknowledgement link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/ack?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          if (data.status === 'completed') {
            // Already completed
            setIsSubmitted(true);
            setError('');
          } else {
            setError(data.error || 'Failed to load acknowledgement');
          }
          setLoading(false);
          return;
        }

        setAcknowledgementData(data);

        // Pre-fill email and phone if available
        setFormData(prev => ({
          ...prev,
          email: data.email || '',
          phone: data.phone || '',
          inputs: {
            ...prev.inputs,
            availability_date: data.earliestAvailableDeliveryDate || ''
          }
        }));

        setLoading(false);
      } catch (err) {
        console.error('Error fetching acknowledgement:', err);
        setError('Failed to load acknowledgement. Please try again.');
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  const currentSection = sections[sectionIndex];
  const isFinalSection = sectionIndex === sections.length - 1;
  const isSignatureStep = currentSection.id === 'signature';
  const progress = ((sectionIndex + 1) / sections.length) * 100;

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

    if (isFinalSection) {
      await handleSubmit();
      return;
    }

    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'instant' });
    setSectionIndex(sectionIndex + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/ack/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          formData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--ai-accent)] mx-auto mb-4 animate-spin" />
          <p className="text-[var(--ai-text)]">Loading acknowledgement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isSubmitted && !acknowledgementData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-[var(--ai-text)] mb-3">
            Error
          </h1>
          <p className="text-[var(--ai-text-muted)] text-sm mb-4">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-8 max-w-sm w-full text-center fade-in">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--ai-accent)]/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[var(--ai-accent)]" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--ai-text)] mb-3">
            Acknowledgement Submitted
          </h1>
          <p className="text-[var(--ai-text-muted)] text-sm">
            Thank you for completing the Auto-Shipment Agreement. We've received your acknowledgement.
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
          <div className="text-right">
            <div className="text-base text-[var(--ai-text)]">
              {acknowledgementData?.transfereeName}
            </div>
            <div className="text-sm text-[var(--ai-text-muted)]">
              ARP# {acknowledgementData?.arpNumber}
            </div>
          </div>
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

            {/* Section Title */}
            <h2 className="text-2xl font-semibold text-[var(--ai-text)]">
              {currentSection.title}
            </h2>

            {/* Render all micro-steps in this section */}
            {currentSection.microSteps.map((microStep) => (
              <div key={microStep.id} className="space-y-6">
                {/* Intro text */}
                {microStep.intro && (
                  <p className="text-[var(--ai-accent)] text-lg font-medium">
                    {microStep.intro}
                  </p>
                )}

                {/* Main content with variable replacement */}
                <div className={`text-[var(--ai-text)] leading-relaxed whitespace-pre-line ${
                  microStep.isImportant ? 'text-xl' : 'text-xl'
                }`}>
                  {acknowledgementData ? replaceVariables(microStep.content, acknowledgementData) : microStep.content}
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
                    Full Name (E-Signature) *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Your full name"
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base text-[var(--ai-text-muted)] mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base text-[var(--ai-text-muted)] mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="form-input"
                    required
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
              ? 'Submit Acknowledgement'
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
