'use client';

import NewsletterModal from './NewsletterModal';

export default function HomeNewsletterModals() {
  return (
    <>
      <NewsletterModal triggerType="timed" />
      <NewsletterModal triggerType="exit" />
    </>
  );
}
