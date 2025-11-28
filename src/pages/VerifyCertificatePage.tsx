import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { verifyCertificate } from "../services/certificate";
import { CertificateVerificationResponse } from "../types/certificate";

export function VerifyCertificatePage() {
  const { code } = useParams<{ code: string }>();
  const [verification, setVerification] =
    useState<CertificateVerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!code) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await verifyCertificate(code);
      setVerification(result);
      setLoading(false);
    };

    verify();
  }, [code]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCertificateType = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
              Certificate Verification
            </h1>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Verifying certificate...</p>
              </div>
            ) : verification?.valid ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-green-600 mb-2">
                    Valid Certificate
                  </h2>
                  <p className="text-gray-600">
                    This certificate has been verified and is authentic.
                  </p>
                </div>

                {verification.certificate && (
                  <div className="border-t border-gray-200 pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Volunteer Name
                        </label>
                        <p className="text-lg font-semibold text-gray-800">
                          {verification.certificate.volunteerName}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Certificate Type
                        </label>
                        <p className="text-lg font-semibold text-gray-800">
                          {formatCertificateType(
                            verification.certificate.certificateType
                          )}
                        </p>
                      </div>

                      {verification.certificate.hoursWorked && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Hours Worked
                          </label>
                          <p className="text-lg font-semibold text-gray-800">
                            {verification.certificate.hoursWorked} hours
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Work Date
                        </label>
                        <p className="text-lg font-semibold text-gray-800">
                          {formatDate(verification.certificate.workDate)}
                        </p>
                      </div>

                      {verification.certificate.issuedDate && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Issued Date
                          </label>
                          <p className="text-lg font-semibold text-gray-800">
                            {formatDate(verification.certificate.issuedDate)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Work Description
                      </label>
                      <p className="text-gray-800 mt-1">
                        {verification.certificate.workDescription}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-red-600 mb-2">
                  Invalid Certificate
                </h2>
                <p className="text-gray-600 mb-4">
                  The verification code provided is invalid or the certificate
                  does not exist.
                </p>
                <p className="text-sm text-gray-500">
                  Please check the verification code and try again, or contact
                  the organization if you believe this is an error.
                </p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Verification Code: <code className="font-mono">{code}</code>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

