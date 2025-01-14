const { z } = require("zod");

/**
                          |**************************************************|
                          |******************* CATEGORY *********************|
                          |**************************************************|
 */

// Schema for creating a new category
const addCategorySchema = z.object({
  category: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .regex(/^[A-Za-z]+$/, "Invalid category format"),

  description: z.string().optional(),
  d_url: z.string().url("Invalid URL format").optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// Schema for updating a category
const updateCategorySchema = z.object({
  category: z
    .string()
    .min(1, "Category name must not be empty")
    .regex(/^[A-Za-z]+$/, "Invalid category format")
    .optional()
    .refine(
      (val) => !/([<>]|&lt;|&gt;|&amp;|&quot;|&apos;|&#\d+;)/.test(val),
      "Category name contains disallowed characters"
    ),
  description: z
    .string()
    .optional()
    .refine(
      (val) => !/([<>]|&lt;|&gt;|&amp;|&quot;|&apos;|&#\d+;)/.test(val),
      "Description contains disallowed characters"
    ),
  d_url: z
    .string()
    .url("Invalid URL format")
    .optional()
    .refine(
      (val) => !/([<>]|&lt;|&gt;|&amp;|&quot;|&apos;|&#\d+;)/.test(val),
      "URL contains disallowed characters"
    ),
  status: z.enum(["active", "inactive"]).optional(),
});

/**
                          |**************************************************|
                          |******************* PRODUCTS *********************|
                          |**************************************************|
 */

// Common validator for disallowed characters
const disallowedCharacterValidator = z
  .string()
  .trim()
  .refine(
    (val) => !/([<>]|&lt;|&gt;|&amp;|&quot;|&apos;|&#\d+;)/.test(val),
    "Field contains disallowed characters"
  );

// // creating a product
// const createProductSchema = z.object({
//   name: disallowedCharacterValidator,
//   company_name: disallowedCharacterValidator,
//   price: z
//     .number()
//     .positive('Price must be a positive number')
//     .refine((val) => !isNaN(val), 'Invalid number format'),
//   wholesale_price: z
//     .number()
//     .positive('Wholesale price must be a positive number')
//     .refine((val) => !isNaN(val), 'Invalid number format'),
//   discount: z
//     .number()
//     .int()
//     .min(0, 'Discount must be 0 or more')
//     .max(100, 'Discount cannot exceed 100'),
//   manufacturing_date: disallowedCharacterValidator,
//   expiry_date: disallowedCharacterValidator,
//   quantity: z
//     .number()
//     .int()
//     .min(0, 'Quantity cannot be negative')
//     .refine((val) => !isNaN(val), 'Invalid number format'),
//   thumbnail: z.string().optional(),
//   images: z
//     .string()
//     .refine(
//       (val) => !/([<>]|&lt;|&gt;|&amp;|&quot;|&apos;|&#\d+;)/.test(val),
//       'Field contains disallowed characters'
//     )
//     .optional(), // Ensures each image URL doesn't have disallowed characters
//   status: z.enum(['active', 'inactive']).optional(),
//   category_id: z
//     .number()
//     .int()
//     .positive('Category ID must be a positive integer'),
//   barcode: disallowedCharacterValidator.optional(),
//   supplier: disallowedCharacterValidator.optional(),
//   description: z.string().optional(), // No refinement here
// });

const createProductSchema = z.object({
  name: disallowedCharacterValidator,
  company_name: disallowedCharacterValidator,
  price: z.coerce.number().positive("Price must be a positive number"),
  wholesale_price: z.coerce
    .number()
    .positive("Wholesale price must be a positive number"),
  discount: z.coerce.number().int().min(0).max(100),
  manufacturing_date: disallowedCharacterValidator,
  expiry_date: disallowedCharacterValidator,
  quantity: z.coerce.number().int().min(0),
  thumbnail: z.string().optional(),
  images: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  category_id: z.coerce
    .number()
    .int()
    .positive("Category ID must be a positive integer"),
  barcode: disallowedCharacterValidator.optional(),
  supplier: disallowedCharacterValidator.optional(),
  description: z.string().optional(),
});

// updating a product (partial validation)
const updateProductSchema = createProductSchema.partial();

/**
                          |**************************************************|
                          |*******************  REVIEW  *********************|
                          |**************************************************|
 */
// Validation for creating a review
const createReviewSchema = z.object({
  product_id: z.coerce
    .number("P# in invalid format")
    .int("P# in invalid format")
    .positive("no product identified for review."),
  review: z
    .string()
    .min(10, "Review must be more than 10 characters.")
    .max(80, "shorten your review.")
    .refine(
      (val) => !/([<>]|&lt;|&gt;|&amp;|&quot;|&apos;|&#\d+;)/.test(val),
      "Field contains disallowed characters"
    ),
  stars: z.coerce
    .number()
    .int()
    .min(1, "Stars must be at least 1.")
    .max(5, "Stars cannot be more than 5.")
    .refine(
      (val) => !/([<>]|&lt;|&gt;|&amp;|&quot;|&apos;|&#\d+;)/.test(val),
      "Field contains disallowed characters"
    )
    .optional(),

  status: z.enum(["pinned", "pending", "approved"]).optional(),
});

// Validation for updating a review (partial validation)
const updateReviewSchema = createReviewSchema.partial();

/**
                          |**************************************************|
                          |*******************   CART   *********************|
                          |**************************************************|
 */

const cartCheckoutSchema = z.object({
  updatedCartItems: z.array(
    z.object({
      product_id: z
        .number()
        .nonnegative("Product ID must be a non-negative number"),
      quantity: z
        .number()
        .nonnegative("Quantity must be a non-negative number"),
    })
  ),
});

/**
                          |**************************************************|
                          |*******************  ORDERS  *********************|
                          |**************************************************|
 */
const OrderSchema = z.object({
  total_amount: z.number().positive("Total amount must be a positive number"),
  amount_with_delivery: z
    .number()
    .positive("Amount with delivery must be a positive number"),
  status: z
    .enum([
      "pending",
      "approved",
      "on-the-way",
      "received",
      "return-pending",
      "return-approved",
      "return-on-the-way",
      "return-received",
      "completed",
      "rejected",
    ])
    .default("pending"),
  city: z.string().optional().nullable(),
  shipping_address: z.string().optional().nullable(),
  user_contact: z.string().min(1, "User contact is required"),
  rejection_reason: z.string().optional().nullable(),
  exp_delivery_date: z.string().datetime().optional().nullable(),
  courier_company: z.string().optional().nullable(),
  tracking_id: z.string().optional().nullable(),
  payment_type: z.enum(["payFast", "COD"]),
  payment_status: z.enum(["pending", "paid", "returned"]).default("pending"),
  transaction_id: z.string().optional().nullable(),
  transaction_date: z.string().datetime().optional().nullable(),
  return_proof_image: z.string().optional().nullable(),
  return_reason: z.string().optional().nullable(),
  return_address: z.string().optional().nullable(),
  return_rejection_reason: z.string().optional().nullable(),
  return_company: z.string().optional().nullable(),
  return_tracking_id: z.string().optional().nullable(),
  return_user_account: z.string().optional().nullable(),
  return_user_account_title: z.string().optional().nullable(),
  return_user_account_bank: z.string().optional().nullable(),
  return_payment_proof: z.string().optional().nullable(),
  return_payment_date: z.string().datetime().optional().nullable(),
});

const placeOrderSchema = z.object({
  city: z.string().optional().nullable(),
  shipping_address: z.string().optional().nullable(),
  user_contact: z.string().min(1, "User contact is required"),
  payment_type: z.enum(["payFast", "COD"]),
});

const updateOrderSchema = {
  // 1. approve:
  approve: z.object({
    exp_delivery_date: z
      .string()
      .date({ message: "Invalid date format" })
      .or(z.literal(null)),
  }),

  // 2. reject:
  reject: z.object({
    rejection_reason: z
      .string()
      .min(1, { message: "a reason for rejection is required" }),
  }),

  // 3. on the way:
  "on-the-way": z.object({
    courier_company: z
      .string()
      .min(1, { message: "Courier company name is required" }),
    tracking_id: z
      .string()
      .min(1, { message: "Tracking ID of the shipment is required" }),
  }),

  // 4. recieve:
  received: z.object({}),

  // returns:
  "return-reject": z.object({
    return_rejection_reason: z
      .string()
      .min(1, { message: "Reason is required" }),
  }),
  "return-approve": z.object({
    return_address: z
      .string()
      .min(1, { message: "Return address is required" }),
  }),
  "return-receive": z.object({}),
  "return-payment": z.object({
    // return_payment_proof: z
    //   .string()
    //   .min(1, { message: "transiction image is  required" }),
  }),
};

module.exports = {
  // category:
  addCategorySchema,
  updateCategorySchema,

  // products:
  createProductSchema,
  updateProductSchema,

  // reviews:
  createReviewSchema,
  updateReviewSchema,

  // cart:
  cartCheckoutSchema,

  // orders:
  OrderSchema,
  placeOrderSchema,
  updateOrderSchema,
};
