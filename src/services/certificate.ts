import {
  CertificateVerificationResponse,
  CertificateCreateRequest,
  CertificateCreateResponse,
} from "../types/certificate";

const STRAPI_URL =
  import.meta.env.VITE_STRAPI_URL ||
  "https://harmonious-kindness-705e180c6b.strapiapp.com";
const STRAPI_API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN;

/**
 * Verify a certificate by verification code
 */
export async function verifyCertificate(
  code: string
): Promise<CertificateVerificationResponse> {
  try {
    const url = `${STRAPI_URL}/api/certificates/verify/${code}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CertificateVerificationResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return { valid: false };
  }
}

/**
 * Create a certificate via public endpoint
 */
export async function createCertificate(
  data: CertificateCreateRequest
): Promise<CertificateCreateResponse> {
  try {
    const url = `${STRAPI_URL}/api/certificates/public-create`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `HTTP error! status: ${response.status}`
      );
    }

    const result: CertificateCreateResponse = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating certificate:", error);
    throw error;
  }
}

/**
 * Generate PDF for a certificate (admin only - requires API token)
 */
export async function generateCertificatePDF(
  certificateId: number
): Promise<{ success: boolean; message: string; pdfUrl: string }> {
  try {
    const url = `${STRAPI_URL}/api/certificates/${certificateId}/generate-pdf`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (STRAPI_API_TOKEN) {
      headers["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
    } else {
      throw new Error("API token is required for PDF generation");
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

