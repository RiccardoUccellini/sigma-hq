import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, setDoc } from '../lib/mongodb';
import { db } from '../lib/mongodb';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Users, Camera, Calendar, TrendingUp, Star, Zap, Target } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import bianco5Image from '../assets/bianco_5.png';
import HamburgerMenu from './HamburgerMenu';
import Clients from './Clients';
import ClientManagement from './ClientManagement';
import Registrations from './Registrations';
import './Dashboard.css';

// Interfaces for dashboard data
interface Client {
  id: string;
  nameCompany: string;
  startDate: Date;
  isActive: boolean;
  clientType?: 'former' | 'prospective';
  endDate?: Date;
  createdAt: Date;
}

interface PEDEntry {
  id: string;
  clientId: string;
  publicationName: string;
  releaseDate: string;
  postType: string;
  platforms: string[];
  copy: string;
  hashtags: string;
  dropboxLink: string;
  createdAt: Date;
}

interface RecordingDay {
  id: string;
  title: string;
  client: string;
  clientId: string;
  date: Date | null;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  status: 'complete' | 'scheduled' | 'not-scheduled' | 'incomplete';
  script?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  prospectiveClients: number;
  totalRecordings: number;
  upcomingRecordings: number;
  todaysPEDs: number;
  totalPEDs: number;
}

interface LeaderboardEntry {
  id: string;
  userEmail: string;
  highScore: number;
  updatedAt: Date;
}

