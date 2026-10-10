import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

// Common scalar validators
const emailSchema = z.string().min(1, 'Email is required').email('Invalid email format');
const passwordSchema = z.string().min(1, 'Password is required');
const tableNumberSchema = z.coerce.number().int().positive('Table number must be a positive integer');
const restaurantIdSchema = z.string().min(1, 'Restaurant ID is required');

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
});

// Restaurant creation schema (admin)
export const createRestaurantSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required'),
  logo: z.string().url('Logo must be a valid URL').optional(),
  cover_image: z.string().url('Cover image must be a valid URL').optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  description: z.string().optional(),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
  cuisine_type: z.string().optional(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
  plan: z.enum(['starter', 'growth', 'pro', 'custom']).optional(),
  owner_name: z.string().optional(),
  owner_email: z.string().email('Owner email is required'),
  owner_password: z.string().min(6, 'Owner password must be at least 6 characters'),
});

// Menu / Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  sort_order: z.number().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().optional(),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

// Menu item schemas
export const menuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  discount_price: z.coerce.number().positive().optional(),
  category_id: z.string().min(1, 'Category is required'),
  image: z.string().optional(),
  weight: z.string().optional(),
  is_veg: z.boolean().optional(),
  spicy_level: z.number().min(0).max(5).optional(),
  prep_time: z.number().int().positive().optional(),
  is_available: z.boolean().optional(),
  is_bestseller: z.boolean().optional(),
  sizes: z.array(z.object({
    name: z.string(),
    price_delta: z.number(),
  })).optional(),
  add_ons: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
  })).optional(),
  spice_options: z.array(z.string()).optional(),
});

// Table schemas
export const createTableSchema = z.object({
  table_number: z.coerce.number().int().positive(),
  capacity: z.coerce.number().int().positive().optional(),
  status: z.enum(['available', 'ordering', 'occupied', 'reserved', 'cleaning']).optional(),
});

export const updateTableSchema = z.object({
  table_number: z.coerce.number().int().positive().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  status: z.enum(['available', 'ordering', 'occupied', 'reserved', 'cleaning']).optional(),
});

// Coupon schemas
export const createCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_value: z.coerce.number().positive(),
  min_order_amount: z.coerce.number().min(0).optional(),
  max_discount_amount: z.coerce.number().positive().optional(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  usage_limit: z.coerce.number().int().positive().optional(),
  per_customer_limit: z.coerce.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});

// Order status schema
export const orderStatusSchema = z.object({
  status: z.enum(['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']),
});

// Payment schema
export const paymentSchema = z.object({
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']),
});

// Verify code schema
export const verifyCodeSchema = z.object({
  code: z.string().min(1, 'Verification code is required'),
});

// Service request update schema
export const serviceRequestSchema = z.object({
  status: z.enum(['pending', 'attended', 'resolved']),
});

// Service request creation schema
export const serviceRequestCreateSchema = z.object({
  restaurant_id: restaurantIdSchema,
  table_number: z.coerce.number().int().positive(),
  request_type: z.string().optional(),
  note: z.string().optional(),
});

// Pay bill schema
export const payBillSchema = z.object({
  restaurant_id: restaurantIdSchema,
  table_number: z.coerce.number().int().positive(),
  utr: z.string().optional(),
});

// Coupon validation schema
export const couponValidateSchema = z.object({
  restaurant_id: restaurantIdSchema,
  code: z.string().min(1),
  subtotal: z.coerce.number().nonnegative(),
});

// Customer login schema
export const customerLoginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  name: z.string().optional(),
  restaurant_id: z.string().optional(),
});

// Place order schema (validates shape; domain-specific 26-step logic stays in route handler)
export const placeOrderSchema = z.object({
  restaurant_id: restaurantIdSchema,
  table_number: z.coerce.number().int().positive(),
  items: z.array(z.object({
    menu_item_id: z.string().min(1),
    name: z.string().optional(),
    quantity: z.coerce.number().int().positive(),
    selected_size: z.string().optional(),
    selected_addons: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
    })).optional(),
    spice_level: z.string().optional(),
    special_instructions: z.string().optional(),
    customization: z.string().optional(),
  })).min(1, 'At least one item is required'),
  coupon_code: z.string().optional(),
  payment_method: z.enum(['online', 'cash_table', 'cash_counter']).optional(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  notes: z.string().optional(),
  special_instructions: z.string().optional(),
});

