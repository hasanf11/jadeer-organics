-- Removes everything added by add-demo-data.sql (and nothing else).
begin;
delete from public.orders where customer_phone like '+1202555%';
delete from public.reviews where author_name like '%(demo)';
delete from public.contact_messages where name like '%(demo)';
delete from public.stock_alerts where phone like '+1202555%';
delete from public.checkout_leads where phone like '+1202555%';
delete from public.newsletter_subscribers where email like '%.demo@example.com';
-- Order numbers start again after the last real order.
select setval('public.order_number_seq', coalesce((select max(order_number) from public.orders), 1000));
commit;
