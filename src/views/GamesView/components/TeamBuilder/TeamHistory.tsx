import { memo, useState } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { getOfficialArtwork } from '@/utils/formatters';

export const TeamHistory = memo(function TeamHistory() {
  const { team, savedTeams, saveCurrentTeam, loadSavedTeam, deleteSavedTeam } = useFavorites();
  const [teamName, setTeamName] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filledTeam = team.filter(Boolean);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCurrentTeam(teamName);
    setTeamName('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleLoad = (id: string) => {
    loadSavedTeam(id);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteSavedTeam(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="team-history">
      <div className="team-history__header">
        <h3 className="team-history__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Historial de Equipos
        </h3>
        <p className="team-history__subtitle">Guarda hasta 20 equipos con nombre</p>
      </div>

      {/* Save current team form */}
      <form className="team-history__save-form" onSubmit={handleSave}>
        <input
          type="text"
          className="team-history__input"
          placeholder="Nombre del equipo (ej: Mi equipo Johto)"
          value={teamName}
          onChange={e => setTeamName(e.target.value)}
          maxLength={40}
        />
        <button
          type="submit"
          className="team-history__save-btn"
          disabled={filledTeam.length === 0}
          title={filledTeam.length === 0 ? 'Añade Pokémon al equipo primero' : 'Guardar equipo actual'}
        >
          {justSaved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ¡Guardado!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline></svg>
              Guardar
            </>
          )}
        </button>
      </form>

      {/* Saved teams list */}
      {savedTeams.length === 0 ? (
        <div className="team-history__empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
          <p>Aún no has guardado ningún equipo. ¡Arma tu primer equipo y pulsa <strong>Guardar</strong>!</p>
        </div>
      ) : (
        <div className="team-history__list">
          {savedTeams.map(saved => {
            const members = saved.members.filter(Boolean);
            return (
              <div key={saved.id} className="team-history__card">
                <div className="team-history__card-header">
                  <div className="team-history__card-info">
                    <span className="team-history__card-name">{saved.name}</span>
                    <span className="team-history__card-date">
                      {new Date(saved.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="team-history__card-actions">
                    <button
                      className="team-history__card-btn team-history__card-btn--load"
                      onClick={() => handleLoad(saved.id)}
                      title="Cargar este equipo"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-3.6"></path></svg>
                      Cargar
                    </button>
                    <button
                      className={`team-history__card-btn team-history__card-btn--delete ${confirmDelete === saved.id ? 'team-history__card-btn--confirm' : ''}`}
                      onClick={() => handleDelete(saved.id)}
                      title={confirmDelete === saved.id ? '¿Seguro? Haz clic de nuevo para confirmar' : 'Eliminar equipo guardado'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path></svg>
                      {confirmDelete === saved.id ? '¿Confirmar?' : 'Borrar'}
                    </button>
                  </div>
                </div>
                <div className="team-history__card-sprites">
                  {members.map((m, i) => (
                    <div key={i} className="team-history__sprite-wrapper" title={m!.name}>
                      <img
                        src={getOfficialArtwork(m!.id)}
                        alt={m!.name}
                        className="team-history__sprite"
                        loading="lazy"
                      />
                    </div>
                  ))}
                  {/* Empty slots */}
                  {Array.from({ length: 6 - members.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="team-history__sprite-wrapper team-history__sprite-wrapper--empty">
                      <span>?</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
