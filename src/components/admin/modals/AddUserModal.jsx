import React from 'react';

export default function AddUserModal({
  isOpen,
  onClose,
  editingUserId,
  userForm,
  setUserForm,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {editingUserId ? 'Edit User Profile' : 'Register New User'}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {editingUserId ? 'Modify user credentials, permissions, and batch' : 'Create an administrative or student account directly'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer border-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input 
              type="text"
              required
              placeholder="e.g. Tanvir Hasan"
              value={userForm.name}
              onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input 
                type="email"
                required
                placeholder="student@eduhunters.com"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Contact Number</label>
              <input 
                type="text"
                placeholder="e.g. 01700-000000"
                value={userForm.phone}
                onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value, whatsapp: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College / Institution</label>
              <input 
                type="text"
                placeholder="e.g. Dhaka College / Notre Dame College"
                value={userForm.college || ''}
                onChange={(e) => setUserForm(prev => ({ ...prev, college: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">HSC Batch</label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  {['HSC 25', 'HSC 26', 'HSC 27', 'HSC 28'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setUserForm(prev => ({ ...prev, batch: b }))}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                        userForm.batch === b
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <input 
                  type="text"
                  placeholder="e.g. HSC 26"
                  value={userForm.batch}
                  onChange={(e) => setUserForm(prev => ({ ...prev, batch: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
              >
                <option value="Student">Student</option>
                <option value="Instructor">Instructor</option>
                <option value="Moderator">Moderator</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
              <select
                value={userForm.status}
                onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Paid (৳)</label>
              <input
                type="number"
                placeholder="e.g. 499"
                value={userForm.totalSpent !== undefined ? userForm.totalSpent : ''}
                onChange={(e) => setUserForm(prev => ({ ...prev, totalSpent: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-emerald-600 outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none"
            >
              {editingUserId ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
