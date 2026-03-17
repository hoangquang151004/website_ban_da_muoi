# TASK 018 - Thay Hardcode UI bang API That

## Phase

phase5

## Muc tieu

Trang Admin Data hien thi danh sach source tu backend.

## Cong viec can lam

1. Thay du lieu mock trong table.
2. Render paging filter status neu co.
3. Xu ly loading empty error state.

## Dau ra mong doi

UI admin data doc du lieu that.

## DoD

- [x] Khong con hardcode danh sach source.
- [x] State loading error empty hien dung.
- [x] Khong loi hydration neu co store client.

## Ket qua thuc hien

- Da bo du lieu mock tren trang frontend/src/app/admin/data/page.tsx va chuyen sang goi adminDataService.listDataSources.
- Da them filter theo status, pagination (page/limit) va tim kiem theo tu khoa tren du lieu trang hien tai.
- Da xu ly day du state loading, empty, error va nut thu lai.
- Trang la client component, khong doc localStorage/store de render SSR nen khong phat sinh hydration mismatch.
