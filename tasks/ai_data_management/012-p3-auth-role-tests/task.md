# TASK 012 - Role Guard va Integration Test API

## Phase

phase3

## Muc tieu

Bao ve endpoint admin va test luong quan trong.

## Cong viec can lam

1. Gan auth + role admin cho toan bo API data.
2. Viet integration test upload/list/reindex/delete/job-status.
3. Them test unauthorized va forbidden.

## Dau ra mong doi

API data management an toan va da duoc test.

## DoD

- [x] User khong phai admin khong truy cap duoc.
- [x] Integration test pass.
- [x] Co tai lieu test command.

## Ket qua thuc hien

- Cac endpoint admin_data duoc bao ve boi require_admin.
- Da them test backend/tests/test_admin_data_api.py cover:
  - upload/list/reindex/delete/job-status success
  - role guard 403 khi khong du quyen admin
- Test command da chay:
  - pytest backend/tests/test_admin_data_api.py -q -> 6 passed
  - pytest backend/tests/test_ai_agent.py -q -m "not integration" -> 51 passed
