/**
 * Type definitions for the Auto Shipment Agreement app
 */

/**
 * A checkbox option that can be selected
 */
export type CheckOption = {
  id: string;
  label: string;
};

/**
 * A micro-step within a section
 */
export type MicroStep = {
  id: string;
  /** Conversational intro text */
  intro?: string;
  /** Main content for this micro-step */
  content: string;
  /** Whether this is an important/initial-required item */
  isImportant?: boolean;
  /** Optional checkbox options */
  options?: CheckOption[];
  /** If true, shows a text input */
  hasInput?: boolean;
  inputPlaceholder?: string;
};

/**
 * Represents a main section with micro-steps inside
 */
export type Section = {
  id: string;
  title: string;
  /** Micro-steps within this section */
  microSteps: MicroStep[];
  /** Whether this section requires initials */
  requiresInitials?: boolean;
};

/**
 * Form data collected throughout the wizard
 */
export type FormData = {
  /** Selected options keyed by microStep id */
  selectedOptions: Record<string, string[]>;
  /** Text inputs keyed by microStep id */
  inputs: Record<string, string>;
  /** Initials keyed by section id */
  initials: Record<string, string>;
  /** Final signature fields */
  fullName: string;
  email: string;
  phone: string;
  signatureDate: string;
};

/**
 * Payload sent to the webhook
 */
export type WebhookPayload = {
  transfereeName: string;
  email: string;
  phone: string;
  signatureDate: string;
  sections: Array<{
    id: string;
    title: string;
    responses: Array<{
      microStepId: string;
      selectedOptions?: string[];
      input?: string;
    }>;
  }>;
  submittedAt: string;
  userAgent: string;
  language: string;
};
