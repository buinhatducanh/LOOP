/**
 * [locale] Home Page — LOOP Solutions
 *
 * NOTE: This is a minimal placeholder page demonstrating i18n routing.
 * Full public pages will be implemented in the FE repo.
 * This placeholder ensures the [locale] segment is functional.
 */

import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home.hero");

  return (
    <main>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
      <a href={`/${locale}/services`}>{t("cta")}</a>
    </main>
  );
}
