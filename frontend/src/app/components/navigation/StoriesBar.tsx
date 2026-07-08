import { useState } from 'react';
import ReactDOM from 'react-dom';

/* ─── DATOS DE STORIES ─── */
const pumitasStories = [
  { name: 'Tu estado', initials: 'CA', online: true,  hasStory: false, isMe: true,  storyText: '' },
  { name: 'Miguel',   initials: 'MT', online: true,  hasStory: true,  isMe: false, storyText: '📚 Estudiando para el parcial...' },
  { name: 'Valeria',  initials: 'VR', online: true,  hasStory: true,  isMe: false, storyText: '🎉 ¡Evento cultural mañana!' },
  { name: 'Ángela',   initials: 'AR', online: false, hasStory: false, isMe: false, storyText: '' },
  { name: 'Carlos',   initials: 'CM', online: true,  hasStory: true,  isMe: false, storyText: '⚽ Torneo este viernes, ¡anímense!' },
  { name: 'Puma He...', initials: 'PH', online: true, hasStory: false, isMe: false, storyText: '' },
];

/* ─── STORIES BAR ─── */
export function StoriesBar() {
  const [activeStory, setActiveStory] = useState<typeof pumitasStories[0] | null>(null);

  const handleClick = (e: React.MouseEvent, p: typeof pumitasStories[0]) => {
    e.stopPropagation();
    e.preventDefault();
    if (p.isMe || !p.hasStory) return;
    setActiveStory(p);
  };

  return (
    <>
      <style>{`
        .stories-in-header {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          align-items: center;
          height: 100%;
          padding: 0 4px;
          flex: 1;
          min-width: 0;
        }
        .stories-in-header::-webkit-scrollbar { display: none; }
        .story-item-h {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px; cursor: pointer; flex-shrink: 0; position: relative;
        }
        .story-ring-h {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,75,135,0.07); border: 2px solid transparent;
          transition: box-shadow 0.15s;
        }
        .story-ring-h.has-story-h { border-color: #FFD100; }
        .story-ring-h:hover { box-shadow: 0 0 0 2px #FFD100; }
        .story-ava-h {
          width: 28px; height: 28px; background: #003366; color: #fff;
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-weight: 700; font-size: 9px;
          position: relative; border: 2px solid #004B87;
        }
        .story-plus-h {
          position: absolute; bottom: -2px; right: -2px;
          width: 12px; height: 12px; background: #FFD100; color: #003366;
          border-radius: 50%; font-size: 9px; font-weight: 900;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #004B87; line-height: 1;
        }
        .story-name-h {
          font-size: 8.5px; font-weight: 600; color: #5b6472;
          max-width: 38px; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; text-align: center;
        }
        .story-online-h {
          position: absolute; top: 24px; right: 0px;
          width: 8px; height: 8px; background: #22c55e;
          border-radius: 50%; border: 1.5px solid #fff;
        }
        .story-overlay-h {
          position: fixed;
          inset: 0;
          background: rgba(0,20,60,0.75);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .story-viewer-h {
          width: 300px;
          height: 460px;
          background: linear-gradient(160deg, #003366, #004B87);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 28px 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          animation: fadeScaleH 0.2s ease-out;
          z-index: 10000;
        }
        @keyframes fadeScaleH {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .story-bar-h {
          position: absolute; top: 14px; left: 16px; right: 16px;
          height: 3px; background: rgba(255,255,255,0.3);
          border-radius: 2px; overflow: hidden;
        }
        .story-bar-h::after {
          content: ''; display: block; height: 100%; width: 100%;
          background: #FFD100; animation: storyProgH 4s linear forwards;
        }
        @keyframes storyProgH { from { width: 0%; } to { width: 100%; } }
        .story-close-h {
          position: absolute; top: 10px; right: 12px;
          background: none; border: none; color: #fff;
          font-size: 18px; cursor: pointer; opacity: 0.8;
        }
        .story-close-h:hover { opacity: 1; }
        .story-ava-big-h {
          width: 64px; height: 64px; background: #FFD100; color: #003366;
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-weight: 900; font-size: 20px;
          border: 3px solid #fff; margin-bottom: 12px;
        }
        .story-vname-h { font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 16px; }
        .story-vtext-h {
          font-size: 16px; font-weight: 600; color: #fff;
          text-align: center; line-height: 1.5;
          background: rgba(255,255,255,0.1);
          padding: 14px 18px; border-radius: 12px;
        }
      `}</style>

      <div className="stories-in-header">
        {pumitasStories.map((p, i) => (
          <div key={i} className="story-item-h" onClick={(e) => handleClick(e, p)}>
            <div className={`story-ring-h${p.hasStory || p.isMe ? ' has-story-h' : ''}`}>
              <div className="story-ava-h">
                {p.isMe && <span className="story-plus-h">+</span>}
                {p.initials}
              </div>
            </div>
            <span className="story-name-h">{p.name}</span>
            {p.online && !p.isMe && <span className="story-online-h" />}
          </div>
        ))}
      </div>

      {activeStory && ReactDOM.createPortal(
        <div className="story-overlay-h" onClick={() => setActiveStory(null)}>
          <div className="story-viewer-h" onClick={e => e.stopPropagation()}>
            <div className="story-bar-h" />
            <button className="story-close-h" onClick={() => setActiveStory(null)}>✕</button>
            <div className="story-ava-big-h">{activeStory.initials}</div>
            <div className="story-vname-h">{activeStory.name}</div>
            <div className="story-vtext-h">{activeStory.storyText}</div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}