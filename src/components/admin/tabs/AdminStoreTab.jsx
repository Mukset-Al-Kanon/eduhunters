import React, { useState } from 'react';
import { FileText, Plus, Trash2, X } from 'lucide-react';

export default function AdminStoreTab({
  storeProducts,
  setStoreProducts,
  persistAll,
  triggerToast
}) {
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: 'E-book',
    price: 299,
    regularPrice: 599,
    cover: 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp',
    description: 'Exclusive digital study material.'
  });

  const handleAddStoreProduct = (e) => {
    e.preventDefault();
    if (!newProduct.title) return;
    const item = {
      id: Date.now(),
      ...newProduct,
      price: Number(newProduct.price) || 0,
      regularPrice: Number(newProduct.regularPrice) || (Number(newProduct.price) * 2)
    };
    const updated = [item, ...storeProducts];
    setStoreProducts(updated);
    persistAll({ storeProducts: updated });
    setNewProduct({
      title: '',
      category: 'E-book',
      price: 299,
      regularPrice: 599,
      cover: 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp',
      description: 'Exclusive digital study material.'
    });
    setShowAddStoreModal(false);
    triggerToast('📖 Book/PDF added to store!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            Book & PDF Store Directory ({storeProducts.length})
          </h2>
          <p className="text-xs text-slate-500">
            Manage store e-books, study guides, prices, and cover images.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddStoreModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Add New Book/PDF
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {storeProducts.map((prod, idx) => (
          <div key={prod.id || idx} className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-3 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                <img src={prod.cover} alt={prod.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold block mb-1">Book Title</label>
                <input
                  type="text"
                  value={prod.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = storeProducts.map((p, i) => i === idx ? { ...p, title: val } : p);
                    setStoreProducts(updated);
                    persistAll({ storeProducts: updated });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">Price (৳)</label>
                  <input
                    type="number"
                    value={prod.price}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      const updated = storeProducts.map((p, i) => i === idx ? { ...p, price: val } : p);
                      setStoreProducts(updated);
                      persistAll({ storeProducts: updated });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-600 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">Category</label>
                  <input
                    type="text"
                    value={prod.category}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = storeProducts.map((p, i) => i === idx ? { ...p, category: val } : p);
                      setStoreProducts(updated);
                      persistAll({ storeProducts: updated });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete store product?`)) {
                    const updated = storeProducts.filter((_, i) => i !== idx);
                    setStoreProducts(updated);
                    persistAll({ storeProducts: updated });
                    triggerToast('Product deleted!');
                  }
                }}
                className="text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Store Product */}
      {showAddStoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Book or PDF Resource</h3>
                  <p className="text-[11px] text-slate-500">Publish new book or digital PDF download</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStoreModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStoreProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Book or Document Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HSC Physics Formula Sheet"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Selling Price (৳)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  >
                    <option value="E-book">E-book (PDF)</option>
                    <option value="Book">Printed Book</option>
                    <option value="Stationery">Stationery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cover Image Link</label>
                <input
                  type="text"
                  value={newProduct.cover}
                  onChange={(e) => setNewProduct({ ...newProduct, cover: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStoreModal(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
                >
                  Add to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
