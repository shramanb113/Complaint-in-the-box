import { TEMPLATE_CATEGORY, type Category, type TemplateId } from "@nyaypatra/core";

/** The order the categories appear in the picker. */
export const CATEGORY_ORDER: readonly Category[] = ["ecommerce", "upi", "food", "hidden_fee"];

/** Core's TEMPLATE_CATEGORY is the single source of truth; this only groups it for the picker. */
export function templatesByCategory(): Record<Category, TemplateId[]> {
  const grouped: Record<Category, TemplateId[]> = { ecommerce: [], upi: [], food: [], hidden_fee: [] };
  for (const [templateId, category] of Object.entries(TEMPLATE_CATEGORY) as [TemplateId, Category][]) {
    grouped[category].push(templateId);
  }
  return grouped;
}
