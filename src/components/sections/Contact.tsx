import { motion } from 'framer-motion';
import { MapPin, Mail, Facebook, Instagram, Youtube, Send } from 'lucide-react';

export function Contact() {
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Address',
      content: 'Actual Address: 1101 Finch Ave W., Unit #10',
      subContent: 'North York, ON M3J 3L6',
      content2: 'Registered Address: 3 Ellen Street',
      subContent2: 'Mississauga, ON L5M 1R8',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'info@ajrcanada.com',
      href: 'mailto:info@ajrcanada.com',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      href: 'https://www.facebook.com/aifcanada/',
      label: 'Facebook',
      color: 'hover:text-blue-600',
    },
    {
      icon: Instagram,
      href: 'https://www.instagram.com/ajrcanada/',
      label: 'Instagram',
      color: 'hover:text-pink-600',
    },
    {
      icon: Youtube,
      href: 'https://www.youtube.com/channel/UC1FoPhOC4gVK8jEeHl1OxJw',
      label: 'YouTube',
      color: 'hover:text-red-600',
    },
    {
      icon: Send,
      href: 'https://t.me/ajrcanada_bot',
      label: 'Telegram',
      color: 'hover:text-blue-500',
    },
  ];

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif font-bold text-4xl md:text-5xl text-gray-900 mb-4">
            Contact Us
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Have questions? We're here to help. Reach out to us through any of the following channels.
          </p>
        </motion.div>

        {/* Logo and Social Media Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/images/Ajr Islamic Foundation Logo PNG.png"
              alt="Ajr Islamic Foundation Logo"
              className="h-20 md:h-24"
            />
          </div>
          
          {/* Social Media Icons */}
          <div className="flex justify-center items-center gap-4">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-600 transition-colors duration-200 ${social.color}`}
                  aria-label={social.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-6 h-6 md:w-7 md:h-7" />
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contactInfo.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="h-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                  {/* Gradient Background on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Decorative Corner Element */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10 flex items-start gap-6">
                    {/* Icon Container with Enhanced Styling */}
                    <motion.div
                      className={`${item.bgColor} rounded-xl p-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg`}
                      whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className={`w-7 h-7 ${item.color}`} />
                    </motion.div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-xl text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors duration-300">
                        {item.title}
                      </h3>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-gray-700 hover:text-emerald-600 transition-colors duration-200 block text-lg font-medium group-hover:translate-x-1 inline-block transition-transform"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <>
                          <div className="space-y-3">
                            <div>
                              <p className="text-gray-700 text-base font-medium">{item.content}</p>
                              {item.subContent && (
                                <p className="text-gray-600 mt-1 text-base leading-relaxed">{item.subContent}</p>
                              )}
                            </div>
                            {item.content2 && (
                              <div className="pt-3 border-t border-gray-200">
                                <p className="text-gray-700 text-base font-medium">{item.content2}</p>
                                {item.subContent2 && (
                                  <p className="text-gray-600 mt-1 text-base leading-relaxed">{item.subContent2}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Border Accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
