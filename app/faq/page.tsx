import Link from 'next/link';

export default function FAQPage() {
  const faqs = [
    {
      question: 'How does ScriptScope work?',
      answer:
        'Upload your screenplay (PDF or TXT), and our AI analyzes it using a professional coverage framework. You\'ll receive a comprehensive report in about 5 minutes.',
    },
    {
      question: 'Is my script secure?',
      answer:
        'Yes. Your script is encrypted, automatically deleted within 24 hours, never shared with anyone, and never used to train AI. See our Privacy Policy for details.',
    },
    {
      question: 'Who sees my script?',
      answer:
        'No one. The process is entirely automated. No humans read your script unless you specifically contact support with a technical issue.',
    },
    {
      question: 'Is this AI-generated analysis?',
      answer:
        'Yes. ScriptScope uses AI to generate analysis. While our methodology is based on professional script development practices, the output is AI-generated and should not replace professional advice.',
    },
    {
      question: 'What file formats do you accept?',
      answer: 'PDF and TXT files. Screenplay format (Final Draft, etc.) works best.',
    },
    {
      question: 'How long does analysis take?',
      answer: 'Typically 3-5 minutes, depending on script length.',
    },
    {
      question: 'Can I get a refund?',
      answer:
        'Yes, unused credits can be refunded within 30 days. Used credits are non-refundable. If we fail to deliver an analysis due to technical error, you\'ll receive a full refund.',
    },
    {
      question: 'Do you offer bulk pricing?',
      answer: 'Yes. Our 3-pack ($99) and 10-pack ($249) offer discounted rates.',
    },
    {
      question: 'What\'s included in the analysis?',
      answer:
        'Logline and synopsis, story fundamentals (character, structure, theme), craft analysis (dialogue, tone, originality), commercial viability assessment, festival/prestige potential, and final recommendation (Pass/Consider/Recommend).',
    },
    {
      question: 'Can I use this analysis professionally?',
      answer:
        'The analysis is for your personal use to improve your screenplay. It should not be presented as professional coverage or used as the sole basis for business decisions.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A5F] mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Everything you need to know about ScriptScope
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`p-6 ${idx !== faqs.length - 1 ? 'border-b border-gray-200' : ''}`}
            >
              <h2 className="text-xl font-bold text-[#1E3A5F] mb-2">{faq.question}</h2>
              <p className="text-gray-700">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <Link
            href="/contact"
            className="text-[#1E3A5F] underline hover:text-[#152d47]"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
