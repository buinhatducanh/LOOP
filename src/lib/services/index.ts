// Service layer — organized by domain
// Import from specific domain for type-safe access:
//   import { submitContactForm } from "@/lib/services/landing"
//
// Or use domain barrel:
//   import "@/lib/services/gamification"  // side-effect: registers services

// Re-export key types for convenience
export type { ContactFormInput, ContactSubmissionResult } from "./landing/contact.service";
export type { SearchResult } from "./content/search.service";
export type { RedeemParams, RedeemResult } from "./gamification/redemption.service";
export type { CreateTransactionParams } from "./gamification/transaction.service";
export type { TransferParams, TransferResult } from "./gamification/transfer.service";
