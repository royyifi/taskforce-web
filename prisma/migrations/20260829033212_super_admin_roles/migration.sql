-- Promosikan akun ADMIN lama menjadi SUPER_ADMIN
UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN';
