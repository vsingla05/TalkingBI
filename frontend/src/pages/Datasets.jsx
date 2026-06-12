import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/client";

export default function Datasets() {
  const [uploads, setUploads] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/list-datasets");
      setActive(res.data.active_dataset);
      setUploads(res.data.uploads || []);
    } catch (err) {
      console.warn("Failed to load uploads", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen flex bg-[#090a0f] text-[#e2e8f0] font-sans selection:bg-[#7b5fed] selection:text-white">
      <Sidebar />
      <main className="flex-1 py-10 px-8 lg:px-12 max-w-[1400px] mx-auto overflow-y-auto">
        
        {/* Header Section */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Datasets</h1>
            <p className="text-[#8a94a6] text-sm font-medium">Upload, manage, and inspect your data sources.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={load} 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#12161f] border border-[#232a3b] text-sm font-semibold text-[#a0aabf] hover:bg-[#1a1f2b] hover:text-white transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
            <label className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#7b5fed] to-[#9d7aff] text-white text-sm font-semibold cursor-pointer hover:shadow-lg hover:shadow-[#7b5fed]/20 transition-all">
              <input 
                type="file" 
                accept=".csv" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if(!file) return;
                  const fd = new FormData(); 
                  fd.append('file', file);
                  setLoading(true);
                  try { 
                    await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); 
                    await load(); 
                  } catch(e){ 
                    alert('Upload failed'); 
                  } finally { 
                    setLoading(false); 
                    e.target.value = ''; 
                  }
                }} 
                className="hidden" 
              />
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload CSV
            </label>
          </div>
        </div>

        {/* Active Dataset Block */}
        <div className="bg-[#10131a] rounded-2xl border border-[#232a3b] p-7 mb-8 shadow-xl shadow-black/20">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-sm font-bold text-[#68738a] uppercase tracking-wider">Dataset Context</h2>
            <span className="flex items-center gap-1.5 bg-[#0f271d] text-[#2ecc71] text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#183b2a]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] animate-pulse"></span>
              ACTIVE
            </span>
          </div>
          <div className="bg-[#090b0f] flex items-center gap-4 p-4 rounded-xl border border-[#1b212e]">
            <div className="p-2 bg-[#141822] rounded-lg text-[#2ecc71]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-mono text-[#cbd5e1] break-all">
                {active || "No active dataset selected. Upload or select a file below to begin."}
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded Files List */}
        <div className="bg-[#10131a] rounded-2xl border border-[#232a3b] overflow-hidden shadow-xl shadow-black/20 mb-8">
          <div className="px-7 py-5 border-b border-[#232a3b] bg-[#12161f]/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Available Files</h2>
            <span className="bg-[#1b212e] text-[#8a94a6] text-xs font-semibold px-2.5 py-1 rounded-md">
              {uploads.length} File{uploads.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="p-0">
            {loading && <div className="p-8 text-center text-sm font-medium text-[#8a94a6] animate-pulse">Synchronizing datasets...</div>}
            {!loading && uploads.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-[#161a24] flex items-center justify-center text-[#3c465a]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                </div>
                <p className="text-[#8a94a6] text-sm">No datasets uploaded yet.</p>
              </div>
            )}
            
            <ul className="divide-y divide-[#1e2433]">
              {uploads.map((f) => (
                <li key={f.name} className="px-7 py-4 flex items-center justify-between hover:bg-[#151924] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#1c2230] p-3 rounded-xl text-[#7b5fed] group-hover:bg-[#7b5fed]/10 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#e2e8f0] mb-0.5">{f.name}</h4>
                      <div className="flex items-center gap-2 text-xs font-medium text-[#68738a]">
                        <span>{(f.size/1024).toFixed(1)} KB</span>
                        <span className="w-1 h-1 rounded-full bg-[#3c465a]"></span>
                        <span>CSV Document</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { window.open(`${api.defaults.baseURL}/download?filename=${encodeURIComponent(f.name)}`, '_blank'); }}
                      className="px-3 py-1.5 rounded-md bg-transparent hover:bg-[#1e2433] text-[#a0aabf] hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download
                    </button>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(f.uri); alert('Dataset URI copied'); }}
                      className="px-3 py-1.5 rounded-md bg-[#1e2433] hover:bg-[#283144] text-[#a0aabf] hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      Copy URI
                    </button>
                    <button 
                      onClick={async () => {
                        setPreviewLoading(true);
                        try {
                          const res = await api.get(`/preview?filename=${encodeURIComponent(f.name)}&rows=50`);
                          setPreview(res.data);
                        } catch (err) { 
                          alert('Preview failed'); 
                        } finally { 
                          setPreviewLoading(false); 
                        }
                      }}
                      className="px-4 py-1.5 rounded-md bg-[#7b5fed]/10 hover:bg-[#7b5fed]/20 border border-[#7b5fed]/30 text-[#b599ff] text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      {previewLoading ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Loading
                        </span>
                      ) : 'Preview'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Preview Table */}
        {preview && (
          <div className="bg-[#10131a] rounded-2xl border border-[#232a3b] overflow-hidden shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-7 py-5 border-b border-[#232a3b] bg-[#12161f]/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">Data Preview</h3>
                <span className="bg-[#1b212e] text-[#8a94a6] text-xs font-semibold px-2.5 py-1 rounded-md">
                  First {preview.rows_returned} Rows
                </span>
              </div>
              <button 
                onClick={() => setPreview(null)}
                className="text-[#68738a] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-sm border-collapse whitespace-nowrap">
                <thead className="bg-[#0b0d12] sticky top-0 z-10 shadow-sm shadow-black/50">
                  <tr>
                    {preview.columns.map((c) => (
                      <th key={c} className="px-6 py-4 text-left text-[11px] font-bold text-[#68738a] uppercase tracking-wider border-b border-[#1e2433]">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181d29]">
                  {preview.rows.map((r, i) => (
                    <tr key={i} className="hover:bg-[#141822] transition-colors bg-[#0f121a]">
                      {preview.columns.map((c) => (
                        <td key={c} className="px-6 py-3 text-xs font-medium text-[#cbd5e1]">
                          {String(r[c] ?? "-")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Global styles for custom scrollbar (you can move this to your index.css) */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0b0d12;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #232a3b;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3c465a;
        }
      `}} />
    </div>
  );
}