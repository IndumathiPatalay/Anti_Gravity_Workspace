import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';

const themes = [
  { id: 'nature', name: 'Nature & Landscapes', description: 'Describe a peaceful natural landscape, mountains, or lakes.', image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=600' },
  { id: 'daily-life', name: 'Daily Life & Scenes', description: 'Describe a bustling restaurant, city street, or coffee shop.', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600' },
  { id: 'abstract', name: 'Abstract Canvas Art', description: 'Describe the colors, shapes, and feeling of this abstract painting.', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600' },
  { id: 'family-memories', name: 'Family & Nostalgia', description: 'Describe a warm family gathering or sharing sweet childhood memories.', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=600' },
  { id: 'hobbies-leisure', name: 'Hobbies & Workbenches', description: 'Describe a cozy hobby setup, crafting table, or active gardening scene.', image: 'https://images.unsplash.com/photo-1447078806655-409295609816?auto=format&fit=crop&q=80&w=600' },
  { id: 'travel-adventure', name: 'Travel & Expeditions', description: 'Describe an exotic journey, historic temples, or an outdoor mountain trail.', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600' },
];

const ThemeSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container animate-in">
      <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ width: 'fit-content', marginBottom: '2rem' }}>
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1>Select a Theme</h1>
        <p>Choose an image category. You will be asked to describe what you see.</p>
      </div>

      <div className="grid-3" style={{ gap: '2rem' }}>
        {themes.map((theme) => (
          <div 
            key={theme.id} 
            className="glass-panel" 
            style={{ 
              padding: 0, 
              overflow: 'hidden', 
              cursor: 'pointer', 
              transition: 'transform 0.3s ease',
              border: '1px solid var(--glass-border)'
            }}
            onClick={() => navigate(`/test/${theme.id}`)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
              <img src={theme.image} alt={theme.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={20} className="text-accent-primary" />
                {theme.name}
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>{theme.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelection;
