import React, { useState } from 'react';

interface EscalatePickupModalProps {
  manifestId: string;
  onClose: () => void;
  onSubmit: (remarks: string, file: File | null) => Promise<void>;
}

export const EscalatePickupModal: React.FC<EscalatePickupModalProps> = ({
  manifestId,
  onClose,
  onSubmit,
}) => {
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(remarks, file);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-gray-900">Escalate Pickup Request</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <path d="M5 15l10-10M5 5l10 10" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="remarks" className="text-sm text-gray-700">Remarks (Optional)</label>
            <textarea
              id="remarks"
              className="w-full min-h-[100px] p-2.5 text-sm border border-gray-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y"
              placeholder="Enter Remark"
              value={remarks}
              maxLength={300}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <div className="text-[11px] text-gray-400 mt-0.5">
              {300 - remarks.length} / 300 Character(s) Remaining
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm text-gray-700">Attachments (if any)</label>
            <div className="relative border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors group cursor-pointer">
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.csv"
              />
              <span className="text-sm text-gray-500">
                {file ? file.name : "Drop files here or click to upload"}
              </span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Maximum file size: 5 MB</div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              disabled={isSubmitting}
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-[#1a190f] hover:bg-black rounded transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
