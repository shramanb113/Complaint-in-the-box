import companies from "../data/companies.json";
import type { CompanyCatalog } from "./types";

export function loadCompanyCatalog(): CompanyCatalog {
  return companies as CompanyCatalog;
}
