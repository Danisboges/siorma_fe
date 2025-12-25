import Image from "next/image";

export default function CardPendaftaran({
  tags = [],
  title,
  subtitle,
  deadline,
  lowongan,
  image,
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#e0d6d3] shadow-sm flex flex-col h-[620px] md:h-[660px] lg:h-[700px]">
      {/* IMAGE */}
      {image ? (
        <div className="relative w-full aspect-[16/9] mb-4 overflow-hidden rounded-xl border border-[#e0d6d3] bg-gray-100">
          <Image
            src={image}
            alt={title || "Postingan"}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ) : null}

      {/* TAGS */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, i) => (
          <span
            key={i}
            className={`
              text-xs px-3 py-1 rounded-full border 
              ${tag === "BUKA" ? "bg-green-100 text-green-700 border-green-200" : ""}
              ${tag === "Segera ditutup" ? "bg-red-100 text-red-700 border-red-200" : ""}
              ${tag === "Organisasi" ? "bg-red-600 text-white border-red-600" : ""}
              ${tag === "LAB" ? "bg-red-700 text-white border-red-700" : ""}
              ${tag === "Teknologi" ? "bg-gray-100 text-gray-700 border-gray-200" : ""}
              ${tag === "Sosial" ? "bg-gray-100 text-gray-700 border-gray-200" : ""}
            `}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* TITLE */}
      <h3 className="font-semibold text-lg text-[#2d1b18] mb-2">
        {title}
      </h3>

      {/* DESCRIPTION (format aman + scroll internal) */}
      <div className="flex-1 overflow-y-auto pr-2 text-sm text-[#6b4a45]">
        <p className="whitespace-pre-wrap break-words">
          {subtitle}
        </p>
      </div>

      {/* BUTTON */}
      <button className="bg-[#D54133] w-full py-2 rounded-lg text-white font-semibold hover:bg-[#c23a2d] transition mt-4">
        Daftar sekarang
      </button>
    </div>
  );
}
