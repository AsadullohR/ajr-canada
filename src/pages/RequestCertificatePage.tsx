import { useState, FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { createCertificate } from "../services/certificate";
import { CertificateCreateRequest } from "../types/certificate";

export function RequestCertificatePage() {
  const [formData, setFormData] = useState<CertificateCreateRequest>({
    volunteerName: "",
    volunteerEmail: "",
    volunteerPhone: "",
    certificateType: "volunteer-hours",
    hoursWorked: undefined,
    workDescription: "",
    workDate: "",
    truthfulnessConfirmed: false,
    submittedBy: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [success, setSuccess] = useState<{
    verificationCode: string;
    certificateId: number;
  } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.truthfulnessConfirmed) {
      setError("You must confirm the truthfulness of the information provided.");
      setLoading(false);
      return;
    }

    try {
      const result = await createCertificate({
        ...formData,
        submittedBy: formData.submittedBy || formData.volunteerName,
      });
      setSuccess({
        verificationCode: result.verificationCode,
        certificateId: result.certificateId,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while submitting your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked =
      (e.target as HTMLInputElement).type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value ? parseFloat(value) : undefined
          : value,
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isScrolled={isScrolled} activeSection="" />
        <main className="pb-16">
          {/* Pattern Background Hero */}
          <div className="relative w-full h-[300px] md:h-[250px] overflow-hidden bg-gray-950">
            <img
              src="/images/pattern_background.jpg"
              alt="Pattern Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-900/75 to-gray-950/80"></div>
            <div className="absolute inset-0 flex flex-col justify-end px-4 md:px-8 lg:px-12 xl:px-16 pb-8 md:pb-12">
              <h1 className="font-serif font-bold text-4xl md:text-5xl text-white leading-tight max-w-4xl">
                Certificate Request Submitted
              </h1>
            </div>
          </div>

          {/* Success Content */}
          <div className="max-w-2xl mx-auto px-4 md:px-0 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-2xl p-8 md:p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6"
              >
                <svg
                  className="w-10 h-10 text-emerald-600"
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
              </motion.div>
              <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900 mb-4">
                Request Submitted Successfully
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Your certificate request has been submitted successfully. Your
                certificate will be reviewed and processed.
              </p>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-8 border border-emerald-200">
                <p className="text-sm font-medium text-emerald-700 mb-2">
                  Verification Code
                </p>
                <p className="text-3xl font-mono font-bold text-emerald-900">
                  {success.verificationCode}
                </p>
                <p className="text-sm text-emerald-600 mt-3">
                  Save this code to verify your certificate later
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`/verify/${success.verificationCode}`}
                  className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10">Verify Certificate</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
                <button
                  onClick={() => {
                    setSuccess(null);
                    setFormData({
                      volunteerName: "",
                      volunteerEmail: "",
                      volunteerPhone: "",
                      certificateType: "volunteer-hours",
                      hoursWorked: undefined,
                      workDescription: "",
                      workDate: "",
                      truthfulnessConfirmed: false,
                      submittedBy: "",
                    });
                  }}
                  className="px-8 py-4 font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 border border-gray-300"
                >
                  Submit Another Request
                </button>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isScrolled={isScrolled} activeSection="" />
      <main className="pb-16">
        {/* Pattern Background Hero */}
        <div className="relative w-full h-[300px] md:h-[250px] overflow-hidden bg-gray-950">
          <img
            src="/images/pattern_background.jpg"
            alt="Pattern Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-900/75 to-gray-950/80"></div>
          <div className="absolute inset-0 flex flex-col justify-end px-4 md:px-8 lg:px-12 xl:px-16 pb-8 md:pb-12">
            <h1 className="font-serif font-bold text-3xl md:text-4xl text-white leading-tight max-w-4xl">
              Request Certificate
            </h1>
            <p className="text-white mt-4 text-lg max-w-2xl">
              Submit your request for a volunteer certificate or community service recognition
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl mx-auto px-4 md:px-0 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-xl shadow-2xl p-8 md:p-12"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg"
              >
                <p className="text-red-800 font-medium">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="volunteerName"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Volunteer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="volunteerName"
                    name="volunteerName"
                    required
                    value={formData.volunteerName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="volunteerEmail"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="volunteerEmail"
                    name="volunteerEmail"
                    value={formData.volunteerEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="volunteerPhone"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="volunteerPhone"
                    name="volunteerPhone"
                    value={formData.volunteerPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="certificateType"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Certificate Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="certificateType"
                    name="certificateType"
                    required
                    value={formData.certificateType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                  >
                    <option value="volunteer-hours">Volunteer Hours</option>
                    <option value="community-service">Community Service</option>
                    <option value="event-participation">
                      Event Participation
                    </option>
                    <option value="program-completion">
                      Program Completion
                    </option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="hoursWorked"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    id="hoursWorked"
                    name="hoursWorked"
                    min="0"
                    step="0.5"
                    value={formData.hoursWorked || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="workDate"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Work Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="workDate"
                    name="workDate"
                    required
                    value={formData.workDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="workDescription"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Work Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="workDescription"
                  name="workDescription"
                  required
                  rows={5}
                  value={formData.workDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                  placeholder="Describe the volunteer work or service performed..."
                />
              </div>

              <div>
                <label
                  htmlFor="submittedBy"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Submitted By (if different from volunteer name)
                </label>
                <input
                  type="text"
                  id="submittedBy"
                  name="submittedBy"
                  value={formData.submittedBy}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-l-4 border-emerald-500 rounded-r-lg p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="truthfulnessConfirmed"
                    name="truthfulnessConfirmed"
                    required
                    checked={formData.truthfulnessConfirmed}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="truthfulnessConfirmed"
                    className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                  >
                    <span className="font-bold text-emerald-700">
                      I solemnly declare
                    </span>{" "}
                    that all information provided is true and accurate. I
                    understand that providing false information is a sin and may
                    result in legal consequences. I take full responsibility for
                    the accuracy of this information.{" "}
                    <span className="text-red-500 font-semibold">*</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,146,60,0.8)] hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <span className="relative z-10">
                  {loading ? "Submitting..." : "Submit Request"}
                </span>
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

