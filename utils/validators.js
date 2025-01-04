const { z } = require('zod');


/**
                          |**************************************************|
                          |******************* CATEGORY *********************|
                          |**************************************************|
 */

// Schema for creating a new category
const addCategorySchema = z.object({
  category: z
    .string()
    .min(1, 'Category name is required')
    .regex(/^[A-Za-z]+$/, 'Invalid category format'),

  description: z.string().optional(),
  d_url: z.string().url('Invalid URL format').optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// Schema for updating a category
const updateCategorySchema = z.object({
  category: z
    .string()
    .min(1, 'Category name must not be empty')
    .regex(/^[A-Za-z]+$/, 'Invalid category format')
    .optional()
    .refine(
      (val) => !/([<>]|&lt;|&gt;|&amp;|&quot;|&apos;|&#\d+;)/.test(val),
      'Category name contains disallowed characters'
    ),
  description: z
    .string()
    .optional()
    .refine(
      (val) => !/([<>]|&lt;|&gt;|&amp;|&quot;|&apos;|&#\d+;)/.test(val),
      'Description contains disallowed characters'
    ),
  d_url: z
    .string()
    .url('Invalid URL format')
    .optional()
    .refine(
      (val) => !/([<>]|&lt;|&gt;|&amp;|&quot;|&apos;|&#\d+;)/.test(val),
      'URL contains disallowed characters'
    ),
  status: z.enum(['active', 'inactive']).optional(),
});


/**
                          |**************************************************|
                          |******************* PRODUCTS *********************|
                          |**************************************************|
 */

// Common validator for disallowed characters
const disallowedCharacterValidator = z
  .string()
  .refine(
    (val) => !/([<>]|&lt;|&gt;|&amp;|&quot;|&apos;|&#\d+;)/.test(val),
    'Field contains disallowed characters'
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
  price: z.coerce.number().positive('Price must be a positive number'),
  wholesale_price: z.coerce.number().positive('Wholesale price must be a positive number'),
  discount: z.coerce.number().int().min(0).max(100),
  manufacturing_date: disallowedCharacterValidator,
  expiry_date: disallowedCharacterValidator,
  quantity: z.coerce.number().int().min(0),
  thumbnail: z.string().optional(),
  images: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  category_id: z.coerce.number().int().positive('Category ID must be a positive integer'),
  barcode: disallowedCharacterValidator.optional(),
  supplier: disallowedCharacterValidator.optional(),
  description: z.string().optional(),
});


// updating a product (partial validation)
const updateProductSchema = createProductSchema.partial();




module.exports = {
  // category: 
  addCategorySchema, updateCategorySchema,

  // products: 
  createProductSchema, updateProductSchema,

  // NEXT:?
}