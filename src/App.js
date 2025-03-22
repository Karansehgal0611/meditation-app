// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import MeditationTimer from './components/MeditationTimer';
import UserStats from './components/UserStats';
import GroupProgress from './components/GroupProgress';
import Login from './components/Login';
import { fetchUserData, fetchGroupData, startMeditation, endMeditation } from './services/meditationApi';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [groupData, setGroupData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMeditating, setIsMeditating] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  useEffect(() => {
    // Load data if user is logged in
    if (currentUser) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const groupResponse = await fetchGroupData();
          setGroupData(groupResponse);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
      
      // Set up a polling interval to refresh group data
      const interval = setInterval(loadData, 30000); // refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLogin = async (userData) => {
    setCurrentUser(userData);
  };

  const handleStartMeditation = async () => {
    if (currentUser) {
      const startTime = new Date();
      setSessionStartTime(startTime);
      setIsMeditating(true);
      
      try {
        await startMeditation(currentUser.id, startTime);
      } catch (error) {
        console.error('Error starting meditation:', error);
      }
    }
  };

  const handleEndMeditation = async () => {
    if (currentUser && sessionStartTime) {
      const endTime = new Date();
      setIsMeditating(false);
      
      try {
        const duration = Math.floor((endTime - sessionStartTime) / 1000); // duration in seconds
        await endMeditation(currentUser.id, sessionStartTime, endTime, duration);
        
        // Refresh group data immediately after ending a session
        const groupResponse = await fetchGroupData();
        setGroupData(groupResponse);
      } catch (error) {
        console.error('Error ending meditation:', error);
      }
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header>
        <h1>Group Meditation Tracker</h1>
        <div className="user-info">
          <img src={currentUser.avatar || '/default-avatar.png'} alt="User avatar" />
          <span>Welcome, {currentUser.name}</span>
        </div>
      </header>

      <main>
        <section className="timer-section">
          <MeditationTimer 
            isMeditating={isMeditating}
            onStart={handleStartMeditation}
            onEnd={handleEndMeditation}
          />
        </section>

        <section className="stats-section">
          <UserStats 
            userData={currentUser} 
            todayCount={groupData.find(user => user.id === currentUser.id)?.todayCount || 0}
            totalMinutes={groupData.find(user => user.id === currentUser.id)?.totalMinutes || 0}
          />
        </section>

        <section className="group-section">
          <h2>Group Progress</h2>
          {isLoading ? (
            <p>Loading group data...</p>
          ) : (
            <GroupProgress groupData={groupData} currentUserId={currentUser.id} />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;