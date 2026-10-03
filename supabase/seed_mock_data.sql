-- ============================================================================
-- Seed: wipe all business data and load fresh mock records.
-- Run this in the Supabase SQL Editor AFTER migrations 0001–0007.
-- Preserves: employees (sujatha + team stay intact).
-- Requires: gen_random_uuid() (pgcrypto, from 0001).
-- ============================================================================

-- 1. Wipe --------------------------------------------------------------------
truncate table
  chat_attachments, chat_messages, conversations,
  shipment_milestones, shipments,
  order_timeline_events, order_photos, order_documents,
  transactions, tickets, orders,
  products, customers, measurements,
  activity_log
restart identity cascade;

-- 2. Measurements + customers ------------------------------------------------
insert into measurements
  (id, label, blouse_length, shoulder, chest, waist, armhole,
   sleeve_length, sleeve_round, front_neck_deep, back_neck_deep)
values
  ('11111111-1111-1111-1111-111111111111', 'Amara Nair — Blouse',
   15.0, 14.5, 36.0, 30.0, 8.5, 10.0, 11.0, 6.5, 7.5),
  ('22222222-2222-2222-2222-222222222222', 'Meera Krishnan — Blouse',
   14.5, 14.0, 34.0, 28.0, 8.0, 9.5, 10.5, 6.0, 7.0),
  ('33333333-3333-3333-3333-333333333333', 'Sofia D''Souza — Blouse',
   15.5, 15.0, 38.0, 32.0, 9.0, 10.0, 11.5, 7.0, 8.0),
  ('44444444-4444-4444-4444-444444444444', 'Divya Menon — Blouse',
   14.0, 13.5, 33.0, 27.0, 7.5, 9.0, 10.0, 5.5, 6.5);

insert into customers
  (id, customer_name, email, phone, avatar_url, measurement_id, special_notes)
values
  ('a1111111-1111-1111-1111-111111111111', 'Amara Nair',
   'amara.nair@gmail.com', '+91 98200 11223',
   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&q=80',
   '11111111-1111-1111-1111-111111111111',
   'Bride-to-be. Prefers breathable cottons for daily wear.'),
  ('a2222222-2222-2222-2222-222222222222', 'Meera Krishnan',
   'meera.k@gmail.com', '+91 98111 33445',
   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80',
   '22222222-2222-2222-2222-222222222222',
   'Likes contrast piping on blouses.'),
  ('a3333333-3333-3333-3333-333333333333', 'Sofia D''Souza',
   'sofia.dsouza@gmail.com', '+91 97690 55667',
   'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&q=80',
   '33333333-3333-3333-3333-333333333333',
   'Needs extra margin in all blouses for future alterations.'),
  ('a4444444-4444-4444-4444-444444444444', 'Divya Menon',
   'divya.menon@gmail.com', '+91 98840 77889',
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
   '44444444-4444-4444-4444-444444444444',
   'Prefers deep back necks with tassel dori.');

-- 3. Products ----------------------------------------------------------------
insert into products
  (id, name, sku, category, subcategory, price, stock, image_url, material, featured)
values
  ('b1111111-1111-1111-1111-111111111111', 'Everyday Plain Cotton Blouse',
   'VAR-BLS-001', 'Blouses', 'Plain', 45, 20,
   'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
   '100% Mulmul Cotton', true),
  ('b2222222-2222-2222-2222-222222222222', 'Bridal Zari Work Blouse',
   'VAR-BLS-002', 'Blouses', 'Work', 180, 6,
   'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
   'Raw Silk with Gold Zari', true),
  ('b3333333-3333-3333-3333-333333333333', 'Kanjeevaram Silk Saree',
   'VAR-SAR-001', 'Sarees', '', 320, 4,
   'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
   'Pure Mulberry Silk', true),
  ('b4444444-4444-4444-4444-444444444444', 'Georgette Party Frock',
   'VAR-FRK-001', 'Frocks', '', 150, 8,
   'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
   'Floral Georgette with Lining', false),
  ('b5555555-5555-5555-5555-555555555555', 'Mirror Work Blouse',
   'VAR-BLS-003', 'Blouses', 'Work', 120, 10,
   'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80',
   'Cotton Silk with Mirror Work', false);

-- 4. Orders ------------------------------------------------------------------
insert into orders
  (id, order_number, customer_id, item_summary, total, currency,
   status, priority, delivery_date, notes, created_at)