// Waiter punch order schema
export const waiterPunchOrderSchema = z.object({
  table_number: z.coerce.number().int().positive(),
  items: z.array(z.object({
    menu_item_id: z.string().min(1),
    item_name_snapshot: z.string().optional(),
    price_snapshot: z.number().optional(),
    quantity: z.coerce.number().int().positive(),
    notes: z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
  payment_method: z.enum(['online', 'cash_table', 'cash_counter']).optional(),
});

// Staff creation schema
export const createStaffSchema = z.object({
  name: z.string().min(1, 'Staff name is required'),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['restaurant_manager', 'kitchen_staff', 'waiter']),
});

// Restaurant profile update schema
export const updateRestaurantProfileSchema = z.object({
  name: z.string().optional(),
  logo: z.string().url().optional(),
  cover_image: z.string().url().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  description: z.string().optional(),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
  cuisine_type: z.string().optional(),
  wifi_info: z.string().optional(),
  enabled_payments: z.object({
    online: z.boolean().optional(),
    cash_table: z.boolean().optional(),
    cash_counter: z.boolean().optional(),
  }).optional(),
  tax_rate: z.coerce.number().nonnegative().optional(),
  upi_id: z.string().optional(),
  upi_payee_name: z.string().optional(),
  pay_counter_only: z.boolean().optional(),
  menu_theme: z.enum(['dark', 'light', 'cafe']).optional(),
});

// Menu theme update schema (restaurant owner customizes customer menu theme)
export const updateMenuThemeSchema = z.object({
  menu_theme: z.enum(['dark', 'light', 'cafe'], {
    error: 'Theme must be one of: dark, light, cafe',
  }),
});

// Upload schema
export const uploadSchema = z.object({
  dataUrl: z.string().min(1),
  filename: z.string().optional(),
});

// AI generate description schema
export const aiDescriptionSchema = z.object({
  name: z.string().min(1, 'Dish name is required'),
  category: z.string().optional(),
  is_veg: z.boolean().optional(),
});

// Subscription update schema
export const updateSubscriptionSchema = z.object({
  plan: z.enum(['starter', 'growth', 'pro', 'custom']).optional(),
  status: z.enum(['pending', 'awaiting_payment', 'active', 'expiring_soon', 'expired', 'suspended', 'cancelled']).optional(),
  payment_status: z.enum(['paid', 'pending', 'failed']).optional(),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
});

// Restaurant status update schema
export const restaurantStatusSchema = z.object({
  status: z.enum(['active', 'pending', 'suspended']).optional(),
  service_expires_at: z.string().optional(),
  duration_days: z.coerce.number().int().positive().optional(),
  ban_reason: z.string().optional(),
});

// Operations settings schema
export const operationsSchema = z.object({
  accepting_orders: z.boolean().optional(),
  order_validation_enabled: z.boolean().optional(),
  service_charge_rate: z.coerce.number().nonnegative().optional(),
  pay_counter_only: z.boolean().optional(),
});

// Pagination query schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
});

// Order history filter schema
export const orderHistorySchema = z.object({
  phone: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  payment_method: z.string().optional(),
  date: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(50),
});

// Backup import schema
export const backupImportSchema = z.object({
  backupData: z.record(z.string(), z.any()),
});

// Middleware: validates req.body against a Zod schema
export function validateRequestBody(schema: z.ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const fieldErrors = result.error.issues.map(issue => ({
          field: issue.path.join('.') || 'body',
          message: issue.message,
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: fieldErrors,
        });
      }
      req.body = result.data;
      next();
    } catch (err) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
  };
}

// Middleware: validates req.query against a Zod schema
export function validateQuery(schema: z.ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const fieldErrors = result.error.issues.map(issue => ({
          field: issue.path.join('.') || 'query',
          message: issue.message,
        }));
        return res.status(400).json({
          error: 'Query validation failed',
          details: fieldErrors,
        });
      }
      req.query = result.data as any;
      next();
    } catch (err) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
  };
}

export { z };
