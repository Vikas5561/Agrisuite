import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { 
  Users, 
  Package, 
  CheckSquare, 
  Search, 
  RotateCw, 
  Calendar, 
  Clock, 
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StaffDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setError('');
      const res = await api.get('/api/v1/dashboard/staff');
      setStats(res.data);
    } catch (err) {
      setError('Failed to load staff performance dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/staff/farmers?search=${searchQuery}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading staff dashboard...</div>;
  }

  return (
    <div>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Staff Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Your daily checklist and store operations tracker</p>
        </div>
        <button onClick={fetchStats} className="btn btn-secondary">
          <RotateCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Quick Search Farmer */}
      <form onSubmit={handleSearchSubmit} className="glass-panel" style={{ padding: '1.25rem 2rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Search size={22} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input-field"
          style={{ border: 'none', background: 'transparent', padding: '0', fontSize: '1.05rem' }}
          placeholder="Quick search farmers by name, phone number, or kisan code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', borderRadius: '8px' }}>
          Search
        </button>
      </form>

      {/* Metrics Cards Grid */}
      <div className="grid-cols-3" style={{ marginBottom: '2.5rem' }}>
        
        <div 
          onClick={() => navigate('/staff/products')}
          className="glass-panel" 
          style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Your Today's Sales</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem' }}>₹{stats?.todaySales?.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div 
          onClick={() => navigate('/staff/farmers')}
          className="glass-panel" 
          style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Assigned Farmers</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem' }}>{stats?.assignedFarmers || 0}</h3>
          </div>
        </div>

        <div 
          className="glass-panel" 
          style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <CheckSquare size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tasks Completed</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--success)' }}>
              {stats?.completedTasks} / {stats?.completedTasks + stats?.remainingTasks}
            </h3>
          </div>
        </div>

      </div>

      {/* Split section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Left: Task checklist list */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Today's Action Checklist</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={checkStyle}>
              <input type="checkbox" defaultChecked style={boxStyle} />
              <div>
                <div style={{ fontWeight: 'bold', textDecoration: 'line-through', opacity: 0.6 }}>Collect credit due from Farmer FRM000004</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scheduled call: 10:30 AM | Amount: ₹5,000</span>
              </div>
            </div>

            <div style={checkStyle}>
              <input type="checkbox" defaultChecked style={boxStyle} />
              <div>
                <div style={{ fontWeight: 'bold', textDecoration: 'line-through', opacity: 0.6 }}>Deliver 10 bags of Urea to Farmer FRM000001</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: Rampur Village</span>
              </div>
            </div>

            <div style={checkStyle}>
              <input type="checkbox" style={boxStyle} />
              <div>
                <div style={{ fontWeight: 'bold' }}>Schedule field crop visit with Farmer FRM000002</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Purpose: Soil moisture testing & pesticide advisory</span>
              </div>
            </div>

            <div style={checkStyle}>
              <input type="checkbox" style={boxStyle} />
              <div>
                <div style={{ fontWeight: 'bold' }}>Reorder alarm: Urea stock is below critical limits</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Notify Dealer Admin for restocking request</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Work Hours details */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Your Shift Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Shift Schedule:</div>
                <div style={{ fontWeight: 'bold' }}>General Shift (10 AM - 6 PM)</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>In-office restriction:</div>
                <div style={{ fontWeight: 'bold' }}>Login allowed: 9:00 AM - 8:00 PM</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const checkStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1rem',
  padding: '1rem',
  background: 'rgba(255,255,255,0.01)',
  border: '1px solid var(--border-glass)',
  borderRadius: 'var(--radius-md)'
};

const boxStyle = {
  marginTop: '0.2rem',
  width: '18px',
  height: '18px',
  accentColor: 'var(--accent-primary)',
  cursor: 'pointer'
};
