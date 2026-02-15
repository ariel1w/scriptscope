export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-4xl font-bold text-[#1E3A5F] mb-8">Privacy Policy</h1>

        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg max-w-none space-y-6">
          <p>
            ScriptScope ("we", "us", "our") respects your privacy. This policy explains how we collect, use, and protect your personal data in compliance with Israel's Protection of Privacy Law (PPL), the EU General Data Protection Regulation (GDPR), and the California Consumer Privacy Act (CCPA).
          </p>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">1. Data Controller</h2>
          <p>
            The data controller responsible for your data is ScriptScope, operated from Israel.
            <br />
            Contact: privacy@scriptscope.com
          </p>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">2. Information We Collect</h2>

          <p><strong>Personal Data:</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Email address (required for account creation and delivery of analysis)</li>
            <li>Payment information (processed by Paddle, our payment provider — we never store your payment card details)</li>
          </ul>

          <p><strong>Uploaded Content:</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Screenplay files you upload for analysis</li>
          </ul>

          <p><strong>Technical Data (collected automatically):</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Pages visited and usage patterns</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">3. How We Use Your Data</h2>

          <table className="w-full border-collapse border border-gray-300 my-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Legal Basis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Providing script analysis</td>
                <td className="border border-gray-300 px-4 py-2">Contract performance</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Delivering analysis results</td>
                <td className="border border-gray-300 px-4 py-2">Contract performance</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Processing payments</td>
                <td className="border border-gray-300 px-4 py-2">Contract performance</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Service-related emails</td>
                <td className="border border-gray-300 px-4 py-2">Legitimate interest</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Marketing emails</td>
                <td className="border border-gray-300 px-4 py-2">Your consent (opt-out anytime)</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Improving our service</td>
                <td className="border border-gray-300 px-4 py-2">Legitimate interest</td>
              </tr>
            </tbody>
          </table>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">4. Screenplay Data Handling</h2>

          <p><strong>Your scripts are protected:</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Processed only to provide the analysis service</li>
            <li>Encrypted during transmission (TLS 1.3) and storage (AES-256)</li>
            <li>Automatically deleted within 24 hours of analysis completion</li>
            <li>NEVER used to train AI models</li>
            <li>NEVER shared with third parties</li>
            <li>NEVER reviewed by humans (unless you request technical support)</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">5. Data Retention</h2>

          <table className="w-full border-collapse border border-gray-300 my-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Data Type</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Account information</td>
                <td className="border border-gray-300 px-4 py-2">Until you delete your account</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Uploaded scripts</td>
                <td className="border border-gray-300 px-4 py-2">Deleted within 24 hours of analysis</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Analysis reports</td>
                <td className="border border-gray-300 px-4 py-2">Until you delete your account</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Payment records</td>
                <td className="border border-gray-300 px-4 py-2">As required by law (typically 7 years)</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Marketing preferences</td>
                <td className="border border-gray-300 px-4 py-2">Until you unsubscribe</td>
              </tr>
            </tbody>
          </table>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">6. Your Rights</h2>

          <p>Under applicable privacy laws (PPL, GDPR, CCPA), you have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Access</strong> your personal data</li>
            <li><strong>Correct</strong> inaccurate data</li>
            <li><strong>Delete</strong> your data ("right to be forgotten")</li>
            <li><strong>Restrict</strong> processing of your data</li>
            <li><strong>Data portability</strong> — receive your data in a machine-readable format</li>
            <li><strong>Object</strong> to certain processing</li>
            <li><strong>Withdraw consent</strong> at any time (without affecting prior processing)</li>
          </ul>

          <p>
            To exercise these rights, contact: privacy@scriptscope.com
            <br />
            We will respond within 30 days (or sooner where required by law).
          </p>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">7. International Data Transfers</h2>

          <p>Your data may be processed in:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Israel</strong> (recognized by EU as providing adequate data protection)</li>
            <li><strong>United States</strong> (via service providers with Standard Contractual Clauses)</li>
          </ul>

          <p>We ensure appropriate safeguards are in place for all international transfers.</p>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">8. Third-Party Service Providers</h2>

          <p>We share data with these service providers who process data on our behalf:</p>

          <table className="w-full border-collapse border border-gray-300 my-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Provider</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Paddle</td>
                <td className="border border-gray-300 px-4 py-2">Payment processing</td>
                <td className="border border-gray-300 px-4 py-2">UK/US</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Vercel</td>
                <td className="border border-gray-300 px-4 py-2">Website hosting</td>
                <td className="border border-gray-300 px-4 py-2">US</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Supabase</td>
                <td className="border border-gray-300 px-4 py-2">Database</td>
                <td className="border border-gray-300 px-4 py-2">US</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Resend</td>
                <td className="border border-gray-300 px-4 py-2">Email delivery</td>
                <td className="border border-gray-300 px-4 py-2">US</td>
              </tr>
            </tbody>
          </table>

          <p>These providers are bound by data processing agreements and use your data only to provide services to us.</p>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">9. Data Security</h2>

          <p>We implement industry-standard security measures:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>TLS 1.3 encryption for data in transit</li>
            <li>AES-256 encryption for data at rest</li>
            <li>Access controls and authentication</li>
            <li>Regular security practices review</li>
            <li>Automatic data deletion schedules</li>
          </ul>

          <p>
            No system is 100% secure. While we cannot guarantee absolute security, we implement robust measures to protect your data.
          </p>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">10. Cookies</h2>

          <p>
            We use essential cookies required for the site to function. We may use analytics cookies to understand how visitors use our site. You can control cookies through your browser settings.
          </p>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">11. Children's Privacy</h2>

          <p>
            Our service is not intended for users under 18. We do not knowingly collect data from children. If you believe a child has provided us data, contact us immediately at privacy@scriptscope.com.
          </p>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">12. Do Not Sell My Information (CCPA)</h2>

          <p>
            We do not sell your personal information. We do not share your personal information for cross-context behavioral advertising.
          </p>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">13. Changes to This Policy</h2>

          <p>
            We may update this policy periodically. We will notify you of material changes via email or prominent notice on our site. Your continued use after changes constitutes acceptance.
          </p>

          <h2 className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">14. Contact Us</h2>

          <p>
            For privacy-related questions or to exercise your rights:
            <br />
            Email: privacy@scriptscope.com
            <br />
            Response time: Within 30 days
          </p>
        </div>
      </div>
    </div>
  );
}
