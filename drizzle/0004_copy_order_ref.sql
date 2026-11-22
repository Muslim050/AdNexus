-- Номер заказа переезжает в «Рекламную кампанию».
UPDATE "bookings" SET "campaign_name" = "order_ref" WHERE "campaign_name" = '' AND "order_ref" <> '';
