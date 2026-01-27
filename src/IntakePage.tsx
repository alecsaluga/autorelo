import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Car, MapPin, User, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface IntakeData {
  transfereeName: string;
  email: string;
  status: string;
}

interface IntakeFormData {
  // Addresses
  pickupAddress: string;
  deliveryAddress: string;

  // Availability
  availabilityDate: string;

  // Vehicle info
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  plateNumber: string;
  vinNumber: string;

  // Contacts
  pickupContactName: string;
  pickupContactPhone: string;
  deliveryContactName: string;
  deliveryContactPhone: string;
}

function getInitialFormData(): IntakeFormData {
  return {
    pickupAddress: '',
    deliveryAddress: '',
    availabilityDate: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    plateNumber: '',
    vinNumber: '',
    pickupContactName: '',
    pickupContactPhone: '',
    deliveryContactName: '',
    deliveryContactPhone: '',
  };
}

export default function IntakePage() {
  const { token } = useParams<{ token: string }>();

  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [formData, setFormData] = useState<IntakeFormData>(getInitialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch intake data on mount
  useEffect(() => {
    async function fetchData() {
      if (!token) {
        setError('Invalid intake link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/intake?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          if (data.status === 'completed') {
            setIsSubmitted(true);
            setError('');
          } else {
            setError(data.error || 'Failed to load intake form');
          }
          setLoading(false);
          return;
        }

        setIntakeData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching intake:', err);
        setError('Failed to load intake form. Please try again.');
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  const handleInputChange = (field: keyof IntakeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canSubmit = () => {
    return (
      formData.pickupAddress.trim() !== '' &&
      formData.deliveryAddress.trim() !== '' &&
      formData.availabilityDate.trim() !== '' &&
      formData.vehicleYear.trim() !== '' &&
      formData.vehicleMake.trim() !== '' &&
      formData.vehicleModel.trim() !== '' &&
      formData.vehicleColor.trim() !== '' &&
      formData.plateNumber.trim() !== '' &&
      formData.vinNumber.trim() !== '' &&
      formData.pickupContactName.trim() !== '' &&
      formData.pickupContactPhone.trim() !== '' &&
      formData.deliveryContactName.trim() !== '' &&
      formData.deliveryContactPhone.trim() !== ''
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      setError('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/intake/submit`, {
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
          <p className="text-[var(--ai-text)]">Loading scheduling form...</p>
        </div>
      </div>
    );
  }

  // Error state (before data loaded)
  if (error && !isSubmitted && !intakeData) {
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
            Information Submitted
          </h1>
          <p className="text-[var(--ai-text-muted)] text-sm">
            Thank you for providing your scheduling information. We will review your details and send you the confirmation form shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-6 border-b border-[var(--ai-border)] bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <img
            src="/autorelologo.png"
            alt="AutoRelo"
            className="h-10 w-auto"
          />
          <div className="text-right">
            <div className="text-base text-[var(--ai-text)]">
              {intakeData?.transfereeName}
            </div>
            <div className="text-sm text-[var(--ai-text-muted)]">
              Scheduling Request
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto fade-in">
          {/* Introduction */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[var(--ai-text)] mb-3">
              Schedule Your Vehicle Pick-Up
            </h1>
            <p className="text-[var(--ai-text-muted)]">
              Please provide the following information to complete scheduling. All fields are required.
            </p>
          </div>

          {/* Form sections */}
          <div className="space-y-8">
            {/* Addresses Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--ai-accent)]">
                <MapPin className="w-5 h-5" />
                <h2 className="text-lg font-medium">Addresses</h2>
              </div>

              <div>
                <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                  Pick-Up Address *
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress}
                  onChange={e => handleInputChange('pickupAddress', e.target.value)}
                  placeholder="Full street address, city, state, zip"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                  Delivery Address *
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress}
                  onChange={e => handleInputChange('deliveryAddress', e.target.value)}
                  placeholder="Full address, or city/area if exact address unknown"
                  className="form-input"
                />
                <p className="text-xs text-[var(--ai-text-muted)] mt-1">
                  If you don't have the exact address yet, provide the city or general area.
                </p>
              </div>
            </section>

            {/* Availability Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--ai-accent)]">
                <Calendar className="w-5 h-5" />
                <h2 className="text-lg font-medium">Availability</h2>
              </div>

              <div>
                <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                  As of what date will someone be available at the delivery location? *
                </label>
                <input
                  type="date"
                  value={formData.availabilityDate}
                  onChange={e => handleInputChange('availabilityDate', e.target.value)}
                  className="form-input"
                />
                <p className="text-xs text-[var(--ai-text-muted)] mt-1">
                  This is not your exact delivery date — it confirms when you or someone will be available to receive the vehicle from that date forward.
                </p>
              </div>
            </section>

            {/* Vehicle Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--ai-accent)]">
                <Car className="w-5 h-5" />
                <h2 className="text-lg font-medium">Vehicle Information</h2>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                    Year *
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleYear}
                    onChange={e => handleInputChange('vehicleYear', e.target.value)}
                    placeholder="2024"
                    className="form-input"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                    Make *
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleMake}
                    onChange={e => handleInputChange('vehicleMake', e.target.value)}
                    placeholder="Toyota"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={e => handleInputChange('vehicleModel', e.target.value)}
                    placeholder="Camry"
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                  Color *
                </label>
                <input
                  type="text"
                  value={formData.vehicleColor}
                  onChange={e => handleInputChange('vehicleColor', e.target.value)}
                  placeholder="Silver"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                  Plate Number *
                </label>
                <input
                  type="text"
                  value={formData.plateNumber}
                  onChange={e => handleInputChange('plateNumber', e.target.value)}
                  placeholder="ABC-1234"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                  Full VIN Number *
                </label>
                <input
                  type="text"
                  value={formData.vinNumber}
                  onChange={e => handleInputChange('vinNumber', e.target.value.toUpperCase())}
                  placeholder="1HGBH41JXMN109186"
                  className="form-input"
                  maxLength={17}
                />
                <p className="text-xs text-[var(--ai-text-muted)] mt-1">
                  17-character Vehicle Identification Number
                </p>
              </div>
            </section>

            {/* Contacts Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--ai-accent)]">
                <User className="w-5 h-5" />
                <h2 className="text-lg font-medium">Contact Information</h2>
              </div>

              <div className="p-4 bg-[var(--ai-bg-soft)] rounded-lg border border-[var(--ai-border)]">
                <h3 className="text-sm font-medium text-[var(--ai-text)] mb-3">Pick-Up Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.pickupContactName}
                      onChange={e => handleInputChange('pickupContactName', e.target.value)}
                      placeholder="Contact name"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.pickupContactPhone}
                      onChange={e => handleInputChange('pickupContactPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[var(--ai-bg-soft)] rounded-lg border border-[var(--ai-border)]">
                <h3 className="text-sm font-medium text-[var(--ai-text)] mb-3">Delivery Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.deliveryContactName}
                      onChange={e => handleInputChange('deliveryContactName', e.target.value)}
                      placeholder="Contact name"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.deliveryContactPhone}
                      onChange={e => handleInputChange('deliveryContactPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Error message */}
            {error && (
              <p className="text-red-600 text-base">{error}</p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-[var(--ai-border)] bg-white">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit() || isSubmitting}
            className="btn-primary text-lg py-5"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Information'}
          </button>
          <p className="text-center text-sm text-[var(--ai-text-muted)] mt-4">
            Once we receive your information, we'll schedule your pick-up date and send you the confirmation form.
          </p>
        </div>
      </footer>
    </div>
  );
}
