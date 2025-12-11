// src/components/ui/pagination.jsx
"use client";

export function Pagination({ currentPage, totalPages, onPageChange }) {
  // kalau cuma 0 atau 1 halaman, tidak perlu tampilkan pagination
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    if (typeof onPageChange === "function") {
      onPageChange(page);
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className="flex items-center justify-end gap-1"
    >
      {/* Tombol Previous */}
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm border rounded disabled:opacity-50 bg-white"
      >
        Prev
      </button>

      {/* Nomor halaman */}
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => goToPage(page)}
          className={
            "px-3 py-1 text-sm border rounded " +
            (page === currentPage
              ? "bg-[#f7b5b5] text-[#5b1a1a] font-semibold"
              : "bg-white text-gray-700")
          }
        >
          {page}
        </button>
      ))}

      {/* Tombol Next */}
      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-sm border rounded disabled:opacity-50 bg-white"
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;
