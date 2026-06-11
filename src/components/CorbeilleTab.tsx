import React, { useState } from 'react';
import { TrashItem } from '../types';
import { Trash2, RotateCcw, Search, AlertTriangle, ArrowUpDown, X } from 'lucide-react';

interface CorbeilleTabProps {
  trash: TrashItem[];
  onRestore: (item: TrashItem) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
}

export default function CorbeilleTab({ 
  trash, 
  onRestore, 
  onPermanentDelete, 
  onEmptyTrash 
}: CorbeilleTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<TrashItem | null>(null);

  // Sorting
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const typeLabels: Record<string, { label: string; color: string }> = {
    etudiant: { label: 'Étudiant', color: 'bg-indigo-50 text-indigo-700 border-indigo-150' },
    note: { label: 'Note', color: 'bg-amber-50 text-amber-700 border-amber-150' },
    cours: { label: 'Support de cours', color: 'bg-sky-50 text-sky-700 border-sky-150' },
    filiere: { label: 'Filière académique', color: 'bg-purple-50 text-purple-700 border-purple-150' },
    matiere: { label: 'Matière', color: 'bg-pink-50 text-pink-700 border-pink-150' },
    semestre: { label: 'Semestre', color: 'bg-emerald-50 text-emerald-700 border-emerald-150' },
    autorisation: { label: 'Autorisation d\'accès', color: 'bg-violet-50 text-violet-700 border-violet-150' },
    paiement: { label: 'Paiement', color: 'bg-teal-50 text-teal-700 border-teal-150' },
  };

  const filteredTrash = trash
    .filter(item => {
      const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.itemType === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.deletedAt).getTime();
      const dateB = new Date(b.deletedAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <div className="space-y-6" id="corbeille-tab-container">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            Corbeille de fichiers et d'enregistrements
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Visualisez, restaurez ou supprimez définitivement les éléments mis de côté.
          </p>
        </div>

        {trash.length > 0 && (
          <button
            onClick={() => setShowEmptyConfirm(true)}
            className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition whitespace-nowrap shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Vider la corbeille ({trash.length})
          </button>
        )}
      </div>

      {trash.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4 border border-gray-200">
            <Trash2 className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-gray-800">Votre corbeille est vide</h4>
          <p className="text-xs text-gray-500 text-center max-w-sm mt-1">
            Les éléments d'évaluation, d'inscriptions, de frais ou de cours que vous supprimez apparaîtront ici pour pouvoir être récupérés à tout moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un élément supprimé..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-250 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-150 transition font-medium"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-white border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none cursor-pointer focus:ring-1 focus:ring-blue-150 focus:border-blue-500 min-w-[160px]"
            >
              <option value="all">Tous les types ({trash.length})</option>
              {Array.from(new Set(trash.map(x => x.itemType))).map(type => (
                <option key={type} value={type}>
                  {typeLabels[type]?.label || type} (
                  {trash.filter(x => x.itemType === type).length})
                </option>
              ))}
            </select>

            {/* Sort Date Button */}
            <button
              onClick={toggleSortOrder}
              className="bg-white border border-gray-250 hover:bg-gray-50 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 flex items-center gap-1.5 transition shadow-sm leading-none shrink-0"
              title="Inverser l'ordre temporel"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              Date de suppr. : {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
            </button>
          </div>

          {/* Table list of deleted items */}
          <div className="bg-white rounded-xl border border-gray-150 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-55 text-gray-700 text-[10px] font-bold uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4">Élément / Désignation</th>
                    <th className="py-3 px-4 w-44">Type d'enregistrement</th>
                    <th className="py-3 px-4 w-44">Supprimé le</th>
                    <th className="py-3 px-4 text-right w-56">Actions de récupération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredTrash.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500 font-medium">
                        Aucun élément ne correspond à votre recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredTrash.map(item => {
                      const badge = typeLabels[item.itemType] || { label: item.itemType, color: 'bg-gray-100 text-gray-800' };
                      const deletionDate = new Date(item.deletedAt);
                      const formattedDate = deletionDate.toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <span className="block max-w-md truncate" title={item.itemName}>
                              {item.itemName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 font-medium">
                            {formattedDate}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {/* Restore button */}
                              <button
                                onClick={() => onRestore(item)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-150 text-emerald-700 hover:text-emerald-950 rounded-lg transition border border-emerald-100 flex items-center gap-1 text-[11px] font-bold"
                                title="Restaurer l'élément actif"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Restaurer
                              </button>

                              {/* Delete Forever button */}
                              <button
                                onClick={() => setDeleteConfirmItem(item)}
                                className="p-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 rounded-lg transition border border-rose-100 flex justify-center items-center gap-1 text-[11px] font-bold"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Exclure
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>



          {/* MODAL: CONFIRM EMPTY TRASH */}
          {showEmptyConfirm && (
            <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs">
              <div className="bg-white rounded-2xl border border-rose-100 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-zoom-in">
                {/* Header */}
                <div className="bg-rose-950 px-5 py-4 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-rose-100">
                      Vider la corbeille définitivement
                    </h3>
                  </div>
                  <button 
                    onClick={() => setShowEmptyConfirm(false)}
                    className="p-1 rounded-full hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 text-slate-800">
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed font-sans">
                    Vous êtes sur le point de supprimer définitivement <strong className="text-slate-900">{trash.length} élément(s)</strong> de la corbeille.
                    <span className="text-rose-600 font-bold block mt-1">
                      Cette action est irréversible et aucun de ces éléments ne pourra plus être restauré !
                    </span>
                  </p>
                </div>

                {/* Footer buttons */}
                <div className="bg-slate-50 px-5 py-3.5 border-t border-gray-150 flex gap-2 justify-end">
                  <button
                    onClick={() => setShowEmptyConfirm(false)}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-750 text-xs font-bold rounded-xl border border-gray-200 transition font-sans cursor-pointer"
                  >
                    Annuler, Conserver
                  </button>
                  <button
                    onClick={() => {
                      onEmptyTrash();
                      setShowEmptyConfirm(false);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition shadow-md shadow-rose-600/10 flex items-center gap-1.5 font-sans cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purger définitivement ({trash.length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: CONFIRM PERMANENT DELETE OF SINGLE ITEM */}
          {deleteConfirmItem && (
            <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs">
              <div className="bg-white rounded-2xl border border-rose-100 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-zoom-in">
                {/* Header */}
                <div className="bg-rose-950 px-5 py-4 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-rose-100">
                      Confirmation de Suppression Définitive
                    </h3>
                  </div>
                  <button 
                    onClick={() => setDeleteConfirmItem(null)}
                    className="p-1 rounded-full hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 text-slate-800">
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    Vous êtes sur le point de supprimer définitivement cet élément de la corbeille. 
                    <span className="text-rose-600 font-bold block mt-1">
                      Cette action est irréversible et l'élément ne pourra plus du tout être récupéré !
                    </span>
                  </p>

                  <div className="bg-rose-50/50 border border-rose-150 p-3.5 rounded-xl space-y-2">
                    <div>
                      <span className="text-[10px] text-rose-800 font-extrabold block uppercase tracking-wide">Élément :</span>
                      <span className="text-xs text-slate-900 font-black block mt-0.5 break-words">
                        {deleteConfirmItem.itemName}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-100">
                      <div>
                        <span className="text-[10px] text-rose-800 font-extrabold block uppercase tracking-wide">Type :</span>
                        <span className="text-xs text-slate-800 font-bold mt-0.5 block">
                          {typeLabels[deleteConfirmItem.itemType]?.label || deleteConfirmItem.itemType}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-800 font-extrabold block uppercase tracking-wide">Supprimé le :</span>
                        <span className="text-xs text-slate-800 font-bold mt-0.5 block font-mono">
                          {(() => {
                            try {
                              return new Date(deleteConfirmItem.deletedAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              });
                            } catch {
                              return deleteConfirmItem.deletedAt;
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="bg-slate-50 px-5 py-3.5 border-t border-gray-150 flex gap-2 justify-end">
                  <button
                    onClick={() => setDeleteConfirmItem(null)}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-750 text-xs font-bold rounded-xl border border-gray-200 transition"
                  >
                    Annuler, Conserver
                  </button>
                  <button
                    onClick={() => {
                      onPermanentDelete(deleteConfirmItem.id);
                      setDeleteConfirmItem(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition shadow-md shadow-rose-600/10 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
