import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Car, MapPin, User, Calendar, Plus, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

// Declare google types
declare global {
  interface Window {
    google: any;
    initGooglePlaces?: () => void;
  }
}

interface IntakeData {
  transfereeName: string;
  email: string;
  status: string;
}

interface Vehicle {
  year: string;
  make: string;
  model: string;
  color: string;
  plateNumber: string;
  vinNumber: string;
}

interface IntakeFormData {
  // Addresses
  pickupAddress: string;
  deliveryAddress: string;

  // Availability
  availabilityDate: string;

  // Vehicles (up to 3)
  vehicles: Vehicle[];

  // Contacts
  pickupContactName: string;
  pickupContactPhone: string;
  deliveryContactName: string;
  deliveryContactPhone: string;
}

function createEmptyVehicle(): Vehicle {
  return {
    year: '',
    make: '',
    model: '',
    color: '',
    plateNumber: '',
    vinNumber: '',
  };
}

function getInitialFormData(): IntakeFormData {
  return {
    pickupAddress: '',
    deliveryAddress: '',
    availabilityDate: '',
    vehicles: [createEmptyVehicle()],
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
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Refs for address inputs
  const pickupAddressRef = useRef<HTMLInputElement>(null);
  const deliveryAddressRef = useRef<HTMLInputElement>(null);
  const pickupAutocompleteRef = useRef<any>(null);
  const deliveryAutocompleteRef = useRef<any>(null);

  // Load Google Places API
  useEffect(() => {
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('Google Places API key not configured');
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      setGoogleLoaded(true);
      return;
    }

    // Create callback function
    window.initGooglePlaces = () => {
      setGoogleLoaded(true);
    };

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      delete window.initGooglePlaces;
    };
  }, []);

  // Initialize autocomplete when Google is loaded and inputs are ready
  useEffect(() => {
    if (!googleLoaded || !window.google?.maps?.places) return;

    // Initialize pickup address autocomplete
    if (pickupAddressRef.current && !pickupAutocompleteRef.current) {
      pickupAutocompleteRef.current = new window.google.maps.places.Autocomplete(
        pickupAddressRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'address_components']
        }
      );

      pickupAutocompleteRef.current.addListener('place_changed', () => {
        const place = pickupAutocompleteRef.current.getPlace();
        if (place?.formatted_address) {
          setFormData(prev => ({ ...prev, pickupAddress: place.formatted_address }));
        }
      });
    }

    // Initialize delivery address autocomplete
    if (deliveryAddressRef.current && !deliveryAutocompleteRef.current) {
      deliveryAutocompleteRef.current = new window.google.maps.places.Autocomplete(
        deliveryAddressRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'address_components']
        }
      );

      deliveryAutocompleteRef.current.addListener('place_changed', () => {
        const place = deliveryAutocompleteRef.current.getPlace();
        if (place?.formatted_address) {
          setFormData(prev => ({ ...prev, deliveryAddress: place.formatted_address }));
        }
      });
    }
  }, [googleLoaded, intakeData]);

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

  const handleInputChange = (field: keyof Omit<IntakeFormData, 'vehicles'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: string) => {
    setFormData(prev => {
      const newVehicles = [...prev.vehicles];
      newVehicles[index] = { ...newVehicles[index], [field]: value };
      return { ...prev, vehicles: newVehicles };
    });
  };

  const addVehicle = () => {
    if (formData.vehicles.length < 3) {
      setFormData(prev => ({
        ...prev,
        vehicles: [...prev.vehicles, createEmptyVehicle()]
      }));
    }
  };

  const removeVehicle = (index: number) => {
    if (formData.vehicles.length > 1) {
      setFormData(prev => ({
        ...prev,
        vehicles: prev.vehicles.filter((_, i) => i !== index)
      }));
    }
  };

  const isVehicleComplete = (vehicle: Vehicle) => {
    return (
      vehicle.year.trim() !== '' &&
      vehicle.make.trim() !== '' &&
      vehicle.model.trim() !== '' &&
      vehicle.color.trim() !== '' &&
      vehicle.plateNumber.trim() !== '' &&
      vehicle.vinNumber.trim() !== ''
    );
  };

  const canSubmit = () => {
    const hasCompleteVehicle = formData.vehicles.some(isVehicleComplete);
    return (
      formData.pickupAddress.trim() !== '' &&
      formData.deliveryAddress.trim() !== '' &&
      formData.availabilityDate.trim() !== '' &&
      hasCompleteVehicle &&
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
      // Filter to only complete vehicles
      const completeVehicles = formData.vehicles.filter(isVehicleComplete);

      const response = await fetch(`${API_URL}/api/intake/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          formData: {
            ...formData,
            vehicles: completeVehicles
          }
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
                  ref={pickupAddressRef}
                  type="text"
                  value={formData.pickupAddress}
                  onChange={e => handleInputChange('pickupAddress', e.target.value)}
                  placeholder="Start typing an address..."
                  className="form-input"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                  Delivery Address *
                </label>
                <input
                  ref={deliveryAddressRef}
                  type="text"
                  value={formData.deliveryAddress}
                  onChange={e => handleInputChange('deliveryAddress', e.target.value)}
                  placeholder="Start typing an address..."
                  className="form-input"
                  autoComplete="off"
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--ai-accent)]">
                  <Car className="w-5 h-5" />
                  <h2 className="text-lg font-medium">Vehicle Information</h2>
                </div>
                {formData.vehicles.length < 3 && (
                  <button
                    type="button"
                    onClick={addVehicle}
                    className="flex items-center gap-1 text-sm text-[var(--ai-accent)] hover:underline"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Vehicle
                  </button>
                )}
              </div>

              {formData.vehicles.map((vehicle, index) => (
                <div
                  key={index}
                  className="p-4 bg-[var(--ai-bg-soft)] rounded-lg border border-[var(--ai-border)] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[var(--ai-text)]">
                      Vehicle {index + 1}
                    </h3>
                    {formData.vehicles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVehicle(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-[var(--ai-text-muted)] mb-2">
                        Year *
                      </label>
                      <input
                        type="text"
                        value={vehicle.year}
                        onChange={e => handleVehicleChange(index, 'year', e.target.value)}
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
                        value={vehicle.make}
                        onChange={e => handleVehicleChange(index, 'make', e.target.value)}
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
                        value={vehicle.model}
                        onChange={e => handleVehicleChange(index, 'model', e.target.value)}
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
                      value={vehicle.color}
                      onChange={e => handleVehicleChange(index, 'color', e.target.value)}
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
                      value={vehicle.plateNumber}
                      onChange={e => handleVehicleChange(index, 'plateNumber', e.target.value)}
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
                      value={vehicle.vinNumber}
                      onChange={e => handleVehicleChange(index, 'vinNumber', e.target.value.toUpperCase())}
                      placeholder="1HGBH41JXMN109186"
                      className="form-input"
                      maxLength={17}
                    />
                    <p className="text-xs text-[var(--ai-text-muted)] mt-1">
                      17-character Vehicle Identification Number
                    </p>
                  </div>
                </div>
              ))}
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
