-- Sample data seed for Indonesian Language Course app
-- Creates classes in Feb/March/April + matching bookings/payments so revenue exists.
--
-- Prereq:
-- - You must already have at least:
--   - 1 teacher user row in public.users (role = 'TEACHER')
--   - 1 student user row in public.users (role = 'STUDENT')
--
-- Run in Supabase SQL Editor.

do $$
declare
  v_teacher uuid;
  v_student uuid;
  v_year int := extract(year from now())::int;
  use_teacher_id boolean := exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'classes' and column_name = 'teacherId'
  );
  use_teacher_id_snake boolean := exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'classes' and column_name = 'teacher_id'
  );
  use_class_id boolean := exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'classId'
  );
  use_class_id_snake boolean := exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'class_id'
  );
  use_student_id boolean := exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'studentId'
  );
  use_student_id_snake boolean := exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'student_id'
  );
  c record;
  b record;
begin
  select id into v_teacher from public.users where role = 'TEACHER' order by "createdAt" asc limit 1;
  select id into v_student from public.users where role = 'STUDENT' order by "createdAt" asc limit 1;

  if v_teacher is null then
    raise exception 'No TEACHER found in public.users. Create one and set role=TEACHER first.';
  end if;
  if v_student is null then
    raise exception 'No STUDENT found in public.users. Create one and set role=STUDENT first.';
  end if;

  -- Create sample classes across Feb/March/April
  create temporary table tmp_classes (
    id uuid primary key,
    title text,
    d date,
    start_time text,
    end_time text,
    capacity int,
    price double precision
  ) on commit drop;

  insert into tmp_classes (id, title, d, start_time, end_time, capacity, price) values
    (gen_random_uuid(), 'Indonesian Basics A1', make_date(v_year, 2, 5),  '09:00', '10:00', 20, 150000),
    (gen_random_uuid(), 'Indonesian Conversation A2', make_date(v_year, 2, 19), '14:00', '15:00', 18, 200000),
    (gen_random_uuid(), 'Grammar Clinic B1', make_date(v_year, 3, 7), '10:00', '11:00', 15, 175000),
    (gen_random_uuid(), 'Pronunciation Workshop', make_date(v_year, 3, 21), '16:00', '17:00', 12, 125000),
    (gen_random_uuid(), 'Indonesian for Travel', make_date(v_year, 4, 4), '09:00', '10:00', 25, 100000),
    (gen_random_uuid(), 'Business Indonesian B2', make_date(v_year, 4, 18), '13:00', '14:00', 16, 250000);

  for c in select * from tmp_classes loop
    if use_teacher_id then
      insert into public.classes (id, title, description, subject, "startTime", "endTime", date, room, location, capacity, price, status, "teacherId")
      values (c.id, c.title, 'Sample seeded class', 'Indonesian', c.start_time, c.end_time, c.d, 'Room 101', 'Jakarta', c.capacity, c.price, 'SCHEDULED', v_teacher)
      on conflict (id) do nothing;
    elsif use_teacher_id_snake then
      execute format(
        'insert into public.classes (id, title, description, subject, "startTime", "endTime", date, room, location, capacity, price, status, teacher_id)
         values (%L, %L, %L, %L, %L, %L, %L, %L, %L, %s, %s, %L, %L)
         on conflict (id) do nothing',
        c.id, c.title, 'Sample seeded class', 'Indonesian', c.start_time, c.end_time, c.d, 'Room 101', 'Jakarta', c.capacity, c.price, 'SCHEDULED', v_teacher
      );
    else
      raise exception 'Could not find teacherId or teacher_id column on public.classes';
    end if;
  end loop;

  -- Create bookings (PENDING/CONFIRMED) + payments (COMPLETED) for revenue
  create temporary table tmp_bookings (
    id uuid primary key,
    class_id uuid,
    status booking_status
  ) on commit drop;

  insert into tmp_bookings (id, class_id, status)
  select gen_random_uuid(), id, 'CONFIRMED'::booking_status from tmp_classes;

  for b in select * from tmp_bookings loop
    if use_student_id and use_class_id then
      insert into public.bookings (id, status, "studentId", "classId")
      values (b.id, b.status, v_student, b.class_id)
      on conflict do nothing;
    else
      -- snake_case fallback
      execute format(
        'insert into public.bookings (id, status, %s, %s) values (%L, %L, %L, %L) on conflict do nothing',
        case when use_student_id_snake then 'student_id' else '"studentId"' end,
        case when use_class_id_snake then 'class_id' else '"classId"' end,
        b.id, b.status::text, v_student, b.class_id
      );
    end if;

    -- payment per booking (completed)
    insert into public.payments (id, amount, status, "paymentMethod", "transactionId", "paidAt", "userId", "bookingId")
    select gen_random_uuid(), c.price, 'COMPLETED'::payment_status, 'seed', 'seed-' || b.id::text, now(), v_student, b.id
    from tmp_classes c
    where c.id = b.class_id
    on conflict do nothing;
  end loop;
end $$;

