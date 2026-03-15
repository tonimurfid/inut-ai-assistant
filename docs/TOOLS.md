# TOOLS.md — Inut Built-in Tools Reference

## Todo Tools

### `addTodoTool`
Tambah tugas baru.
- Trigger: "todo:", "tambahin", "catat tugas", "jangan lupa"
- Input: task (string)
- Contoh: "todo: kerjain assignment ML"

### `completeTodoTool`
Tandai tugas selesai.
- Trigger: "selesai", "done", "udah beres", "kelar"
- Input: id (number)
- Contoh: "selesai no 2" / "done todo #3"

### `listTodoTool`
Tampilkan semua todo pending.
- Trigger: "todo apa aja", "list tugas", "apa yang belum selesai"
- Output: list todo + id

---

## Expense Tools

### `addExpenseTool`
Catat pengeluaran.
- Trigger: "beli", "bayar", "keluar duit", "habis"
- Input: amount, category, note (optional)
- Kategori: food, transport, shopping, health, other
- Contoh: "beli makan 35rb" / "bayar ojol 15ribu"

### `expenseSummaryTool`
Ringkasan pengeluaran minggu ini.
- Trigger: "rekap", "summary", "udah abis berapa", "pengeluaran minggu ini"
- Output: breakdown per kategori + total

---

## Idea Tools

### `addIdeaTool`
Simpan ide.
- Trigger: "ide:", "tiba-tiba kepikiran", "bagaimana kalau", "what if"
- Input: content, tags (optional)
- Contoh: "ide: bikin chrome extension buat block sosmed"

---

## Deadline Tools

### `addDeadlineTool`
Tambah deadline.
- Trigger: "deadline", "due", "harus selesai", "ingetin", "besok ada"
- Input: title, due_date (YYYY-MM-DD HH:MM)
- Contoh: "deadline laporan magang Jumat jam 5 sore"

### `listDeadlineTool`
Tampilkan deadline mendatang.
- Trigger: "deadline apa aja", "jadwal", "yang mau due"
- Output: list deadline + tanggal

---

## Notes
- Semua data tersimpan lokal di SQLite
- Inut tidak punya akses ke file, kamera, atau kontak
- Data hanya bisa diakses oleh Toni