// Minigame Component
function SigmaMinigame() {
  const { currentUser } = useAuth();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'ended'>('waiting');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('sigmaHighScore') || '0');
  });
  const [recentScores, setRecentScores] = useState<number[]>(() => {
    const saved = localStorage.getItem('sigmaRecentScores');
    return saved ? JSON.parse(saved) : [];
  });

  const saveHighScoreToFirebase = async (newHighScore: number) => {
    if (!currentUser?.email) {
      console.warn('No user email available for saving high score');
      return;
    }
    
    try {
      console.log('Attempting to save high score:', newHighScore, 'for user:', currentUser.email);
      const userScoreRef = doc(db, 'gameLeaderboard', currentUser.email);
      await setDoc(userScoreRef, {
        userEmail: currentUser.email,
        highScore: newHighScore,
        updatedAt: new Date()
      });
      
      console.log('High score saved successfully to MongoDB');
      toast.success('High score saved to leaderboard! 🏆');
    } catch (error) {
      console.error('Error saving high score:', error);
      toast.error(`Failed to save high score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    moveTarget();
  };

  const endGame = async () => {
    setGameState('ended');
    const newScores = [score, ...recentScores.slice(0, 4)];
    setRecentScores(newScores);
    localStorage.setItem('sigmaRecentScores', JSON.stringify(newScores));
    
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('sigmaHighScore', score.toString());
      toast.success(`🎉 New High Score: ${score}!`);
      
      // Save to Firebase only if it's a new personal high score
      await saveHighScoreToFirebase(score);
    }
  };

  const moveTarget = () => {
    setTargetPosition({
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20
    });
  };

  const hitTarget = () => {
    setScore(prev => prev + 1);
    moveTarget();
  };

  const resetGame = () => {
    setGameState('waiting');
    setScore(0);
    setTimeLeft(30);
  };

  return (
    <div className="minigame-container">
      <div className="game-stats">
        <div className="stat-item">
          <span className="stat-label">Score:</span>
          <span className="stat-value">{score}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Time:</span>
          <span className="stat-value">{timeLeft}s</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">High Score:</span>
          <span className="stat-value">{highScore}</span>
        </div>
      </div>

      {gameState === 'waiting' && (
        <div className="game-waiting">
          <motion.div 
            className="game-intro"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Target size={48} />
            <h4>SIGMA Target Practice</h4>
            <p>Click the targets as fast as you can!</p>
            <motion.button 
              className="game-start-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
            >
              <Zap size={20} />
              Start Game
            </motion.button>
          </motion.div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-area">
          <motion.div
            className="target"
            style={{
              left: `${targetPosition.x}%`,
              top: `${targetPosition.y}%`
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            whileHover={{ scale: 1.1 }}
            onClick={hitTarget}
          >
            🎯
          </motion.div>
        </div>
      )}

      {gameState === 'ended' && (
        <motion.div 
          className="game-ended"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="final-score">
            <h4>Game Over!</h4>
            <p>Final Score: <strong>{score}</strong></p>
            {score === highScore && score > 0 && (
              <p className="new-record">🏆 New Record!</p>
            )}
          </div>
          <motion.button 
            className="game-restart-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
          >
            Play Again
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

// Leaderboard Component
function GameLeaderboard() {
  const { currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Load leaderboard data
  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const querySnapshot = await getDocs(
        query(collection(db, 'gameLeaderboard'), orderBy('highScore', 'desc'))
      );
      const leaderboardData: LeaderboardEntry[] = [];
      
      querySnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        leaderboardData.push({
          id: doc.id,
          userEmail: data.userEmail,
          highScore: data.highScore,
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt)
        });
      });
      
      setLeaderboard(leaderboardData.slice(0, 10)); // Top 10
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  return (
    <div className="leaderboard-card">
      <div className="leaderboard-header">
        <h4>🏆 Global Leaderboard</h4>
        <span className="leaderboard-subtitle">Top Players</span>
      </div>
      
      {loadingLeaderboard ? (
        <div className="leaderboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading rankings...</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.length > 0 ? (
            leaderboard.map((entry, index) => (
              <motion.div 
                key={entry.id} 
                className={`leaderboard-item ${entry.userEmail === currentUser?.email ? 'current-user' : ''}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="rank-info">
                  <span className={`rank-position ${index < 3 ? 'top-three' : ''}`}>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index >= 3 && `#${index + 1}`}
                  </span>
                  <div className="player-info">
                    <span className="player-email">
                      {entry.userEmail === currentUser?.email ? 'You' : entry.userEmail.split('@')[0]}
                    </span>
                    <span className="score-date">
                      {entry.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="player-score">
                  <span className="score-value">{entry.highScore}</span>
                  <Star size={14} className="score-star" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="empty-leaderboard">
              <p>No scores yet!</p>
              <small>Be the first to set a record! 🎯</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    prospectiveClients: 0,
    totalRecordings: 0,
    upcomingRecordings: 0,
    todaysPEDs: 0,
    totalPEDs: 0,
  });
  const [prospectiveClients, setProspectiveClients] = useState<Client[]>([]);
  const [nextRecording, setNextRecording] = useState<RecordingDay | null>(null);
  const [todaysPEDs, setTodaysPEDs] = useState<PEDEntry[]>([]);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel (removed brain dump notes)
      const [clientsData, recordingsData, pedData] = await Promise.all([
        loadClients(),
        loadRecordings(),
        loadPEDEntries()
      ]);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const activeClients = clientsData.filter(c => c.isActive).length;
      const prospective = clientsData.filter(c => !c.isActive && c.clientType === 'prospective');
      const upcomingRecs = recordingsData.filter(r => r.date && r.date >= today).length;
      const todayPEDs = pedData.filter(p => {
        if (!p.releaseDate) return false;
        const releaseDate = new Date(p.releaseDate);
        releaseDate.setHours(0, 0, 0, 0);
        return releaseDate.getTime() === today.getTime();
      });

      // Find next recording
      const nextRec = recordingsData
        .filter(r => r.date && r.date >= today)
        .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))[0] || null;

      setStats({
        totalClients: clientsData.length,
        activeClients,
        prospectiveClients: prospective.length,
        totalRecordings: recordingsData.length,
        upcomingRecordings: upcomingRecs,
        todaysPEDs: todayPEDs.length,
        totalPEDs: pedData.length,
      });

      setProspectiveClients(prospective.slice(0, 5)); // Show top 5
      setNextRecording(nextRec);
      setTodaysPEDs(todayPEDs.slice(0, 3)); // Show top 3

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async (): Promise<Client[]> => {
    try {
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef);
      const querySnapshot = await getDocs(q);
      const clientsData: Client[] = [];
      
      querySnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        clientsData.push({
          id: doc.id,
          nameCompany: data.nameCompany,
          startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
          isActive: data.isActive,
          clientType: data.clientType,
          endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)) : undefined,
          createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt)
        });
      });
      
      return clientsData;
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    }
  };

  const loadRecordings = async (): Promise<RecordingDay[]> => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'recordingDays'), orderBy('updatedAt', 'desc'))
      );
      const recordingsData: RecordingDay[] = [];
      
      querySnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        recordingsData.push({
          id: doc.id,
          title: data.title,
          client: data.client,
          clientId: data.clientId,
          date: data.date ? (data.date instanceof Date ? data.date : new Date(data.date)) : null,
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location,
          notes: data.notes,
          status: data.status,
          script: data.script,
          createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt || Date.now())
        });
      });
      
      return recordingsData;
    } catch (error) {
      console.error('Error loading recordings:', error);
      return [];
    }
  };

  const loadPEDEntries = async (): Promise<PEDEntry[]> => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'pedEntries'), orderBy('createdAt', 'desc'))
      );
      const pedData: PEDEntry[] = [];
      
      querySnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        pedData.push({
          id: doc.id,
          clientId: data.clientId,
          publicationName: data.publicationName,
          releaseDate: data.releaseDate || '',
          postType: data.postType,
          platforms: data.platforms || (data.platform ? [data.platform] : []),
          copy: data.copy,
          hashtags: data.hashtags,
          dropboxLink: data.dropboxLink,
          createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt)
        });
      });
      
      return pedData;
    } catch (error) {
      console.error('Error loading PED entries:', error);
      return [];
    }
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'scheduled': '#ff9800',
      'complete': '#4caf50',
      'incomplete': '#f44336',
      'not-scheduled': '#9e9e9e'
    };
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: colors[status as keyof typeof colors] || '#9e9e9e' }}
      >
        {status.replace('-', ' ')}
      </span>
    );
  };

  // Render different pages based on currentPage state
  if (currentPage === 'clients') {
    return <Clients onNavigate={handleNavigation} />;
  }

  if (currentPage === 'client-management') {
    return <ClientManagement onNavigate={handleNavigation} />;
  }

  if (currentPage === 'registrations') {
    return <Registrations onNavigate={handleNavigation} />;
  }

  return (
    <div className="dashboard-root">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#5b3983',
            color: '#fff',
            fontFamily: 'Montserrat',
          },
        }}
      />
      
      {/* Hamburger Menu */}
      <HamburgerMenu onNavigate={handleNavigation} />

      {/* Logo in top right */}
      <div className="dashboard-header">
        <img 
          src={bianco5Image} 
          alt="SIGMA HQ" 
          className="dashboard-logo"
        />
      </div>

      {/* Main content */}
      <div className="dashboard-content">
        <div className="dashboard-welcome">
          <h1 className="dashboard-title">Welcome back! 👋</h1>
          <p className="dashboard-subtitle">Here's what's happening at SIGMA HQ today</p>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards Grid with animations */}
            <motion.div 
              className="stats-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="stat-card primary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="stat-icon">
                  <Users size={32} />
                </div>
                <div className="stat-content">
                  <h3>
                    <CountUp 
                      end={stats.activeClients} 
                      duration={2}
                      preserveValue
                    />
                  </h3>
                  <p>Active Clients</p>
                  <span className="stat-detail">+{stats.prospectiveClients} prospective</span>
                </div>
              </motion.div>

              <motion.div 
                className="stat-card success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="stat-icon">
                  <Camera size={32} />
                </div>
                <div className="stat-content">
                  <h3>
                    <CountUp 
                      end={stats.upcomingRecordings} 
                      duration={2}
                      preserveValue
                    />
                  </h3>
                  <p>Upcoming Recordings</p>
                  <span className="stat-detail">{stats.totalRecordings} total</span>
                </div>
              </motion.div>

              <motion.div 
                className="stat-card warning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="stat-icon">
                  <Calendar size={32} />
                </div>
                <div className="stat-content">
                  <h3>
                    <CountUp 
                      end={stats.todaysPEDs} 
                      duration={2}
                      preserveValue
                    />
                  </h3>
                  <p>PEDs Due Today</p>
                  <span className="stat-detail">{stats.totalPEDs} total PEDs</span>
                </div>
              </motion.div>

              <motion.div 
                className="stat-card info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="stat-icon">
                  <TrendingUp size={32} />
                </div>
                <div className="stat-content">
                  <h3>
                    <CountUp 
                      end={stats.totalPEDs} 
                      duration={2}
                      preserveValue
                    />
                  </h3>
                  <p>Total PEDs Created</p>
                  <span className="stat-detail">All-time content</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              className="quick-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <h3>⚡ Quick Actions</h3>
              <div className="actions-grid">
                <motion.button 
                  className="action-btn primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage('clients')}
                >
                  <span className="action-icon">👥</span>
                  <span>Manage Clients</span>
                </motion.button>
                <motion.button 
                  className="action-btn success"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage('client-management')}
                >
                  <span className="action-icon">📊</span>
                  <span>Client Management</span>
                </motion.button>
                <motion.button 
                  className="action-btn warning"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage('registrations')}
                >
                  <span className="action-icon">🎬</span>
                  <span>Recording Days</span>
                </motion.button>
                <motion.button 
                  className="action-btn info"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toast.success('Analytics coming soon! 🚀')}
                >
                  <span className="action-icon">📈</span>
                  <span>Analytics</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Main Dashboard Grid */}
            <div className="dashboard-grid">
              {/* Prospective Clients */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>🎯 Prospective Clients</h3>
                  <button 
                    className="view-all-btn"
                    onClick={() => setCurrentPage('clients')}
                  >
                    View All
                  </button>
                </div>
                <div className="card-content">
                  {prospectiveClients.length > 0 ? (
                    <div className="prospects-list">
                      {prospectiveClients.map((client) => (
                        <div key={client.id} className="prospect-item">
                          <div className="prospect-info">
                            <h4>{client.nameCompany}</h4>
                            <p>Added {formatDate(client.createdAt)}</p>
                          </div>
                          <div className="prospect-status">
                            <span className="status-badge prospective">Prospective</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No prospective clients at the moment</p>
                      <small>Great job closing deals! 🎉</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Recording */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>🎥 Next Recording Day</h3>
                  <button 
                    className="view-all-btn"
                    onClick={() => setCurrentPage('registrations')}
                  >
                    View All
                  </button>
                </div>
                <div className="card-content">
                  {nextRecording ? (
                    <div className="next-recording">
                      <div className="recording-main">
                        <h4>{nextRecording.title}</h4>
                        <p className="recording-client">{nextRecording.client}</p>
                        <div className="recording-details">
                          <span className="recording-date">
                            📅 {nextRecording.date ? formatDate(nextRecording.date) : 'Not scheduled'}
                          </span>
                          <span className="recording-time">
                            🕐 {nextRecording.startTime} - {nextRecording.endTime}
                          </span>
                          <span className="recording-location">
                            📍 {nextRecording.location || 'Location TBD'}
                          </span>
                        </div>
                        {getStatusBadge(nextRecording.status)}
                      </div>
                      {nextRecording.notes && (
                        <div className="recording-notes">
                          <h5>📝 Notes:</h5>
                          <p>{nextRecording.notes}</p>
                        </div>
                      )}
                      {nextRecording.script && (
                        <div className="recording-script">
                          <span className="script-badge">✅ Script Ready</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No upcoming recordings scheduled</p>
                      <small>Time to plan your next shoot! 📸</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Today's PEDs */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>🚀 Today's PED Releases</h3>
                  <button 
                    className="view-all-btn"
                    onClick={() => setCurrentPage('client-management')}
                  >
                    View All
                  </button>
                </div>
                <div className="card-content">
                  {todaysPEDs.length > 0 ? (
                    <div className="peds-list">
                      {todaysPEDs.map((ped) => (
                        <div key={ped.id} className="ped-item">
                          <div className="ped-info">
                            <h4>{ped.publicationName}</h4>
                            <p className="ped-type">{ped.postType}</p>
                            <div className="ped-platforms">
                              {ped.platforms.map((platform) => (
                                <span key={platform} className="platform-tag">
                                  {platform}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="ped-status">
                            <span className="status-badge urgent">Due Today</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No PEDs due today</p>
                      <small>You're all caught up! 🎯</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Insights */}
              
            </div>

            {/* Fun Minigame Section */}
            <motion.div 
              className="minigame-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              <div className="minigame-row">
                {/* Game Section - 70% */}
                <div className="game-section">
                  <div className="minigame-card">
                    <div className="card-header">
                      <h3>🎮 SIGMA Challenge</h3>
                      <span className="game-subtitle">Test Your Reflexes!</span>
                    </div>
                    <div className="card-content">
                      <SigmaMinigame />
                    </div>
                  </div>
                </div>

                {/* Leaderboard Section - 30% */}
                <div className="leaderboard-section">
                  <GameLeaderboard />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* User info in bottom left */}
      <div className="dashboard-user-info">
        <div className="user-avatar">
          {currentUser?.email?.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <p>Welcome back,</p>
          <strong>{currentUser?.email}</strong>
        </div>
      </div>
    </div>
  );
}
