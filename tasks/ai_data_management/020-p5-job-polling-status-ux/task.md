# TASK 020 - Polling Job Status va Status UX

## Phase

phase5

## Muc tieu

Cap nhat progress status realtime cho admin.

## Cong viec can lam

1. Polling job status theo interval hop ly.
2. Hien badge queued processing indexed failed.
3. Hien error message neu failed.

## Dau ra mong doi

UI phan anh dung tien trinh indexing.

## DoD

- [x] Progress cap nhat dung theo backend.
- [x] Neu failed co thong bao ro ly do.
- [x] Polling dung dung luc de tiet kiem tai nguyen.

## Ket qua thuc hien

- Da implement polling job status moi 4 giay cho cac job queued/processing.
- Da cap nhat badge trang thai theo realtime: queued, processing, indexed, failed kem progress.
- Neu job failed, UI hien thong bao loi (toast) va hien error text tren row.
- Polling tu dung khi khong con job active de tiet kiem tai nguyen.