values
  ('c1111111-1111-1111-1111-111111111111', 'VAR-8901',
   'a1111111-1111-1111-1111-111111111111',
   'Bridal Zari Work Blouse (Elbow Sleeve)', 180, 'USD',
   'active', 'high', '2026-10-12', 'Bride fitting on Oct 5. Sleeve confirmed elbow length.',
   '2026-09-28T10:00:00Z'),
  ('c2222222-2222-2222-2222-222222222222', 'VAR-8902',
   'a2222222-2222-2222-2222-222222222222',
   'Kanjeevaram Silk Saree + Fall & Pico', 340, 'USD',
   'new', 'medium', '2026-10-18', 'Contrast blouse piping in maroon.',
   '2026-10-01T14:30:00Z'),
  ('c3333333-3333-3333-3333-333333333333', 'VAR-8903',
   'a3333333-3333-3333-3333-333333333333',
   'Georgette Party Frock', 150, 'USD',
   'hold', 'low', '2026-10-20', 'On hold — waiting on lining fabric arrival.',
   '2026-09-29T09:15:00Z'),
  ('c4444444-4444-4444-4444-444444444444', 'VAR-8904',
   'a4444444-4444-4444-4444-444444444444',
   'Everyday Plain Cotton Blouse × 2', 90, 'USD',
   'dispatched', 'medium', '2026-10-04', 'Both blouses with tassel dori.',
   '2026-09-26T11:45:00Z'),
  ('c5555555-5555-5555-5555-555555555555', 'VAR-8905',
   'a1111111-1111-1111-1111-111111111111',
   'Mirror Work Blouse', 120, 'USD',
   'delivered', 'high', '2026-09-30', 'Delivered. Client loved the fit.',
   '2026-09-20T10:00:00Z'),
  ('c6666666-6666-6666-6666-666666666666', 'VAR-8906',
   'a2222222-2222-2222-2222-222222222222',
   'Everyday Plain Cotton Blouse', 45, 'USD',
   'delivered', 'low', '2026-09-25', '',
   '2026-09-18T15:00:00Z');

-- 5. Timelines ---------------------------------------------------------------
insert into order_timeline_events
  (order_id, position, title, description, display_time, state)
values
  ('c1111111-1111-1111-1111-111111111111', 0, 'Order Placed',
   'Bridal Zari Work Blouse commissioned.', 'Sep 28, 2026 · 10:00 AM', 'completed'),
  ('c1111111-1111-1111-1111-111111111111', 1, 'Active',
   'Cutting done. Zari panels being attached.', 'Oct 1, 2026', 'current'),
  ('c1111111-1111-1111-1111-111111111111', 2, 'Dispatched', 'Scheduled', 'upcoming'),
  ('c1111111-1111-1111-1111-111111111111', 3, 'Delivered', 'Target: Oct 12, 2026', 'upcoming'),
  ('c2222222-2222-2222-2222-222222222222', 0, 'Order Placed',
   'Kanjeevaram saree + fall/pico work.', 'Oct 1, 2026 · 2:30 PM', 'completed'),
  ('c2222222-2222-2222-2222-222222222222', 1, 'Active', 'Scheduled', 'upcoming'),
  ('c2222222-2222-2222-2222-222222222222', 2, 'Dispatched', 'Scheduled', 'upcoming'),
  ('c2222222-2222-2222-2222-222222222222', 3, 'Delivered', 'Target: Oct 18, 2026', 'upcoming'),
  ('c3333333-3333-3333-3333-333333333333', 0, 'Order Placed',
   'Georgette frock commissioned.', 'Sep 29, 2026 · 9:15 AM', 'completed'),
  ('c3333333-3333-3333-3333-333333333333', 1, 'Active', 'Scheduled', 'upcoming'),
  ('c3333333-3333-3333-3333-333333333333', 2, 'Hold',
   'Paused — lining fabric awaited.', 'Sep 30, 2026', 'current'),
  ('c4444444-4444-4444-4444-444444444444', 0, 'Order Placed',
   'Two plain cotton blouses.', 'Sep 26, 2026 · 11:45 AM', 'completed'),
  ('c4444444-4444-4444-4444-444444444444', 1, 'Active', 'Sep 28, 2026', 'completed'),
  ('c4444444-4444-4444-4444-444444444444', 2, 'Dispatched',
   'Handed to BlueDart — BLDT-551201.', 'Oct 2, 2026', 'current'),
  ('c4444444-4444-4444-4444-444444444444', 3, 'Delivered', 'Target: Oct 4, 2026', 'upcoming'),
  ('c5555555-5555-5555-5555-555555555555', 0, 'Order Placed',
   'Mirror work blouse.', 'Sep 20, 2026 · 10:00 AM', 'completed'),
  ('c5555555-5555-5555-5555-555555555555', 1, 'Active', 'Sep 22, 2026', 'completed'),
  ('c5555555-5555-5555-5555-555555555555', 2, 'Dispatched', 'Sep 28, 2026', 'completed'),
  ('c5555555-5555-5555-5555-555555555555', 3, 'Delivered',
   'Signed and confirmed.', 'Sep 30, 2026', 'completed'),
  ('c6666666-6666-6666-6666-666666666666', 0, 'Order Placed',
   'Plain cotton blouse.', 'Sep 18, 2026 · 3:00 PM', 'completed'),
  ('c6666666-6666-6666-6666-666666666666', 1, 'Active', 'Sep 20, 2026', 'completed'),
  ('c6666666-6666-6666-6666-666666666666', 2, 'Dispatched', 'Sep 23, 2026', 'completed'),
  ('c6666666-6666-6666-6666-666666666666', 3, 'Delivered', 'Sep 25, 2026', 'completed');

