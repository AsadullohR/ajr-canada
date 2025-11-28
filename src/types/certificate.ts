export interface Certificate {
  id: number;
  documentId: string;
  volunteerName: string;
  volunteerEmail?: string;
  volunteerPhone?: string;
  certificateType:
    | "volunteer-hours"
    | "community-service"
    | "event-participation"
    | "program-completion"
    | "other";
  hoursWorked?: number;
  workDescription: string;
  workDate: string;
  issuedDate?: string;
  verificationCode?: string;
  qrCode?: {
    id: number;
    url: string;
  };
  pdfCertificate?: {
    id: number;
    url: string;
  };
  isVerified?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  truthfulnessConfirmed?: boolean;
  submittedBy?: string;
  submissionIp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateVerificationResponse {
  valid: boolean;
  certificate?: {
    volunteerName: string;
    certificateType: string;
    hoursWorked?: number;
    workDescription: string;
    workDate: string;
    issuedDate?: string;
  };
}

export interface CertificateCreateRequest {
  volunteerName: string;
  volunteerEmail?: string;
  volunteerPhone?: string;
  certificateType?:
    | "volunteer-hours"
    | "community-service"
    | "event-participation"
    | "program-completion"
    | "other";
  hoursWorked?: number;
  workDescription: string;
  workDate: string;
  truthfulnessConfirmed: boolean;
  submittedBy?: string;
}

export interface CertificateCreateResponse {
  success: boolean;
  message: string;
  verificationCode: string;
  certificateId: number;
}

