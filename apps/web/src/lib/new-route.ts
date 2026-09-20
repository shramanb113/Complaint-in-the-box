import { CategorySchema, TEMPLATE_CATEGORY, TemplateIdSchema, type Category, type TemplateId } from "@nyaypatra/core";

/**
 * Reads /new/[category]?template=... . An unknown category is a 404 (null). A template that is
 * unknown, from another category, or repeated is ignored rather than an error.
 */
export function parseNewRoute(
  category: string,
  template: string | string[] | undefined
): { category: Category; templateId?: TemplateId } | null {
  const parsedCategory = CategorySchema.safeParse(category);
  if (!parsedCategory.success) return null;
  const route = { category: parsedCategory.data };
  if (typeof template !== "string") return route;
  const parsedTemplate = TemplateIdSchema.safeParse(template);
  if (!parsedTemplate.success || TEMPLATE_CATEGORY[parsedTemplate.data] !== route.category) return route;
  return { ...route, templateId: parsedTemplate.data };
}
