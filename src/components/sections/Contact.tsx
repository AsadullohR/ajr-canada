import React from 'react';
import { MapPin, Mail } from 'lucide-react';

export function Contact() {
  return (
    <section id="contact" className="py-24 bg-gray-50">
      <div className="px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="text-center mb-12">
          <h2 className="section-title mb-4">Contact Us</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Have questions? We're here to help. Reach out to us through any of the following channels.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card p-6 transform md:hover:scale-105 transition-transform duration-300">
            <div className="flex items-start space-x-4">
              <MapPin className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Locations</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-700">Actual Address:</p>
                    <p className="text-gray-600">1101 Finch Ave W., Unit #10<br />North York, ON M3J 3L6</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Registered Address:</p>
                    <p className="text-gray-600">3 Ellen Street<br />Mississauga, ON L5M 1R8</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card p-6 transform md:hover:scale-105 transition-transform duration-300">
            <div className="flex items-start space-x-4">
              <Mail className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Email</h3>
                <a href="mailto:info@ajrcanada.com" className="text-gray-600 hover:text-emerald-600 transition-colors">
                  info@ajrcanada.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}