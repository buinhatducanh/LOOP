"use client";

import { BookingWizardClient } from "@/components/landing/BookingWizardClient";

interface Props {
  locale: string;
}

export function BookingWizardPageClient({ locale }: Props) {
  return <BookingWizardClient locale={locale} />;
}
