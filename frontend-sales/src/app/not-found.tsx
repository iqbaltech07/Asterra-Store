import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-[#121A2A] flex flex-col font-sans">
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex items-center justify-center w-full">
        <div className="max-w-md w-full bg-white border border-[rgba(18,26,42,0.08)] rounded-3xl p-8 sm:p-10 text-center shadow-editorial space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center mx-auto text-[#C96F55]">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-[#C96F55] tracking-widest uppercase">
              Error 404
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#121A2A] tracking-tight">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 leading-relaxed">
              Tautan yang Anda tuju mungkin sudah dipindahkan, dihapus, atau tidak pernah ada di katalog Asterra Store.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-[#121A2A] hover:bg-[#1c273d] text-[#F7F5EF] rounded-xl text-xs font-bold gap-2 h-11 px-5">
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                <span>Ke Beranda</span>
              </Button>
            </Link>

            <Link href="/products" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-[rgba(18,26,42,0.18)] text-[#121A2A] hover:bg-white rounded-xl text-xs font-semibold h-11 px-5">
                <span>Katalog Produk</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
