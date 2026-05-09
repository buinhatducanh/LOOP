/**
 * GET /api/testimonials
 *
 * Returns all active testimonials.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi).
 */

import { handleError, ok } from "@/lib/api/response";
import { getTestimonials } from "@/lib/db/queries";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const testimonials = await getTestimonials();

    const localized = testimonials.map((t: typeof testimonials[number]) => ({
      id: t.id,
      name: t.name,
      avatar: t.avatar,
      rating: t.rating,
      text: getLocalizedField(t, "text", locale),
      role: getLocalizedField(t, "role", locale),
      company: getLocalizedField(t, "company", locale),
      _localeUsed: locale,
    }));

    return ok(localized);
  } catch (error) {
    return handleError(error);
  }
}