-- 6. Photos & documents ------------------------------------------------------
insert into order_photos (order_id, url, caption, uploaded_at)
values
  ('c1111111-1111-1111-1111-111111111111',
   'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80',
   'Zari panel selection', '2026-09-29T10:00:00Z'),
  ('c5555555-5555-5555-5555-555555555555',
   'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80',
   'Finished mirror work blouse', '2026-09-28T10:00:00Z');

insert into order_documents (order_id, name, kind, size_text, url, uploaded_at)
values
  ('c1111111-1111-1111-1111-111111111111',
   'Invoice_VAR-8901.pdf', 'invoice', '245 KB', '#', '2026-09-28T10:00:00Z'),
  ('c2222222-2222-2222-2222-222222222222',
   'Invoice_VAR-8902.pdf', 'invoice', '198 KB', '#', '2026-10-01T14:30:00Z');

-- 7. Transactions -------------------------------------------------------------
insert into transactions
  (customer_id, order_id, amount, currency, payment_mode, payment_ref,
   occurred_at, created_at)
values
  ('a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111',
   180, 'USD', 'upi', 'UPI-2026-8901-A', '2026-09-28T10:00:00Z', '2026-09-28T10:00:00Z'),
  ('a2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222',
   340, 'USD', 'bank_transfer', 'BT-2026-8902-A', '2026-10-01T14:30:00Z', '2026-10-01T14:30:00Z'),
  ('a3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333',
   150, 'USD', 'credit_card', 'CC-2026-8903-A', '2026-09-29T09:15:00Z', '2026-09-29T09:15:00Z'),
  ('a4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444',
   90, 'USD', 'cash', 'CASH-2026-8904-A', '2026-09-26T11:45:00Z', '2026-09-26T11:45:00Z'),
  ('a1111111-1111-1111-1111-111111111111', 'c5555555-5555-5555-5555-555555555555',
   120, 'USD', 'upi', 'UPI-2026-8905-A', '2026-09-20T10:00:00Z', '2026-09-20T10:00:00Z'),
  ('a2222222-2222-2222-2222-222222222222', 'c6666666-6666-6666-6666-666666666666',
   45, 'USD', 'debit_card', 'DC-2026-8906-A', '2026-09-18T15:00:00Z', '2026-09-18T15:00:00Z');

-- 8. Shipments ----------------------------------------------------------------
insert into shipments
  (id, tracking_number, carrier, destination_city, recipient_name,
   order_id, status, estimated_delivery)
values
  ('d1111111-1111-1111-1111-111111111111', 'BLDT-551201', 'BlueDart',
   'Bengaluru, India', 'Divya Menon',
   'c4444444-4444-4444-4444-444444444444', 'in_transit', 'Oct 4, 2026'),
  ('d2222222-2222-2222-2222-222222222222', 'DHL-EXP-773310', 'DHL Express',
   'Mumbai, India', 'Amara Nair',
   'c5555555-5555-5555-5555-555555555555', 'delivered', 'Sep 30, 2026');

insert into shipment_milestones (shipment_id, position, status_text, location, time_text)
values
  ('d1111111-1111-1111-1111-111111111111', 0, 'Handed over to Courier', 'Varnika Studio Vault', 'Oct 2 18:30'),
  ('d1111111-1111-1111-1111-111111111111', 1, 'Arrived at Sorting Facility', 'Bengaluru Hub', 'Oct 3 09:15'),
  ('d2222222-2222-2222-2222-222222222222', 0, 'Handed over to Courier', 'Varnika Studio Vault', 'Sep 28 17:00'),
  ('d2222222-2222-2222-2222-222222222222', 1, 'Delivered', 'Mumbai — Signed', 'Sep 30 12:40');

-- 9. Tickets (history only — no UI) -------------------------------------------
insert into tickets
  (ticket_number, customer_id, order_id, subject, status, assigned_to, last_message, created_at)
values
  ('TCK-910', 'a1111111-1111-1111-1111-111111111111',
   'c1111111-1111-1111-1111-111111111111',
   'Sleeve length confirmation for VAR-8901', 'open', 'Master Tailor Anand',
   'Client confirmed elbow-length sleeves on call.', '2026-10-02T09:00:00Z'),
  ('TCK-911', 'a4444444-4444-4444-4444-444444444444', null,
   'Tassel dori color choice', 'resolved', 'Concierge',
   'Client picked gold dori. Closed.', '2026-09-27T16:00:00Z');

