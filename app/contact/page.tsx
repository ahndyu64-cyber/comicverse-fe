'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to a backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">Liên hệ với chúng tôi</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Có câu hỏi hoặc đề xuất? Chúng tôi rất muốn nghe từ bạn. Hãy điền vào biểu mẫu dưới đây và chúng tôi sẽ liên hệ với bạn soonest.
        </p>

        {submitted && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
            Cảm ơn bạn đã gửi tin nhắn! Chúng tôi sẽ sớm liên hệ với bạn.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-900 mb-2">
              Tên của bạn
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Nhập tên của bạn"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
              Email của bạn
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Nhập email của bạn"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-neutral-900 mb-2">
              Chủ đề
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Nhập chủ đề"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-neutral-900 mb-2">
              Tin nhắn
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Nhập tin nhắn của bạn..."
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Gửi tin nhắn
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Thông tin liên hệ khác</h2>
          <div className="space-y-4">
            <p className="text-neutral-700 dark:text-neutral-300">
              <span className="font-semibold text-neutral-900">Email:</span> support@comicverse.com
            </p>
            <p className="text-neutral-700 dark:text-neutral-300">
              <span className="font-semibold text-neutral-900">Địa chỉ:</span> ComicVerse Inc., Vietnam
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
