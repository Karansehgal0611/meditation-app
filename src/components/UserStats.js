import React from 'react';

const UserStats = ({ userData, todayCount, totalMinutes }) => {
  return (
    <div className="user-stats">
      <h2>Your Meditation Stats</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Today's Sessions</h3>
          <div className="stat-value">{todayCount}</div>
        </div>
        <div className="stat-card">
          <h3>Total Minutes</h3>
          <div className="stat-value">{totalMinutes}</div>
        </div>
        <div className="stat-card">
          <h3>Streak</h3>
          <div className="stat-value">{userData.streak || 0} days</div>
        </div>
      </div>
    </div>
  );
};

export default UserStats;