-- 10. Chat --------------------------------------------------------------------
insert into conversations (id, customer_id, order_id, subject, status, created_at, last_message_at)
values
  ('e1111111-1111-1111-1111-111111111111',
   'a1111111-1111-1111-1111-111111111111',
   'c1111111-1111-1111-1111-111111111111',
   'Sleeve length — VAR-8901', 'open',
   '2026-10-01T10:00:00Z', '2026-10-01T11:20:00Z'),
  ('e2222222-2222-2222-2222-222222222222',
   'a2222222-2222-2222-2222-222222222222',
   null, 'Saree fall question', 'open',
   '2026-10-02T09:00:00Z', '2026-10-02T09:30:00Z');

insert into chat_messages (id, conversation_id, sender, sender_name, body, created_at)
values
  ('f1111111-1111-1111-1111-111111111111',
   'e1111111-1111-1111-1111-111111111111',
   'customer', 'Amara Nair', 'Hi! Can the sleeve be elbow length instead of full?',
   '2026-10-01T10:00:00Z'),
  ('f2222222-2222-2222-2222-222222222222',
   'e1111111-1111-1111-1111-111111111111',
   'staff', 'Sujatha', 'Yes! Noted elbow-length sleeves. Sharing the zari panel options here.',
   '2026-10-01T11:20:00Z'),
  ('f3333333-3333-3333-3333-333333333333',
   'e2222222-2222-2222-2222-222222222222',
   'customer', 'Meera Krishnan', 'Do you also stitch saree falls?',
   '2026-10-02T09:00:00Z'),
  ('f4444444-4444-4444-4444-444444444444',
   'e2222222-2222-2222-2222-222222222222',
   'staff', 'Sujatha', 'Yes we do — cotton and contrast piping available.',
   '2026-10-02T09:30:00Z');

-- Attachment linked to VAR-8901: the fan-out trigger copies it to order_photos
insert into chat_attachments
  (conversation_id, message_id, order_id, kind, url, name, size_text, created_at)
values
  ('e1111111-1111-1111-1111-111111111111',
   'f2222222-2222-2222-2222-222222222222',
   'c1111111-1111-1111-1111-111111111111',
   'photo',
   'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80',
   'Zari panel options', '320 KB', '2026-10-01T11:20:00Z');

-- 11. Activity backfill --------------------------------------------------------
insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label,
   customer_id, customer_name, created_at)
select 'System', 'added', 'customer', id, customer_name,
  id, customer_name, created_at
from customers;

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label,
   customer_id, customer_name, order_id, order_number, created_at)
select 'System', 'added', 'order', o.id, o.order_number,
  o.customer_id, coalesce(c.customer_name, ''), o.id, o.order_number, o.created_at
from orders o
left join customers c on c.id = o.customer_id;

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label, detail,
   customer_id, customer_name, order_id, order_number, created_at)
select 'System', 'added', 'transaction', t.id, t.payment_ref,
  t.currency || ' ' || t.amount || ' via ' || replace(t.payment_mode::text, '_', ' '),
  t.customer_id, coalesce(c.customer_name, ''), t.order_id, coalesce(o.order_number, ''), t.occurred_at
from transactions t
left join customers c on c.id = t.customer_id
left join orders o on o.id = t.order_id;

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label,
   customer_id, customer_name, order_id, order_number, created_at)
select 'System', 'added', 'shipment', s.id, s.tracking_number,
  o.customer_id, coalesce(c.customer_name, ''), s.order_id, coalesce(o.order_number, ''), s.created_at
from shipments s
left join orders o on o.id = s.order_id
left join customers c on c.id = o.customer_id;

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label, created_at)
select 'System', 'added', 'product', id, name, created_at
from products;

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label,
   customer_id, customer_name, order_id, order_number, created_at)
select coalesce(c.customer_name, 'Website'), 'raised', 'ticket', t.id, t.ticket_number,
  t.customer_id, coalesce(c.customer_name, ''), t.order_id, coalesce(o.order_number, ''), t.created_at
from tickets t
left join customers c on c.id = t.customer_id
left join orders o on o.id = t.order_id;

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label,
   customer_id, customer_name, order_id, order_number, created_at)
select coalesce(c.customer_name, 'System'), 'added', 'conversation', v.id,
  coalesce(nullif(v.subject, ''), 'Chat'),
  v.customer_id, coalesce(c.customer_name, ''), v.order_id, coalesce(o.order_number, ''), v.created_at
from conversations v
left join customers c on c.id = v.customer_id
left join orders o on o.id = v.order_id;
